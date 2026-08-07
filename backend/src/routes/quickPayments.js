const express = require('express');
const router = express.Router();
const db = require('../db/index');
const { eq, desc, and, like } = require('drizzle-orm');
const { customers, merchants, transactions, paymentMethods } = require('../db/schema');
const { auth, customerAuth } = require('../middleware/auth');

/**
 * Process one-click payment using saved payment method
 * POST /api/quick-payments
 */
router.post('/', customerAuth, async (req, res) => {
  try {
    const { merchantId, amount, currency = 'SLE', paymentMethodId, description } = req.body;
    const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
    const customer = customerResult[0];

    if (!merchantId || !amount || !paymentMethodId) {
      return res.status(400).json({ error: 'Merchant ID, amount, and payment method ID are required' });
    }

    // Verify payment method belongs to customer
    const paymentMethodResult = await db.select()
      .from(paymentMethods)
      .where(and(eq(paymentMethods.id, paymentMethodId), eq(paymentMethods.customerId, customer.id)))
      .limit(1);
    
    const paymentMethod = paymentMethodResult[0];

    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    // Check customer balance
    if (parseFloat(customer.balance) < parseFloat(amount)) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Get merchant
    const merchantResult = await db.select()
      .from(merchants)
      .where(eq(merchants.id, merchantId))
      .limit(1);
    
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    // Process payment
    const transactionResult = await db.insert(transactions).values({
      merchantId,
      customerId: customer.id,
      amount: parseFloat(amount).toString(),
      currency,
      paymentMethod: paymentMethod.provider,
      status: 'SUCCESSFUL',
      description: description || 'Quick payment',
      reference: `QUICK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metadata: JSON.stringify({
        quickPayment: true,
        paymentMethodId,
        paymentMethodLast4: paymentMethod.last4
      })
    }).returning();
    
    const transaction = transactionResult[0];

    // Update customer balance
    const newCustomerBalance = parseFloat(customer.balance) - parseFloat(amount);
    await db.update(customers)
      .set({ balance: newCustomerBalance.toString() })
      .where(eq(customers.id, customer.id));

    // Update merchant balance
    const newMerchantBalance = parseFloat(merchant.balance) + parseFloat(amount);
    await db.update(merchants)
      .set({ balance: newMerchantBalance.toString() })
      .where(eq(merchants.id, merchantId));

    // Emit socket notifications
    if (global.io) {
      global.io.to(customer.id).emit('payment', {
        type: 'quick_payment',
        transaction
      });
      global.io.to(merchantId).emit('payment', {
        type: 'received',
        transaction
      });
    }

    res.status(201).json({
      message: 'Quick payment processed successfully',
      transaction
    });
  } catch (error) {
    console.error('Quick payment error:', error);
    res.status(500).json({ error: 'Failed to process quick payment' });
  }
});

/**
 * Get quick payment history
 * GET /api/quick-payments/history
 */
router.get('/history', customerAuth, async (req, res) => {
  try {
    const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
    const customer = customerResult[0];

    const transactionsResult = await db.select()
      .from(transactions)
      .where(and(eq(transactions.customerId, customer.id), like(transactions.metadata, '%"quickPayment":true%')))
      .orderBy(desc(transactions.createdAt));

    // Manually join merchant data
    const transactionsWithMerchant = await Promise.all(
      transactionsResult.map(async (transaction) => {
        const merchantResult = await db.select()
          .from(merchants)
          .where(eq(merchants.id, transaction.merchantId))
          .limit(1);
        
        return {
          ...transaction,
          merchant: merchantResult[0] || null
        };
      })
    );

    res.json({ transactions: transactionsWithMerchant });
  } catch (error) {
    console.error('Get quick payment history error:', error);
    res.status(500).json({ error: 'Failed to get quick payment history' });
  }
});

module.exports = router;
