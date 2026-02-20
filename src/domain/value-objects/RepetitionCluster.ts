// ABOUTME: Immutable value object representing a cluster of word repetitions
// ABOUTME: Tracks positions, suggestions, and intentionality for repeated words

export interface RepetitionPosition {
  start: number;
  end: number;
}

export interface RepetitionClusterData {
  word: string;
  positions: RepetitionPosition[];
  suggestions?: string[];
  isIntentional?: boolean;
}

export class RepetitionCluster {
  readonly word: string;
  readonly positions: readonly RepetitionPosition[];
  readonly suggestions: readonly string[];
  readonly isIntentional: boolean;

  constructor(data: RepetitionClusterData) {
    // Validate word
    if (!data.word || data.word.length === 0) {
      throw new Error('Word cannot be empty');
    }

    // Validate positions count
    if (!data.positions || data.positions.length < 2) {
      throw new Error('A repetition must have at least 2 occurrences');
    }

    // Validate each position
    for (const pos of data.positions) {
      if (pos.start < 0) {
        throw new Error('Position start must be non-negative');
      }
      if (pos.end <= pos.start) {
        throw new Error('Position end must be greater than start');
      }
    }

    this.word = data.word;
    // Sort positions by start index and make immutable copy
    this.positions = [...data.positions].sort((a, b) => a.start - b.start);
    this.suggestions = data.suggestions ? [...data.suggestions] : [];
    this.isIntentional = data.isIntentional ?? false;
  }

  getCount(): number {
    return this.positions.length;
  }

  getFirstOccurrence(): RepetitionPosition {
    return { ...this.positions[0] };
  }

  getLastOccurrence(): RepetitionPosition {
    return { ...this.positions[this.positions.length - 1] };
  }

  getSpan(): number {
    const first = this.getFirstOccurrence();
    const last = this.getLastOccurrence();
    return last.end - first.start;
  }

  markAsIntentional(): RepetitionCluster {
    return new RepetitionCluster({
      word: this.word,
      positions: [...this.positions],
      suggestions: [...this.suggestions],
      isIntentional: true,
    });
  }

  addSuggestion(suggestion: string): RepetitionCluster {
    if (this.suggestions.includes(suggestion)) {
      return this;
    }

    return new RepetitionCluster({
      word: this.word,
      positions: [...this.positions],
      suggestions: [...this.suggestions, suggestion],
      isIntentional: this.isIntentional,
    });
  }
}

export function createRepetitionCluster(data: RepetitionClusterData): RepetitionCluster {
  return new RepetitionCluster(data);
}
