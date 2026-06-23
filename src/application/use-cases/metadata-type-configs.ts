// ABOUTME: The 7 MetadataTypeConfig instances for the unified GenerateMetadataUseCase.
// ABOUTME: Each config owns the typeKey, title, LLM call, and TipTap formatter for one metadata type.

import {
  LLMProvider,
  NarrativeAnalysis,
  StylisticDNA,
  Characters,
  Plot,
  Worldbuilding,
  Synthesis,
  ChapterSummaries,
} from '../../domain';
import { MetadataTypeConfig } from './GenerateMetadataUseCase';

function h(text: string, level: number = 2): object {
  return { type: 'heading', attrs: { level }, content: [{ type: 'text', text }] };
}

function p(text: string): object {
  return { type: 'paragraph', content: text ? [{ type: 'text', text }] : [] };
}

function tipTap(content: object[]): string {
  return JSON.stringify({ type: 'doc', content });
}

export const narrativeAnalysisConfig: MetadataTypeConfig<NarrativeAnalysis> = {
  typeKey: 'narrative-analysis',
  title: 'Analyse Narrative',
  generate: (provider: LLMProvider, fullText: string) =>
    provider.generateNarrativeAnalysis(fullText),
  format: (a) =>
    tipTap([
      h('1. Narrateur'),
      p(a.narratorType),
      h('2. Focalisation'),
      p(a.focalization),
      h('3. Temporalité'),
      p(a.temporality),
      h('4. Structure des chapitres'),
      p(a.chapterStructure),
      h('5. Voix narrative distinctive'),
      ...a.narrativeVoice.map((point) => p(`• ${point}`)),
      h('6. Synthèse'),
      p(a.summary),
    ]),
};

export const stylisticDNAConfig: MetadataTypeConfig<StylisticDNA> = {
  typeKey: 'stylistic-dna',
  title: 'ADN Stylistique',
  generate: (provider: LLMProvider, fullText: string) =>
    provider.generateStylisticDNA(fullText),
  format: (a) =>
    tipTap([
      h('1. Registre et Lexique'),
      p(a.registerAndLexicon),
      h('2. Syntaxe'),
      p(a.syntax),
      h('3. Figures de Style'),
      p(a.figuresOfStyle),
      h('4. Tics et Signatures'),
      p(a.ticsAndSignatures),
      h('5. Rythme et Respiration'),
      p(a.rhythmAndBreathing),
      h('6. Charte "À la manière de"'),
      ...a.writingRules.map((rule) => p(`• ${rule}`)),
      h('7. Synthèse'),
      p(a.summary),
    ]),
};

export const charactersConfig: MetadataTypeConfig<Characters> = {
  typeKey: 'characters',
  title: 'Personnages',
  generate: (provider: LLMProvider, fullText: string) =>
    provider.generateCharacters(fullText),
  format: (a) =>
    tipTap([
      h('Fiches Personnages'),
      ...a.characterProfiles.flatMap((profile) => [
        h(profile.name, 3),
        h('Identité', 4),
        p(profile.identity),
        h('Apparence', 4),
        p(profile.appearance),
        h('Psychologie', 4),
        p(profile.psychology),
        h('Voix et Langage', 4),
        p(profile.voiceAndLanguage),
        h('Backstory', 4),
        p(profile.backstory),
        h('Relations', 4),
        p(profile.relationships),
        h('Fonction Narrative', 4),
        p(profile.narrativeFunction),
        h('Questions Ouvertes', 4),
        p(profile.openQuestions),
      ]),
      h('Cartographie Relationnelle'),
      p(a.relationalMap),
      h('Hiérarchie Narrative'),
      p(a.narrativeHierarchy),
      h('Synthèse'),
      p(a.summary),
    ]),
};

