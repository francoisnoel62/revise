// ABOUTME: Application service building ready-to-inject AI context blocks from project metadata
// ABOUTME: Applies the "author edit wins" rule — trusts structuredData only if not edited since generation

import { MetadataRepository } from '../../domain/interfaces/MetadataRepository';
import { ResearchDocumentRepository } from '../../domain/interfaces/ResearchDocumentRepository';
import { ResearchDocument } from '../../domain/entities/ResearchDocument';
import { Character } from '../../domain/entities/Character';
import type {
  NarrativeAnalysis,
  StylisticDNA,
  Characters,
  Plot,
  Worldbuilding,
  ChapterSummaries,
} from '../../domain';

type Resolved =
  | { kind: 'structured'; data: unknown }
  | { kind: 'rawText'; text: string };

const COMPLETION_RAWTEXT_CAP = 400;
const CHAPTER_RAWTEXT_CAP = 800;
const REWRITE_RAWTEXT_CAP = 600;
const PERSONA_RAWTEXT_CAP = 600;
const PERSONA_CHAR_FIELD_CAP = 400;

// Research docs are the author's intentional context — leaner for latency-critical completion.
const COMPLETION_RESEARCH_CAP = 600;
const CHAPTER_RESEARCH_CAP = 1500;

const RESEARCH_TYPE_LABELS: Record<string, string> = {
  note: 'NOTE',
  link: 'LIEN',
  quote: 'CITATION',
  reference: 'RÉFÉRENCE',
  image: 'IMAGE',
};

const LABELS: Record<string, string> = {
  'narrative-analysis': 'NARRATION',
  'stylistic-dna': 'STYLE',
  'characters': 'PERSONNAGES',
  'plot': 'INTRIGUE',
  'worldbuilding': 'UNIVERS',
  'chapter-summaries': 'RÉSUMÉS DES CHAPITRES',
};

function truncate(text: string, cap: number): string {
  const t = text.trim();
  return t.length <= cap ? t : t.slice(0, cap).trimEnd() + '…';
}

export class AIContextBuilder {
  constructor(
    private readonly metadataRepository: MetadataRepository,
    private readonly researchDocumentRepository?: ResearchDocumentRepository
  ) {}

  async buildCompletionContext(ownerId: string, projectId: string, chapterId?: string): Promise<string> {
    const resolved = await this.resolve(ownerId, projectId, [
      'stylistic-dna', 'narrative-analysis', 'characters', 'plot', 'worldbuilding',
    ]);

    let out = '';

    out += this.project<StylisticDNA>(resolved, 'stylistic-dna', COMPLETION_RAWTEXT_CAP,
      (d) => `\n\n[MÉTADONNÉES - STYLE]\nRegistre: ${d.registerAndLexicon}\nRythme: ${d.rhythmAndBreathing}\n`,
      this.bracketFallback);

    out += this.project<NarrativeAnalysis>(resolved, 'narrative-analysis', COMPLETION_RAWTEXT_CAP,
      (d) => `\n\n[MÉTADONNÉES - NARRATION]\nPoint de vue: ${d.narratorType}\nFocalisation: ${d.focalization}\n`,
      this.bracketFallback);

    out += this.project<Characters>(resolved, 'characters', COMPLETION_RAWTEXT_CAP,
      (d) => {
        let s = '\n\n[MÉTADONNÉES - PERSONNAGES]\n';
        for (const c of d.characterProfiles.slice(0, 3)) s += `- ${c.name}: ${c.identity}\n`;
        return s;
      },
      this.bracketFallback);

    out += this.project<Plot>(resolved, 'plot', COMPLETION_RAWTEXT_CAP,
      (d) => `\n\n[MÉTADONNÉES - INTRIGUE]\nÉtat actuel: ${d.plotState}\n`,
      this.bracketFallback);

    out += this.project<Worldbuilding>(resolved, 'worldbuilding', COMPLETION_RAWTEXT_CAP,
      (d) => {
        const { worldRules, atmosphere } = d;
        if (!worldRules && !atmosphere) return '';
        let s = '\n\n[MÉTADONNÉES - UNIVERS]\n';
        if (worldRules) s += `Règles du monde: ${worldRules}\n`;
        if (atmosphere) s += `Atmosphère: ${atmosphere}\n`;
        return s;
      },
      this.bracketFallback);

    out += await this.projectResearch(ownerId, projectId, { kind: 'completion', chapterId });

    return out;
  }

