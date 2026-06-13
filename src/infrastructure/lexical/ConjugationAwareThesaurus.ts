// ABOUTME: Thesaurus decorator that resolves synonyms for conjugated verbs
// ABOUTME: Lemmatizes the word, looks up synonyms of the lemma, then re-inflects them to match

import { Thesaurus } from '@/domain/interfaces/Thesaurus';
import { Morphology } from '@/domain/interfaces/Morphology';

export class ConjugationAwareThesaurus implements Thesaurus {
  constructor(
    private readonly base: Thesaurus,
    private readonly morphology: Morphology
  ) {}

  async lookup(word: string): Promise<string[]> {
    const normalized = word.trim().toLowerCase();
    if (normalized.length === 0) return [];

    const interpretations = await this.morphology.lemmatize(normalized);
    const verbForms = interpretations.filter((i) => i.cgram === 'VER');

    // Plain lookup when the word is unknown, not a verb, or already a base form
    // (infinitives are keyed directly in the synonym index).
    const isBaseForm = verbForms.some((i) => i.lemma === normalized);
    if (verbForms.length === 0 || isBaseForm) {
      return this.base.lookup(normalized);
    }

    const seen = new Set<string>();
    const results: string[] = [];
    const visitedLemmas = new Set<string>();

    for (const form of verbForms) {
      if (visitedLemmas.has(form.lemma)) continue;
      visitedLemmas.add(form.lemma);

      const targetMorph = form.morphs[0];
      if (!targetMorph) continue;

      const synonymLemmas = await this.base.lookup(form.lemma);
      for (const synonym of synonymLemmas) {
        const inflected = await this.morphology.inflect(synonym, 'VER', targetMorph);
        if (inflected && !seen.has(inflected)) {
          seen.add(inflected);
          results.push(inflected);
        }
      }
    }

    // Nothing could be re-inflected — fall back to the lemma's synonyms (infinitives)
    // so the author still gets suggestions rather than an empty palette.
    if (results.length === 0) {
      return this.base.lookup(verbForms[0].lemma);
    }

    return results;
  }
}
