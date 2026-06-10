// ABOUTME: Caps the byte size of captured exchange content before encryption and storage
// ABOUTME: Analysis operations send the whole manuscript, so unbounded content would bloat the database

/** Maximum stored size per content field (input, systemPrompt, output), in bytes. */
export const MAX_EXCHANGE_FIELD_BYTES = 50 * 1024;

const TRUNCATION_MARKER = '\n\n…[contenu tronqué]';

/**
 * Returns the value unchanged when within the cap, otherwise truncates it to
 * the byte budget (without splitting a multi-byte UTF-8 character) and appends
 * a visible marker so the author knows the stored copy is partial.
 */
export function truncateExchangeField(
  value: string,
  maxBytes: number = MAX_EXCHANGE_FIELD_BYTES
): string {
  if (Buffer.byteLength(value, 'utf8') <= maxBytes) {
    return value;
  }

  // Cut on a byte boundary, then drop any trailing partial multi-byte sequence.
  const slice = Buffer.from(value, 'utf8').subarray(0, maxBytes);
  const safe = new TextDecoder('utf-8', { fatal: false }).decode(slice);
  // TextDecoder replaces an incomplete trailing sequence with U+FFFD; strip it.
  const cleaned = safe.replace(/�+$/u, '');

  return cleaned + TRUNCATION_MARKER;
}
