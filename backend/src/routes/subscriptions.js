const express = require('express');
const router = express.Router();
const prisma = require('../db/index');
const { auth, merchantAuth } = require('../middleware/auth');

/**
 * Create a subscription
 * POST /api/subscriptions
 */
router.post('/', merchantAuth, async (req, res) => {
  try {
    const { customerId, amount, currency = 'SLE', interval, metadata } = req.body;
    const merchant = req.merchant;

    if (!customerId || !amount || !interval) {
      return res.status(400).json({ error: 'Customer ID, amount, and interval are required' });
    }

    // Validate interval
    const validIntervals = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
    if (!validIntervals.includes(interval)) {
      return res.status(400).json({ error: 'Invalid interval. Must be DAILY, WEEKLY, MONTHLY, or YEARLY' });
    }

    // Calculate next billing date
    const nextBilling = new Date();
    switch(interval) {
      case 'DAILY':
        nextBilling.setDate(nextBilling.getDate() + 1);
        break;
      case 'WEEKLY':
        nextBilling.setDate(nextBilling.getDate() + 7);
        break;
      case 'MONTHLY':
        nextBilling.setMonth(nextBilling.getMonth() + 1);
        break;
      case 'YEARLY':
        nextBilling.setFullYear(nextBilling.getFullYear() + 1);
        break;
    }

    const subscription = await prisma.subscription.create({
      data: {
        merchantId: merchant.id,
        customerId,
        amount: parseFloat(amount),
        currency,
        interval,
        nextBilling,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    });

    res.status(201).json({
      message: 'Subscription created successfully',
      subscription
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

/**
 * Get merchant subscriptions
 * GET /api/subscriptions
 */
router.get('/', merchantAuth, async (req, res) => {
  try {
    const merchant = req.merchant;
    const { status } = req.query;

    const where = { merchantId: merchant.id };
    if (status) {
      where.status = status;
    }

    const subscriptions = await prisma.subscription.findMany({
      where,
      include: {
        // Note: Customer relation not in schema, would need to add
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ subscriptions });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ error: 'Failed to get subscriptions' });
  }
});

/**
 * Get subscription by ID
 * GET /api/subscriptions/:id
 */
router.get('/:id', merchantAuth, async (req, res) => {
  try {
    const merchant = req.merchant;
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: req.params.id,
        merchantId: merchant.id
      }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json({ subscription });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to get subscription' });
  }
});

/**
 * Pause subscription
 * POST /api/subscriptions/:id/pause
 */
router.post('/:id/pause', merchantAuth, async (req, res) => {
  try {
    const merchant = req.merchant;
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: req.params.id,
        merchantId: merchant.id
      }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (subscription.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Only active subscriptions can be paused' });
    }

    const updated = await prisma.subscription.update({
      where: { id: req.params.id },
      data: { status: 'PAUSED' }
    });

    res.json({
      message: 'Subscription paused successfully',
      subscription: updated
    });
  } catch (error) {
    console.error('Pause subscription error:', error);
    res.status(500).json({ error: 'Failed to pause subscription' });
  }
});

/**
 * Resume subscription
 * POST /api/subscriptions/:id/resume
 */
router.post('/:id/resume', merchantAuth, async (req, res) => {
  try {
    const merchant = req.merchant;
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: req.params.id,
        merchantId: merchant.id
      }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (subscription.status !== 'PAUSED') {
      return res.status(400).json({ error: 'Only paused subscriptions can be resumed' });
    }

    // Recalculate next billing date
    const nextBilling = new Date();
    switch(subscription.interval) {
      case 'DAILY':
        nextBilling.setDate(nextBilling.getDate() + 1);
        break;
      case 'WEEKLY':
        nextBilling.setDate(nextBilling.getDate() + 7);
        break;
      case 'MONTHLY':
        nextBilling.setMonth(nextBilling.getMonth() + 1);
        break;
      case 'YEARLY':
        nextBilling.setFullYear(nextBilling.getFullYear() + 1);
        break;
    }

    const updated = await prisma.subscription.update({
      where: { id: req.params.id },
      data: { 
        status: 'ACTIVE',
        nextBilling
      }
    });

    res.json({
      message: 'Subscription resumed successfully',
      subscription: updated
    });
  } catch (error) {
    console.error('Resume subscription error:', error);
    res.status(500).json({ error: 'Failed to resume subscription' });
  }
});

/**
 * Cancel subscription
 * POST /api/subscriptions/:id/cancel
 */
router.post('/:id/cancel', merchantAuth, async (req, res) => {
  try {
    const merchant = req.merchant;
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: req.params.id,
        merchantId: merchant.id
      }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (subscription.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Subscription is already cancelled' });
    }

    const updated = await prisma.subscription.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' }
    });

    res.json({
      message: 'Subscription cancelled successfully',
      subscription: updated
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

/**
 * Process subscription billing (internal endpoint)
 * POST /api/subscriptions/process-billing
 */
router.post('/process-billing', auth, async (req, res) => {
  try {
    // Only allow admin or system
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get all active subscriptions due for billing
    const now = new Date();
    const dueSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        nextBilling: { lte: now }
      },
      include: {
        // Would need customer relation
      }
    });

    let processed = 0;
    let failed = 0;

    for (const subscription of dueSubscriptions) {
      try {
        // Create transaction for subscription payment
        const transaction = await prisma.transaction.create({
          data: {
            merchantId: subscription.merchantId,
            customerId: subscription.customerId,
            amount: subscription.amount,
            currency: subscription.currency,
            paymentMethod: 'SUBSCRIPTION',
            status: 'SUCCESSFUL',
            description: `Subscription payment - ${subscription.interval}`,
            reference: `SUB_${subscription.id}_${Date.now()}`,
            metadata: JSON.stringify({ subscriptionId: subscription.id })
          }
        });

        // Update subscription next billing date
        const nextBilling = new Date(subscription.nextBilling);
        switch(subscription.interval) {
          case 'DAILY':
            nextBilling.setDate(nextBilling.getDate() + 1);
            break;
          case 'WEEKLY':
            nextBilling.setDate(nextBilling.getDate() + 7);
            break;
          case 'MONTHLY':
            nextBilling.setMonth(nextBilling.getMonth() + 1);
            break;
          case 'YEARLY':
            nextBilling.setFullYear(nextBilling.getFullYear() + 1);
            break;
        }

        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            nextBilling,
            lastPayment: now
          }
        });

        processed++;
      } catch (error) {
        console.error(`Failed to process subscription ${subscription.id}:`, error);
        failed++;
      }
    }

    res.json({
      message: 'Billing processed',
      processed,
      failed,
      total: dueSubscriptions.length
    });
  } catch (error) {
    console.error('Process billing error:', error);
    res.status(500).json({ error: 'Failed to process billing' });
  }
});

module.exports = router;
