// ABOUTME: Application use case orchestrating text rewriting with AI assistance
// ABOUTME: Coordinates TextDocument and LLMProvider to generate rewrite proposals

import { TextDocument } from '@/domain/entities/TextDocument';
import { TextSelection } from '@/domain/value-objects/TextSelection';
import { RewriteProposal } from '@/domain/value-objects/RewriteProposal';
import { LLMProvider } from '@/domain/interfaces/LLMProvider';

export class RewriteTextUseCase {
  constructor(private readonly llmProvider: LLMProvider) {}

  async execute(
    document: TextDocument,
    selection: TextSelection
  ): Promise<RewriteProposal[]> {
    if (selection.isEmpty()) {
      throw new Error('Cannot rewrite empty selection');
    }

    const selectedText = document.getSelectedText(selection);
    const fullContext = document.getContent();

    const proposals = await this.llmProvider.generateRewrites(
      selectedText,
      fullContext
    );

    return proposals;
  }
}
