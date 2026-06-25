// ABOUTME: Serialization utilities for ProjectSettings entity to/from MongoDB documents
// ABOUTME: Handles Date conversions and type safety for project settings

import { ProjectSettings, ProjectSettingsProperties } from '@/domain/entities/ProjectSettings';
import { ObjectId } from 'mongodb';
import { Contributor, ContributorRole } from '@/domain/value-objects/Contributor';
import { RelatedWork } from '@/domain/value-objects/RelatedWork';
import { PointOfView, NarrationTense, TargetAudience } from '@/domain/value-objects/NarrationSettings';
import { SuggestionLength, AudaceLevel } from '@/domain/value-objects/AutocompletePreferences';
import { CanonExtractionMode } from '@/domain/value-objects/CanonExtractionPreferences';

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
  customDictionary?: string[];
  ignoredWords?: string[];
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
    ignoredWords: props.ignoredWords ?? [],
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
    ignoredWords: doc.ignoredWords ?? [],
  };

  return ProjectSettings.reconstruct(props);
}
