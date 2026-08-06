const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { auth, customerAuth } = require('../middleware/auth');

/**
 * Process one-click payment using saved payment method
 * POST /api/quick-payments
 */
router.post('/', customerAuth, async (req, res) => {
  try {
    const { merchantId, amount, currency = 'SLE', paymentMethodId, description } = req.body;
    const customer = req.customer;

    if (!merchantId || !amount || !paymentMethodId) {
      return res.status(400).json({ error: 'Merchant ID, amount, and payment method ID are required' });
    }

    // Verify payment method belongs to customer
    const paymentMethod = await prisma.customerPaymentMethod.findFirst({
      where: {
        id: paymentMethodId,
        customerId: customer.id
      }
    });

    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    // Check customer balance
    if (customer.balance < parseFloat(amount)) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Get merchant
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId }
    });

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    // Process payment
    const transaction = await prisma.transaction.create({
      data: {
        merchantId,
        customerId: customer.id,
        amount: parseFloat(amount),
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
      }
    });

    // Update customer balance
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        balance: { decrement: parseFloat(amount) }
      }
    });

    // Update merchant balance
    await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        balance: { increment: parseFloat(amount) }
      }
    });

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
    const customer = req.customer;

    const transactions = await prisma.transaction.findMany({
      where: {
        customerId: customer.id,
        metadata: {
          contains: '"quickPayment":true'
        }
      },
      include: {
        merchant: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ transactions });
  } catch (error) {
    console.error('Get quick payment history error:', error);
    res.status(500).json({ error: 'Failed to get quick payment history' });
  }
});

module.exports = router;
