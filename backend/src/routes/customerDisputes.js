const express = require('express');
const { customerAuth } = require('../middleware/auth');
const prisma = require('../lib/prisma');

const router = express.Router();

// Get customer disputes
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

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.dispute.count({ where })
    ]);

    res.json({
      disputes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get customer disputes error:', error);
    res.status(500).json({ error: 'Failed to get disputes' });
  }
});

// Create dispute
router.post('/', customerAuth, async (req, res) => {
  try {
    const { transactionId, transferId, title, description } = req.body;
    const customer = await prisma.customer.findUnique({
      where: { userId: req.user.id }
    });

    const dispute = await prisma.dispute.create({
      data: {
        customerId: customer.id,
        transactionId,
        transferId,
        title,
        description,
        status: 'OPEN'
      }
    });

    res.json(dispute);
  } catch (error) {
    console.error('Create dispute error:', error);
    res.status(500).json({ error: 'Failed to create dispute' });
  }
});

module.exports = router;
