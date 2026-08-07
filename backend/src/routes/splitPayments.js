const express = require('express');
const router = express.Router();
const prisma = require('../db/index');
const { auth, merchantAuth } = require('../middleware/auth');

/**
 * Create a split payment
 * POST /api/split-payments
 */
router.post('/', merchantAuth, async (req, res) => {
  try {
    const { totalAmount, currency = 'SLE', splits, expiresAt, metadata } = req.body;
    const merchant = req.merchant;

    if (!totalAmount || !splits || !Array.isArray(splits)) {
      return res.status(400).json({ error: 'Total amount and splits array are required' });
    }

    // Validate splits
    const splitTotal = splits.reduce((sum, split) => sum + split.amount, 0);
    if (Math.abs(splitTotal - totalAmount) > 0.01) {
      return res.status(400).json({ error: 'Split amounts must equal total amount' });
    }

    // Create split payment
    const splitPayment = await prisma.splitPayment.create({
      data: {
        merchantId: merchant.id,
        totalAmount: parseFloat(totalAmount),
        currency,
        reference: `SPLIT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    });

    // Create split parts
    const splitParts = await Promise.all(splits.map(split => 
      prisma.splitPaymentPart.create({
        data: {
          splitPaymentId: splitPayment.id,
          recipientId: split.recipientId,
          recipientType: split.recipientType || 'MERCHANT',
          amount: parseFloat(split.amount)
        }
      })
    ));

    res.status(201).json({
      message: 'Split payment created successfully',
      splitPayment: {
        ...splitPayment,
        splits: splitParts
      }
    });
  } catch (error) {
    console.error('Create split payment error:', error);
    res.status(500).json({ error: 'Failed to create split payment' });
  }
});

/**
 * Get merchant split payments
 * GET /api/split-payments
 */
router.get('/', merchantAuth, async (req, res) => {
  try {
    const merchant = req.merchant;
    const { status } = req.query;

    const where = { merchantId: merchant.id };
    if (status) {
      where.status = status;
    }

    const splitPayments = await prisma.splitPayment.findMany({
      where,
      include: {
        splits: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ splitPayments });
  } catch (error) {
    console.error('Get split payments error:', error);
    res.status(500).json({ error: 'Failed to get split payments' });
  }
});

/**
 * Get split payment by ID
 * GET /api/split-payments/:id
 */
router.get('/:id', merchantAuth, async (req, res) => {
  try {
    const merchant = req.merchant;
    const splitPayment = await prisma.splitPayment.findFirst({
      where: {
        id: req.params.id,
        merchantId: merchant.id
      },
      include: {
        splits: true
      }
    });

    if (!splitPayment) {
      return res.status(404).json({ error: 'Split payment not found' });
    }

    res.json({ splitPayment });
  } catch (error) {
    console.error('Get split payment error:', error);
    res.status(500).json({ error: 'Failed to get split payment' });
  }
});

/**
 * Execute split payment
 * POST /api/split-payments/:id/execute
 */
router.post('/:id/execute', merchantAuth, async (req, res) => {
  try {
    const merchant = req.merchant;
    const splitPayment = await prisma.splitPayment.findFirst({
      where: {
        id: req.params.id,
        merchantId: merchant.id
      },
      include: {
        splits: true
      }
    });

    if (!splitPayment) {
      return res.status(404).json({ error: 'Split payment not found' });
    }

    if (splitPayment.status !== 'PENDING') {
      return res.status(400).json({ error: 'Split payment can only be executed if pending' });
    }

    if (splitPayment.expiresAt && new Date(splitPayment.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Split payment has expired' });
    }

    // Execute each split
    const results = [];
    let allSuccessful = true;

    for (const split of splitPayment.splits) {
      try {
        // Create transaction for each split
        const transaction = await prisma.transaction.create({
          data: {
            merchantId: merchant.id,
            amount: split.amount,
            currency: splitPayment.currency,
            paymentMethod: 'SPLIT_PAYMENT',
            status: 'SUCCESSFUL',
            description: `Split payment part`,
            reference: `SPLIT_PART_${split.id}_${Date.now()}`,
            metadata: JSON.stringify({ 
              splitPaymentId: splitPayment.id,
              splitPartId: split.id,
              recipientId: split.recipientId,
              recipientType: split.recipientType
            })
          }
        });

        // Update split part status
        await prisma.splitPaymentPart.update({
          where: { id: split.id },
          data: {
            status: 'COMPLETED',
            transactionId: transaction.id
          }
        });

        results.push({
          splitId: split.id,
          status: 'COMPLETED',
          transactionId: transaction.id
        });
      } catch (error) {
        console.error(`Failed to execute split ${split.id}:`, error);
        await prisma.splitPaymentPart.update({
          where: { id: split.id },
          data: { status: 'FAILED' }
        });
        results.push({
          splitId: split.id,
          status: 'FAILED',
          error: error.message
        });
        allSuccessful = false;
      }
    }

    // Update split payment status
    await prisma.splitPayment.update({
      where: { id: splitPayment.id },
      data: {
        status: allSuccessful ? 'COMPLETED' : 'FAILED'
      }
    });

    res.json({
      message: 'Split payment executed',
      splitPaymentId: splitPayment.id,
      status: allSuccessful ? 'COMPLETED' : 'FAILED',
      results
    });
  } catch (error) {
    console.error('Execute split payment error:', error);
    res.status(500).json({ error: 'Failed to execute split payment' });
  }
});

/**
 * Cancel split payment
 * POST /api/split-payments/:id/cancel
 */
router.post('/:id/cancel', merchantAuth, async (req, res) => {
  try {
    const merchant = req.merchant;
    const splitPayment = await prisma.splitPayment.findFirst({
      where: {
        id: req.params.id,
        merchantId: merchant.id
      }
    });

    if (!splitPayment) {
      return res.status(404).json({ error: 'Split payment not found' });
    }

    if (splitPayment.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only pending split payments can be cancelled' });
    }

    // Cancel all split parts
    await prisma.splitPaymentPart.updateMany({
      where: { splitPaymentId: splitPayment.id },
      data: { status: 'FAILED' }
    });

    // Update split payment status
    const updated = await prisma.splitPayment.update({
      where: { id: splitPayment.id },
      data: { status: 'FAILED' }
    });

    res.json({
      message: 'Split payment cancelled successfully',
      splitPayment: updated
    });
  } catch (error) {
    console.error('Cancel split payment error:', error);
    res.status(500).json({ error: 'Failed to cancel split payment' });
  }
});

module.exports = router;
