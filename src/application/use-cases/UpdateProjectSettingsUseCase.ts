// ABOUTME: Use case for updating project settings
// ABOUTME: Supports partial updates of all settings fields

import { ProjectSettings } from '@/domain/entities/ProjectSettings';
import { ProjectSettingsRepository } from '@/domain/interfaces/ProjectSettingsRepository';
import { IdGenerator } from '@/domain/interfaces/IdGenerator';
import { Contributor } from '@/domain/value-objects/Contributor';
import { RelatedWork } from '@/domain/value-objects/RelatedWork';
import { PointOfView, NarrationTense, TargetAudience } from '@/domain/value-objects/NarrationSettings';
import { AutocompletePreferences } from '@/domain/value-objects/AutocompletePreferences';
import { CanonExtractionPreferences } from '@/domain/value-objects/CanonExtractionPreferences';
import type { PublicationProfileId } from '@/domain/value-objects/PublicationProfile';
import type { LevelStyleSetProperties } from '@/domain/value-objects/LevelStyleSet';
import type { TocPreferences } from '@/domain/value-objects/TocPreferences';
import type { AutomaticSnapshotInterval } from '@/domain/value-objects/AutomaticSnapshotInterval';
import type { AutomaticSnapshotRepository } from '@/domain/interfaces/AutomaticSnapshotRepository';
import type { GrammarRuleProfile } from '@/domain/value-objects/GrammarRuleProfile';

export interface ProjectSettingsUpdates {
  title?: string;
  subtitle?: string;
  summary?: string;
  genre?: string;
  synopsis?: string;
  pointOfView?: PointOfView;
  tense?: NarrationTense;
  targetAudience?: TargetAudience;
  isbn?: string;
  contributors?: Contributor[];
  relatedWorks?: RelatedWork[];
  autocompletePreferences?: Partial<AutocompletePreferences>;
  canonExtractionPreferences?: Partial<CanonExtractionPreferences>;
  // Declaring a word changes the compiled engine dictionary, so that write goes
  // through UpdatePersonalDictionaryUseCase, which rebuilds it. A generic update
  // here would replace the list and leave the automaton describing other words.
  ignoredWords?: string[];
  grammarRuleProfile?: GrammarRuleProfile;
  publicationProfileId?: PublicationProfileId;
  levelStyles?: {
    profileId: PublicationProfileId;
    styles: LevelStyleSetProperties;
  };
  tocPreferences?: Partial<TocPreferences>;
  endnotesTitle?: string;
  automaticSnapshotIntervalMinutes?: AutomaticSnapshotInterval | null;
  snapshotTimeZone?: string;
}

export interface UpdateProjectSettingsInput {
  userId: string;
  projectId: string;
  updates: ProjectSettingsUpdates;
}

export class UpdateProjectSettingsUseCase {
  constructor(
    private readonly repository: ProjectSettingsRepository,
    private readonly idGenerator: IdGenerator,
    private readonly automaticSnapshots?: AutomaticSnapshotRepository,
  ) {}

  async execute(input: UpdateProjectSettingsInput): Promise<ProjectSettings> {
    let existing = await this.repository.findByProjectId(input.userId, input.projectId);

    if (!existing) {
      const title = 'title' in input.updates && input.updates.title ? input.updates.title : 'Sans titre';
      const created = ProjectSettings.create(
        this.idGenerator.generate(),
        input.projectId,
        input.userId,
        title
      );
      existing = await this.repository.create(input.userId, created);
    }

    let updated = existing;
    const previousAutomaticSnapshotInterval = existing.getAutomaticSnapshotIntervalMinutes();
    const updates = input.updates;

    if ('title' in updates) {
      updated = updated.updateTitle(updates.title!);
    }

    if ('subtitle' in updates) {
      updated = updated.updateSubtitle(updates.subtitle);
    }

    if ('summary' in updates) {
      updated = updated.updateSummary(updates.summary!);
    }

    if ('genre' in updates) {
      updated = updated.updateGenre(updates.genre!);
    }

    if ('synopsis' in updates) {
      updated = updated.updateSynopsis(updates.synopsis!);
    }

    if ('pointOfView' in updates) {
      updated = updated.updatePointOfView(updates.pointOfView);
    }

    if ('tense' in updates) {
      updated = updated.updateTense(updates.tense);
    }

    if ('targetAudience' in updates) {
      updated = updated.updateTargetAudience(updates.targetAudience);
    }

    if ('isbn' in updates) {
      updated = updated.updateIsbn(updates.isbn);
    }

    if ('contributors' in updates) {
      updated = updated.updateContributors(updates.contributors!);
    }

    if ('relatedWorks' in updates) {
      updated = updated.updateRelatedWorks(updates.relatedWorks!);
    }

    if ('autocompletePreferences' in updates) {
      updated = updated.updateAutocompletePreferences(updates.autocompletePreferences!);
    }

    if ('canonExtractionPreferences' in updates) {
      updated = updated.updateCanonExtractionPreferences(updates.canonExtractionPreferences!);
    }

    if ('ignoredWords' in updates) {
      updated = updated.updateIgnoredWords(updates.ignoredWords!);
    }

    if ('grammarRuleProfile' in updates) {
      updated = updated.updateGrammarRuleProfile(updates.grammarRuleProfile!);
    }

    if ('publicationProfileId' in updates) {
      updated = updated.updatePublicationProfile(updates.publicationProfileId!);
    }

    if ('levelStyles' in updates) {
      updated = updated.updateLevelStyleSet(
        updates.levelStyles!.profileId,
        updates.levelStyles!.styles,
      );
    }

    if ('tocPreferences' in updates) {
      updated = updated.updateTocPreferences(updates.tocPreferences!);
    }

    if ('endnotesTitle' in updates) {
      updated = updated.updateEndnotesTitle(updates.endnotesTitle);
    }

    if ('automaticSnapshotIntervalMinutes' in updates) {
      updated = updated.updateAutomaticSnapshotIntervalMinutes(updates.automaticSnapshotIntervalMinutes ?? null);
    }

    if ('snapshotTimeZone' in updates) {
      updated = updated.updateSnapshotTimeZone(updates.snapshotTimeZone!);
    }

    const saved = await this.repository.update(input.userId, updated);
    if (
      this.automaticSnapshots &&
      'automaticSnapshotIntervalMinutes' in updates &&
      previousAutomaticSnapshotInterval !== saved.getAutomaticSnapshotIntervalMinutes()
    ) {
      await this.automaticSnapshots.configure(
        input.userId,
        input.projectId,
        saved.getAutomaticSnapshotIntervalMinutes(),
      );
    }
    return saved;
  }
}
