const express = require('express');
const router = express.Router();
const db = require('../db/index');
const { eq, desc, and } = require('drizzle-orm');
const { merchants, transactions, splitPayments, splitPaymentParts } = require('../db/schema');
const { auth, merchantAuth } = require('../middleware/auth');

/**
 * Create a split payment
 * POST /api/split-payments
 */
router.post('/', merchantAuth, async (req, res) => {
  try {
    const { totalAmount, currency = 'SLE', splits, expiresAt, metadata } = req.body;
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    if (!totalAmount || !splits || !Array.isArray(splits)) {
      return res.status(400).json({ error: 'Total amount and splits array are required' });
    }

    // Validate splits
    const splitTotal = splits.reduce((sum, split) => sum + parseFloat(split.amount), 0);
    if (Math.abs(splitTotal - parseFloat(totalAmount)) > 0.01) {
      return res.status(400).json({ error: 'Split amounts must equal total amount' });
    }

    // Create split payment
    const splitPaymentResult = await db.insert(splitPayments).values({
      merchantId: merchant.id,
      totalAmount: parseFloat(totalAmount).toString(),
      currency,
      reference: `SPLIT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      metadata: metadata ? JSON.stringify(metadata) : null
    }).returning();
    
    const splitPayment = splitPaymentResult[0];

    // Create split parts
    const splitPartsResults = await Promise.all(splits.map(split => 
      db.insert(splitPaymentParts).values({
        splitPaymentId: splitPayment.id,
        recipientId: split.recipientId,
        recipientType: split.recipientType || 'MERCHANT',
        amount: parseFloat(split.amount).toString()
      }).returning()
    ));
    
    const splitParts = splitPartsResults.map(r => r[0]);

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
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const { status } = req.query;

    let whereCondition = eq(splitPayments.merchantId, merchant.id);
    if (status) {
      whereCondition = and(eq(splitPayments.merchantId, merchant.id), eq(splitPayments.status, status));
    }

    const splitPaymentsResult = await db.select()
      .from(splitPayments)
      .where(whereCondition)
      .orderBy(desc(splitPayments.createdAt));

    // Get splits for each payment
    const splitPaymentsWithSplits = await Promise.all(
      splitPaymentsResult.map(async (sp) => {
        const splitsResult = await db.select()
          .from(splitPaymentParts)
          .where(eq(splitPaymentParts.splitPaymentId, sp.id));
        return {
          ...sp,
          splits: splitsResult
        };
      })
    );

    res.json({ splitPayments: splitPaymentsWithSplits });
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
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const splitPaymentResult = await db.select()
      .from(splitPayments)
      .where(and(eq(splitPayments.id, req.params.id), eq(splitPayments.merchantId, merchant.id)))
      .limit(1);
    
    const splitPayment = splitPaymentResult[0];

    if (!splitPayment) {
      return res.status(404).json({ error: 'Split payment not found' });
    }

    // Get splits
    const splitsResult = await db.select()
      .from(splitPaymentParts)
      .where(eq(splitPaymentParts.splitPaymentId, splitPayment.id));

    res.json({ splitPayment: { ...splitPayment, splits: splitsResult } });
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
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const splitPaymentResult = await db.select()
      .from(splitPayments)
      .where(and(eq(splitPayments.id, req.params.id), eq(splitPayments.merchantId, merchant.id)))
      .limit(1);
    
    const splitPayment = splitPaymentResult[0];

    if (!splitPayment) {
      return res.status(404).json({ error: 'Split payment not found' });
    }

    if (splitPayment.status !== 'PENDING') {
      return res.status(400).json({ error: 'Split payment can only be executed if pending' });
    }

    if (splitPayment.expiresAt && new Date(splitPayment.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Split payment has expired' });
    }

    // Get splits
    const splitsResult = await db.select()
      .from(splitPaymentParts)
      .where(eq(splitPaymentParts.splitPaymentId, splitPayment.id));

    // Execute each split
    const results = [];
    let allSuccessful = true;

    for (const split of splitsResult) {
      try {
        // Create transaction for each split
        const transactionResult = await db.insert(transactions).values({
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
        }).returning();
        
        const transaction = transactionResult[0];

        // Update split part status
        await db.update(splitPaymentParts)
          .set({
            status: 'COMPLETED',
            transactionId: transaction.id
          })
          .where(eq(splitPaymentParts.id, split.id));

        results.push({
          splitId: split.id,
          status: 'COMPLETED',
          transactionId: transaction.id
        });
      } catch (error) {
        console.error(`Failed to execute split ${split.id}:`, error);
        await db.update(splitPaymentParts)
          .set({ status: 'FAILED' })
          .where(eq(splitPaymentParts.id, split.id));
        results.push({
          splitId: split.id,
          status: 'FAILED',
          error: error.message
        });
        allSuccessful = false;
      }
    }

    // Update split payment status
    await db.update(splitPayments)
      .set({
        status: allSuccessful ? 'COMPLETED' : 'FAILED'
      })
      .where(eq(splitPayments.id, splitPayment.id));

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
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const splitPaymentResult = await db.select()
      .from(splitPayments)
      .where(and(eq(splitPayments.id, req.params.id), eq(splitPayments.merchantId, merchant.id)))
      .limit(1);
    
    const splitPayment = splitPaymentResult[0];

    if (!splitPayment) {
      return res.status(404).json({ error: 'Split payment not found' });
    }

    if (splitPayment.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only pending split payments can be cancelled' });
    }

    // Cancel all split parts
    await db.update(splitPaymentParts)
      .set({ status: 'FAILED' })
      .where(eq(splitPaymentParts.splitPaymentId, splitPayment.id));

    // Update split payment status
    const updatedResult = await db.update(splitPayments)
      .set({ status: 'FAILED' })
      .where(eq(splitPayments.id, splitPayment.id))
      .returning();
    
    const updated = updatedResult[0];

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
