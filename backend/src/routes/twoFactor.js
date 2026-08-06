const express = require('express');
const router = express.Router();
const twoFactorService = require('../services/twoFactor');
const prisma = require('../lib/prisma');
const { auth } = require('../middleware/auth');

/**
 * Generate 2FA secret for user
 * POST /api/two-factor/setup
 */
router.post('/setup', auth, async (req, res) => {
  try {
    const user = req.user;

    if (user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is already enabled' });
    }

    // Generate secret
    const secret = twoFactorService.generateSecret();
    const backupCodes = twoFactorService.generateBackupCodes();

    // Store in user record (not enabled yet)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: secret.base32,
        twoFactorBackupCodes: JSON.stringify(backupCodes)
      }
    });

    res.json({
      secret: secret.base32,
      qrCode: secret.otpauth_url,
      backupCodes: backupCodes
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ error: 'Failed to setup 2FA' });
  }
});

/**
 * Enable 2FA after verification
 * POST /api/two-factor/enable
 */
router.post('/enable', auth, async (req, res) => {
  try {
    const { token } = req.body;
    const user = req.user;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is already enabled' });
    }

    if (!user.twoFactorSecret) {
      return res.status(400).json({ error: 'Please setup 2FA first' });
    }

    // Verify token
    const isValid = twoFactorService.verifyToken(user.twoFactorSecret, token);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    // Enable 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true }
    });

    res.json({ message: '2FA enabled successfully' });
  } catch (error) {
    console.error('2FA enable error:', error);
    res.status(500).json({ error: 'Failed to enable 2FA' });
  }
});

/**
 * Disable 2FA
 * POST /api/two-factor/disable
 */
router.post('/disable', auth, async (req, res) => {
  try {
    const { token } = req.body;
    const user = req.user;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is not enabled' });
    }

    // Verify token before disabling
    const isValid = twoFactorService.verifyToken(user.twoFactorSecret, token);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null
      }
    });

    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
});

/**
 * Verify 2FA token during login
 * POST /api/two-factor/verify
 */
router.post('/verify', async (req, res) => {
  try {
    const { email, token, backupCode } = req.body;

    if (!email || (!token && !backupCode)) {
      return res.status(400).json({ error: 'Email and token or backup code are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is not enabled for this account' });
    }

    let isValid = false;

    // Try TOTP token first
    if (token) {
      isValid = twoFactorService.verifyToken(user.twoFactorSecret, token);
    }

    // Try backup code if TOTP failed
    if (!isValid && backupCode) {
      const result = twoFactorService.verifyBackupCode(user.twoFactorBackupCodes, backupCode);
      isValid = result.valid;
      
      if (isValid) {
        // Update remaining backup codes
        await prisma.user.update({
          where: { id: user.id },
          data: { twoFactorBackupCodes: JSON.stringify(result.remainingCodes) }
        });
      }
    }

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid token or backup code' });
    }

    res.json({ valid: true });
  } catch (error) {
    console.error('2FA verify error:', error);
    res.status(500).json({ error: 'Failed to verify 2FA' });
  }
});

/**
 * Get 2FA status
 * GET /api/two-factor/status
 */
router.get('/status', auth, async (req, res) => {
  try {
    const user = req.user;

    res.json({
      enabled: user.twoFactorEnabled,
      hasSecret: !!user.twoFactorSecret
    });
  } catch (error) {
    console.error('2FA status error:', error);
    res.status(500).json({ error: 'Failed to get 2FA status' });
  }
});

module.exports = router;
