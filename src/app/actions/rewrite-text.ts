// ABOUTME: Server Action for generating AI rewrite proposals
// ABOUTME: Orchestrates RewriteTextUseCase with OpenAI infrastructure

'use server';

import { RewriteTextUseCase } from '@/application';
import { OpenAIProvider, config, validateConfig } from '@/infrastructure';
import { TextDocument, TextSelection } from '@/domain';

interface RewriteResult {
  proposals: Array<{
    content: string;
    styleLabel?: string;
  }>;
  duration?: number;
}

export async function rewriteText(
  fullContent: string,
  selectionStart: number,
  selectionEnd: number
): Promise<RewriteResult | { error: string }> {
  const startTime = performance.now();

  try {
    validateConfig();

    if (!config.openai.apiKey) {
      return { error: 'OpenAI API key not configured' };
    }

    const document = new TextDocument(fullContent);
    const selection = new TextSelection(selectionStart, selectionEnd);

    const provider = new OpenAIProvider(
      config.openai.apiKey,
      config.openai.model
    );
    const useCase = new RewriteTextUseCase(provider);

    const proposals = await useCase.execute(document, selection);

    const duration = performance.now() - startTime;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Rewrite] Completed in ${duration.toFixed(2)}ms`);
    }

    return {
      proposals: proposals.map((p) => ({
        content: p.content,
        styleLabel: p.styleLabel,
      })),
      duration,
    };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Failed to generate rewrites' };
  }
}
