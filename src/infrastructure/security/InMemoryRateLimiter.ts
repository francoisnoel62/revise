// ABOUTME: In-memory rate limiter implementation.
// ABOUTME: Tracks attempts per identifier/action with configurable limits and windows.

import { RateLimiter, RateLimitResult } from '@/domain/interfaces/RateLimiter';

interface RateLimitConfig {
  maxAttempts: number;
  windowSeconds: number;
}

interface AttemptRecord {
  attempts: number;
  firstAttemptAt: number;
}

const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  registration: { maxAttempts: 5, windowSeconds: 3600 }, // 5 attempts per hour
  login: { maxAttempts: 10, windowSeconds: 900 }, // 10 attempts per 15 minutes
  default: { maxAttempts: 100, windowSeconds: 3600 },
};

export class InMemoryRateLimiter implements RateLimiter {
  private records: Map<string, AttemptRecord> = new Map();
  private configs: Record<string, RateLimitConfig>;

  constructor(customConfigs?: Record<string, RateLimitConfig>) {
    this.configs = { ...DEFAULT_CONFIGS, ...customConfigs };
  }

  private getKey(identifier: string, action: string): string {
    return `${action}:${identifier}`;
  }

  private getConfig(action: string): RateLimitConfig {
    return this.configs[action] || this.configs['default'];
  }

  private cleanExpiredRecords(): void {
    const now = Date.now();
    for (const [key, record] of this.records.entries()) {
      const action = key.split(':')[0];
      const config = this.getConfig(action);
      const windowMs = config.windowSeconds * 1000;

      if (now - record.firstAttemptAt > windowMs) {
        this.records.delete(key);
      }
    }
  }

  async checkLimit(identifier: string, action: string): Promise<RateLimitResult> {
    this.cleanExpiredRecords();

    const key = this.getKey(identifier, action);
    const config = this.getConfig(action);
    const record = this.records.get(key);
    const now = Date.now();

    if (!record) {
      return {
        allowed: true,
        remainingAttempts: config.maxAttempts,
        resetInSeconds: config.windowSeconds,
      };
    }

    const windowMs = config.windowSeconds * 1000;
    const elapsedMs = now - record.firstAttemptAt;

    if (elapsedMs > windowMs) {
      this.records.delete(key);
      return {
        allowed: true,
        remainingAttempts: config.maxAttempts,
        resetInSeconds: config.windowSeconds,
      };
    }

    const remainingAttempts = Math.max(0, config.maxAttempts - record.attempts);
    const resetInSeconds = Math.ceil((windowMs - elapsedMs) / 1000);

    return {
      allowed: remainingAttempts > 0,
      remainingAttempts,
      resetInSeconds,
    };
  }

  async recordAttempt(identifier: string, action: string): Promise<void> {
    const key = this.getKey(identifier, action);
    const config = this.getConfig(action);
    const record = this.records.get(key);
    const now = Date.now();

    if (!record) {
      this.records.set(key, { attempts: 1, firstAttemptAt: now });
      return;
    }

    const windowMs = config.windowSeconds * 1000;
    if (now - record.firstAttemptAt > windowMs) {
      this.records.set(key, { attempts: 1, firstAttemptAt: now });
    } else {
      record.attempts += 1;
    }
  }

  async resetLimit(identifier: string, action: string): Promise<void> {
    const key = this.getKey(identifier, action);
    this.records.delete(key);
  }
}

// Singleton instance for the application
let rateLimiterInstance: InMemoryRateLimiter | null = null;

export function getRateLimiter(): InMemoryRateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new InMemoryRateLimiter();
  }
  return rateLimiterInstance;
}
