const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
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
    const merchant = await prisma.merchant.findFirst({
      where: { userId: req.user.id }
    });

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    // Create simulated transaction
    const transaction = await prisma.transaction.create({
      data: {
        merchantId: merchant.id,
        amount: parseFloat(amount),
        currency,
        paymentMethod,
        status: 'SUCCESSFUL',
        description: description || 'Sandbox test payment',
        reference: `TEST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: JSON.stringify({ sandbox: true, test: true })
      }
    });

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
    const user = await prisma.user.create({
      data: {
        email: email || `test_customer_${Date.now()}@sandbox.com`,
        password: await bcrypt.hash('Test123456', 10),
        name: name || 'Test Customer',
        role: 'CUSTOMER',
        verified: true
      }
    });

    // Create customer profile
    const customer = await prisma.customer.create({
      data: {
        userId: user.id,
        name: name || 'Test Customer',
        phone: phone || `+232${Math.floor(Math.random() * 90000000) + 10000000}`,
        balance: 10000.00 // Give test customer some balance
      }
    });

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
    await prisma.transaction.deleteMany({
      where: {
        metadata: {
          contains: '"sandbox":true'
        }
      }
    });

    // Delete test customers created in sandbox
    const testUsers = await prisma.user.findMany({
      where: {
        email: {
          contains: '@sandbox.com'
        }
      }
    });

    for (const user of testUsers) {
      await prisma.customer.deleteMany({
        where: { userId: user.id }
      });
      await prisma.user.delete({
        where: { id: user.id }
      });
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
    const testTransactions = await prisma.transaction.findMany({
      where: {
        metadata: {
          contains: '"sandbox":true'
        }
      },
      take: 50,
      orderBy: { createdAt: 'desc' }
    });

    // Get test customers
    const testCustomers = await prisma.user.findMany({
      where: {
        email: {
          contains: '@sandbox.com'
        }
      },
      include: {
        customer: true
      },
      take: 50
    });

    res.json({
      transactions: testTransactions,
      customers: testCustomers,
      sandbox: true
    });
  } catch (error) {
    console.error('Get test data error:', error);
    res.status(500).json({ error: 'Failed to get test data' });
  }
});

module.exports = router;
