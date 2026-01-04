// ABOUTME: Immutable value object representing a text selection with start and end positions
// ABOUTME: Enforces valid selection ranges and provides selection length calculations

export class TextSelection {
  readonly start: number;
  readonly end: number;

  constructor(start: number, end: number) {
    if (start < 0) {
      throw new Error('Selection start must be non-negative');
    }

    if (end < start) {
      throw new Error('Selection end must be greater than or equal to start');
    }

    this.start = start;
    this.end = end;
  }

  getLength(): number {
    return this.end - this.start;
  }

  isEmpty(): boolean {
    return this.start === this.end;
  }
}
