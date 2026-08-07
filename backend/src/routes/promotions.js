const express = require('express');
const router = express.Router();
const db = require('../db/index');
const { eq, desc, and } = require('drizzle-orm');
const { merchants, promoCodes } = require('../db/schema');
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
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    if (!discountType || !discountValue) {
      return res.status(400).json({ error: 'Discount type and value are required' });
    }

    const promoCodeResult = await db.insert(promoCodes).values({
      merchantId: merchant.id,
      code: code || generatePromoCode(),
      discountType: discountType.toUpperCase(),
      discountValue: parseFloat(discountValue).toString(),
      minPurchase: minPurchase ? parseFloat(minPurchase).toString() : '0',
      maxUses: maxUses || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      description: description || null,
      active: true
    }).returning();
    
    const promoCode = promoCodeResult[0];

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
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const { active } = req.query;

    let whereCondition = eq(promoCodes.merchantId, merchant.id);
    if (active !== undefined) {
      whereCondition = and(eq(promoCodes.merchantId, merchant.id), eq(promoCodes.active, active === 'true'));
    }

    const promoCodesResult = await db.select()
      .from(promoCodes)
      .where(whereCondition)
      .orderBy(desc(promoCodes.createdAt));

    res.json({ promoCodes: promoCodesResult });
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
    const promoCodeResult = await db.select()
      .from(promoCodes)
      .where(eq(promoCodes.code, req.params.code))
      .limit(1);
    
    const promoCode = promoCodeResult[0];

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

    const promoCodeResult = await db.select()
      .from(promoCodes)
      .where(eq(promoCodes.code, code))
      .limit(1);
    
    const promoCode = promoCodeResult[0];

    if (!promoCode || !promoCode.active) {
      return res.status(404).json({ error: 'Invalid or inactive promotional code' });
    }

    if (promoCode.expiresAt && new Date(promoCode.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Promotional code has expired' });
    }

    if (parseFloat(amount) < parseFloat(promoCode.minPurchase)) {
      return res.status(400).json({ 
        error: `Minimum purchase amount is ${promoCode.minPurchase}` 
      });
    }

    let discountAmount;
    if (promoCode.discountType === 'PERCENTAGE') {
      discountAmount = parseFloat(amount) * (parseFloat(promoCode.discountValue) / 100);
    } else {
      discountAmount = parseFloat(promoCode.discountValue);
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
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const { discountType, discountValue, minPurchase, maxUses, expiresAt, active, description } = req.body;

    const promoCodeResult = await db.select()
      .from(promoCodes)
      .where(and(eq(promoCodes.id, req.params.id), eq(promoCodes.merchantId, merchant.id)))
      .limit(1);
    
    const promoCode = promoCodeResult[0];

    if (!promoCode) {
      return res.status(404).json({ error: 'Promotional code not found' });
    }

    const updatedResult = await db.update(promoCodes)
      .set({
        discountType: discountType || promoCode.discountType,
        discountValue: discountValue !== undefined ? parseFloat(discountValue).toString() : promoCode.discountValue,
        minPurchase: minPurchase !== undefined ? parseFloat(minPurchase).toString() : promoCode.minPurchase,
        maxUses: maxUses !== undefined ? maxUses : promoCode.maxUses,
        expiresAt: expiresAt ? new Date(expiresAt) : promoCode.expiresAt,
        active: active !== undefined ? active : promoCode.active,
        description: description !== undefined ? description : promoCode.description
      })
      .where(eq(promoCodes.id, req.params.id))
      .returning();
    
    const updated = updatedResult[0];

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
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const promoCodeResult = await db.select()
      .from(promoCodes)
      .where(and(eq(promoCodes.id, req.params.id), eq(promoCodes.merchantId, merchant.id)))
      .limit(1);
    
    const promoCode = promoCodeResult[0];

    if (!promoCode) {
      return res.status(404).json({ error: 'Promotional code not found' });
    }

    await db.delete(promoCodes).where(eq(promoCodes.id, req.params.id));

    res.json({ message: 'Promotional code deleted successfully' });
  } catch (error) {
    console.error('Delete promo code error:', error);
    res.status(500).json({ error: 'Failed to delete promotional code' });
  }
});

module.exports = router;
