const express = require('express');
const router = express.Router();
const prisma = require('../db/index');
const { auth, merchantAuth } = require('../middleware/auth');

/**
 * Create an escrow
 * POST /api/escrow
 */
router.post('/', merchantAuth, async (req, res) => {
  try {
    const { customerId, amount, currency = 'SLE', releaseCondition, metadata } = req.body;
    const merchant = req.merchant;

    if (!customerId || !amount) {
      return res.status(400).json({ error: 'Customer ID and amount are required' });
    }

    const escrow = await prisma.escrow.create({
      data: {
        merchantId: merchant.id,
        customerId,
        amount: parseFloat(amount),
        currency,
        releaseCondition,
        reference: `ESCROW_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    });

    res.status(201).json({
      message: 'Escrow created successfully',
      escrow
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
    const merchant = req.merchant;
    const { status } = req.query;

    const where = { merchantId: merchant.id };
    if (status) {
      where.status = status;
    }

    const escrows = await prisma.escrow.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json({ escrows });
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
    const merchant = req.merchant;
    const escrow = await prisma.escrow.findFirst({
      where: {
        id: req.params.id,
        merchantId: merchant.id
      }
    });

    if (!escrow) {
      return res.status(404).json({ error: 'Escrow not found' });
    }

    res.json({ escrow });
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
    const merchant = req.merchant;
    const escrow = await prisma.escrow.findFirst({
      where: {
        id: req.params.id,
        merchantId: merchant.id
      }
    });

    if (!escrow) {
      return res.status(404).json({ error: 'Escrow not found' });
    }

    if (escrow.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only pending escrows can be funded' });
    }

    const updated = await prisma.escrow.update({
      where: { id: req.params.id },
      data: {
        status: 'FUNDED',
        fundedAt: new Date()
      }
    });

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
    const merchant = req.merchant;
    const escrow = await prisma.escrow.findFirst({
      where: {
        id: req.params.id,
        merchantId: merchant.id
      }
    });

    if (!escrow) {
      return res.status(404).json({ error: 'Escrow not found' });
    }

    if (escrow.status !== 'FUNDED') {
      return res.status(400).json({ error: 'Only funded escrows can be released' });
    }

    // Create transaction for the release
    const transaction = await prisma.transaction.create({
      data: {
        merchantId: merchant.id,
        customerId: escrow.customerId,
        amount: escrow.amount,
        currency: escrow.currency,
        paymentMethod: 'ESCROW_RELEASE',
        status: 'SUCCESSFUL',
        description: 'Escrow release payment',
        reference: `ESCROW_RELEASE_${escrow.id}_${Date.now()}`,
        metadata: JSON.stringify({ escrowId: escrow.id })
      }
    });

    // Update escrow status
    const updated = await prisma.escrow.update({
      where: { id: req.params.id },
      data: {
        status: 'RELEASED',
        releasedAt: new Date()
      }
    });

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
    const merchant = req.merchant;
    const { reason } = req.body;
    const escrow = await prisma.escrow.findFirst({
      where: {
        id: req.params.id,
        merchantId: merchant.id
      }
    });

    if (!escrow) {
      return res.status(404).json({ error: 'Escrow not found' });
    }

    if (escrow.status === 'REFUNDED') {
      return res.status(400).json({ error: 'Escrow is already refunded' });
    }

    // Update escrow status
    const updated = await prisma.escrow.update({
      where: { id: req.params.id },
      data: {
        status: 'REFUNDED',
        refundedAt: new Date(),
        metadata: JSON.stringify({
          ...JSON.parse(escrow.metadata || '{}'),
          refundReason: reason
        })
      }
    });

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
    const merchant = req.merchant;
    const escrow = await prisma.escrow.findFirst({
      where: {
        id: req.params.id,
        merchantId: merchant.id
      }
    });

    if (!escrow) {
      return res.status(404).json({ error: 'Escrow not found' });
    }

    if (escrow.status === 'DISPUTED') {
      return res.status(400).json({ error: 'Escrow is already disputed' });
    }

    const updated = await prisma.escrow.update({
      where: { id: req.params.id },
      data: { status: 'DISPUTED' }
    });

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
