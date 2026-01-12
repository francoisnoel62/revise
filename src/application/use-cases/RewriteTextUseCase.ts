// ABOUTME: Application use case orchestrating text rewriting with AI assistance
// ABOUTME: Coordinates TextDocument and LLMProvider to generate rewrite proposals

import { TextDocument } from '@/domain/entities/TextDocument';
import { TextSelection } from '@/domain/value-objects/TextSelection';
import { RewriteProposal } from '@/domain/value-objects/RewriteProposal';
import { LLMProvider } from '@/domain/interfaces/LLMProvider';

export class RewriteTextUseCase {
  constructor(private readonly llmProvider: LLMProvider) {}

  /**
   * Execute rewrite with TextDocument and TextSelection (legacy API).
   * Extracts selected text using positions - works when document is plain text.
   */
  async execute(
    document: TextDocument,
    selection: TextSelection
  ): Promise<RewriteProposal[]> {
    if (selection.isEmpty()) {
      throw new Error('Cannot rewrite empty selection');
    }

    const selectedText = document.getSelectedText(selection);
    const fullContext = document.getContent();

    return this.executeWithText(selectedText, fullContext);
  }

  /**
   * Execute rewrite with already-extracted text (preferred API).
   * Use this when text is extracted from TipTap editor directly,
   * avoiding the JSON/text position mismatch issue.
   */
  async executeWithText(
    selectedText: string,
    fullContext: string
  ): Promise<RewriteProposal[]> {
    if (!selectedText || selectedText.trim().length === 0) {
      throw new Error('Cannot rewrite empty selection');
    }

    const proposals = await this.llmProvider.generateRewrites(
      selectedText,
      fullContext
    );

    return proposals;
  }
}
