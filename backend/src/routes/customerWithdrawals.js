const express = require('express');
const { customerAuth, requireFullVerification } = require('../middleware/auth');
const db = require('../db/index');
const { eq, desc, and } = require('drizzle-orm');
const { customers, customerWithdrawals } = require('../db/schema');

const router = express.Router();

// Get customer withdrawals
router.get('/', customerAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    
    const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
    const customer = customerResult[0];

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const conditions = status 
      ? and(eq(customerWithdrawals.customerId, customer.id), eq(customerWithdrawals.status, status))
      : eq(customerWithdrawals.customerId, customer.id);

    const withdrawalsResult = await db.select()
      .from(customerWithdrawals)
      .where(conditions)
      .orderBy(desc(customerWithdrawals.createdAt))
      .limit(parseInt(limit))
      .offset(offset);

    // Count total
    const countResult = await db.select({ count: customerWithdrawals.id })
      .from(customerWithdrawals)
      .where(conditions);
    const total = countResult.length;

    res.json({
      withdrawals: withdrawalsResult,
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
router.post('/', customerAuth, requireFullVerification, async (req, res) => {
  try {
    const { amount, mobileMoneyProvider, mobileNumber } = req.body;
    
    const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
    const customer = customerResult[0];

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check KYC status
    if (!customer.kycVerified) {
      return res.status(403).json({ error: 'KYC verification required. Please complete your identity verification to withdraw funds.' });
    }

    // Calculate fee (3% for customer withdrawals)
    const fee = amount * 0.03;
    const totalDeduction = amount + fee;

    if (parseFloat(customer.balance) < totalDeduction) {
      return res.status(400).json({ error: `Insufficient balance. Amount: ${amount}, Fee: ${fee}, Total required: ${totalDeduction}` });
    }

    const withdrawalResult = await db.insert(customerWithdrawals).values({
      customerId: customer.id,
      amount: amount.toString(),
      fee: fee.toString(),
      currency: 'SLE',
      mobileMoneyProvider,
      mobileNumber,
      status: 'PENDING'
    }).returning();

    res.json(withdrawalResult[0]);
  } catch (error) {
    console.error('Create withdrawal error:', error);
    res.status(500).json({ error: 'Failed to create withdrawal' });
  }
});

module.exports = router;
