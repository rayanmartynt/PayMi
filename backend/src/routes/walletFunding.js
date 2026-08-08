const express = require('express');
const { customerAuth, requireFullVerification } = require('../middleware/auth');
const db = require('../db/index');
const { eq, and, desc } = require('drizzle-orm');
const { customers, walletFunding } = require('../db/schema');

const router = express.Router();

// Create wallet funding request
router.post('/', customerAuth, requireFullVerification, async (req, res) => {
  try {
    const { amount, provider, phoneNumber } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    if (!provider) {
      return res.status(400).json({ error: 'Provider is required' });
    }

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Validate provider
    const validProviders = ['ORANGE_MONEY', 'QMONEY', 'AFRI_MONEY'];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Generate reference
    const reference = `WAL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create funding request
    const funding = await db.insert(walletFunding).values({
      customerId: req.customer.id,
      amount: amount.toString(),
      currency: 'SLE',
      provider,
      phoneNumber,
      reference,
      status: 'PENDING'
    }).returning();

    res.json({
      message: 'Wallet funding request created',
      funding: funding[0]
    });
  } catch (error) {
    console.error('Create wallet funding error:', error);
    res.status(500).json({ error: 'Failed to create funding request' });
  }
});

// Get customer wallet funding history
router.get('/', customerAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let conditions = eq(walletFunding.customerId, req.customer.id);
    if (status) {
      conditions = and(conditions, eq(walletFunding.status, status));
    }

    const fundingResult = await db.select()
      .from(walletFunding)
      .where(conditions)
      .orderBy(desc(walletFunding.createdAt))
      .limit(parseInt(limit))
      .offset(offset);

    // Count total
    const countResult = await db.select({ count: walletFunding.id })
      .from(walletFunding)
      .where(conditions);
    const total = countResult.length;

    res.json({
      funding: fundingResult,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get wallet funding error:', error);
    res.status(500).json({ error: 'Failed to get funding history' });
  }
});

// Get specific funding request
router.get('/:id', customerAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const fundingResult = await db.select()
      .from(walletFunding)
      .where(eq(walletFunding.id, id))
      .limit(1);

    const funding = fundingResult[0];

    if (!funding) {
      return res.status(404).json({ error: 'Funding request not found' });
    }

    // Verify ownership
    if (funding.customerId !== req.customer.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(funding);
  } catch (error) {
    console.error('Get wallet funding error:', error);
    res.status(500).json({ error: 'Failed to get funding request' });
  }
});

// Process funding completion (webhook from provider)
router.post('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionId, status, providerResponse } = req.body;

    // Verify webhook signature (in production, implement signature verification)
    // const signature = req.headers['x-provider-signature'];
    // if (!verifySignature(req.body, signature)) {
    //   return res.status(401).json({ error: 'Invalid signature' });
    // }

    const fundingResult = await db.select()
      .from(walletFunding)
      .where(eq(walletFunding.id, id))
      .limit(1);

    const funding = fundingResult[0];

    if (!funding) {
      return res.status(404).json({ error: 'Funding request not found' });
    }

    if (funding.status !== 'PENDING') {
      return res.status(400).json({ error: 'Funding request already processed' });
    }

    // Update funding status
    const updatedFunding = await db.update(walletFunding)
      .set({
        status: status || 'COMPLETED',
        transactionId,
        providerResponse: JSON.stringify(providerResponse),
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(walletFunding.id, id))
      .returning();

    // If successful, add funds to customer wallet
    if (status === 'COMPLETED' || status === 'SUCCESS') {
      await db.transaction(async (tx) => {
        // Get customer
        const customerResult = await tx.select().from(customers).where(eq(customers.id, funding.customerId)).limit(1);
        const customer = customerResult[0];

        // Update balance
        await tx.update(customers)
          .set({ balance: (parseFloat(customer.balance) + parseFloat(funding.amount)).toString() })
          .where(eq(customers.id, funding.customerId));
      });
    }

    res.json({
      message: 'Funding processed successfully',
      funding: updatedFunding[0]
    });
  } catch (error) {
    console.error('Process funding error:', error);
    res.status(500).json({ error: 'Failed to process funding' });
  }
});

// Cancel funding request
router.post('/:id/cancel', customerAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const fundingResult = await db.select()
      .from(walletFunding)
      .where(eq(walletFunding.id, id))
      .limit(1);

    const funding = fundingResult[0];

    if (!funding) {
      return res.status(404).json({ error: 'Funding request not found' });
    }

    // Verify ownership
    if (funding.customerId !== req.customer.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (funding.status !== 'PENDING') {
      return res.status(400).json({ error: 'Can only cancel pending requests' });
    }

    // Update funding status
    const updatedFunding = await db.update(walletFunding)
      .set({
        status: 'FAILED',
        providerResponse: JSON.stringify({ reason: 'Cancelled by user' }),
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(walletFunding.id, id))
      .returning();

    res.json({
      message: 'Funding request cancelled',
      funding: updatedFunding[0]
    });
  } catch (error) {
    console.error('Cancel funding error:', error);
    res.status(500).json({ error: 'Failed to cancel funding request' });
  }
});

module.exports = router;
