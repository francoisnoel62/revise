// ABOUTME: Immutable value object representing a single AI-generated rewrite proposal
// ABOUTME: Contains rewritten text content with optional style classification

export class RewriteProposal {
  readonly content: string;
  readonly styleLabel?: string;

  constructor(content: string, styleLabel?: string) {
    const trimmedContent = content.trim();

    if (trimmedContent.length === 0) {
      throw new Error('Proposal content cannot be empty');
    }

    this.content = trimmedContent;
    this.styleLabel = styleLabel;
  }
}
