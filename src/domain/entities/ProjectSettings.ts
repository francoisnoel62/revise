// ABOUTME: Domain entity representing project settings (title, cover, narration, etc.)
// ABOUTME: Separate from AI-generated metadata, owned by the author

import { Contributor } from '../value-objects/Contributor';
import { RelatedWork } from '../value-objects/RelatedWork';
import { PointOfView, NarrationTense, TargetAudience } from '../value-objects/NarrationSettings';
import {
  AutocompletePreferences,
  SuggestionLength,
  AudaceLevel,
  DEFAULT_AUTOCOMPLETE_PREFERENCES,
} from '../value-objects/AutocompletePreferences';
import {
  CanonExtractionPreferences,
  CanonExtractionMode,
  DEFAULT_CANON_EXTRACTION_PREFERENCES,
} from '../value-objects/CanonExtractionPreferences';

export interface ProjectSettingsProperties {
  id: string;
  projectId: string;
  ownerId: string;
  title: string;
  subtitle?: string;
  summary: string;
  coverImageUrl?: string;
  genre: string;
  synopsis: string;
  pointOfView?: PointOfView;
  tense?: NarrationTense;
  targetAudience?: TargetAudience;
  isbn?: string;
  contributors: Contributor[];
  relatedWorks: RelatedWork[];
  createdAt: Date;
  updatedAt: Date;
  autocompleteEnabled?: boolean;
  autocompleteSuggestionLength?: SuggestionLength;
  autocompleteAudace?: AudaceLevel;
  autocompleteLearnFromRejections?: boolean;
  autocompletePartialAcceptance?: boolean;
  autocompleteSmartPrefetch?: boolean;
  canonExtractionMode?: CanonExtractionMode;
  customDictionary?: string[];
}

export class ProjectSettings {
  private readonly id: string;
  private readonly projectId: string;
  private readonly ownerId: string;
  private title: string;
  private subtitle?: string;
  private summary: string;
  private coverImageUrl?: string;
  private genre: string;
  private synopsis: string;
  private pointOfView?: PointOfView;
  private tense?: NarrationTense;
  private targetAudience?: TargetAudience;
  private isbn?: string;
  private contributors: Contributor[];
  private relatedWorks: RelatedWork[];
  private readonly createdAt: Date;
  private updatedAt: Date;
  private autocompleteEnabled?: boolean;
  private autocompleteSuggestionLength?: SuggestionLength;
  private autocompleteAudace?: AudaceLevel;
  private autocompleteLearnFromRejections?: boolean;
  private autocompletePartialAcceptance?: boolean;
  private autocompleteSmartPrefetch?: boolean;
  private canonExtractionMode?: CanonExtractionMode;
  private customDictionary: string[];

  private constructor(props: ProjectSettingsProperties) {
    this.validate(props);

    this.id = props.id.trim();
    this.projectId = props.projectId.trim();
    this.ownerId = props.ownerId.trim();
    this.title = props.title.trim();
    this.subtitle = props.subtitle?.trim();
    this.summary = props.summary.trim();
    this.coverImageUrl = props.coverImageUrl?.trim();
    this.genre = props.genre.trim();
    this.synopsis = props.synopsis.trim();
    this.pointOfView = props.pointOfView;
    this.tense = props.tense;
    this.targetAudience = props.targetAudience;
    this.isbn = props.isbn?.trim();
    this.contributors = [...props.contributors];
    this.relatedWorks = [...props.relatedWorks];
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.autocompleteEnabled = props.autocompleteEnabled;
    this.autocompleteSuggestionLength = props.autocompleteSuggestionLength;
    this.autocompleteAudace = props.autocompleteAudace;
    this.autocompleteLearnFromRejections = props.autocompleteLearnFromRejections;
    this.autocompletePartialAcceptance = props.autocompletePartialAcceptance;
    this.autocompleteSmartPrefetch = props.autocompleteSmartPrefetch;
    this.canonExtractionMode = props.canonExtractionMode;
    this.customDictionary = [...(props.customDictionary ?? [])];
  }

  private validate(props: ProjectSettingsProperties): void {
    if (!props.id || props.id.trim().length === 0) {
      throw new Error('Project settings ID cannot be empty');
    }
    if (!props.projectId || props.projectId.trim().length === 0) {
      throw new Error('Project ID cannot be empty');
    }
    if (!props.ownerId || props.ownerId.trim().length === 0) {
      throw new Error('Owner ID cannot be empty');
    }
    if (!props.title || props.title.trim().length === 0) {
      throw new Error('Project title cannot be empty');
    }
  }

