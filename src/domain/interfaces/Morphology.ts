// ABOUTME: Domain interface for French morphology — lemmatization and re-inflection
// ABOUTME: Lets the thesaurus resolve synonyms for inflected words; swappable by design

export interface MorphInterpretation {
  lemma: string;
  cgram: string;
  morphs: string[];
}

export interface Morphology {
  // Maps an inflected form to its possible lemmas and morphological features
  lemmatize(word: string): Promise<MorphInterpretation[]>;

  // Produces the surface form of a lemma for a given category and morphological tag
  // (e.g. inflect('observer', 'VER', 'ind:imp:3s') → 'observait'); null when not found
  inflect(lemma: string, cgram: string, morph: string): Promise<string | null>;

  // Re-inflects many lemmas at once in a single query; returns lemma → surface form
  // for those that have a matching form (others are absent from the map)
  inflectBatch(lemmas: string[], cgram: string, morph: string): Promise<Map<string, string>>;
}
