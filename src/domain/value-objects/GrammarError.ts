// ABOUTME: Immutable grammar-checking error metadata independent of a specific engine.
// ABOUTME: Validates source ranges and stable rule-family identifiers for the editor.

export class GrammarErrorRange {
  readonly start: number;
  readonly end: number;

  constructor(start: number, end: number) {
    if (!Number.isInteger(start) || !Number.isInteger(end)) {
      throw new Error('Grammar error positions must be integers');
    }
    if (start < 0) {
      throw new Error('Grammar error range start must be non-negative');
    }
    if (end < start) {
      throw new Error('Grammar error range end must be greater than or equal to start');
    }

    this.start = start;
    this.end = end;
  }
}

export class GrammarRuleFamily {
  readonly value: string;

  constructor(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new Error('Grammar rule family cannot be empty');
    }
    this.value = trimmed;
  }
}

export interface GrammarErrorProperties {
  range: GrammarErrorRange;
  message: string;
  suggestions: readonly string[];
  ruleFamily: GrammarRuleFamily;
  ruleId: string;
}

export class GrammarError {
  readonly range: GrammarErrorRange;
  readonly message: string;
  readonly suggestions: readonly string[];
  readonly ruleFamily: GrammarRuleFamily;
  readonly ruleId: string;

  constructor(properties: GrammarErrorProperties) {
    this.range = properties.range;
    this.message = properties.message;
    this.suggestions = [...properties.suggestions];
    this.ruleFamily = properties.ruleFamily;
    this.ruleId = properties.ruleId;
  }
}
