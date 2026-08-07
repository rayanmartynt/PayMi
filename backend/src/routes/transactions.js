const express = require('express');
const { auth, merchantAuth, customerAuth } = require('../middleware/auth');
const db = require('../db/index');
const { eq, desc } = require('drizzle-orm');
const { merchants, customers, transactions, refunds } = require('../db/schema');

const router = express.Router();

// Get all transactions for a merchant
router.get('/merchant', merchantAuth, async (req, res) => {
  try {
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const transactionsResult = await db.select()
      .from(transactions)
      .where(eq(transactions.merchantId, merchant.id))
      .orderBy(desc(transactions.createdAt));

    res.json(transactionsResult);
  } catch (error) {
    console.error('Get merchant transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

// Get all transactions for a customer
router.get('/customer', customerAuth, async (req, res) => {
  try {
    const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
    const customer = customerResult[0];

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const transactionsResult = await db.select()
      .from(transactions)
      .where(eq(transactions.customerId, customer.id))
      .orderBy(desc(transactions.createdAt));

    res.json(transactionsResult);
  } catch (error) {
    console.error('Get customer transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

// Get single transaction by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const transactionResult = await db.select().from(transactions).where(eq(transactions.id, req.params.id)).limit(1);
    const transaction = transactionResult[0];

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Check if user has access to this transaction
    if (req.user.role === 'MERCHANT') {
      const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
      const merchant = merchantResult[0];
      if (transaction.merchantId !== merchant.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    if (req.user.role === 'CUSTOMER') {
      const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
      const customer = customerResult[0];
      if (transaction.customerId !== customer.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json(transaction);
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: 'Failed to get transaction' });
  }
});

// Create refund
router.post('/:id/refund', merchantAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const transactionResult = await db.select().from(transactions).where(eq(transactions.id, req.params.id)).limit(1);
    const transaction = transactionResult[0];

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.merchantId !== merchant.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (transaction.status !== 'SUCCESSFUL') {
      return res.status(400).json({ error: 'Can only refund successful transactions' });
    }

    const refundResult = await db.insert(refunds).values({
      transactionId: transaction.id,
      amount: transaction.amount,
      reason,
      status: 'PENDING'
    }).returning();
    
    const refund = refundResult[0];

    // Notify customer about refund
    if (global.io && transaction.customerId) {
      global.io.to(transaction.customerId).emit('refund_initiated', {
        transactionId: transaction.id,
        amount: transaction.amount,
        reason
      });
    }

    res.json(refund);
  } catch (error) {
    console.error('Create refund error:', error);
    res.status(500).json({ error: 'Failed to create refund' });
  }
});

module.exports = router;