export const plotConfig: MetadataTypeConfig<Plot> = {
  typeKey: 'plot',
  title: 'Intrigue',
  generate: (provider: LLMProvider, fullText: string) =>
    provider.generatePlot(fullText),
  format: (a) =>
    tipTap([
      h('1. Situation Initiale'),
      p(a.initialSituation),
      h('2. Élément Déclencheur'),
      p(a.incitingIncident),
      h('3. Enjeux'),
      p(a.stakes),
      h('4. Questions Dramatiques'),
      p(a.dramaticQuestions),
      h('5. Conflits'),
      p(a.conflicts),
      h('6. Fils Narratifs'),
      p(a.narrativeThreads),
      h('7. Structure Détectée'),
      p(a.detectedStructure),
      h('8. Scène par Scène'),
      ...a.sceneBreakdown.map((scene) =>
        p(
          `**${scene.chapter}** | ${scene.location} | ${scene.characters} | ${scene.objective} | ${scene.conflict} | ${scene.outcome} | ${scene.function}`
        )
      ),
      h("9. État de l'Intrigue"),
      p(a.plotState),
      h('10. Directions Possibles'),
      p(a.possibleDirections),
      h('Synthèse'),
      p(a.summary),
    ]),
};

export const worldbuildingConfig: MetadataTypeConfig<Worldbuilding> = {
  typeKey: 'worldbuilding',
  title: 'Univers',
  generate: (provider: LLMProvider, fullText: string) =>
    provider.generateWorldbuilding(fullText),
  format: (a) =>
    tipTap([
      h('1. Thèmes Explicites'),
      p(a.explicitThemes),
      h('2. Thèmes Implicites'),
      p(a.implicitThemes),
      h('3. Symbolique'),
      p(a.symbolism),
      h('4. Sous-texte'),
      p(a.subtext),
      h('5. Vision du Monde'),
      p(a.worldview),
      h('6. Intertextualité'),
      p(a.intertextuality),
      h('7. Cadre Spatio-temporel'),
      p(a.spatiotemporalSetting),
      h('8. Atmosphère'),
      p(a.atmosphere),
      h('9. Règles du Monde'),
      p(a.worldRules),
      h('10. Contexte Social'),
      p(a.socialContext),
      h("11. Détails d'Immersion"),
      p(a.immersionDetails),
      h('12. Cohérence'),
      p(a.coherence),
      h('Synthèse'),
      p(a.summary),
    ]),
};

export const synthesisConfig: MetadataTypeConfig<Synthesis> = {
  typeKey: 'synthesis',
  title: 'Synthèse',
  generate: (provider: LLMProvider, fullText: string) =>
    provider.generateSynthesis(fullText),
  format: (a) =>
    tipTap([
      h('Identité du Texte'),
      p(a.textIdentity),
      h('Points Forts'),
      ...a.strengths.map((s) => p(`• ${s}`)),
      h("Axes d'Amélioration"),
      ...a.improvements.map((i) => p(`• ${i}`)),
      h('Cohérence Interne'),
      p(a.internalCoherence),
      h('Charte Stylistique'),
      ...a.stylisticCharter.map((rule) => p(`• ${rule}`)),
      h("Résumé de l'Intrigue"),
      p(a.plotSummary),
      h('Questions Ouvertes'),
      ...a.openQuestions.map((q) => p(`• ${q}`)),
      h('Personnages - Aide-Mémoire'),
      ...a.characterSummaries.map((char) =>
        p(`**${char.name}**: ${char.role} | ${char.motivation} | ${char.flaw} | ${char.lastSituation}`)
      ),
      h('Promesses au Lecteur'),
      ...a.readerPromises.map((promise) => p(`• ${promise}`)),
      h('Directions Narratives'),
      ...a.narrativeDirections.map((dir) =>
        p(`**${dir.direction}**\nAvantages: ${dir.advantages}\nRisques: ${dir.risks}`)
      ),
      h('Scènes à Envisager'),
      ...a.suggestedScenes.map((scene) => p(`• ${scene}`)),
      h('Personnages à Développer'),
      p(a.charactersToDevelop),
      h('Alertes'),
      ...a.alerts.map((alert) => p(`⚠️ ${alert}`)),
    ]),
};

export const chapterSummariesConfig: MetadataTypeConfig<ChapterSummaries> = {
  typeKey: 'chapter-summaries',
  title: 'Résumés des Chapitres',
  generate: (provider: LLMProvider, fullText: string) =>
    provider.generateChapterSummaries(fullText),
  format: (a) => {
    const content: object[] = [];
    for (const chapter of a.chapters) {
      content.push(h(`Chapitre ${chapter.chapterNumber} – ${chapter.chapterTitle}`));
      content.push(p(chapter.summary));
    }
    if (a.overallArc) {
      content.push(h('Arc narratif global'));
      content.push(p(a.overallArc));
    }
    return tipTap(content);
  },
};
