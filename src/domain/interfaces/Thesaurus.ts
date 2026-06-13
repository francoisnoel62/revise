// ABOUTME: Domain interface for the lexical thesaurus — returns synonym candidates for a word
// ABOUTME: Implemented by JeuxDeMotsThesaurus (infrastructure); swappable by design

export interface Thesaurus {
  lookup(word: string): Promise<string[]>;
}
