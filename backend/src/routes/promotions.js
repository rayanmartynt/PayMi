const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { auth, merchantAuth } = require('../middleware/auth');

/**
 * Generate unique promo code
 */
const generatePromoCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Create a promotional code (merchant only)
 * POST /api/promotions
 */
router.post('/', merchantAuth, async (req, res) => {
  try {
    const { code, discountType, discountValue, minPurchase, maxUses, expiresAt, description } = req.body;
    const merchant = req.merchant;

    if (!discountType || !discountValue) {
      return res.status(400).json({ error: 'Discount type and value are required' });
    }

    const promoCode = await prisma.promoCode.create({
      data: {
        merchantId: merchant.id,
        code: code || generatePromoCode(),
        discountType: discountType.toUpperCase(),
        discountValue: parseFloat(discountValue),
        minPurchase: minPurchase ? parseFloat(minPurchase) : 0,
        maxUses: maxUses || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        description: description || null,
        active: true
      }
    });

    res.status(201).json({
      message: 'Promotional code created successfully',
      promoCode
    });
  } catch (error) {
    console.error('Create promo code error:', error);
    res.status(500).json({ error: 'Failed to create promotional code' });
  }
});

/**
 * Get all promotional codes for merchant
 * GET /api/promotions
 */
router.get('/', merchantAuth, async (req, res) => {
  try {
    const merchant = req.merchant;
    const { active } = req.query;

    const where = { merchantId: merchant.id };
    if (active !== undefined) {
      where.active = active === 'true';
    }

    const promoCodes = await prisma.promoCode.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json({ promoCodes });
  } catch (error) {
    console.error('Get promo codes error:', error);
    res.status(500).json({ error: 'Failed to get promotional codes' });
  }
});

/**
 * Validate a promotional code
 * GET /api/promotions/validate/:code
 */
router.get('/validate/:code', async (req, res) => {
  try {
    const promoCode = await prisma.promoCode.findUnique({
      where: { code: req.params.code }
    });

    if (!promoCode) {
      return res.status(404).json({ error: 'Invalid promotional code' });
    }

    if (!promoCode.active) {
      return res.status(400).json({ error: 'Promotional code is inactive' });
    }

    if (promoCode.expiresAt && new Date(promoCode.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Promotional code has expired' });
    }

    if (promoCode.maxUses && promoCode.usesCount >= promoCode.maxUses) {
      return res.status(400).json({ error: 'Promotional code has reached maximum uses' });
    }

    res.json({
      valid: true,
      discountType: promoCode.discountType,
      discountValue: promoCode.discountValue,
      minPurchase: promoCode.minPurchase
    });
  } catch (error) {
    console.error('Validate promo code error:', error);
    res.status(500).json({ error: 'Failed to validate promotional code' });
  }
});

/**
 * Apply promotional code to payment
 * POST /api/promotions/apply
 */
router.post('/apply', auth, async (req, res) => {
  try {
    const { code, amount } = req.body;

    if (!code || !amount) {
      return res.status(400).json({ error: 'Code and amount are required' });
    }

    const promoCode = await prisma.promoCode.findUnique({
      where: { code }
    });

    if (!promoCode || !promoCode.active) {
      return res.status(404).json({ error: 'Invalid or inactive promotional code' });
    }

    if (promoCode.expiresAt && new Date(promoCode.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Promotional code has expired' });
    }

    if (parseFloat(amount) < promoCode.minPurchase) {
      return res.status(400).json({ 
        error: `Minimum purchase amount is ${promoCode.minPurchase}` 
      });
    }

    let discountAmount;
    if (promoCode.discountType === 'PERCENTAGE') {
      discountAmount = parseFloat(amount) * (promoCode.discountValue / 100);
    } else {
      discountAmount = promoCode.discountValue;
    }

    const finalAmount = Math.max(0, parseFloat(amount) - discountAmount);

    res.json({
      message: 'Promotional code applied successfully',
      discountAmount,
      finalAmount,
      promoCode: {
        code: promoCode.code,
        discountType: promoCode.discountType,
        discountValue: promoCode.discountValue
      }
    });
  } catch (error) {
    console.error('Apply promo code error:', error);
    res.status(500).json({ error: 'Failed to apply promotional code' });
  }
});

/**
 * Update promotional code
 * PUT /api/promotions/:id
 */
router.put('/:id', merchantAuth, async (req, res) => {
  try {
    const merchant = req.merchant;
    const { discountType, discountValue, minPurchase, maxUses, expiresAt, active, description } = req.body;

    const promoCode = await prisma.promoCode.findFirst({
      where: { id: req.params.id, merchantId: merchant.id }
    });

    if (!promoCode) {
      return res.status(404).json({ error: 'Promotional code not found' });
    }

    const updated = await prisma.promoCode.update({
      where: { id: req.params.id },
      data: {
        discountType: discountType || promoCode.discountType,
        discountValue: discountValue !== undefined ? parseFloat(discountValue) : promoCode.discountValue,
        minPurchase: minPurchase !== undefined ? parseFloat(minPurchase) : promoCode.minPurchase,
        maxUses: maxUses !== undefined ? maxUses : promoCode.maxUses,
        expiresAt: expiresAt ? new Date(expiresAt) : promoCode.expiresAt,
        active: active !== undefined ? active : promoCode.active,
        description: description !== undefined ? description : promoCode.description
      }
    });

    res.json({
      message: 'Promotional code updated successfully',
      promoCode: updated
    });
  } catch (error) {
    console.error('Update promo code error:', error);
    res.status(500).json({ error: 'Failed to update promotional code' });
  }
});

/**
 * Delete promotional code
 * DELETE /api/promotions/:id
 */
router.delete('/:id', merchantAuth, async (req, res) => {
  try {
    const merchant = req.merchant;

    const promoCode = await prisma.promoCode.findFirst({
      where: { id: req.params.id, merchantId: merchant.id }
    });

    if (!promoCode) {
      return res.status(404).json({ error: 'Promotional code not found' });
    }

    await prisma.promoCode.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Promotional code deleted successfully' });
  } catch (error) {
    console.error('Delete promo code error:', error);
    res.status(500).json({ error: 'Failed to delete promotional code' });
  }
});

module.exports = router;
