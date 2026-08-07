const express = require('express');
const router = express.Router();
const db = require('../db/index');
const { eq, desc, and, isNotNull } = require('drizzle-orm');
const { users, customers, referrals } = require('../db/schema');
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

    let referralResult = await db.select()
      .from(referrals)
      .where(eq(referrals.referrerId, user.id))
      .limit(1);
    
    let referral = referralResult[0];

    if (!referral) {
      const referralResult = await db.insert(referrals).values({
        referrerId: user.id,
        referralCode: generateReferralCode(),
        commissionRate: 5 // 5% commission
      }).returning();
      
      referral = referralResult[0];
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
    const referralResult = await db.select()
      .from(referrals)
      .where(eq(referrals.referralCode, req.params.code))
      .limit(1);
    
    const referral = referralResult[0];

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

    const referralResult = await db.select()
      .from(referrals)
      .where(eq(referrals.referralCode, referralCode))
      .limit(1);
    
    const referral = referralResult[0];

    if (!referral) {
      return res.status(404).json({ error: 'Invalid referral code' });
    }

    if (referral.referrerId === user.id) {
      return res.status(400).json({ error: 'Cannot use your own referral code' });
    }

    // Check if user already referred
    const existingReferralResult = await db.select()
      .from(referrals)
      .where(eq(referrals.referredUserId, user.id))
      .limit(1);
    
    const existingReferral = existingReferralResult[0];

    if (existingReferral) {
      return res.status(400).json({ error: 'Already used a referral code' });
    }

    // Update referral with referred user
    const updatedResult = await db.update(referrals)
      .set({
        referredUserId: user.id,
        referredAt: new Date()
      })
      .where(eq(referrals.id, referral.id))
      .returning();
    
    const updated = updatedResult[0];

    // Give bonus to referrer
    const bonusAmount = 1000; // 1000 SLE bonus
    const customerResult = await db.select()
      .from(customers)
      .where(eq(customers.userId, referral.referrerId))
      .limit(1);
    
    const customer = customerResult[0];
    
    if (customer) {
      await db.update(customers)
        .set({ balance: (parseFloat(customer.balance) + bonusAmount).toString() })
        .where(eq(customers.userId, referral.referrerId));
    }

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

    const referralResult = await db.select()
      .from(referrals)
      .where(eq(referrals.referrerId, user.id))
      .limit(1);
    
    const referral = referralResult[0];

    if (!referral) {
      return res.json({
        totalReferrals: 0,
        totalEarnings: 0,
        pendingEarnings: 0,
        referralCode: null
      });
    }

    // Get total referrals
    const totalReferralsResult = await db.select()
      .from(referrals)
      .where(and(eq(referrals.referrerId, user.id), isNotNull(referrals.referredUserId)));
    
    const totalReferrals = totalReferralsResult.length;

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

    const referralsResult = await db.select()
      .from(referrals)
      .where(and(eq(referrals.referrerId, user.id), isNotNull(referrals.referredUserId)))
      .orderBy(desc(referrals.referredAt));

    // Get user details for each referral
    const referralsWithUsers = await Promise.all(
      referralsResult.map(async (referral) => {
        const userResult = await db.select()
          .from(users)
          .where(eq(users.id, referral.referredUserId))
          .limit(1);
        return {
          ...referral,
          referredUser: userResult[0] ? {
            id: userResult[0].id,
            email: userResult[0].email,
            name: userResult[0].name,
            createdAt: userResult[0].createdAt
          } : null
        };
      })
    );

    res.json({ referrals: referralsWithUsers });
  } catch (error) {
    console.error('Get referred users error:', error);
    res.status(500).json({ error: 'Failed to get referred users' });
  }
});

module.exports = router;
