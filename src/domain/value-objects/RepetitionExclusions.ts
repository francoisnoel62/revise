// ABOUTME: Immutable value object managing words excluded from repetition detection
// ABOUTME: Supports multiple sources: character names, place names, and user-defined exclusions

export type ExclusionSource = 'character' | 'place' | 'user';

export interface RepetitionExclusionsData {
  characterNames?: string[];
  placeNames?: string[];
  userExclusions?: string[];
}

export class RepetitionExclusions {
  private readonly characterNames: Set<string>;
  private readonly placeNames: Set<string>;
  private readonly userExclusions: Set<string>;

  constructor(data: RepetitionExclusionsData = {}) {
    this.characterNames = new Set(
      (data.characterNames || []).map((w) => w.toLowerCase())
    );
    this.placeNames = new Set(
      (data.placeNames || []).map((w) => w.toLowerCase())
    );
    this.userExclusions = new Set(
      (data.userExclusions || []).map((w) => w.toLowerCase())
    );
  }

  isExcluded(word: string): boolean {
    const normalized = word.toLowerCase();
    return (
      this.characterNames.has(normalized) ||
      this.placeNames.has(normalized) ||
      this.userExclusions.has(normalized)
    );
  }

  getSource(word: string): ExclusionSource | null {
    const normalized = word.toLowerCase();

    if (this.characterNames.has(normalized)) {
      return 'character';
    }
    if (this.placeNames.has(normalized)) {
      return 'place';
    }
    if (this.userExclusions.has(normalized)) {
      return 'user';
    }

    return null;
  }

  addUserExclusion(word: string): RepetitionExclusions {
    const normalized = word.toLowerCase();

    // Don't add if already excluded from any source
    if (this.isExcluded(normalized)) {
      return this;
    }

    return new RepetitionExclusions({
      characterNames: Array.from(this.characterNames),
      placeNames: Array.from(this.placeNames),
      userExclusions: [...Array.from(this.userExclusions), normalized],
    });
  }

  removeUserExclusion(word: string): RepetitionExclusions {
    const normalized = word.toLowerCase();

    if (!this.userExclusions.has(normalized)) {
      return this;
    }

    const newUserExclusions = Array.from(this.userExclusions).filter(
      (w) => w !== normalized
    );

    return new RepetitionExclusions({
      characterNames: Array.from(this.characterNames),
      placeNames: Array.from(this.placeNames),
      userExclusions: newUserExclusions,
    });
  }

  getCharacterNames(): string[] {
    return Array.from(this.characterNames);
  }

  getPlaceNames(): string[] {
    return Array.from(this.placeNames);
  }

  getUserExclusions(): string[] {
    return Array.from(this.userExclusions);
  }

  getAll(): string[] {
    return [
      ...this.getCharacterNames(),
      ...this.getPlaceNames(),
      ...this.getUserExclusions(),
    ];
  }

  mergeWith(other: RepetitionExclusions): RepetitionExclusions {
    const mergedCharacters = new Set([
      ...this.characterNames,
      ...other.characterNames,
    ]);
    const mergedPlaces = new Set([...this.placeNames, ...other.placeNames]);
    const mergedUser = new Set([...this.userExclusions, ...other.userExclusions]);

    return new RepetitionExclusions({
      characterNames: Array.from(mergedCharacters),
      placeNames: Array.from(mergedPlaces),
      userExclusions: Array.from(mergedUser),
    });
  }
}

export function createRepetitionExclusions(
  data: RepetitionExclusionsData = {}
): RepetitionExclusions {
  return new RepetitionExclusions(data);
}
