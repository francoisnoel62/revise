// ABOUTME: Serialization utilities for AutocompleteEvent to/from MongoDB documents
// ABOUTME: Handles ObjectId and Date conversions for the instrumentation collection

import {
  AutocompleteEvent,
  AutocompleteEventProperties,
} from '@/domain/entities/AutocompleteEvent';
import { AutocompleteOutcome } from '@/domain/value-objects/AutocompleteOutcome';
import { AutocompleteIntent } from '@/domain/value-objects/AutocompleteIntent';
import { ObjectId } from 'mongodb';

export interface AutocompleteEventDocument {
  _id: ObjectId;
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
  acceptedChars: number;
  acceptedWords: number;
  intent: AutocompleteIntent | null;
  outcome: AutocompleteOutcome;
  deletedAfterMs: number | null;
  createdAt: Date;
}

export function serializeAutocompleteEvent(
  event: AutocompleteEvent
): AutocompleteEventDocument {
  return {
    _id: new ObjectId(event.getId()),
    ownerId: event.getOwnerId(),
    projectId: event.getProjectId(),
    chapterId: event.getChapterId(),
    suggestionId: event.getSuggestionId(),
    providerType: event.getProviderType(),
    model: event.getModel(),
    triggeredAt: event.getTriggeredAt(),
    firstTokenMs: event.getFirstTokenMs(),
    totalMs: event.getTotalMs(),
    suggestionLengthChars: event.getSuggestionLengthChars(),
    suggestionLengthWords: event.getSuggestionLengthWords(),
    acceptedChars: event.getAcceptedChars(),
    acceptedWords: event.getAcceptedWords(),
    intent: event.getIntent(),
    outcome: event.getOutcome(),
    deletedAfterMs: event.getDeletedAfterMs(),
    createdAt: event.getCreatedAt(),
  };
}

export function deserializeAutocompleteEvent(
  doc: AutocompleteEventDocument
): AutocompleteEvent {
  const props: AutocompleteEventProperties = {
    id: doc._id.toHexString(),
    ownerId: doc.ownerId,
    projectId: doc.projectId,
    chapterId: doc.chapterId ?? null,
    suggestionId: doc.suggestionId,
    providerType: doc.providerType ?? null,
    model: doc.model ?? null,
    triggeredAt: doc.triggeredAt,
    firstTokenMs: doc.firstTokenMs ?? null,
    totalMs: doc.totalMs,
    suggestionLengthChars: doc.suggestionLengthChars,
    suggestionLengthWords: doc.suggestionLengthWords,
    acceptedChars: doc.acceptedChars ?? 0,
    acceptedWords: doc.acceptedWords ?? 0,
    intent: doc.intent ?? null,
    outcome: doc.outcome,
    deletedAfterMs: doc.deletedAfterMs ?? null,
    createdAt: doc.createdAt,
  };
  return AutocompleteEvent.reconstruct(props);
}
