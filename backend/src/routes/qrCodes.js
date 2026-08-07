const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const db = require('../db/index');
const { eq, desc, and } = require('drizzle-orm');
const { merchants, qrCodes } = require('../db/schema');
const { auth, merchantAuth } = require('../middleware/auth');

/**
 * Generate a QR code for payment
 * POST /api/qr-codes
 */
router.post('/', merchantAuth, async (req, res) => {
  try {
    const { amount, currency = 'SLE', expiresAt, metadata } = req.body;
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    // Generate QR code data
    const qrData = JSON.stringify({
      merchantId: merchant.id,
      amount: amount || null,
      currency,
      timestamp: Date.now()
    });

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(qrData);

    // Save QR code to database
    const qrCodeResult = await db.insert(qrCodes).values({
      merchantId: merchant.id,
      amount: amount ? parseFloat(amount).toString() : null,
      currency,
      qrCodeData: qrData,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      metadata: metadata ? JSON.stringify(metadata) : null
    }).returning();
    
    const qrCode = qrCodeResult[0];

    res.status(201).json({
      message: 'QR code generated successfully',
      qrCode: {
        ...qrCode,
        imageUrl: qrCodeDataUrl
      }
    });
  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

/**
 * Get merchant QR codes
 * GET /api/qr-codes
 */
router.get('/', merchantAuth, async (req, res) => {
  try {
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const { status } = req.query;

    let whereCondition = eq(qrCodes.merchantId, merchant.id);
    if (status) {
      whereCondition = and(eq(qrCodes.merchantId, merchant.id), eq(qrCodes.status, status));
    }

    const qrCodesResult = await db.select()
      .from(qrCodes)
      .where(whereCondition)
      .orderBy(desc(qrCodes.createdAt));

    res.json({ qrCodes: qrCodesResult });
  } catch (error) {
    console.error('Get QR codes error:', error);
    res.status(500).json({ error: 'Failed to get QR codes' });
  }
});

/**
 * Get QR code by ID
 * GET /api/qr-codes/:id
 */
router.get('/:id', merchantAuth, async (req, res) => {
  try {
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const qrCodeResult = await db.select()
      .from(qrCodes)
      .where(and(eq(qrCodes.id, req.params.id), eq(qrCodes.merchantId, merchant.id)))
      .limit(1);
    
    const qrCode = qrCodeResult[0];

    if (!qrCode) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    // Check if expired
    if (qrCode.expiresAt && new Date(qrCode.expiresAt) < new Date()) {
      await db.update(qrCodes)
        .set({ status: 'EXPIRED' })
        .where(eq(qrCodes.id, req.params.id));
      qrCode.status = 'EXPIRED';
    }

    res.json({ qrCode });
  } catch (error) {
    console.error('Get QR code error:', error);
    res.status(500).json({ error: 'Failed to get QR code' });
  }
});

/**
 * Process payment via QR code scan
 * POST /api/qr-codes/:id/scan
 */
router.post('/:id/scan', auth, async (req, res) => {
  try {
    const qrCodeResult = await db.select()
      .from(qrCodes)
      .where(eq(qrCodes.id, req.params.id))
      .limit(1);
    
    const qrCode = qrCodeResult[0];

    if (!qrCode) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    if (qrCode.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'QR code is not active' });
    }

    if (qrCode.expiresAt && new Date(qrCode.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'QR code has expired' });
    }

    // Increment scan count
    await db.update(qrCodes)
      .set({ scanCount: qrCode.scanCount + 1 })
      .where(eq(qrCodes.id, req.params.id));

    res.json({
      message: 'QR code scanned successfully',
      merchantId: qrCode.merchantId,
      amount: qrCode.amount,
      currency: qrCode.currency
    });
  } catch (error) {
    console.error('Scan QR code error:', error);
    res.status(500).json({ error: 'Failed to scan QR code' });
  }
});

/**
 * Disable QR code
 * POST /api/qr-codes/:id/disable
 */
router.post('/:id/disable', merchantAuth, async (req, res) => {
  try {
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const qrCodeResult = await db.select()
      .from(qrCodes)
      .where(and(eq(qrCodes.id, req.params.id), eq(qrCodes.merchantId, merchant.id)))
      .limit(1);
    
    const qrCode = qrCodeResult[0];

    if (!qrCode) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    if (qrCode.status === 'DISABLED') {
      return res.status(400).json({ error: 'QR code is already disabled' });
    }

    const updatedResult = await db.update(qrCodes)
      .set({ status: 'DISABLED' })
      .where(eq(qrCodes.id, req.params.id))
      .returning();
    
    const updated = updatedResult[0];

    res.json({
      message: 'QR code disabled successfully',
      qrCode: updated
    });
  } catch (error) {
    console.error('Disable QR code error:', error);
    res.status(500).json({ error: 'Failed to disable QR code' });
  }
});

/**
 * Enable QR code
 * POST /api/qr-codes/:id/enable
 */
router.post('/:id/enable', merchantAuth, async (req, res) => {
  try {
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const qrCodeResult = await db.select()
      .from(qrCodes)
      .where(and(eq(qrCodes.id, req.params.id), eq(qrCodes.merchantId, merchant.id)))
      .limit(1);
    
    const qrCode = qrCodeResult[0];

    if (!qrCode) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    if (qrCode.status === 'ACTIVE') {
      return res.status(400).json({ error: 'QR code is already active' });
    }

    if (qrCode.expiresAt && new Date(qrCode.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Cannot enable expired QR code' });
    }

    const updatedResult = await db.update(qrCodes)
      .set({ status: 'ACTIVE' })
      .where(eq(qrCodes.id, req.params.id))
      .returning();
    
    const updated = updatedResult[0];

    res.json({
      message: 'QR code enabled successfully',
      qrCode: updated
    });
  } catch (error) {
    console.error('Enable QR code error:', error);
    res.status(500).json({ error: 'Failed to enable QR code' });
  }
});

/**
 * Delete QR code
 * DELETE /api/qr-codes/:id
 */
router.delete('/:id', merchantAuth, async (req, res) => {
  try {
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const qrCodeResult = await db.select()
      .from(qrCodes)
      .where(and(eq(qrCodes.id, req.params.id), eq(qrCodes.merchantId, merchant.id)))
      .limit(1);
    
    const qrCode = qrCodeResult[0];

    if (!qrCode) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    await db.delete(qrCodes).where(eq(qrCodes.id, req.params.id));

    res.json({ message: 'QR code deleted successfully' });
  } catch (error) {
    console.error('Delete QR code error:', error);
    res.status(500).json({ error: 'Failed to delete QR code' });
  }
});

module.exports = router;
