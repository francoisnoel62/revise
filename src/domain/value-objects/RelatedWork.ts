// ABOUTME: Value object representing a related work (e.g., prequel, sequel)
// ABOUTME: Provides structure for related works with title and optional project link

export interface RelatedWork {
  title: string;
  projectId?: string;
}

export function createRelatedWork(title: string, projectId?: string): RelatedWork {
  const trimmedTitle = title.trim();
  if (trimmedTitle.length === 0) {
    throw new Error('Related work title cannot be empty');
  }

  const trimmedProjectId = projectId?.trim();
  const finalProjectId = trimmedProjectId && trimmedProjectId.length > 0 ? trimmedProjectId : undefined;

  return {
    title: trimmedTitle,
    projectId: finalProjectId,
  };
}

export function isValidRelatedWork(work: RelatedWork): boolean {
  if (!work) return false;
  if (!work.title || work.title.trim().length === 0) return false;
  return true;
}
