// ABOUTME: Immutable value object representing a single spelling/grammar correction
// ABOUTME: Contains the original text, corrected text, and explanation of the issue

export type CorrectionType = 'spelling' | 'grammar' | 'style' | 'punctuation';

export interface SpellCheckCorrectionData {
  original: string;
  corrected: string;
  type: CorrectionType;
  explanation: string;
  position?: {
    start: number;
    end: number;
  };
}

export class SpellCheckCorrection {
  readonly original: string;
  readonly corrected: string;
  readonly type: CorrectionType;
  readonly explanation: string;
  readonly position?: {
    start: number;
    end: number;
  };

  constructor(data: SpellCheckCorrectionData) {
    if (!data.original || data.original.trim().length === 0) {
      throw new Error('Original text cannot be empty');
    }

    if (!data.corrected || data.corrected.trim().length === 0) {
      throw new Error('Corrected text cannot be empty');
    }

    if (!data.explanation || data.explanation.trim().length === 0) {
      throw new Error('Explanation cannot be empty');
    }

    this.original = data.original;
    this.corrected = data.corrected;
    this.type = data.type;
    this.explanation = data.explanation;
    this.position = data.position;
  }

  /**
   * Check if the correction actually changes the text
   */
  hasChange(): boolean {
    return this.original !== this.corrected;
  }

  /**
   * Get a user-friendly label for the correction type
   */
  getTypeLabel(): string {
    switch (this.type) {
      case 'spelling':
        return 'Orthographe';
      case 'grammar':
        return 'Grammaire';
      case 'style':
        return 'Style';
      case 'punctuation':
        return 'Ponctuation';
      default:
        return 'Correction';
    }
  }
}

/**
 * Result of a spell check operation
 */
export interface SpellCheckResult {
  corrections: SpellCheckCorrection[];
  correctedText: string;
  hasErrors: boolean;
  summary: string;
}
