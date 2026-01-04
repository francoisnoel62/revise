// ABOUTME: Environment configuration module for infrastructure layer
// ABOUTME: Validates and provides typed access to environment variables

export const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o',
  },
} as const;

export function validateConfig(): void {
  if (!config.openai.apiKey && process.env.NODE_ENV !== 'test') {
    console.warn('Warning: OPENAI_API_KEY not set. AI features will not work.');
  }
}
