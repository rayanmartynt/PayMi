const express = require('express');
const { customerAuth } = require('../middleware/auth');
const db = require('../db/index');
const { eq, desc, and } = require('drizzle-orm');
const { customers, transactions, merchants, users } = require('../db/schema');

const router = express.Router();

// Get customer payments
router.get('/', customerAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    
    const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
    const customer = customerResult[0];

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    let whereCondition = eq(transactions.customerId, customer.id);
    if (status) {
      whereCondition = and(eq(transactions.customerId, customer.id), eq(transactions.status, status));
    }

    const paymentsResult = await db.select()
      .from(transactions)
      .where(whereCondition)
      .orderBy(desc(transactions.createdAt))
      .limit(parseInt(limit))
      .offset(offset);

    const total = paymentsResult.length;

    res.json({
      payments: paymentsResult,
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
