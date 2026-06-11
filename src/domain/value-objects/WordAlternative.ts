// ABOUTME: Immutable value object for a thesaurus layer-2 proposal
// ABOUTME: Carries a word alternative with its scene-effect justification

export interface WordAlternativeData {
  word: string;
  sceneEffect: string;
  register?: string;
}

export class WordAlternative {
  readonly word: string;
  readonly sceneEffect: string;
  readonly register?: string;

  constructor(data: WordAlternativeData) {
    const trimmedWord = data.word.trim();
    if (trimmedWord.length === 0) {
      throw new Error('WordAlternative word cannot be empty');
    }

    const trimmedEffect = data.sceneEffect.trim();
    if (trimmedEffect.length === 0) {
      throw new Error('WordAlternative sceneEffect cannot be empty');
    }

    this.word = trimmedWord;
    this.sceneEffect = trimmedEffect;
    this.register = data.register?.trim() || undefined;
  }
}

export function createWordAlternative(data: WordAlternativeData): WordAlternative {
  return new WordAlternative(data);
}
