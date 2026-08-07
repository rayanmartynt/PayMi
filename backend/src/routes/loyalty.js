const express = require('express');
const router = express.Router();
const db = require('../db/index');
const { eq, desc, and } = require('drizzle-orm');
const { loyaltyAccounts, loyaltyRewards, loyaltyRedemptions } = require('../db/schema');
const { auth } = require('../middleware/auth');

/**
 * Calculate loyalty points (1 point per 100 SLE spent)
 */
const calculatePoints = (amount) => {
  return Math.floor(amount / 100);
};

/**
 * Get user loyalty account
 * GET /api/loyalty/account
 */
router.get('/account', auth, async (req, res) => {
  try {
    const user = req.user;

    let loyaltyAccountResult = await db.select()
      .from(loyaltyAccounts)
      .where(eq(loyaltyAccounts.userId, user.id))
      .limit(1);
    
    let loyaltyAccount = loyaltyAccountResult[0];

    if (!loyaltyAccount) {
      const loyaltyAccountResult = await db.insert(loyaltyAccounts).values({
        userId: user.id,
        points: 0,
        tier: 'BRONZE'
      }).returning();
      
      loyaltyAccount = loyaltyAccountResult[0];
    }

    res.json({ loyaltyAccount });
  } catch (error) {
    console.error('Get loyalty account error:', error);
    res.status(500).json({ error: 'Failed to get loyalty account' });
  }
});

/**
 * Get loyalty rewards catalog
 * GET /api/loyalty/rewards
 */
router.get('/rewards', async (req, res) => {
  try {
    const rewardsResult = await db.select()
      .from(loyaltyRewards)
      .where(eq(loyaltyRewards.active, true))
      .orderBy(loyaltyRewards.pointsRequired);

    res.json({ rewards: rewardsResult });
  } catch (error) {
    console.error('Get loyalty rewards error:', error);
    res.status(500).json({ error: 'Failed to get loyalty rewards' });
  }
});

/**
 * Redeem loyalty points for reward
 * POST /api/loyalty/redeem
 */
router.post('/redeem', auth, async (req, res) => {
  try {
    const { rewardId } = req.body;
    const user = req.user;

    const loyaltyAccountResult = await db.select()
      .from(loyaltyAccounts)
      .where(eq(loyaltyAccounts.userId, user.id))
      .limit(1);
    
    const loyaltyAccount = loyaltyAccountResult[0];

    if (!loyaltyAccount) {
      return res.status(404).json({ error: 'Loyalty account not found' });
    }

    const rewardResult = await db.select()
      .from(loyaltyRewards)
      .where(eq(loyaltyRewards.id, rewardId))
      .limit(1);
    
    const reward = rewardResult[0];

    if (!reward || !reward.active) {
      return res.status(404).json({ error: 'Reward not found or inactive' });
    }

    if (loyaltyAccount.points < reward.pointsRequired) {
      return res.status(400).json({ error: 'Insufficient points' });
    }

    // Deduct points
    await db.update(loyaltyAccounts)
      .set({ points: loyaltyAccount.points - reward.pointsRequired })
      .where(eq(loyaltyAccounts.id, loyaltyAccount.id));

    // Create redemption record
    const redemptionResult = await db.insert(loyaltyRedemptions).values({
      loyaltyAccountId: loyaltyAccount.id,
      rewardId,
      pointsUsed: reward.pointsRequired,
      status: 'COMPLETED'
    }).returning();
    
    const redemption = redemptionResult[0];

    // Update tier based on remaining points
    await updateLoyaltyTier(loyaltyAccount.id);

    res.json({
      message: 'Reward redeemed successfully',
      redemption,
      remainingPoints: loyaltyAccount.points - reward.pointsRequired
    });
  } catch (error) {
    console.error('Redeem reward error:', error);
    res.status(500).json({ error: 'Failed to redeem reward' });
  }
});

/**
 * Get redemption history
 * GET /api/loyalty/redemptions
 */
router.get('/redemptions', auth, async (req, res) => {
  try {
    const user = req.user;

    const loyaltyAccountResult = await db.select()
      .from(loyaltyAccounts)
      .where(eq(loyaltyAccounts.userId, user.id))
      .limit(1);
    
    const loyaltyAccount = loyaltyAccountResult[0];

    if (!loyaltyAccount) {
      return res.json({ redemptions: [] });
    }

    const redemptionsResult = await db.select()
      .from(loyaltyRedemptions)
      .where(eq(loyaltyRedemptions.loyaltyAccountId, loyaltyAccount.id))
      .orderBy(desc(loyaltyRedemptions.createdAt));

    // Get reward details for each redemption
    const redemptionsWithRewards = await Promise.all(
      redemptionsResult.map(async (redemption) => {
        const rewardResult = await db.select()
          .from(loyaltyRewards)
          .where(eq(loyaltyRewards.id, redemption.rewardId))
          .limit(1);
        return {
          ...redemption,
          reward: rewardResult[0] || null
        };
      })
    );

    res.json({ redemptions: redemptionsWithRewards });
  } catch (error) {
    console.error('Get redemptions error:', error);
    res.status(500).json({ error: 'Failed to get redemptions' });
  }
});

/**
 * Add points to loyalty account (internal use)
 * POST /api/loyalty/add-points
 */
router.post('/add-points', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const user = req.user;

    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    let loyaltyAccountResult = await db.select()
      .from(loyaltyAccounts)
      .where(eq(loyaltyAccounts.userId, user.id))
      .limit(1);
    
    let loyaltyAccount = loyaltyAccountResult[0];

    if (!loyaltyAccount) {
      const loyaltyAccountResult = await db.insert(loyaltyAccounts).values({
        userId: user.id,
        points: 0,
        tier: 'BRONZE'
      }).returning();
      
      loyaltyAccount = loyaltyAccountResult[0];
    }

    const pointsToAdd = calculatePoints(parseFloat(amount));

    await db.update(loyaltyAccounts)
      .set({ points: loyaltyAccount.points + pointsToAdd })
      .where(eq(loyaltyAccounts.id, loyaltyAccount.id));

    // Update tier
    await updateLoyaltyTier(loyaltyAccount.id);

    res.json({
      message: 'Points added successfully',
      pointsAdded: pointsToAdd
    });
  } catch (error) {
    console.error('Add points error:', error);
    res.status(500).json({ error: 'Failed to add points' });
  }
});

/**
 * Update loyalty tier based on points
 */
async function updateLoyaltyTier(loyaltyAccountId) {
  const accountResult = await db.select()
    .from(loyaltyAccounts)
    .where(eq(loyaltyAccounts.id, loyaltyAccountId))
    .limit(1);
  
  const account = accountResult[0];

  let tier = 'BRONZE';
  if (account.points >= 10000) tier = 'GOLD';
  else if (account.points >= 5000) tier = 'SILVER';

  if (tier !== account.tier) {
    await db.update(loyaltyAccounts)
      .set({ tier })
      .where(eq(loyaltyAccounts.id, loyaltyAccountId));
  }
}

module.exports = router;
