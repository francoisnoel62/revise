// ABOUTME: hCaptcha verification implementation.
// ABOUTME: Verifies hCaptcha tokens server-side for spam prevention.

import { CaptchaVerifier, CaptchaVerificationResult } from '@/domain/interfaces/CaptchaVerifier';

const HCAPTCHA_VERIFY_URL = 'https://api.hcaptcha.com/siteverify';

export class HCaptchaVerifier implements CaptchaVerifier {
  constructor(private secretKey: string) {}

  async verify(token: string, remoteIp?: string): Promise<CaptchaVerificationResult> {
    if (!token) {
      return { success: false, errorCodes: ['missing-input-response'] };
    }

    try {
      // eslint-disable-next-line no-undef
      const body = new URLSearchParams({
        secret: this.secretKey,
        response: token,
      });

      if (remoteIp) {
        body.append('remoteip', remoteIp);
      }

      const response = await fetch(HCAPTCHA_VERIFY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        return { success: false, errorCodes: ['verification-failed'] };
      }

      const data = await response.json();

      return {
        success: data.success === true,
        errorCodes: data['error-codes'],
      };
    } catch (error) {
      console.error('hCaptcha verification error:', error);
      return { success: false, errorCodes: ['verification-error'] };
    }
  }
}

// Factory function to get the verifier
export function getHCaptchaVerifier(): HCaptchaVerifier | null {
  const secretKey = process.env.HCAPTCHA_SECRET_KEY;
  if (!secretKey) {
    return null;
  }
  return new HCaptchaVerifier(secretKey);
}
