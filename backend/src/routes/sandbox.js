const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db/index');
const { eq, desc, like } = require('drizzle-orm');
const { users, merchants, customers, transactions } = require('../db/schema');
const { requireSandbox } = require('../middleware/sandbox');
const { auth } = require('../middleware/auth');

/**
 * Get sandbox status
 * GET /api/sandbox/status
 */
router.get('/status', (req, res) => {
  res.json({
    sandboxMode: req.isSandbox,
    testMerchantId: process.env.SANDBOX_MERCHANT_ID || 'test_merchant_123'
  });
});

/**
 * Create a test payment (sandbox only)
 * POST /api/sandbox/test-payment
 */
router.post('/test-payment', (req, res, next) => requireSandbox(req, res, next), auth, async (req, res) => {
  try {
    const { amount, currency = 'SLE', paymentMethod, description } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    if (!paymentMethod) {
      return res.status(400).json({ error: 'Payment method is required' });
    }

    // Get merchant from user
    const merchantResult = await db.select()
      .from(merchants)
      .where(eq(merchants.userId, req.user.id))
      .limit(1);
    
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    // Create simulated transaction
    const transactionResult = await db.insert(transactions).values({
      merchantId: merchant.id,
      amount: parseFloat(amount).toString(),
      currency,
      paymentMethod,
      status: 'SUCCESSFUL',
      description: description || 'Sandbox test payment',
      reference: `TEST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metadata: JSON.stringify({ sandbox: true, test: true })
    }).returning();
    
    const transaction = transactionResult[0];

    // Emit socket notification
    if (global.io) {
      global.io.to(req.user.id).emit('transaction', {
        type: 'payment',
        transaction
      });
    }

    res.json({
      message: 'Test payment created successfully',
      transaction,
      sandbox: true
    });
  } catch (error) {
    console.error('Test payment error:', error);
    res.status(500).json({ error: 'Failed to create test payment' });
  }
});

/**
 * Create a test customer (sandbox only)
 * POST /api/sandbox/test-customer
 */
router.post('/test-customer', requireSandbox, auth, async (req, res) => {
  try {
    const { name, phone, email } = req.body;

    // Create test user
    const userResult = await db.insert(users).values({
      email: email || `test_customer_${Date.now()}@sandbox.com`,
      password: await bcrypt.hash('Test123456', 10),
      name: name || 'Test Customer',
      role: 'CUSTOMER',
      verified: true
    }).returning();
    
    const user = userResult[0];

    // Create customer profile
    const customerResult = await db.insert(customers).values({
      userId: user.id,
      name: name || 'Test Customer',
      phone: phone || `+232${Math.floor(Math.random() * 90000000) + 10000000}`,
      balance: '10000.00' // Give test customer some balance
    }).returning();
    
    const customer = customerResult[0];

    res.json({
      message: 'Test customer created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      customer,
      sandbox: true
    });
  } catch (error) {
    console.error('Test customer error:', error);
    res.status(500).json({ error: 'Failed to create test customer' });
  }
});

/**
 * Reset sandbox data (sandbox only)
 * DELETE /api/sandbox/reset
 */
router.delete('/reset', requireSandbox, auth, async (req, res) => {
  try {
    // Only allow admin to reset sandbox
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can reset sandbox' });
    }

    // Delete all test transactions (those with sandbox metadata)
    const testTransactionsResult = await db.select()
      .from(transactions)
      .where(like(transactions.metadata, '%"sandbox":true%'));
    
    for (const transaction of testTransactionsResult) {
      await db.delete(transactions).where(eq(transactions.id, transaction.id));
    }

    // Delete test customers created in sandbox
    const testUsersResult = await db.select()
      .from(users)
      .where(like(users.email, '%@sandbox.com'));

    for (const user of testUsersResult) {
      await db.delete(customers).where(eq(customers.userId, user.id));
      await db.delete(users).where(eq(users.id, user.id));
    }

    res.json({
      message: 'Sandbox data reset successfully',
      sandbox: true
    });
  } catch (error) {
    console.error('Sandbox reset error:', error);
    res.status(500).json({ error: 'Failed to reset sandbox' });
  }
});

/**
 * Get sandbox test data (sandbox only)
 * GET /api/sandbox/test-data
 */
router.get('/test-data', requireSandbox, auth, async (req, res) => {
  try {
    // Get test transactions
    const testTransactionsResult = await db.select()
      .from(transactions)
      .where(like(transactions.metadata, '%"sandbox":true%'))
      .orderBy(desc(transactions.createdAt))
      .limit(50);

    // Get test customers
    const testUsersResult = await db.select()
      .from(users)
      .where(like(users.email, '%@sandbox.com'))
      .limit(50);

    // Manually join customer data
    const testCustomers = await Promise.all(
      testUsersResult.map(async (user) => {
        const customerResult = await db.select()
          .from(customers)
          .where(eq(customers.userId, user.id))
          .limit(1);
        
        return {
          ...user,
          customer: customerResult[0] || null
        };
      })
    );

    res.json({
      transactions: testTransactionsResult,
      customers: testCustomers,
      sandbox: true
    });
  } catch (error) {
    console.error('Get test data error:', error);
    res.status(500).json({ error: 'Failed to get test data' });
  }
});

module.exports = router;
