// ABOUTME: Server Actions for custom annexes (author-inserted front/back matter).
// ABOUTME: CRUD + reordering, all scoped to the authenticated owner and project.

'use server';

import { CustomAnnex, type AnnexPlacement, ANNEX_PLACEMENTS } from '@/domain/entities/CustomAnnex';
import {
  ActionResult,
  getAuthenticatedUserId,
  getCustomAnnexRepo,
  getRepository,
  getIdGenerator,
  withErrorHandling,
} from './utils';

export interface SerializedCustomAnnex {
  id: string;
  projectId: string;
  title: string;
  content: string;
  placement: AnnexPlacement;
  order: number;
  hasContent: boolean;
  updatedAt: string;
}

function isPlacement(value: string): value is AnnexPlacement {
  return (ANNEX_PLACEMENTS as readonly string[]).includes(value);
}

/** True when the TipTap content carries visible text (not just an empty doc). */
function checkHasContent(content: string): boolean {
  try {
    const json = JSON.parse(content) as { content?: unknown };
    if (!Array.isArray(json.content)) return false;
    const hasText = (nodes: unknown[]): boolean =>
      nodes.some((node) => {
        if (typeof node !== 'object' || node === null) return false;
        const n = node as { type?: unknown; text?: unknown; content?: unknown };
        if (n.type === 'text' && typeof n.text === 'string' && n.text.trim()) return true;
        return Array.isArray(n.content) ? hasText(n.content) : false;
      });
    return hasText(json.content);
  } catch {
    return false;
  }
}

function serialize(annex: CustomAnnex): SerializedCustomAnnex {
  const content = annex.getContent();
  return {
    id: annex.getId(),
    projectId: annex.getProjectId(),
    title: annex.getTitle(),
    content,
    placement: annex.getPlacement(),
    order: annex.getOrder(),
    hasContent: checkHasContent(content),
    updatedAt: annex.getUpdatedAt().toISOString(),
  };
}

export async function listCustomAnnexesAction(
  projectId: string,
): Promise<ActionResult<SerializedCustomAnnex[]>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const repo = await getCustomAnnexRepo();
    const annexes = await repo.findByProjectId(auth.userId, projectId);
    return annexes.map(serialize);
  });
}

export async function createCustomAnnexAction(
  projectId: string,
  title: string,
  placement: string,
): Promise<ActionResult<SerializedCustomAnnex>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  if (!isPlacement(placement)) {
    return { success: false, error: 'Emplacement invalide' };
  }
  if (!title.trim()) {
    return { success: false, error: 'Le titre est requis' };
  }

  return withErrorHandling(async () => {
    const repo = await getCustomAnnexRepo();
    const projectRepo = await getRepository();
    const idGenerator = await getIdGenerator();

    const project = await projectRepo.loadProject(auth.userId, projectId);
    if (!project) {
      throw new Error('Projet non trouvé');
    }

    // Append at the end of its placement zone.
    const order = await repo.countByProjectAndPlacement(auth.userId, projectId, placement);
    const annex = CustomAnnex.createEmpty(idGenerator.generate(), projectId, title, placement, order);
    await repo.create(auth.userId, annex);

    return serialize(annex);
  });
}

export async function updateCustomAnnexAction(
  projectId: string,
  annexId: string,
  updates: { title?: string; content?: string; placement?: string },
): Promise<ActionResult<SerializedCustomAnnex>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  if (updates.placement !== undefined && !isPlacement(updates.placement)) {
    return { success: false, error: 'Emplacement invalide' };
  }

  return withErrorHandling(async () => {
    const repo = await getCustomAnnexRepo();
    const annex = await repo.findById(auth.userId, annexId);
    if (!annex || annex.getProjectId() !== projectId) {
      throw new Error('Annexe non trouvée');
    }

    if (updates.title !== undefined) annex.updateTitle(updates.title);
    if (updates.content !== undefined) annex.updateContent(updates.content);
    if (updates.placement !== undefined && isPlacement(updates.placement)) {
      annex.updatePlacement(updates.placement);
    }

    await repo.update(auth.userId, annex);
    return serialize(annex);
  });
}

export async function deleteCustomAnnexAction(
  projectId: string,
  annexId: string,
): Promise<ActionResult<{ deleted: true }>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  return withErrorHandling(async () => {
    const repo = await getCustomAnnexRepo();
    const annex = await repo.findById(auth.userId, annexId);
    if (annex && annex.getProjectId() === projectId) {
      await repo.delete(auth.userId, annexId);
    }
    return { deleted: true };
  });
}

export async function reorderCustomAnnexesAction(
  projectId: string,
  placement: string,
  orderedIds: string[],
): Promise<ActionResult<{ reordered: true }>> {
  const auth = await getAuthenticatedUserId();
  if ('error' in auth) return auth.error;

  if (!isPlacement(placement)) {
    return { success: false, error: 'Emplacement invalide' };
  }

  return withErrorHandling(async () => {
    const repo = await getCustomAnnexRepo();
    const annexes = await repo.findByProjectId(auth.userId, projectId);
    const byId = new Map(annexes.map((a) => [a.getId(), a]));

    for (let i = 0; i < orderedIds.length; i++) {
      const annex = byId.get(orderedIds[i]);
      if (!annex || annex.getPlacement() !== placement) continue;
      if (annex.getOrder() !== i) {
        annex.setOrder(i);
        await repo.update(auth.userId, annex);
      }
    }

    return { reordered: true };
  });
}
