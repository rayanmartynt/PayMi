const express = require('express');
const router = express.Router();
const prisma = require('../db/index');
const { auth, merchantAuth } = require('../middleware/auth');

/**
 * Create bulk payment batch
 * POST /api/bulk-payments
 */
router.post('/', merchantAuth, async (req, res) => {
  try {
    const { payments, currency = 'SLE', description } = req.body;
    const merchant = req.merchant;

    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      return res.status(400).json({ error: 'Payments array is required' });
    }

    for (const payment of payments) {
      if (!payment.recipientId || !payment.amount) {
        return res.status(400).json({ error: 'Each payment must have recipientId and amount' });
      }
    }

    const totalAmount = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const bulkPayment = await prisma.bulkPayment.create({
      data: {
        merchantId: merchant.id,
        totalAmount,
        currency,
        paymentCount: payments.length,
        status: 'PENDING',
        description: description || null,
        payments: JSON.stringify(payments)
      }
    });

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
    const merchant = req.merchant;
    const { status } = req.query;

    const where = { merchantId: merchant.id };
    if (status) {
      where.status = status;
    }

    const bulkPayments = await prisma.bulkPayment.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json({ bulkPayments });
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
    const merchant = req.merchant;
    const bulkPayment = await prisma.bulkPayment.findFirst({
      where: {
        id: req.params.id,
        merchantId: merchant.id
      }
    });

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
    const merchant = req.merchant;
    const bulkPayment = await prisma.bulkPayment.findFirst({
      where: {
        id: req.params.id,
        merchantId: merchant.id
      }
    });

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
        const transaction = await prisma.transaction.create({
          data: {
            merchantId: merchant.id,
            customerId: payment.recipientId,
            amount: parseFloat(payment.amount),
            currency: bulkPayment.currency,
            paymentMethod: 'BULK_PAYMENT',
            status: 'SUCCESSFUL',
            description: payment.description || 'Bulk payment',
            reference: `BULK_${bulkPayment.id}_${Date.now()}`,
            metadata: JSON.stringify({ bulkPaymentId: bulkPayment.id })
          }
        });

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

    await prisma.bulkPayment.update({
      where: { id: req.params.id },
      data: {
        status: failureCount === 0 ? 'COMPLETED' : 'PARTIALLY_COMPLETED',
        successCount,
        failureCount,
        processedAt: new Date()
      }
    });

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
    const merchant = req.merchant;
    const bulkPayment = await prisma.bulkPayment.findFirst({
      where: {
        id: req.params.id,
        merchantId: merchant.id
      }
    });

    if (!bulkPayment) {
      return res.status(404).json({ error: 'Bulk payment not found' });
    }

    if (bulkPayment.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only pending bulk payments can be cancelled' });
    }

    const updated = await prisma.bulkPayment.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' }
    });

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
