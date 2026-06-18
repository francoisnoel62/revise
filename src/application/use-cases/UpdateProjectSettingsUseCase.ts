// ABOUTME: Use case for updating project settings
// ABOUTME: Supports partial updates of all settings fields

import { ProjectSettings } from '@/domain/entities/ProjectSettings';
import { ProjectSettingsRepository } from '@/domain/interfaces/ProjectSettingsRepository';
import { Contributor } from '@/domain/value-objects/Contributor';
import { RelatedWork } from '@/domain/value-objects/RelatedWork';
import { PointOfView, NarrationTense, TargetAudience } from '@/domain/value-objects/NarrationSettings';
import { AutocompletePreferences } from '@/domain/value-objects/AutocompletePreferences';
import { CanonExtractionPreferences } from '@/domain/value-objects/CanonExtractionPreferences';

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
}

export interface UpdateProjectSettingsInput {
  userId: string;
  projectId: string;
  updates: ProjectSettingsUpdates;
}

export class UpdateProjectSettingsUseCase {
  constructor(private readonly repository: ProjectSettingsRepository) {}

  async execute(input: UpdateProjectSettingsInput): Promise<ProjectSettings> {
    const existing = await this.repository.findByProjectId(input.userId, input.projectId);

    if (!existing) {
      throw new Error('Project settings not found');
    }

    let updated = existing;
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

    return this.repository.update(input.userId, updated);
  }
}
