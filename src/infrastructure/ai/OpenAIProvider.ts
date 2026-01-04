// ABOUTME: Concrete implementation of LLMProvider using OpenAI API for text rewriting
// ABOUTME: Generates 5 stylistically distinct proposals using carefully crafted prompt

import OpenAI from 'openai';
import { LLMProvider } from '@/domain/interfaces/LLMProvider';
import { RewriteProposal } from '@/domain/value-objects/RewriteProposal';

interface ProposalResponse {
  proposals: Array<{
    content: string;
    styleLabel?: string;
  }>;
}

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o') {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async generateRewrites(
    text: string,
    context?: string
  ): Promise<RewriteProposal[]> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(text, context);

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.9, // Higher temperature for more diverse outputs
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      return this.parseResponse(content);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error during text generation');
    }
  }

  private buildSystemPrompt(): string {
    return `You are a professional writing assistant specialized in rewriting text while preserving meaning and authorial voice.

Your task is to generate EXACTLY 5 distinct rewrite proposals for selected text.

CRITICAL REQUIREMENTS:
- Generate EXACTLY 5 proposals, no more, no less
- Each proposal must be GENUINELY DIFFERENT in style and tone
- PRESERVE the original meaning completely
- MAINTAIN the author's voice and intent
- PROHIBIT clichés, filler words, and generic expressions
- Each proposal should feel like it came from a different stylistic approach

STYLE DIVERSITY (aim for these distinct approaches):
1. Formal/Professional - Elevated register, precise terminology
2. Casual/Conversational - Natural, approachable tone
3. Concise/Direct - Maximum clarity, minimum words
4. Elaborate/Descriptive - Rich detail, fuller expression
5. Neutral/Balanced - Clear middle ground

OUTPUT FORMAT:
Return a JSON object with this exact structure:
{
  "proposals": [
    { "content": "First rewrite variant", "styleLabel": "formal" },
    { "content": "Second rewrite variant", "styleLabel": "casual" },
    { "content": "Third rewrite variant", "styleLabel": "concise" },
    { "content": "Fourth rewrite variant", "styleLabel": "elaborate" },
    { "content": "Fifth rewrite variant", "styleLabel": "neutral" }
  ]
}`;
  }

  private buildUserPrompt(text: string, context?: string): string {
    let prompt = `Rewrite the following text in 5 distinct ways:\n\n"${text}"`;

    if (context && context !== text) {
      prompt += `\n\nFull document context (for understanding tone and voice):\n"${context}"`;
    }

    prompt += '\n\nGenerate exactly 5 stylistically distinct proposals as JSON.';

    return prompt;
  }

  private parseResponse(content: string): RewriteProposal[] {
    let parsed: ProposalResponse;

    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error('Failed to parse OpenAI response');
    }

    if (!parsed.proposals || !Array.isArray(parsed.proposals)) {
      throw new Error('Invalid response structure from OpenAI');
    }

    if (parsed.proposals.length !== 5) {
      throw new Error(
        `Expected exactly 5 proposals, got ${parsed.proposals.length}`
      );
    }

    return parsed.proposals.map(
      (p) => new RewriteProposal(p.content, p.styleLabel)
    );
  }
}
