// ABOUTME: Domain entity representing a historical record of AI rewrite proposals
// ABOUTME: Immutable entity storing selected text and generated proposals for a chapter

export class CorrectionHistory {
  private readonly id: string;
  private readonly projectId: string;
  private readonly chapterId: string;
  private readonly selectedText: string;
  private readonly proposals: string[];
  private readonly createdAt: Date;

  constructor(
    id: string,
    projectId: string,
    chapterId: string,
    selectedText: string,
    proposals: string[],
    createdAt?: Date
  ) {
    // Validate ID
    if (!id || id.trim().length === 0) {
      throw new Error('CorrectionHistory ID cannot be empty');
    }

    // Validate projectId
    if (!projectId || projectId.trim().length === 0) {
      throw new Error('Project ID cannot be empty');
    }

    // Validate chapterId
    if (!chapterId || chapterId.trim().length === 0) {
      throw new Error('Chapter ID cannot be empty');
    }

    // Validate selectedText
    if (!selectedText || selectedText.trim().length === 0) {
      throw new Error('Selected text cannot be empty');
    }

    // Validate proposals
    if (!proposals || proposals.length === 0) {
      throw new Error('At least one proposal is required');
    }

    // Validate each proposal is not empty
    for (const proposal of proposals) {
      if (!proposal || proposal.trim().length === 0) {
        throw new Error('Proposal content cannot be empty');
      }
    }

    this.id = id.trim();
    this.projectId = projectId.trim();
    this.chapterId = chapterId.trim();
    this.selectedText = selectedText.trim();
    this.proposals = proposals.map((p) => p.trim());
    this.createdAt = createdAt ?? new Date();
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getProjectId(): string {
    return this.projectId;
  }

  getChapterId(): string {
    return this.chapterId;
  }

  getSelectedText(): string {
    return this.selectedText;
  }

  getProposals(): string[] {
    return [...this.proposals];
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt.getTime());
  }

  getProposalCount(): number {
    return this.proposals.length;
  }
}
