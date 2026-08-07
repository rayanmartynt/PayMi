const express = require('express');
const router = express.Router();
const db = require('../db/index');
const { eq, desc, and, lte } = require('drizzle-orm');
const { merchants, transactions, subscriptions } = require('../db/schema');
const { auth, merchantAuth } = require('../middleware/auth');

/**
 * Create a subscription
 * POST /api/subscriptions
 */
router.post('/', merchantAuth, async (req, res) => {
  try {
    const { customerId, amount, currency = 'SLE', interval, metadata } = req.body;
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

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

    const subscriptionResult = await db.insert(subscriptions).values({
      merchantId: merchant.id,
      customerId,
      amount: parseFloat(amount).toString(),
      currency,
      interval,
      nextBilling,
      metadata: metadata ? JSON.stringify(metadata) : null
    }).returning();
    
    const subscription = subscriptionResult[0];

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
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const { status } = req.query;

    let whereCondition = eq(subscriptions.merchantId, merchant.id);
    if (status) {
      whereCondition = and(eq(subscriptions.merchantId, merchant.id), eq(subscriptions.status, status));
    }

    const subscriptionsResult = await db.select()
      .from(subscriptions)
      .where(whereCondition)
      .orderBy(desc(subscriptions.createdAt));

    res.json({ subscriptions: subscriptionsResult });
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
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const subscriptionResult = await db.select()
      .from(subscriptions)
      .where(and(eq(subscriptions.id, req.params.id), eq(subscriptions.merchantId, merchant.id)))
      .limit(1);
    
    const subscription = subscriptionResult[0];

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
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const subscriptionResult = await db.select()
      .from(subscriptions)
      .where(and(eq(subscriptions.id, req.params.id), eq(subscriptions.merchantId, merchant.id)))
      .limit(1);
    
    const subscription = subscriptionResult[0];

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (subscription.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Only active subscriptions can be paused' });
    }

    const updatedResult = await db.update(subscriptions)
      .set({ status: 'PAUSED' })
      .where(eq(subscriptions.id, req.params.id))
      .returning();
    
    const updated = updatedResult[0];

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
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const subscriptionResult = await db.select()
      .from(subscriptions)
      .where(and(eq(subscriptions.id, req.params.id), eq(subscriptions.merchantId, merchant.id)))
      .limit(1);
    
    const subscription = subscriptionResult[0];

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

    const updatedResult = await db.update(subscriptions)
      .set({ 
        status: 'ACTIVE',
        nextBilling
      })
      .where(eq(subscriptions.id, req.params.id))
      .returning();
    
    const updated = updatedResult[0];

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
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const subscriptionResult = await db.select()
      .from(subscriptions)
      .where(and(eq(subscriptions.id, req.params.id), eq(subscriptions.merchantId, merchant.id)))
      .limit(1);
    
    const subscription = subscriptionResult[0];

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (subscription.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Subscription is already cancelled' });
    }

    const updatedResult = await db.update(subscriptions)
      .set({ status: 'CANCELLED' })
      .where(eq(subscriptions.id, req.params.id))
      .returning();
    
    const updated = updatedResult[0];

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
    const dueSubscriptionsResult = await db.select()
      .from(subscriptions)
      .where(and(eq(subscriptions.status, 'ACTIVE'), lte(subscriptions.nextBilling, now)));

    let processed = 0;
    let failed = 0;

    for (const subscription of dueSubscriptionsResult) {
      try {
        // Create transaction for subscription payment
        const transactionResult = await db.insert(transactions).values({
          merchantId: subscription.merchantId,
          customerId: subscription.customerId,
          amount: subscription.amount,
          currency: subscription.currency,
          paymentMethod: 'SUBSCRIPTION',
          status: 'SUCCESSFUL',
          description: `Subscription payment - ${subscription.interval}`,
          reference: `SUB_${subscription.id}_${Date.now()}`,
          metadata: JSON.stringify({ subscriptionId: subscription.id })
        }).returning();
        
        const transaction = transactionResult[0];

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

        await db.update(subscriptions)
          .set({
            nextBilling,
            lastPayment: now
          })
          .where(eq(subscriptions.id, subscription.id));

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
      total: dueSubscriptionsResult.length
    });
  } catch (error) {
    console.error('Process billing error:', error);
    res.status(500).json({ error: 'Failed to process billing' });
  }
});

module.exports = router;