  /**
   * Author's intentional context only (research docs), without any derived metadata.
   * Used by the manuscript-first autocomplete context (metadata out of the hot path).
   */
  async buildResearchContext(ownerId: string, projectId: string, chapterId?: string): Promise<string> {
    return this.projectResearch(ownerId, projectId, { kind: 'completion', chapterId });
  }

  async buildChapterContext(ownerId: string, projectId: string): Promise<string> {
    const resolved = await this.resolve(ownerId, projectId, [
      'narrative-analysis', 'stylistic-dna', 'characters', 'plot', 'worldbuilding', 'chapter-summaries',
    ]);

    let out = '';

    out += this.project<NarrativeAnalysis>(resolved, 'narrative-analysis', CHAPTER_RAWTEXT_CAP,
      (d) => `\n\n--- ANALYSE NARRATIVE ---\nNarrateur: ${d.narratorType}\nFocalisation: ${d.focalization}\nTemporalité: ${d.temporality}\n`,
      this.dashFallback);

    out += this.project<StylisticDNA>(resolved, 'stylistic-dna', CHAPTER_RAWTEXT_CAP,
      (d) => `\n\n--- ADN STYLISTIQUE ---\nRegistre: ${d.registerAndLexicon}\nRythme: ${d.rhythmAndBreathing}\nRègles: ${d.writingRules.slice(0, 5).join(', ')}\n`,
      this.dashFallback);

    out += this.project<Characters>(resolved, 'characters', CHAPTER_RAWTEXT_CAP,
      (d) => {
        let s = '\n\n--- PERSONNAGES ---\n';
        for (const c of d.characterProfiles.slice(0, 5)) s += `- ${c.name}: ${c.identity}. ${c.psychology}\n`;
        return s;
      },
      this.dashFallback);

    out += this.project<Plot>(resolved, 'plot', CHAPTER_RAWTEXT_CAP,
      (d) => `\n\n--- INTRIGUE ---\nEnjeux: ${d.stakes}\nÉtat actuel: ${d.plotState}\nConflits: ${d.conflicts}\n`,
      this.dashFallback);

    out += this.project<Worldbuilding>(resolved, 'worldbuilding', CHAPTER_RAWTEXT_CAP,
      (d) => `\n\n--- UNIVERS ---\nAtmosphère: ${d.atmosphere}\nThèmes: ${d.explicitThemes}\n`,
      this.dashFallback);

    out += this.project<ChapterSummaries>(resolved, 'chapter-summaries', CHAPTER_RAWTEXT_CAP,
      (d) => {
        let s = '\n\n--- RÉSUMÉS DES CHAPITRES PRÉCÉDENTS ---\n';
        for (const chap of d.chapters) s += `Chapitre ${chap.chapterNumber} (${chap.chapterTitle}): ${chap.summary}\n`;
        s += `\nArc narratif global: ${d.overallArc}\n`;
        return s;
      },
      this.dashFallback);

    out += await this.projectResearch(ownerId, projectId, { kind: 'chapter' });

    return out;
  }

