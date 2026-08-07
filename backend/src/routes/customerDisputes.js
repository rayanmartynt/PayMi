const express = require('express');
const { customerAuth } = require('../middleware/auth');
const db = require('../db/index');
const { eq, desc, and } = require('drizzle-orm');
const { customers, disputes } = require('../db/schema');

const router = express.Router();

// Get customer disputes
router.get('/', customerAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    
    const customerResult = await db.select()
      .from(customers)
      .where(eq(customers.userId, req.user.id))
      .limit(1);
    
    const customer = customerResult[0];

    let whereCondition = eq(disputes.customerId, customer.id);
    if (status) {
      whereCondition = and(eq(disputes.customerId, customer.id), eq(disputes.status, status));
    }

    const disputesResult = await db.select()
      .from(disputes)
      .where(whereCondition)
      .orderBy(desc(disputes.createdAt))
      .limit(parseInt(limit))
      .offset(offset);

    const totalResult = await db.select()
      .from(disputes)
      .where(whereCondition);
    
    const total = totalResult.length;

    res.json({
      disputes: disputesResult,
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
    const customerResult = await db.select()
      .from(customers)
      .where(eq(customers.userId, req.user.id))
      .limit(1);
    
    const customer = customerResult[0];

    const disputeResult = await db.insert(disputes).values({
      customerId: customer.id,
      transactionId,
      transferId,
      title,
      description,
      status: 'OPEN'
    }).returning();
    
    const dispute = disputeResult[0];

    res.json(dispute);
  } catch (error) {
    console.error('Create dispute error:', error);
    res.status(500).json({ error: 'Failed to create dispute' });
  }
});

module.exports = router;
