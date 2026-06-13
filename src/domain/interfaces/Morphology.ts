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
}
