const express = require('express');
const { customerAuth } = require('../middleware/auth');
const prisma = require('../db/index');

const router = express.Router();

// Get customer support tickets
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

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.supportTicket.count({ where })
    ]);

    res.json({
      tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get support tickets error:', error);
    res.status(500).json({ error: 'Failed to get support tickets' });
  }
});

// Create support ticket
router.post('/', customerAuth, async (req, res) => {
  try {
    const { subject, message, priority } = req.body;
    const customer = await prisma.customer.findUnique({
      where: { userId: req.user.id }
    });

    const ticket = await prisma.supportTicket.create({
      data: {
        customerId: customer.id,
        subject,
        message,
        priority: priority || 'MEDIUM',
        status: 'OPEN'
      }
    });

    res.json(ticket);
  } catch (error) {
    console.error('Create support ticket error:', error);
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
});

module.exports = router;
