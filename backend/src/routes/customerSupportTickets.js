const express = require('express');
const { customerAuth } = require('../middleware/auth');
const db = require('../db/index');
const { eq, desc, and } = require('drizzle-orm');
const { customers, supportTickets } = require('../db/schema');

const router = express.Router();

// Get customer support tickets
router.get('/', customerAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    
    const customerResult = await db.select()
      .from(customers)
      .where(eq(customers.userId, req.user.id))
      .limit(1);
    
    const customer = customerResult[0];

    let whereCondition = eq(supportTickets.customerId, customer.id);
    if (status) {
      whereCondition = and(eq(supportTickets.customerId, customer.id), eq(supportTickets.status, status));
    }

    const ticketsResult = await db.select()
      .from(supportTickets)
      .where(whereCondition)
      .orderBy(desc(supportTickets.createdAt))
      .limit(parseInt(limit))
      .offset(offset);

    const totalResult = await db.select()
      .from(supportTickets)
      .where(whereCondition);
    
    const total = totalResult.length;

    res.json({
      tickets: ticketsResult,
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
    const customerResult = await db.select()
      .from(customers)
      .where(eq(customers.userId, req.user.id))
      .limit(1);
    
    const customer = customerResult[0];

    const ticketResult = await db.insert(supportTickets).values({
      customerId: customer.id,
      subject,
      message,
      priority: priority || 'MEDIUM',
      status: 'OPEN'
    }).returning();
    
    const ticket = ticketResult[0];

    res.json(ticket);
  } catch (error) {
    console.error('Create support ticket error:', error);
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
});

module.exports = router;
