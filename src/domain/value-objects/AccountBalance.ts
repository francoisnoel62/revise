// ABOUTME: Value object representing an AI provider account balance
// ABOUTME: Contains usage, credit limit, and optional renewal date information

/**
 * Represents the account balance status for an AI provider.
 * Used to display usage/credits information in the provider dashboard.
 */
export interface AccountBalance {
  /** Amount used in USD (or provider's currency) */
  readonly used: number;

  /** Total credit limit in USD (or provider's currency), null if unlimited/unknown */
  readonly limit: number | null;

  /** Credit renewal date, null if not applicable */
  readonly renewalDate: Date | null;

  /** Currency code (e.g., 'USD') */
  readonly currency: string;

  /** Whether the balance information is available */
  readonly available: boolean;

  /** Error message if balance is unavailable */
  readonly errorMessage?: string;
}

/**
 * Creates a successful AccountBalance result.
 */
export function createAccountBalance(
  used: number,
  limit: number | null,
  renewalDate: Date | null = null,
  currency: string = 'USD'
): AccountBalance {
  if (used < 0) {
    throw new Error('Used amount cannot be negative');
  }
  if (limit !== null && limit < 0) {
    throw new Error('Limit cannot be negative');
  }

  return {
    used,
    limit,
    renewalDate,
    currency,
    available: true,
  };
}

/**
 * Creates an unavailable AccountBalance result with an error message.
 */
export function createUnavailableBalance(errorMessage: string): AccountBalance {
  return {
    used: 0,
    limit: null,
    renewalDate: null,
    currency: 'USD',
    available: false,
    errorMessage,
  };
}

/**
 * Formats an AccountBalance for display.
 * Returns a string like "$42.50 / $100.00" or "$42.50" if no limit.
 */
export function formatBalance(balance: AccountBalance): string {
  if (!balance.available) {
    return balance.errorMessage || 'Balance unavailable';
  }

  const formatAmount = (amount: number): string => {
    const symbol = balance.currency === 'USD' ? '$' : balance.currency + ' ';
    return `${symbol}${amount.toFixed(2)}`;
  };

  if (balance.limit !== null) {
    return `${formatAmount(balance.used)} / ${formatAmount(balance.limit)}`;
  }

  return formatAmount(balance.used);
}

/**
 * Calculates usage percentage (0-100).
 * Returns null if limit is not available.
 */
export function getUsagePercentage(balance: AccountBalance): number | null {
  if (!balance.available || balance.limit === null || balance.limit === 0) {
    return null;
  }
  return Math.min(100, (balance.used / balance.limit) * 100);
}
