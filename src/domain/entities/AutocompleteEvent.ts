// ABOUTME: AutocompleteEvent entity — one record summarizing the lifecycle of a single suggestion
// ABOUTME: Captures perceived latency, duration, length and terminal outcome for instrumentation

import {
  AutocompleteOutcome,
  isValidAutocompleteOutcome,
} from '../value-objects/AutocompleteOutcome';

export interface AutocompleteEventProperties {
  id: string;
  ownerId: string;
  projectId: string;
  chapterId: string | null;
  suggestionId: string;
  providerType: string | null;
  model: string | null;
  triggeredAt: Date;
  firstTokenMs: number | null;
  totalMs: number;
  suggestionLengthChars: number;
  suggestionLengthWords: number;
  outcome: AutocompleteOutcome;
  deletedAfterMs: number | null;
  createdAt: Date;
}

export type CreateAutocompleteEventProps = Omit<AutocompleteEventProperties, 'createdAt'>;

export class AutocompleteEvent {
  private readonly id: string;
  private readonly ownerId: string;
  private readonly projectId: string;
  private readonly chapterId: string | null;
  private readonly suggestionId: string;
  private readonly providerType: string | null;
  private readonly model: string | null;
  private readonly triggeredAt: Date;
  private readonly firstTokenMs: number | null;
  private readonly totalMs: number;
  private readonly suggestionLengthChars: number;
  private readonly suggestionLengthWords: number;
  private readonly outcome: AutocompleteOutcome;
  private readonly deletedAfterMs: number | null;
  private readonly createdAt: Date;

  private constructor(props: AutocompleteEventProperties) {
    this.validate(props);

    this.id = props.id;
    this.ownerId = props.ownerId;
    this.projectId = props.projectId;
    this.chapterId = props.chapterId;
    this.suggestionId = props.suggestionId;
    this.providerType = props.providerType;
    this.model = props.model;
    this.triggeredAt = props.triggeredAt;
    this.firstTokenMs = props.firstTokenMs;
    this.totalMs = props.totalMs;
    this.suggestionLengthChars = props.suggestionLengthChars;
    this.suggestionLengthWords = props.suggestionLengthWords;
    this.outcome = props.outcome;
    this.deletedAfterMs = props.deletedAfterMs;
    this.createdAt = props.createdAt;
  }

  private validate(props: AutocompleteEventProperties): void {
    if (!props.suggestionId || props.suggestionId.trim().length === 0) {
      throw new Error('suggestionId is required');
    }
    if (!isValidAutocompleteOutcome(props.outcome)) {
      throw new Error(`Invalid outcome: ${props.outcome}`);
    }
    this.requireNonNegative(props.totalMs, 'totalMs');
    this.requireNonNegativeOrNull(props.firstTokenMs, 'firstTokenMs');
    this.requireNonNegative(props.suggestionLengthChars, 'suggestionLengthChars');
    this.requireNonNegative(props.suggestionLengthWords, 'suggestionLengthWords');
    this.requireNonNegativeOrNull(props.deletedAfterMs, 'deletedAfterMs');
    if (props.outcome === 'empty' && props.firstTokenMs !== null) {
      throw new Error('firstTokenMs must be null when outcome is empty');
    }
  }

  private requireNonNegative(value: number, field: string): void {
    if (value < 0) {
      throw new Error(`${field} cannot be negative`);
    }
  }

  private requireNonNegativeOrNull(value: number | null, field: string): void {
    if (value !== null && value < 0) {
      throw new Error(`${field} cannot be negative`);
    }
  }

  static create(props: CreateAutocompleteEventProps): AutocompleteEvent {
    return new AutocompleteEvent({ ...props, createdAt: new Date() });
  }

  static reconstruct(props: AutocompleteEventProperties): AutocompleteEvent {
    return new AutocompleteEvent(props);
  }

  getId(): string {
    return this.id;
  }
  getOwnerId(): string {
    return this.ownerId;
  }
  getProjectId(): string {
    return this.projectId;
  }
  getChapterId(): string | null {
    return this.chapterId;
  }
  getSuggestionId(): string {
    return this.suggestionId;
  }
  getProviderType(): string | null {
    return this.providerType;
  }
  getModel(): string | null {
    return this.model;
  }
  getTriggeredAt(): Date {
    return this.triggeredAt;
  }
  getFirstTokenMs(): number | null {
    return this.firstTokenMs;
  }
  getTotalMs(): number {
    return this.totalMs;
  }
  getSuggestionLengthChars(): number {
    return this.suggestionLengthChars;
  }
  getSuggestionLengthWords(): number {
    return this.suggestionLengthWords;
  }
  getOutcome(): AutocompleteOutcome {
    return this.outcome;
  }
  getDeletedAfterMs(): number | null {
    return this.deletedAfterMs;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
}
