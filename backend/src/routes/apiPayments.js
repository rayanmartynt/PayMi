const express = require('express');
const { apiKeyAuth, requirePermission } = require('../middleware/apiKeyAuth');
const db = require('../db/index');
const { eq } = require('drizzle-orm');
const { transactions, customers, adminFees, webhooks } = require('../db/schema');
const crypto = require('crypto');

const router = express.Router();

// Create payment via API (public endpoint with API key auth)
router.post('/create-payment', apiKeyAuth, requirePermission('payments'), async (req, res) => {
  try {
    const { amount, currency = 'SLE', customerEmail, customerName, description, metadata, returnUrl, cancelUrl } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    if (parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    // Generate transaction reference
    const transactionReference = `PAY-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;

    // Create transaction record
    const transaction = await db.insert(transactions).values({
      merchantId: req.merchant.id,
      amount: amount.toString(),
      currency,
      status: 'PENDING',
      paymentMethod: 'API',
      paymentGateway: 'PAYMI',
      transactionReference,
      description: description || 'API Payment',
      metadata: metadata ? JSON.stringify(metadata) : null
    }).returning();

    // Calculate fee (2.5% for API payments)
    const fee = amount * 0.025;

    // Record admin fee
    await db.insert(adminFees).values({
      type: 'PAYMENT_FEE',
      amount: amount.toString(),
      fee: fee.toString(),
      currency,
      referenceId: transaction[0].id
    });

    res.json({
      success: true,
      transaction: {
        id: transaction[0].id,
        reference: transactionReference,
        amount: amount.toString(),
        currency,
        status: 'PENDING',
        createdAt: transaction[0].createdAt
      },
      paymentUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/${transactionReference}`,
      checkoutUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/checkout/${transactionReference}`
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Get payment status
router.get('/payment/:reference', apiKeyAuth, requirePermission('payments'), async (req, res) => {
  try {
    const { reference } = req.params;

    const transactionResult = await db.select().from(transactions).where(eq(transactions.transactionReference, reference)).limit(1);
    const transaction = transactionResult[0];

    if (!transaction) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (transaction.merchantId !== req.merchant.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      payment: {
        id: transaction.id,
        reference: transaction.transactionReference,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        paymentMethod: transaction.paymentMethod,
        description: transaction.description,
        metadata: transaction.metadata ? JSON.parse(transaction.metadata) : null,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt
      }
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ error: 'Failed to get payment' });
  }
});

// Complete payment (called from frontend after customer payment)
router.post('/payment/:reference/complete', apiKeyAuth, requirePermission('payments'), async (req, res) => {
  try {
    const { reference } = req.params;
    const { customerId, paymentMethod } = req.body;

    const transactionResult = await db.select().from(transactions).where(eq(transactions.transactionReference, reference)).limit(1);
    const transaction = transactionResult[0];

    if (!transaction) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (transaction.merchantId !== req.merchant.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (transaction.status !== 'PENDING') {
      return res.status(400).json({ error: 'Payment is not in pending state' });
    }

    // Get customer
    const customerResult = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
    const customer = customerResult[0];

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check balance
    if (parseFloat(customer.balance) < parseFloat(transaction.amount)) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Deduct from customer
    await db.update(customers)
      .set({ balance: (parseFloat(customer.balance) - parseFloat(transaction.amount)).toString() })
      .where(eq(customers.id, customerId));

    // Add to merchant
    await db.update(req.merchant)
      .set({ balance: (parseFloat(req.merchant.balance) + parseFloat(transaction.amount)).toString() })
      .where(eq(req.merchant.id, req.merchant.id));

    // Update transaction status
    const updatedTransaction = await db.update(transactions)
      .set({ 
        status: 'COMPLETED',
        customerId,
        paymentMethod,
        updatedAt: new Date()
      })
      .where(eq(transactions.id, transaction.id))
      .returning();

    // Trigger webhook if configured
    await triggerWebhook(req.merchant.id, 'payment.completed', updatedTransaction[0]);

    res.json({
      success: true,
      payment: updatedTransaction[0]
    });
  } catch (error) {
    console.error('Complete payment error:', error);
    res.status(500).json({ error: 'Failed to complete payment' });
  }
});

// Webhook trigger function
async function triggerWebhook(merchantId, event, data) {
  try {
    const webhookResult = await db.select().from(webhooks).where(eq(webhooks.merchantId, merchantId)).limit(1);
    const webhook = webhookResult[0];

    if (!webhook || !webhook.isActive) {
      return;
    }

    const events = JSON.parse(webhook.events || '[]');
    if (!events.includes(event)) {
      return;
    }

    // Generate signature
    const payload = JSON.stringify(data);
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(payload)
      .digest('hex');

    // Send webhook
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-PayMi-Signature': signature,
        'X-PayMi-Event': event
      },
      body: payload
    });

    // Update last triggered timestamp
    await db.update(webhooks)
      .set({ lastTriggeredAt: new Date() })
      .where(eq(webhooks.id, webhook.id));

    console.log(`Webhook triggered for event ${event}:`, response.status);
  } catch (error) {
    console.error('Webhook trigger error:', error);
  }
}

module.exports = router;
