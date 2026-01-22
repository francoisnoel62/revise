// ABOUTME: Server Actions for editorial annexes (front/back matter content)
// ABOUTME: Leverages existing ProjectMetadata infrastructure for editorial content

'use server';

import { ProjectMetadata } from '@/domain/entities/ProjectMetadata';
import {
  EDITORIAL_TYPE_KEYS,
  EDITORIAL_ORDER,
  isEditorialType,
  getMetadataType,
  type EditorialTypeKey,
} from '@/domain/value-objects/MetadataType';
import {
  ActionResult,
  getAuthenticatedUserId,
  getMetadataRepo,
  getRepository,
  getIdGenerator,
  withErrorHandling,
} from './utils';

/**
 * Serialized editorial annex for client transport.
 */
export interface SerializedEditorialAnnex {
  id: string;
  projectId: string;
  type: EditorialTypeKey;
  title: string;
  description: string;
  content: string | null;
  hasContent: boolean;
  updatedAt: string | null;
}

/**
 * Serialize a ProjectMetadata entity or create empty placeholder.
 */
function serializeEditorial(
  metadata: ProjectMetadata | null,
  type: EditorialTypeKey,
  projectId: string
): SerializedEditorialAnnex {
  const typeInfo = getMetadataType(type);

  if (!metadata) {
    return {
      id: '',
      projectId,
      type,
      title: typeInfo?.name ?? type,
      description: typeInfo?.description ?? '',
      content: null,
      hasContent: false,
      updatedAt: null,
    };
  }

  // Check if content is empty (just an empty doc)
  const content = metadata.getContent();
  const hasContent = checkHasContent(content);

  return {
    id: metadata.getId(),
    projectId: metadata.getProjectId(),
    type,
    title: typeInfo?.name ?? type,
    description: typeInfo?.description ?? '',
    content: hasContent ? content : null,
    hasContent,
    updatedAt: metadata.getProperties().lastEdited.toISOString(),
  };
}

/**
 * Check if TipTap content has actual text (not just empty doc).
 */
function checkHasContent(content: string): boolean {
  try {
    const json = JSON.parse(content);
    if (!json.content || !Array.isArray(json.content)) {
      return false;
    }
    // Check if there's any text content
    const hasText = json.content.some((node: unknown) => {
      if (typeof node !== 'object' || node === null) return false;
      const n = node as Record<string, unknown>;
      if (n.type === 'text' && typeof n.text === 'string' && n.text.trim()) {
        return true;
      }
      if (Array.isArray(n.content)) {
        return n.content.some((child: unknown) => {
          if (typeof child !== 'object' || child === null) return false;
          const c = child as Record<string, unknown>;
          return c.type === 'text' && typeof c.text === 'string' && c.text.trim();
        });
      }
      return false;
    });
    return hasText;
  } catch {
    return false;
  }
}

/**
 * List all editorial annexes for a project.
 * Returns all 8 types, with or without content.
 */
export async function listEditorialAnnexesAction(
  projectId: string
): Promise<ActionResult<SerializedEditorialAnnex[]>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const repo = await getMetadataRepo();

    // Fetch all editorial metadata types
    const annexes: SerializedEditorialAnnex[] = [];

    for (const type of EDITORIAL_TYPE_KEYS) {
      const metadata = await repo.findByProjectAndType(auth.userId, projectId, type);
      annexes.push(serializeEditorial(metadata, type, projectId));
    }

    // Sort by defined order
    annexes.sort((a, b) => EDITORIAL_ORDER[a.type] - EDITORIAL_ORDER[b.type]);

    return annexes;
  });
}

/**
 * Get a single editorial annex by type.
 */
export async function getEditorialAnnexAction(
  projectId: string,
  type: string
): Promise<ActionResult<SerializedEditorialAnnex>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  if (!isEditorialType(type)) {
    return { success: false, error: 'Type éditorial invalide' };
  }

  return withErrorHandling(async () => {
    const repo = await getMetadataRepo();
    const metadata = await repo.findByProjectAndType(auth.userId, projectId, type);

    return serializeEditorial(metadata, type, projectId);
  });
}

/**
 * Save editorial annex content.
 * Creates new metadata if not exists, updates if exists.
 */
export async function saveEditorialAnnexAction(
  projectId: string,
  type: string,
  content: string
): Promise<ActionResult<SerializedEditorialAnnex>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  if (!isEditorialType(type)) {
    return { success: false, error: 'Type éditorial invalide' };
  }

  return withErrorHandling(async () => {
    const repo = await getMetadataRepo();
    const projectRepo = await getRepository();
    const idGenerator = await getIdGenerator();
    const typeInfo = getMetadataType(type);

    // Verify project exists and user owns it
    const project = await projectRepo.loadProject(auth.userId, projectId);
    if (!project) {
      throw new Error('Projet non trouvé');
    }

    // Check if metadata already exists
    const existing = await repo.findByProjectAndType(auth.userId, projectId, type);

    let metadata: ProjectMetadata;

    if (existing) {
      // Update existing
      existing.updateContent(content);
      await repo.update(auth.userId, existing);
      metadata = existing;
    } else {
      // Create new
      metadata = new ProjectMetadata(
        idGenerator.generate(),
        projectId,
        type,
        typeInfo?.name ?? type,
        content,
        {
          isGenerated: false, // Editorial content is author-written, not AI-generated
        }
      );
      await repo.create(auth.userId, metadata);
    }

    return serializeEditorial(metadata, type, projectId);
  });
}

/**
 * Delete editorial annex content.
 */
export async function deleteEditorialAnnexAction(
  projectId: string,
  type: string
): Promise<ActionResult<{ deleted: true }>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  if (!isEditorialType(type)) {
    return { success: false, error: 'Type éditorial invalide' };
  }

  return withErrorHandling(async () => {
    const repo = await getMetadataRepo();
    const existing = await repo.findByProjectAndType(auth.userId, projectId, type);

    if (existing) {
      await repo.delete(auth.userId, existing.getId());
    }

    return { deleted: true };
  });
}

/**
 * Get count of editorial annexes with content.
 */
export async function getEditorialAnnexCountAction(
  projectId: string
): Promise<ActionResult<{ count: number; total: number }>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const repo = await getMetadataRepo();
    let count = 0;

    for (const type of EDITORIAL_TYPE_KEYS) {
      const metadata = await repo.findByProjectAndType(auth.userId, projectId, type);
      if (metadata && checkHasContent(metadata.getContent())) {
        count++;
      }
    }

    return {
      count,
      total: EDITORIAL_TYPE_KEYS.length,
    };
  });
}
