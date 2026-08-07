const express = require('express');
const router = express.Router();
const db = require('../db/index');
const { eq, desc, and } = require('drizzle-orm');
const { merchants, transactions, bulkPayments } = require('../db/schema');
const { auth, merchantAuth } = require('../middleware/auth');

/**
 * Create bulk payment batch
 * POST /api/bulk-payments
 */
router.post('/', merchantAuth, async (req, res) => {
  try {
    const { payments, currency = 'SLE', description } = req.body;
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      return res.status(400).json({ error: 'Payments array is required' });
    }

    for (const payment of payments) {
      if (!payment.recipientId || !payment.amount) {
        return res.status(400).json({ error: 'Each payment must have recipientId and amount' });
      }
    }

    const totalAmount = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const bulkPaymentResult = await db.insert(bulkPayments).values({
      merchantId: merchant.id,
      totalAmount: totalAmount.toString(),
      currency,
      paymentCount: payments.length,
      status: 'PENDING',
      description: description || null,
      payments: JSON.stringify(payments)
    }).returning();
    
    const bulkPayment = bulkPaymentResult[0];

    res.status(201).json({
      message: 'Bulk payment batch created',
      bulkPayment
    });
  } catch (error) {
    console.error('Create bulk payment error:', error);
    res.status(500).json({ error: 'Failed to create bulk payment' });
  }
});

/**
 * Get bulk payment batches for merchant
 * GET /api/bulk-payments
 */
router.get('/', merchantAuth, async (req, res) => {
  try {
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const { status } = req.query;

    let whereCondition = eq(bulkPayments.merchantId, merchant.id);
    if (status) {
      whereCondition = and(eq(bulkPayments.merchantId, merchant.id), eq(bulkPayments.status, status));
    }

    const bulkPaymentsResult = await db.select()
      .from(bulkPayments)
      .where(whereCondition)
      .orderBy(desc(bulkPayments.createdAt));

    res.json({ bulkPayments: bulkPaymentsResult });
  } catch (error) {
    console.error('Get bulk payments error:', error);
    res.status(500).json({ error: 'Failed to get bulk payments' });
  }
});

/**
 * Get bulk payment by ID
 * GET /api/bulk-payments/:id
 */
router.get('/:id', merchantAuth, async (req, res) => {
  try {
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const bulkPaymentResult = await db.select()
      .from(bulkPayments)
      .where(and(eq(bulkPayments.id, req.params.id), eq(bulkPayments.merchantId, merchant.id)))
      .limit(1);
    
    const bulkPayment = bulkPaymentResult[0];

    if (!bulkPayment) {
      return res.status(404).json({ error: 'Bulk payment not found' });
    }

    res.json({ bulkPayment });
  } catch (error) {
    console.error('Get bulk payment error:', error);
    res.status(500).json({ error: 'Failed to get bulk payment' });
  }
});

/**
 * Process bulk payment batch
 * POST /api/bulk-payments/:id/process
 */
router.post('/:id/process', merchantAuth, async (req, res) => {
  try {
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const bulkPaymentResult = await db.select()
      .from(bulkPayments)
      .where(and(eq(bulkPayments.id, req.params.id), eq(bulkPayments.merchantId, merchant.id)))
      .limit(1);
    
    const bulkPayment = bulkPaymentResult[0];

    if (!bulkPayment) {
      return res.status(404).json({ error: 'Bulk payment not found' });
    }

    if (bulkPayment.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only pending bulk payments can be processed' });
    }

    const payments = JSON.parse(bulkPayment.payments);
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const payment of payments) {
      try {
        const transactionResult = await db.insert(transactions).values({
          merchantId: merchant.id,
          customerId: payment.recipientId,
          amount: parseFloat(payment.amount).toString(),
          currency: bulkPayment.currency,
          paymentMethod: 'BULK_PAYMENT',
          status: 'SUCCESSFUL',
          description: payment.description || 'Bulk payment',
          reference: `BULK_${bulkPayment.id}_${Date.now()}`,
          metadata: JSON.stringify({ bulkPaymentId: bulkPayment.id })
        }).returning();
        
        const transaction = transactionResult[0];

        results.push({
          recipientId: payment.recipientId,
          status: 'SUCCESS',
          transactionId: transaction.id
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to process payment to ${payment.recipientId}:`, error);
        results.push({
          recipientId: payment.recipientId,
          status: 'FAILED',
          error: error.message
        });
        failureCount++;
      }
    }

    await db.update(bulkPayments)
      .set({
        status: failureCount === 0 ? 'COMPLETED' : 'PARTIALLY_COMPLETED',
        successCount,
        failureCount,
        processedAt: new Date()
      })
      .where(eq(bulkPayments.id, req.params.id));

    res.json({
      message: 'Bulk payment processed',
      results,
      summary: {
        total: payments.length,
        success: successCount,
        failed: failureCount
      }
    });
  } catch (error) {
    console.error('Process bulk payment error:', error);
    res.status(500).json({ error: 'Failed to process bulk payment' });
  }
});

/**
 * Cancel bulk payment batch
 * POST /api/bulk-payments/:id/cancel
 */
router.post('/:id/cancel', merchantAuth, async (req, res) => {
  try {
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const bulkPaymentResult = await db.select()
      .from(bulkPayments)
      .where(and(eq(bulkPayments.id, req.params.id), eq(bulkPayments.merchantId, merchant.id)))
      .limit(1);
    
    const bulkPayment = bulkPaymentResult[0];

    if (!bulkPayment) {
      return res.status(404).json({ error: 'Bulk payment not found' });
    }

    if (bulkPayment.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only pending bulk payments can be cancelled' });
    }

    const updatedResult = await db.update(bulkPayments)
      .set({ status: 'CANCELLED' })
      .where(eq(bulkPayments.id, req.params.id))
      .returning();
    
    const updated = updatedResult[0];

    res.json({
      message: 'Bulk payment cancelled',
      bulkPayment: updated
    });
  } catch (error) {
    console.error('Cancel bulk payment error:', error);
    res.status(500).json({ error: 'Failed to cancel bulk payment' });
  }
});

module.exports = router;
