const express = require('express');
const router = express.Router();
const db = require('../db/index');
const { eq, desc, and } = require('drizzle-orm');
const { merchants, transactions, escrow } = require('../db/schema');
const { auth, merchantAuth } = require('../middleware/auth');

/**
 * Create an escrow
 * POST /api/escrow
 */
router.post('/', merchantAuth, async (req, res) => {
  try {
    const { customerId, amount, currency = 'SLE', releaseCondition, metadata } = req.body;
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    if (!customerId || !amount) {
      return res.status(400).json({ error: 'Customer ID and amount are required' });
    }

    const escrowResult = await db.insert(escrow).values({
      merchantId: merchant.id,
      customerId,
      amount: parseFloat(amount).toString(),
      currency,
      releaseCondition,
      reference: `ESCROW_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metadata: metadata ? JSON.stringify(metadata) : null
    }).returning();
    
    const escrowData = escrowResult[0];

    res.status(201).json({
      message: 'Escrow created successfully',
      escrow: escrowData
    });
  } catch (error) {
    console.error('Create escrow error:', error);
    res.status(500).json({ error: 'Failed to create escrow' });
  }
});

/**
 * Get merchant escrows
 * GET /api/escrow
 */
router.get('/', merchantAuth, async (req, res) => {
  try {
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const { status } = req.query;

    let whereCondition = eq(escrow.merchantId, merchant.id);
    if (status) {
      whereCondition = and(eq(escrow.merchantId, merchant.id), eq(escrow.status, status));
    }

    const escrowsResult = await db.select()
      .from(escrow)
      .where(whereCondition)
      .orderBy(desc(escrow.createdAt));

    res.json({ escrows: escrowsResult });
  } catch (error) {
    console.error('Get escrows error:', error);
    res.status(500).json({ error: 'Failed to get escrows' });
  }
});

/**
 * Get escrow by ID
 * GET /api/escrow/:id
 */
router.get('/:id', merchantAuth, async (req, res) => {
  try {
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const escrowResult = await db.select()
      .from(escrow)
      .where(and(eq(escrow.id, req.params.id), eq(escrow.merchantId, merchant.id)))
      .limit(1);
    
    const escrowData = escrowResult[0];

    if (!escrowData) {
      return res.status(404).json({ error: 'Escrow not found' });
    }

    res.json({ escrow: escrowData });
  } catch (error) {
    console.error('Get escrow error:', error);
    res.status(500).json({ error: 'Failed to get escrow' });
  }
});

/**
 * Fund escrow
 * POST /api/escrow/:id/fund
 */
router.post('/:id/fund', merchantAuth, async (req, res) => {
  try {
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const escrowResult = await db.select()
      .from(escrow)
      .where(and(eq(escrow.id, req.params.id), eq(escrow.merchantId, merchant.id)))
      .limit(1);
    
    const escrowData = escrowResult[0];

    if (!escrowData) {
      return res.status(404).json({ error: 'Escrow not found' });
    }

    if (escrowData.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only pending escrows can be funded' });
    }

    const updatedResult = await db.update(escrow)
      .set({
        status: 'FUNDED',
        fundedAt: new Date()
      })
      .where(eq(escrow.id, req.params.id))
      .returning();
    
    const updated = updatedResult[0];

    res.json({
      message: 'Escrow funded successfully',
      escrow: updated
    });
  } catch (error) {
    console.error('Fund escrow error:', error);
    res.status(500).json({ error: 'Failed to fund escrow' });
  }
});

/**
 * Release escrow
 * POST /api/escrow/:id/release
 */
router.post('/:id/release', merchantAuth, async (req, res) => {
  try {
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const escrowResult = await db.select()
      .from(escrow)
      .where(and(eq(escrow.id, req.params.id), eq(escrow.merchantId, merchant.id)))
      .limit(1);
    
    const escrowData = escrowResult[0];

    if (!escrowData) {
      return res.status(404).json({ error: 'Escrow not found' });
    }

    if (escrowData.status !== 'FUNDED') {
      return res.status(400).json({ error: 'Only funded escrows can be released' });
    }

    // Create transaction for the release
    const transactionResult = await db.insert(transactions).values({
      merchantId: merchant.id,
      customerId: escrowData.customerId,
      amount: escrowData.amount,
      currency: escrowData.currency,
      paymentMethod: 'ESCROW_RELEASE',
      status: 'SUCCESSFUL',
      description: 'Escrow release payment',
      reference: `ESCROW_RELEASE_${escrowData.id}_${Date.now()}`,
      metadata: JSON.stringify({ escrowId: escrowData.id })
    }).returning();
    
    const transaction = transactionResult[0];

    // Update escrow status
    const updatedResult = await db.update(escrow)
      .set({
        status: 'RELEASED',
        releasedAt: new Date()
      })
      .where(eq(escrow.id, req.params.id))
      .returning();
    
    const updated = updatedResult[0];

    // Emit socket notification
    if (global.io) {
      global.io.to(merchant.id).emit('escrow', {
        type: 'released',
        escrow: updated,
        transaction
      });
    }

    res.json({
      message: 'Escrow released successfully',
      escrow: updated,
      transaction
    });
  } catch (error) {
    console.error('Release escrow error:', error);
    res.status(500).json({ error: 'Failed to release escrow' });
  }
});

/**
 * Refund escrow
 * POST /api/escrow/:id/refund
 */
router.post('/:id/refund', merchantAuth, async (req, res) => {
  try {
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const { reason } = req.body;
    const escrowResult = await db.select()
      .from(escrow)
      .where(and(eq(escrow.id, req.params.id), eq(escrow.merchantId, merchant.id)))
      .limit(1);
    
    const escrowData = escrowResult[0];

    if (!escrowData) {
      return res.status(404).json({ error: 'Escrow not found' });
    }

    if (escrowData.status === 'REFUNDED') {
      return res.status(400).json({ error: 'Escrow is already refunded' });
    }

    // Update escrow status
    const updatedResult = await db.update(escrow)
      .set({
        status: 'REFUNDED',
        refundedAt: new Date(),
        metadata: JSON.stringify({
          ...JSON.parse(escrowData.metadata || '{}'),
          refundReason: reason
        })
      })
      .where(eq(escrow.id, req.params.id))
      .returning();
    
    const updated = updatedResult[0];

    // Emit socket notification
    if (global.io) {
      global.io.to(merchant.id).emit('escrow', {
        type: 'refunded',
        escrow: updated
      });
    }

    res.json({
      message: 'Escrow refunded successfully',
      escrow: updated
    });
  } catch (error) {
    console.error('Refund escrow error:', error);
    res.status(500).json({ error: 'Failed to refund escrow' });
  }
});

/**
 * Mark escrow as disputed
 * POST /api/escrow/:id/dispute
 */
router.post('/:id/dispute', merchantAuth, async (req, res) => {
  try {
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const escrowResult = await db.select()
      .from(escrow)
      .where(and(eq(escrow.id, req.params.id), eq(escrow.merchantId, merchant.id)))
      .limit(1);
    
    const escrowData = escrowResult[0];

    if (!escrowData) {
      return res.status(404).json({ error: 'Escrow not found' });
    }

    if (escrowData.status === 'DISPUTED') {
      return res.status(400).json({ error: 'Escrow is already disputed' });
    }

    const updatedResult = await db.update(escrow)
      .set({ status: 'DISPUTED' })
      .where(eq(escrow.id, req.params.id))
      .returning();
    
    const updated = updatedResult[0];

    res.json({
      message: 'Escrow marked as disputed',
      escrow: updated
    });
  } catch (error) {
    console.error('Dispute escrow error:', error);
    res.status(500).json({ error: 'Failed to dispute escrow' });
  }
});

module.exports = router;
