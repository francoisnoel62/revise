// ABOUTME: Application service building ready-to-inject AI context blocks from project metadata
// ABOUTME: Applies the "author edit wins" rule — trusts structuredData only if not edited since generation

import { MetadataRepository } from '../../domain/interfaces/MetadataRepository';
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
  constructor(private readonly metadataRepository: MetadataRepository) {}

  async buildCompletionContext(ownerId: string, projectId: string): Promise<string> {
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

    return out;
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
