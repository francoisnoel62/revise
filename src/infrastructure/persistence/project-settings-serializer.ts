// ABOUTME: Serialization utilities for ProjectSettings entity to/from MongoDB documents
// ABOUTME: Handles Date conversions and type safety for project settings

import { ProjectSettings, ProjectSettingsProperties } from '@/domain/entities/ProjectSettings';
import { ObjectId } from 'mongodb';
import { Contributor, ContributorRole } from '@/domain/value-objects/Contributor';
import { RelatedWork } from '@/domain/value-objects/RelatedWork';
import { PointOfView, NarrationTense, TargetAudience } from '@/domain/value-objects/NarrationSettings';
import { SuggestionLength, AudaceLevel } from '@/domain/value-objects/AutocompletePreferences';
import { CanonExtractionMode } from '@/domain/value-objects/CanonExtractionPreferences';
import type { PublicationProfileId } from '@/domain/value-objects/PublicationProfile';
import type { LevelStylesByProfile } from '@/domain/entities/ProjectSettings';
import type { TocDepth, TocStyle } from '@/domain/value-objects/TocPreferences';
import type { AutomaticSnapshotInterval } from '@/domain/value-objects/AutomaticSnapshotInterval';
import type { GrammarRuleProfile } from '@/domain/value-objects/GrammarRuleProfile';
import type { PersonalDictionaryEntry } from '@/domain/value-objects/PersonalDictionaryEntry';
import type { GrammarPersonalDictionary } from '@/domain/interfaces/GrammarChecker';
import type { IgnoredGrammarIssue } from '@/domain/value-objects/IgnoredGrammarIssue';

export interface ContributorDocument {
  name: string;
  role: string;
}

export interface RelatedWorkDocument {
  title: string;
  projectId?: string;
}

export interface ProjectSettingsDocument {
  _id: ObjectId;
  projectId: string;
  ownerId: string;
  title: string;
  subtitle?: string;
  summary: string;
  coverImageUrl?: string;
  genre: string;
  synopsis: string;
  pointOfView?: string;
  tense?: string;
  targetAudience?: string;
  isbn?: string;
  contributors: ContributorDocument[];
  relatedWorks: RelatedWorkDocument[];
  createdAt: Date;
  updatedAt: Date;
  autocompleteEnabled?: boolean;
  autocompleteSuggestionLength?: string;
  autocompleteAudace?: string;
  autocompleteLearnFromRejections?: boolean;
  autocompletePartialAcceptance?: boolean;
  autocompleteSmartPrefetch?: boolean;
  canonExtractionMode?: CanonExtractionMode;
  /** Bare strings are words stored before the author could describe them. */
  customDictionary?: (string | PersonalDictionaryEntry)[];
  grammarDictionary?: GrammarPersonalDictionary | null;
  ignoredGrammarIssues?: IgnoredGrammarIssue[];
  ignoredWords?: string[];
  grammarRuleProfile?: GrammarRuleProfile;
  publicationProfileId?: PublicationProfileId;
  levelStylesByProfile?: LevelStylesByProfile;
  tocDepth?: TocDepth;
  tocStyle?: TocStyle;
  endnotesTitle?: string;
  automaticSnapshotIntervalMinutes?: AutomaticSnapshotInterval | null;
  snapshotTimeZone?: string;
}

