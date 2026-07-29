// ABOUTME: Projects persisted editorial settings into the immutable snapshot representation.
// ABOUTME: Keeps every snapshot-producing and comparison path aligned when metadata evolves.

import type { ProjectSettings } from '@/domain/entities/ProjectSettings';
import type { SnapshotEditorialMetadata } from '@/domain/entities/Snapshot';

export function snapshotEditorialMetadataFrom(settings: ProjectSettings): SnapshotEditorialMetadata {
  return {
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
    contributors: settings.getContributors(),
    relatedWorks: settings.getRelatedWorks(),
  };
}
