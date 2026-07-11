// ABOUTME: Domain entity for an author-inserted book annex (front or back matter).
// ABOUTME: Holds title + TipTap content, a placement zone, and an order within that zone.

export type AnnexPlacement = 'front' | 'back';

export const ANNEX_PLACEMENTS: readonly AnnexPlacement[] = ['front', 'back'];

export interface CustomAnnexProperties {
  createdAt: Date;
  updatedAt: Date;
}

export class CustomAnnex {
  private readonly id: string;
  private readonly projectId: string;
  private title: string;
  private content: string; // TipTap JSON stringified
  private placement: AnnexPlacement;
  private order: number;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(
    id: string,
    projectId: string,
    title: string,
    content: string,
    placement: AnnexPlacement,
    order: number,
    properties?: Partial<CustomAnnexProperties>,
  ) {
    if (!id || id.trim().length === 0) {
      throw new Error('CustomAnnex ID cannot be empty');
    }
    if (!projectId || projectId.trim().length === 0) {
      throw new Error('CustomAnnex project ID cannot be empty');
    }
    if (!title || title.trim().length === 0) {
      throw new Error('CustomAnnex title cannot be empty');
    }
    CustomAnnex.assertPlacement(placement);
    CustomAnnex.assertTipTapJSON(content);

    this.id = id;
    this.projectId = projectId;
    this.title = title.trim();
    this.content = content;
    this.placement = placement;
    this.order = order;
    this.createdAt = properties?.createdAt ?? new Date();
    this.updatedAt = properties?.updatedAt ?? new Date();
  }

  static createEmpty(
    id: string,
    projectId: string,
    title: string,
    placement: AnnexPlacement,
    order: number,
  ): CustomAnnex {
    const emptyContent = JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] });
    return new CustomAnnex(id, projectId, title, emptyContent, placement, order);
  }

  getId(): string {
    return this.id;
  }

  getProjectId(): string {
    return this.projectId;
  }

  getTitle(): string {
    return this.title;
  }

  getContent(): string {
    return this.content;
  }

  getPlacement(): AnnexPlacement {
    return this.placement;
  }

  getOrder(): number {
    return this.order;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  updateTitle(newTitle: string): void {
    if (!newTitle || newTitle.trim().length === 0) {
      throw new Error('CustomAnnex title cannot be empty');
    }
    this.title = newTitle.trim();
    this.updatedAt = new Date();
  }

  updateContent(newContent: string): void {
    CustomAnnex.assertTipTapJSON(newContent);
    this.content = newContent;
    this.updatedAt = new Date();
  }

  updatePlacement(placement: AnnexPlacement): void {
    CustomAnnex.assertPlacement(placement);
    this.placement = placement;
    this.updatedAt = new Date();
  }

  setOrder(order: number): void {
    this.order = order;
    this.updatedAt = new Date();
  }

  private static assertPlacement(placement: AnnexPlacement): void {
    if (!ANNEX_PLACEMENTS.includes(placement)) {
      throw new Error(`Invalid annex placement: ${placement}`);
    }
  }

  private static assertTipTapJSON(content: string): void {
    let json: unknown;
    try {
      json = JSON.parse(content);
    } catch {
      throw new Error('Invalid JSON format for annex content');
    }
    if (!json || typeof json !== 'object' || (json as { type?: unknown }).type !== 'doc') {
      throw new Error('Invalid TipTap JSON: must have type "doc"');
    }
  }
}