export function serializeProjectSettings(
  settings: ProjectSettings
): Omit<ProjectSettingsDocument, '_id'> & { _id: ObjectId } {
  const props = settings.toProperties();
  return {
    _id: new ObjectId(settings.getId()),
    projectId: settings.getProjectId(),
    ownerId: settings.getOwnerId(),
    title: settings.getTitle(),
    subtitle: settings.getSubtitle(),
    summary: settings.getSummary(),
    coverImageUrl: settings.getCoverImageUrl(),
    genre: settings.getGenre(),
    synopsis: settings.getSynopsis(),
    pointOfView: settings.getPointOfView(),
    tense: settings.getTense(),
    targetAudience: settings.getTargetAudience(),
    isbn: settings.getIsbn(),
    contributors: settings.getContributors().map((c) => ({
      name: c.name,
      role: c.role,
    })),
    relatedWorks: settings.getRelatedWorks().map((w) => ({
      title: w.title,
      projectId: w.projectId,
    })),
    createdAt: settings.getCreatedAt(),
    updatedAt: settings.getUpdatedAt(),
    autocompleteEnabled: props.autocompleteEnabled,
    autocompleteSuggestionLength: props.autocompleteSuggestionLength,
    autocompleteAudace: props.autocompleteAudace,
    autocompleteLearnFromRejections: props.autocompleteLearnFromRejections,
    autocompletePartialAcceptance: props.autocompletePartialAcceptance,
    autocompleteSmartPrefetch: props.autocompleteSmartPrefetch,
    canonExtractionMode: props.canonExtractionMode,
    customDictionary: props.customDictionary ?? [],
    grammarDictionary: props.grammarDictionary ?? null,
    ignoredGrammarIssues: props.ignoredGrammarIssues ?? [],
    ignoredWords: props.ignoredWords ?? [],
    grammarRuleProfile: props.grammarRuleProfile,
    publicationProfileId: props.publicationProfileId,
    levelStylesByProfile: props.levelStylesByProfile,
    tocDepth: props.tocDepth,
    tocStyle: props.tocStyle,
    endnotesTitle: props.endnotesTitle,
    automaticSnapshotIntervalMinutes: props.automaticSnapshotIntervalMinutes,
    snapshotTimeZone: props.snapshotTimeZone,
  };
}

export function deserializeProjectSettings(doc: ProjectSettingsDocument): ProjectSettings {
  const contributors: Contributor[] = doc.contributors.map((c) => ({
    name: c.name,
    role: c.role as ContributorRole,
  }));

  const relatedWorks: RelatedWork[] = doc.relatedWorks.map((w) => ({
    title: w.title,
    projectId: w.projectId,
  }));

  const props: ProjectSettingsProperties = {
    id: doc._id.toHexString(),
    projectId: doc.projectId,
    ownerId: doc.ownerId,
    title: doc.title,
    subtitle: doc.subtitle,
    summary: doc.summary,
    coverImageUrl: doc.coverImageUrl,
    genre: doc.genre,
    synopsis: doc.synopsis,
    pointOfView: doc.pointOfView as PointOfView | undefined,
    tense: doc.tense as NarrationTense | undefined,
    targetAudience: doc.targetAudience as TargetAudience | undefined,
    isbn: doc.isbn,
    contributors,
    relatedWorks,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    autocompleteEnabled: doc.autocompleteEnabled,
    autocompleteSuggestionLength: doc.autocompleteSuggestionLength as SuggestionLength | undefined,
    autocompleteAudace: doc.autocompleteAudace as AudaceLevel | undefined,
    autocompleteLearnFromRejections: doc.autocompleteLearnFromRejections,
    autocompletePartialAcceptance: doc.autocompletePartialAcceptance,
    autocompleteSmartPrefetch: doc.autocompleteSmartPrefetch,
    canonExtractionMode: doc.canonExtractionMode,
    customDictionary: doc.customDictionary ?? [],
    grammarDictionary: doc.grammarDictionary ?? null,
    ignoredGrammarIssues: doc.ignoredGrammarIssues ?? [],
    ignoredWords: doc.ignoredWords ?? [],
    grammarRuleProfile: doc.grammarRuleProfile,
    publicationProfileId: doc.publicationProfileId,
    levelStylesByProfile: doc.levelStylesByProfile,
    tocDepth: doc.tocDepth,
    tocStyle: doc.tocStyle,
    endnotesTitle: doc.endnotesTitle,
    automaticSnapshotIntervalMinutes: doc.automaticSnapshotIntervalMinutes,
    snapshotTimeZone: doc.snapshotTimeZone,
  };

  return ProjectSettings.reconstruct(props);
}