  static create(
    id: string,
    projectId: string,
    ownerId: string,
    title: string
  ): ProjectSettings {
    const now = new Date();
    return new ProjectSettings({
      id,
      projectId,
      ownerId,
      title,
      subtitle: undefined,
      summary: '',
      coverImageUrl: undefined,
      genre: '',
      synopsis: '',
      pointOfView: undefined,
      tense: undefined,
      targetAudience: undefined,
      isbn: undefined,
      contributors: [],
      relatedWorks: [],
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstruct(props: ProjectSettingsProperties): ProjectSettings {
    return new ProjectSettings(props);
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getProjectId(): string {
    return this.projectId;
  }

  getOwnerId(): string {
    return this.ownerId;
  }

  getTitle(): string {
    return this.title;
  }

  getSubtitle(): string | undefined {
    return this.subtitle;
  }

  getSummary(): string {
    return this.summary;
  }

  getCoverImageUrl(): string | undefined {
    return this.coverImageUrl;
  }

  getGenre(): string {
    return this.genre;
  }

  getSynopsis(): string {
    return this.synopsis;
  }

  getPointOfView(): PointOfView | undefined {
    return this.pointOfView;
  }

  getTense(): NarrationTense | undefined {
    return this.tense;
  }

  getTargetAudience(): TargetAudience | undefined {
    return this.targetAudience;
  }

  getIsbn(): string | undefined {
    return this.isbn;
  }

  getContributors(): Contributor[] {
    return [...this.contributors];
  }

  getRelatedWorks(): RelatedWork[] {
    return [...this.relatedWorks];
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt.getTime());
  }

  getUpdatedAt(): Date {
    return new Date(this.updatedAt.getTime());
  }

  // Mutations (return new instance for immutability)
  updateTitle(title: string): ProjectSettings {
    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      throw new Error('Project title cannot be empty');
    }
    return new ProjectSettings({
      ...this.toProperties(),
      title: trimmedTitle,
      updatedAt: new Date(),
    });
  }

  updateSubtitle(subtitle: string | undefined): ProjectSettings {
    return new ProjectSettings({
      ...this.toProperties(),
      subtitle: subtitle?.trim(),
      updatedAt: new Date(),
    });
  }

  updateSummary(summary: string): ProjectSettings {
    return new ProjectSettings({
      ...this.toProperties(),
      summary: summary.trim(),
      updatedAt: new Date(),
    });
  }

  updateCoverImageUrl(coverImageUrl: string | undefined): ProjectSettings {
    return new ProjectSettings({
      ...this.toProperties(),
      coverImageUrl: coverImageUrl?.trim(),
      updatedAt: new Date(),
    });
  }

  updateGenre(genre: string): ProjectSettings {
    return new ProjectSettings({
      ...this.toProperties(),
      genre: genre.trim(),
      updatedAt: new Date(),
    });
  }

  updateSynopsis(synopsis: string): ProjectSettings {
    return new ProjectSettings({
      ...this.toProperties(),
      synopsis: synopsis.trim(),
      updatedAt: new Date(),
    });
  }

  updatePointOfView(pointOfView: PointOfView | undefined): ProjectSettings {
    return new ProjectSettings({
      ...this.toProperties(),
      pointOfView,
      updatedAt: new Date(),
    });
  }

  updateTense(tense: NarrationTense | undefined): ProjectSettings {
    return new ProjectSettings({
      ...this.toProperties(),
      tense,
      updatedAt: new Date(),
    });
  }

  updateTargetAudience(targetAudience: TargetAudience | undefined): ProjectSettings {
    return new ProjectSettings({
      ...this.toProperties(),
      targetAudience,
      updatedAt: new Date(),
    });
  }

  updateIsbn(isbn: string | undefined): ProjectSettings {
    return new ProjectSettings({
      ...this.toProperties(),
      isbn: isbn?.trim(),
      updatedAt: new Date(),
    });
  }

  updateContributors(contributors: Contributor[]): ProjectSettings {
    return new ProjectSettings({
      ...this.toProperties(),
      contributors: [...contributors],
      updatedAt: new Date(),
    });
  }

  updateRelatedWorks(relatedWorks: RelatedWork[]): ProjectSettings {
    return new ProjectSettings({
      ...this.toProperties(),
      relatedWorks: [...relatedWorks],
      updatedAt: new Date(),
    });
  }

  getAutocompletePreferences(): AutocompletePreferences {
    return {
      enabled: this.autocompleteEnabled ?? DEFAULT_AUTOCOMPLETE_PREFERENCES.enabled,
      smartPrefetch: this.autocompleteSmartPrefetch ?? DEFAULT_AUTOCOMPLETE_PREFERENCES.smartPrefetch,
      suggestionLength: this.autocompleteSuggestionLength ?? DEFAULT_AUTOCOMPLETE_PREFERENCES.suggestionLength,
      audace: this.autocompleteAudace ?? DEFAULT_AUTOCOMPLETE_PREFERENCES.audace,
      learnFromRejections: this.autocompleteLearnFromRejections ?? DEFAULT_AUTOCOMPLETE_PREFERENCES.learnFromRejections,
      partialAcceptance: this.autocompletePartialAcceptance ?? DEFAULT_AUTOCOMPLETE_PREFERENCES.partialAcceptance,
    };
  }

  updateAutocompletePreferences(prefs: Partial<AutocompletePreferences>): ProjectSettings {
    return new ProjectSettings({
      ...this.toProperties(),
      autocompleteEnabled: prefs.enabled ?? this.autocompleteEnabled,
      autocompleteSuggestionLength: prefs.suggestionLength ?? this.autocompleteSuggestionLength,
      autocompleteAudace: prefs.audace ?? this.autocompleteAudace,
      autocompleteLearnFromRejections: prefs.learnFromRejections ?? this.autocompleteLearnFromRejections,
      autocompletePartialAcceptance: prefs.partialAcceptance ?? this.autocompletePartialAcceptance,
      autocompleteSmartPrefetch: prefs.smartPrefetch ?? this.autocompleteSmartPrefetch,
      updatedAt: new Date(),
    });
  }

  getCanonExtractionPreferences(): CanonExtractionPreferences {
    return {
      mode: this.canonExtractionMode ?? DEFAULT_CANON_EXTRACTION_PREFERENCES.mode,
    };
  }

  updateCanonExtractionPreferences(prefs: Partial<CanonExtractionPreferences>): ProjectSettings {
    return new ProjectSettings({
      ...this.toProperties(),
      canonExtractionMode: prefs.mode ?? this.canonExtractionMode,
      updatedAt: new Date(),
    });
  }

  getCustomDictionary(): string[] {
    return [...this.customDictionary];
  }

  addWordToCustomDictionary(word: string): ProjectSettings {
    const trimmed = word.trim();
    if (!trimmed) throw new Error('Word cannot be empty');
    if (this.customDictionary.includes(trimmed)) return this;
    return new ProjectSettings({
      ...this.toProperties(),
      customDictionary: [...this.customDictionary, trimmed],
      updatedAt: new Date(),
    });
  }

  updateCustomDictionary(words: string[]): ProjectSettings {
    return new ProjectSettings({
      ...this.toProperties(),
      customDictionary: [...words],
      updatedAt: new Date(),
    });
  }

  toProperties(): ProjectSettingsProperties {
    return {
      id: this.id,
      projectId: this.projectId,
      ownerId: this.ownerId,
      title: this.title,
      subtitle: this.subtitle,
      summary: this.summary,
      coverImageUrl: this.coverImageUrl,
      genre: this.genre,
      synopsis: this.synopsis,
      pointOfView: this.pointOfView,
      tense: this.tense,
      targetAudience: this.targetAudience,
      isbn: this.isbn,
      contributors: [...this.contributors],
      relatedWorks: [...this.relatedWorks],
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      autocompleteEnabled: this.autocompleteEnabled,
      autocompleteSuggestionLength: this.autocompleteSuggestionLength,
      autocompleteAudace: this.autocompleteAudace,
      autocompleteLearnFromRejections: this.autocompleteLearnFromRejections,
      autocompletePartialAcceptance: this.autocompletePartialAcceptance,
      autocompleteSmartPrefetch: this.autocompleteSmartPrefetch,
      canonExtractionMode: this.canonExtractionMode,
      customDictionary: [...this.customDictionary],
    };
  }
}
