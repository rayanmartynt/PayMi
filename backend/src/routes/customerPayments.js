const express = require('express');
const { customerAuth } = require('../middleware/auth');
const prisma = require('../db/index');

const router = express.Router();

// Get customer payments
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

    const [payments, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          merchant: { include: { user: true } }
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.transaction.count({ where })
    ]);

    res.json({
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get customer payments error:', error);
    res.status(500).json({ error: 'Failed to get payments' });
  }
});

module.exports = router;
