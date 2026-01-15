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
  encryption: {
    key: process.env.ENCRYPTION_KEY || '',
  },
  email: {
    resendApiKey: process.env.RESEND_API_KEY || '',
    adminEmail: process.env.ADMIN_EMAIL || '',
    fromEmail: process.env.EMAIL_FROM || 'Revise <noreply@resend.dev>',
  },
  app: {
    // Priority: NEXT_PUBLIC_APP_URL > VERCEL_URL (auto on Vercel) > localhost
    baseUrl:
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
  },
} as const;

export function validateConfig(): void {
  const warnings: string[] = [];
  const errors: string[] = [];

  // OpenAI (warning only - app works without AI, users can configure providers)
  if (!config.openai.apiKey && process.env.NODE_ENV !== 'test') {
    warnings.push(
      'OPENAI_API_KEY not set. Users must configure providers for AI features.'
    );
  }

  // MongoDB (error in production)
  if (!config.database.uri && process.env.NODE_ENV === 'production') {
    errors.push('MONGODB_URI is required in production.');
  }

  // Auth (error in production)
  if (!config.auth.secret && process.env.NODE_ENV === 'production') {
    errors.push('AUTH_SECRET is required in production.');
  }

  if (config.auth.secret && config.auth.secret.length < 32) {
    errors.push('AUTH_SECRET must be at least 32 characters long.');
  }

  // Encryption (error in production)
  if (!config.encryption.key && process.env.NODE_ENV === 'production') {
    errors.push('ENCRYPTION_KEY is required in production.');
  }

  if (config.encryption.key && config.encryption.key.length < 32) {
    errors.push('ENCRYPTION_KEY must be at least 32 characters long.');
  }

  // App URL (warning in production if using auto-detection)
  if (!process.env.NEXT_PUBLIC_APP_URL && process.env.NODE_ENV === 'production') {
    if (process.env.VERCEL_URL) {
      warnings.push(
        `NEXT_PUBLIC_APP_URL not set. Using VERCEL_URL (${process.env.VERCEL_URL}). ` +
        'Set NEXT_PUBLIC_APP_URL for custom domain support.'
      );
    } else {
      errors.push(
        'NEXT_PUBLIC_APP_URL is required in production for email links to work correctly.'
      );
    }
  }

  warnings.forEach((w) => console.warn(`Warning: ${w}`));
  errors.forEach((e) => console.error(`Error: ${e}`));

  if (errors.length > 0 && process.env.NODE_ENV === 'production') {
    throw new Error('Missing required environment variables');
  }
}
