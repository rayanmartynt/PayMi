const express = require('express');
const { customerAuth } = require('../middleware/auth');
const prisma = require('../lib/prisma');

const router = express.Router();

// Get customer withdrawals
router.get('/', customerAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;
    
    const customer = await prisma.customer.findUnique({
      where: { userId: req.user.id }
    });

    const where = {
      customerId: customer.id,
      ...(status ? { status } : {})
    };

    const [withdrawals, total] = await Promise.all([
      prisma.customerWithdrawal.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.customerWithdrawal.count({ where })
    ]);

    res.json({
      withdrawals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get customer withdrawals error:', error);
    res.status(500).json({ error: 'Failed to get withdrawals' });
  }
});

// Create withdrawal request
router.post('/', customerAuth, async (req, res) => {
  try {
    const { amount, mobileMoneyProvider, mobileNumber } = req.body;
    const customer = await prisma.customer.findUnique({
      where: { userId: req.user.id }
    });

    if (customer.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const withdrawal = await prisma.customerWithdrawal.create({
      data: {
        customerId: customer.id,
        amount,
        currency: 'SLE',
        mobileMoneyProvider,
        mobileNumber,
        status: 'PENDING'
      }
    });

    res.json(withdrawal);
  } catch (error) {
    console.error('Create withdrawal error:', error);
    res.status(500).json({ error: 'Failed to create withdrawal' });
  }
});

module.exports = router;
