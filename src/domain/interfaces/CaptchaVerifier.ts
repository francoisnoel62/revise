// ABOUTME: Interface for CAPTCHA verification.
// ABOUTME: Abstracts CAPTCHA providers to allow swapping between hCaptcha, reCAPTCHA, etc.

export interface CaptchaVerificationResult {
  success: boolean;
  errorCodes?: string[];
}

export interface CaptchaVerifier {
  /**
   * Verify a CAPTCHA token.
   * @param token - The CAPTCHA response token from the client
   * @param remoteIp - Optional IP address of the client
   * @returns Verification result
   */
  verify(token: string, remoteIp?: string): Promise<CaptchaVerificationResult>;
}
