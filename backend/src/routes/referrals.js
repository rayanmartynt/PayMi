const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { auth } = require('../middleware/auth');

/**
 * Generate unique referral code
 */
const generateReferralCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Get or create referral code for user
 * GET /api/referrals/my-code
 */
router.get('/my-code', auth, async (req, res) => {
  try {
    const user = req.user;

    let referral = await prisma.referral.findFirst({
      where: { referrerId: user.id }
    });

    if (!referral) {
      referral = await prisma.referral.create({
        data: {
          referrerId: user.id,
          referralCode: generateReferralCode(),
          commissionRate: 5 // 5% commission
        }
      });
    }

    res.json({ referral });
  } catch (error) {
    console.error('Get referral code error:', error);
    res.status(500).json({ error: 'Failed to get referral code' });
  }
});

/**
 * Validate referral code
 * GET /api/referrals/validate/:code
 */
router.get('/validate/:code', async (req, res) => {
  try {
    const referral = await prisma.referral.findUnique({
      where: { referralCode: req.params.code }
    });

    if (!referral) {
      return res.status(404).json({ error: 'Invalid referral code' });
    }

    res.json({ valid: true, commissionRate: referral.commissionRate });
  } catch (error) {
    console.error('Validate referral code error:', error);
    res.status(500).json({ error: 'Failed to validate referral code' });
  }
});

/**
 * Apply referral code during registration
 * POST /api/referrals/apply
 */
router.post('/apply', auth, async (req, res) => {
  try {
    const { referralCode } = req.body;
    const user = req.user;

    const referral = await prisma.referral.findUnique({
      where: { referralCode }
    });

    if (!referral) {
      return res.status(404).json({ error: 'Invalid referral code' });
    }

    if (referral.referrerId === user.id) {
      return res.status(400).json({ error: 'Cannot use your own referral code' });
    }

    // Check if user already referred
    const existingReferral = await prisma.referral.findFirst({
      where: { referredUserId: user.id }
    });

    if (existingReferral) {
      return res.status(400).json({ error: 'Already used a referral code' });
    }

    // Update referral with referred user
    const updated = await prisma.referral.update({
      where: { id: referral.id },
      data: {
        referredUserId: user.id,
        referredAt: new Date()
      }
    });

    // Give bonus to referrer
    const bonusAmount = 1000; // 1000 SLE bonus
    await prisma.customer.update({
      where: { userId: referral.referrerId },
      data: {
        balance: { increment: bonusAmount }
      }
    });

    res.json({
      message: 'Referral code applied successfully',
      referral: updated,
      bonusAmount
    });
  } catch (error) {
    console.error('Apply referral code error:', error);
    res.status(500).json({ error: 'Failed to apply referral code' });
  }
});

/**
 * Get referral stats for user
 * GET /api/referrals/stats
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const user = req.user;

    const referral = await prisma.referral.findFirst({
      where: { referrerId: user.id }
    });

    if (!referral) {
      return res.json({
        totalReferrals: 0,
        totalEarnings: 0,
        pendingEarnings: 0,
        referralCode: null
      });
    }

    // Get total referrals
    const totalReferrals = await prisma.referral.count({
      where: { referrerId: user.id, referredUserId: { not: null } }
    });

    // Calculate earnings (simplified - in production, track actual commissions)
    const totalEarnings = totalReferrals * 1000; // 1000 SLE per referral

    res.json({
      totalReferrals,
      totalEarnings,
      pendingEarnings: 0,
      referralCode: referral.referralCode,
      commissionRate: referral.commissionRate
    });
  } catch (error) {
    console.error('Get referral stats error:', error);
    res.status(500).json({ error: 'Failed to get referral stats' });
  }
});

/**
 * Get referred users list
 * GET /api/referrals/referred-users
 */
router.get('/referred-users', auth, async (req, res) => {
  try {
    const user = req.user;

    const referrals = await prisma.referral.findMany({
      where: { referrerId: user.id, referredUserId: { not: null } },
      include: {
        referredUser: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true
          }
        }
      },
      orderBy: { referredAt: 'desc' }
    });

    res.json({ referrals });
  } catch (error) {
    console.error('Get referred users error:', error);
    res.status(500).json({ error: 'Failed to get referred users' });
  }
});

module.exports = router;
