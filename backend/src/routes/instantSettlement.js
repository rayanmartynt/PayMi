const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
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
    const merchant = req.merchant;

    if (!amount || !mobileMoneyProvider || !mobileNumber) {
      return res.status(400).json({ error: 'Amount, provider, and mobile number are required' });
    }

    const instantFee = calculateInstantFee(parseFloat(amount));
    const netAmount = parseFloat(amount) - instantFee;

    // Create settlement with instant flag
    const settlement = await prisma.settlement.create({
      data: {
        merchantId: merchant.id,
        amount: netAmount,
        currency,
        mobileMoneyProvider,
        mobileNumber,
        instant: true,
        instantFee,
        status: 'PENDING'
      }
    });

    // In a real implementation, this would trigger the actual mobile money transfer
    // For now, we'll simulate instant settlement
    setTimeout(async () => {
      try {
        await prisma.settlement.update({
          where: { id: settlement.id },
          data: {
            status: 'COMPLETED',
            settledAt: new Date()
          }
        });

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
    const merchant = req.merchant;
    const { status } = req.query;

    const where = { merchantId: merchant.id, instant: true };
    if (status) {
      where.status = status;
    }

    const settlements = await prisma.settlement.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json({ settlements });
  } catch (error) {
    console.error('Get settlement history error:', error);
    res.status(500).json({ error: 'Failed to get settlement history' });
  }
});

module.exports = router;
