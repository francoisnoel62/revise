// ABOUTME: Tests for HCaptchaVerifier.
// ABOUTME: Verifies hCaptcha token validation logic.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HCaptchaVerifier } from './HCaptchaVerifier';

describe('HCaptchaVerifier', () => {
  let verifier: HCaptchaVerifier;
  const mockSecretKey = 'test-secret-key';

  beforeEach(() => {
    verifier = new HCaptchaVerifier(mockSecretKey);
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('verify', () => {
    it('returns failure for missing token', async () => {
      const result = await verifier.verify('');

      expect(result.success).toBe(false);
      expect(result.errorCodes).toContain('missing-input-response');
    });

    it('returns success for valid token', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      const result = await verifier.verify('valid-token');

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        'https://api.hcaptcha.com/siteverify',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      );
    });

    it('returns failure for invalid token', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: false, 'error-codes': ['invalid-input-response'] }),
      } as Response);

      const result = await verifier.verify('invalid-token');

      expect(result.success).toBe(false);
      expect(result.errorCodes).toContain('invalid-input-response');
    });

    it('includes remoteip when provided', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      await verifier.verify('token', '127.0.0.1');

      const fetchCall = vi.mocked(fetch).mock.calls[0];
      const body = fetchCall[1]?.body as string;
      expect(body).toContain('remoteip=127.0.0.1');
    });

    it('handles network errors gracefully', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      const result = await verifier.verify('token');

      expect(result.success).toBe(false);
      expect(result.errorCodes).toContain('verification-error');
    });

    it('handles non-OK responses', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      const result = await verifier.verify('token');

      expect(result.success).toBe(false);
      expect(result.errorCodes).toContain('verification-failed');
    });
  });
});
