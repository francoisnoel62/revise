// ABOUTME: Centralized environment configuration for all external services.
// ABOUTME: Validates required variables and provides typed access.

export const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o',
  },
  database: {
    uri: process.env.MONGODB_URI || '',
    dbName: process.env.MONGODB_DB_NAME || 'revise',
  },
  auth: {
    secret: process.env.AUTH_SECRET || '',
    // Let Auth.js auto-detect on Vercel; only override if explicitly set to 'false'
    trustHost: process.env.AUTH_TRUST_HOST !== 'false' ? undefined : false,
  },
} as const;

export function validateConfig(): void {
  const warnings: string[] = [];
  const errors: string[] = [];

  // OpenAI (warning only - app works without AI)
  if (!config.openai.apiKey && process.env.NODE_ENV !== 'test') {
    warnings.push('OPENAI_API_KEY not set. AI features will not work.');
  }

  // MongoDB (error in production)
  if (!config.database.uri && process.env.NODE_ENV === 'production') {
    errors.push('MONGODB_URI is required in production.');
  }

  // Auth (error in production)
  if (!config.auth.secret && process.env.NODE_ENV === 'production') {
    errors.push('AUTH_SECRET is required in production.');
  }

  warnings.forEach((w) => console.warn(`Warning: ${w}`));
  errors.forEach((e) => console.error(`Error: ${e}`));

  if (errors.length > 0 && process.env.NODE_ENV === 'production') {
    throw new Error('Missing required environment variables');
  }
}
