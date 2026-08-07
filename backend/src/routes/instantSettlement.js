const express = require('express');
const router = express.Router();
const db = require('../db/index');
const { eq, desc, and } = require('drizzle-orm');
const { merchants, settlements } = require('../db/schema');
const { auth, merchantAuth } = require('../middleware/auth');

/**
 * Calculate instant settlement fee (2% of amount)
 */
const calculateInstantFee = (amount) => {
  return amount * 0.02;
};

/**
 * Request instant settlement
 * POST /api/instant-settlement
 */
router.post('/', merchantAuth, async (req, res) => {
  try {
    const { amount, currency = 'SLE', mobileMoneyProvider, mobileNumber } = req.body;
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    if (!amount || !mobileMoneyProvider || !mobileNumber) {
      return res.status(400).json({ error: 'Amount, provider, and mobile number are required' });
    }

    const instantFee = calculateInstantFee(parseFloat(amount));
    const netAmount = parseFloat(amount) - instantFee;

    // Create settlement with instant flag
    const settlementResult = await db.insert(settlements).values({
      merchantId: merchant.id,
      amount: netAmount.toString(),
      currency,
      mobileMoneyProvider,
      mobileNumber,
      instant: true,
      instantFee: instantFee.toString(),
      status: 'PENDING'
    }).returning();
    
    const settlement = settlementResult[0];

    // In a real implementation, this would trigger the actual mobile money transfer
    // For now, we'll simulate instant settlement
    setTimeout(async () => {
      try {
        await db.update(settlements)
          .set({
            status: 'COMPLETED',
            settledAt: new Date()
          })
          .where(eq(settlements.id, settlement.id));

        if (global.io) {
          global.io.to(merchant.id).emit('settlement', {
            type: 'instant',
            settlement: {
              ...settlement,
              status: 'COMPLETED',
              settledAt: new Date()
            }
          });
        }
      } catch (error) {
        console.error('Instant settlement processing error:', error);
      }
    }, 5000); // Simulate 5 second processing time

    res.status(201).json({
      message: 'Instant settlement requested',
      settlement: {
        ...settlement,
        estimatedCompletion: new Date(Date.now() + 5000)
      }
    });
  } catch (error) {
    console.error('Instant settlement error:', error);
    res.status(500).json({ error: 'Failed to request instant settlement' });
  }
});

/**
 * Get instant settlement fee estimate
 * GET /api/instant-settlement/estimate
 */
router.get('/estimate', merchantAuth, async (req, res) => {
  try {
    const { amount } = req.query;

    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    const instantFee = calculateInstantFee(parseFloat(amount));
    const netAmount = parseFloat(amount) - instantFee;

    res.json({
      amount: parseFloat(amount),
      instantFee,
      netAmount,
      feePercentage: 2
    });
  } catch (error) {
    console.error('Estimate error:', error);
    res.status(500).json({ error: 'Failed to calculate estimate' });
  }
});

/**
 * Get merchant settlement history
 * GET /api/instant-settlement/history
 */
router.get('/history', merchantAuth, async (req, res) => {
  try {
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const { status } = req.query;

    let whereCondition = and(eq(settlements.merchantId, merchant.id), eq(settlements.instant, true));
    if (status) {
      whereCondition = and(eq(settlements.merchantId, merchant.id), eq(settlements.instant, true), eq(settlements.status, status));
    }

    const settlementsResult = await db.select()
      .from(settlements)
      .where(whereCondition)
      .orderBy(desc(settlements.createdAt));

    res.json({ settlements: settlementsResult });
  } catch (error) {
    console.error('Get settlement history error:', error);
    res.status(500).json({ error: 'Failed to get settlement history' });
  }
});

module.exports = router;
