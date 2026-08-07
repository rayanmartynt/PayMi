const express = require('express');
const { auth, merchantAuth, customerAuth } = require('../middleware/auth');
const prisma = require('../db/index');

const router = express.Router();

// Get all transactions for a merchant
router.get('/merchant', merchantAuth, async (req, res) => {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { userId: req.user.id }
    });

    const transactions = await prisma.transaction.findMany({
      where: { merchantId: merchant.id },
      include: {
        customer: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(transactions);
  } catch (error) {
    console.error('Get merchant transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

// Get all transactions for a customer
router.get('/customer', customerAuth, async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { userId: req.user.id }
    });

    const transactions = await prisma.transaction.findMany({
      where: { customerId: customer.id },
      include: {
        merchant: {
          include: {
            user: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(transactions);
  } catch (error) {
    console.error('Get customer transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

// Get single transaction by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: {
        merchant: {
          include: {
            user: true
          }
        },
        customer: {
          include: {
            user: true
          }
        }
      }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Check if user has access to this transaction
    if (req.user.role === 'MERCHANT' && transaction.merchantId !== req.user.merchant.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (req.user.role === 'CUSTOMER' && transaction.customerId !== req.user.customer.id) {
      return res.status(403).json({ error: 'Access denied' });
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
    const merchant = await prisma.merchant.findUnique({
      where: { userId: req.user.id }
    });

    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.merchantId !== merchant.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (transaction.status !== 'SUCCESSFUL') {
      return res.status(400).json({ error: 'Can only refund successful transactions' });
    }

    const refund = await prisma.refund.create({
      data: {
        transactionId: transaction.id,
        amount: transaction.amount,
        reason,
        status: 'PENDING'
      }
    });

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
