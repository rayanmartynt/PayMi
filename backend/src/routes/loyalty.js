const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
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

    let loyaltyAccount = await prisma.loyaltyAccount.findFirst({
      where: { userId: user.id }
    });

    if (!loyaltyAccount) {
      loyaltyAccount = await prisma.loyaltyAccount.create({
        data: {
          userId: user.id,
          points: 0,
          tier: 'BRONZE'
        }
      });
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
    const rewards = await prisma.loyaltyReward.findMany({
      where: { active: true },
      orderBy: { pointsRequired: 'asc' }
    });

    res.json({ rewards });
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

    const loyaltyAccount = await prisma.loyaltyAccount.findFirst({
      where: { userId: user.id }
    });

    if (!loyaltyAccount) {
      return res.status(404).json({ error: 'Loyalty account not found' });
    }

    const reward = await prisma.loyaltyReward.findUnique({
      where: { id: rewardId }
    });

    if (!reward || !reward.active) {
      return res.status(404).json({ error: 'Reward not found or inactive' });
    }

    if (loyaltyAccount.points < reward.pointsRequired) {
      return res.status(400).json({ error: 'Insufficient points' });
    }

    // Deduct points
    await prisma.loyaltyAccount.update({
      where: { id: loyaltyAccount.id },
      data: {
        points: { decrement: reward.pointsRequired }
      }
    });

    // Create redemption record
    const redemption = await prisma.loyaltyRedemption.create({
      data: {
        loyaltyAccountId: loyaltyAccount.id,
        rewardId,
        pointsUsed: reward.pointsRequired,
        status: 'COMPLETED'
      }
    });

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

    const loyaltyAccount = await prisma.loyaltyAccount.findFirst({
      where: { userId: user.id }
    });

    if (!loyaltyAccount) {
      return res.json({ redemptions: [] });
    }

    const redemptions = await prisma.loyaltyRedemption.findMany({
      where: { loyaltyAccountId: loyaltyAccount.id },
      include: {
        reward: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ redemptions });
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

    let loyaltyAccount = await prisma.loyaltyAccount.findFirst({
      where: { userId: user.id }
    });

    if (!loyaltyAccount) {
      loyaltyAccount = await prisma.loyaltyAccount.create({
        data: {
          userId: user.id,
          points: 0n,
          tier: 'BRONZE'
        }
      });
    }

    const pointsToAdd = calculatePoints(parseFloat(amount));

    await prisma.loyaltyAccount.update({
      where: { id: loyaltyAccount.id },
      data: {
        points: { increment: pointsToAdd }
      }
    });

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
  const account = await prisma.loyaltyAccount.findUnique({
    where: { id: loyaltyAccountId }
  });

  let tier = 'BRONZE';
  if (account.points >= 10000) tier = 'GOLD';
  else if (account.points >= 5000) tier = 'SILVER';

  if (tier !== account.tier) {
    await prisma.loyaltyAccount.update({
      where: { id: loyaltyAccountId },
      data: { tier }
    });
  }
}

module.exports = router;
