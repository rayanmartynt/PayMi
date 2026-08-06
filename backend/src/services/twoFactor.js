const speakeasy = require('speakeasy');

class TwoFactorService {
  /**
   * Generate a new TOTP secret for a user
   */
  generateSecret() {
    const secret = speakeasy.generateSecret({
      name: 'PayMi',
      issuer: 'PayMi',
      length: 32
    });
    return secret;
  }

  /**
   * Generate backup codes for a user
   */
  generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      codes.push(speakeasy.generateSecret({ length: 8 }).base32);
    }
    return codes;
  }

  /**
   * Verify a TOTP token
   */
  verifyToken(secret, token) {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps (60 seconds) before and after
    });
  }

  /**
   * Verify a backup code
   */
  verifyBackupCode(backupCodes, code) {
    const codes = JSON.parse(backupCodes || '[]');
    const index = codes.indexOf(code);
    if (index !== -1) {
      // Remove used backup code
      codes.splice(index, 1);
      return { valid: true, remainingCodes: codes };
    }
    return { valid: false, remainingCodes: codes };
  }
}

module.exports = new TwoFactorService();