  async buildRewriteContext(ownerId: string, projectId: string): Promise<string> {
    const resolved = await this.resolve(ownerId, projectId, ['stylistic-dna', 'narrative-analysis']);
    const style = resolved.get('stylistic-dna');
    const narr = resolved.get('narrative-analysis');
    if (!style && !narr) return '';

    const lines: string[] = [
      "--- PROFIL STYLISTIQUE DE L'AUTEUR ---",
      "(Issu de l'analyse IA du roman complet — calibre la VOIX AMPLIFIÉE)",
      '',
    ];

    if (style?.kind === 'structured') {
      const d = style.data as StylisticDNA;
      lines.push(`REGISTRE ET LEXIQUE: ${d.registerAndLexicon}`);
      lines.push(`RYTHME: ${d.rhythmAndBreathing}`);
      const rules = d.writingRules?.slice(0, 5) ?? [];
      if (rules.length > 0) {
        lines.push("RÈGLES D'ÉCRITURE À RESPECTER:");
        rules.forEach((r) => lines.push(`- ${r}`));
      }
    } else if (style?.kind === 'rawText') {
      lines.push(`PROFIL STYLISTIQUE (édité par l'auteur): ${truncate(style.text, REWRITE_RAWTEXT_CAP)}`);
    }

    if (narr?.kind === 'structured') {
      const d = narr.data as NarrativeAnalysis;
      lines.push(`POINT DE VUE: ${d.narratorType}`);
      lines.push(`FOCALISATION: ${d.focalization}`);
    } else if (narr?.kind === 'rawText') {
      lines.push(`NARRATION (édité par l'auteur): ${truncate(narr.text, REWRITE_RAWTEXT_CAP)}`);
    }

    lines.push('');
    lines.push('Applique ce profil pour :');
    lines.push("- Proposition 3 (VOIX AMPLIFIÉE) : intensifie spécifiquement CE style d'auteur");
    lines.push("- Toutes les propositions : respecte les règles d'écriture listées ci-dessus");
    lines.push('- Toutes les propositions : maintiens le point de vue narratif établi');

    return lines.join('\n');
  }

  async buildCharacterPersona(
    character: Character,
    ownerId: string,
    projectId: string,
  ): Promise<string> {
    const resolved = await this.resolve(ownerId, projectId, ['narrative-analysis', 'plot']);

    const narrativeBlock = this.project<NarrativeAnalysis>(
      resolved,
      'narrative-analysis',
      PERSONA_RAWTEXT_CAP,
      (d) => `POV : ${d.narratorType}. Focalisation : ${d.focalization}.`,
      (_label, text) => text,
    );

    const plotBlock = this.project<Plot>(
      resolved,
      'plot',
      PERSONA_RAWTEXT_CAP,
      (d) => [d.plotState, d.conflicts].filter(Boolean).join(' — '),
      (_label, text) => text,
    );

    const characterSheet = [
      character.getIdentity()         && `Identité : ${truncate(character.getIdentity(), PERSONA_CHAR_FIELD_CAP)}`,
      character.getPsychology()       && `Psychologie : ${truncate(character.getPsychology(), PERSONA_CHAR_FIELD_CAP)}`,
      character.getVoiceAndLanguage() && `Voix et langage : ${truncate(character.getVoiceAndLanguage(), PERSONA_CHAR_FIELD_CAP)}`,
      character.getBackstory()        && `Histoire : ${truncate(character.getBackstory(), PERSONA_CHAR_FIELD_CAP)}`,
      character.getRelationships()    && `Relations : ${truncate(character.getRelationships(), PERSONA_CHAR_FIELD_CAP)}`,
      character.getOpenQuestions()    && `Questions ouvertes : ${truncate(character.getOpenQuestions(), PERSONA_CHAR_FIELD_CAP)}`,
    ]
      .filter(Boolean)
      .join('\n');

    return [
      `Tu incarnes le personnage "${character.getName()}" d'un roman en cours d'écriture.`,
      `Réponds toujours en restant dans sa voix et sa psychologie, à la première personne.`,
      ``,
      `=== FICHE DU PERSONNAGE ===`,
      characterSheet,
      narrativeBlock && `\n=== CONTEXTE DU ROMAN ===\n${narrativeBlock}${plotBlock ? '\n' + plotBlock : ''}`,
      ``,
      `RÈGLES ABSOLUES :`,
      `- Ne réponds qu'à partir de ce qui est dans cette fiche et dans le roman.`,
      `- Si tu ne sais pas ou si ce n'est pas dans le texte, dis-le franchement ("Je ne sais pas" ou "Ce n'est pas établi dans mon histoire").`,
      `- Ne fabrique jamais de canon. L'auteur est seul juge de ce qui existe dans l'œuvre.`,
    ]
      .filter((line) => line !== undefined)
      .join('\n');
  }

  private async projectResearch(
    ownerId: string,
    projectId: string,
    scope: { kind: 'completion'; chapterId?: string } | { kind: 'chapter' }
  ): Promise<string> {
    if (!this.researchDocumentRepository) return '';

    let docs: ResearchDocument[];
    try {
      docs = await this.researchDocumentRepository.findByProjectId(ownerId, projectId);
    } catch {
      return ''; // fail gracefully — completion/generation work without research context
    }

    const isGlobal = (d: ResearchDocument) => d.getLinkedChapterIds().length === 0;

    const selected =
      scope.kind === 'chapter'
        ? docs // globals + every linked doc
        : docs.filter((d) => isGlobal(d) || (scope.chapterId ? d.isLinkedToChapter(scope.chapterId) : false));

    if (selected.length === 0) return '';

    // Author's overall intent (global docs) first, then chapter-specific.
    selected.sort((a, b) => Number(isGlobal(b)) - Number(isGlobal(a)));

    const cap = scope.kind === 'chapter' ? CHAPTER_RESEARCH_CAP : COMPLETION_RESEARCH_CAP;
    const header =
      scope.kind === 'chapter'
        ? '\n\n--- DOCUMENTS DE RECHERCHE ---\n'
        : "\n\n[INTENTION DE L'AUTEUR — RECHERCHE]\n";

    let body = '';
    for (const d of selected) {
      let entry = `- [${RESEARCH_TYPE_LABELS[d.getType()] ?? d.getType().toUpperCase()}] ${d.getTitle()}\n`;
      const source = [d.getSourceAuthor(), d.getSourceTitle()].filter(Boolean).join(', ');
      if (source) entry += `  Source: ${source}\n`;
      if (d.getUrl()) entry += `  URL: ${d.getUrl()}\n`;
      const text = d.getContentText();
      if (text) entry += `  ${text}\n`;
      const tags = d.getTags();
      if (tags.length > 0) entry += `  Tags: ${tags.join(', ')}\n`;

      if (body.length + entry.length > cap) {
        const remaining = cap - body.length;
        if (remaining > 0) body += entry.slice(0, remaining).trimEnd() + '…\n';
        break;
      }
      body += entry;
    }

    return body ? header + body : '';
  }

  private readonly bracketFallback = (label: string, text: string): string =>
    `\n\n[MÉTADONNÉES - ${label}] (édité par l'auteur)\n${text}\n`;

  private readonly dashFallback = (label: string, text: string): string =>
    `\n\n--- ${label} (édité par l'auteur) ---\n${text}\n`;

  private project<T>(
    resolved: Map<string, Resolved>,
    typeKey: string,
    cap: number,
    formatStructured: (data: T) => string,
    formatFallback: (label: string, text: string) => string
  ): string {
    const r = resolved.get(typeKey);
    if (!r) return '';
    if (r.kind === 'structured') return formatStructured(r.data as T);
    return formatFallback(LABELS[typeKey] ?? typeKey, truncate(r.text, cap));
  }

  private async resolve(
    ownerId: string,
    projectId: string,
    typeKeys: string[]
  ): Promise<Map<string, Resolved>> {
    const map = new Map<string, Resolved>();

    try {
      const list = await this.metadataRepository.findByProjectId(ownerId, projectId);

      for (const metadata of list) {
        const typeKey = metadata.getTypeKey();
        if (!typeKeys.includes(typeKey)) continue;

        const raw = metadata.getStructuredData();
        if (raw && !metadata.wasEditedSinceGeneration()) {
          try {
            map.set(typeKey, { kind: 'structured', data: JSON.parse(raw) });
            continue;
          } catch {
            // corrupt structuredData — fall through to raw text
          }
        }

        const text = metadata.getContentText();
        if (text) map.set(typeKey, { kind: 'rawText', text });
      }
    } catch {
      // Fail gracefully — AI features work without context
    }

    return map;
  }
}
