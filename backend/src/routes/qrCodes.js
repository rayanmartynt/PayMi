const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const prisma = require('../lib/prisma');
const { auth, merchantAuth } = require('../middleware/auth');

/**
 * Generate a QR code for payment
 * POST /api/qr-codes
 */
router.post('/', merchantAuth, async (req, res) => {
  try {
    const { amount, currency = 'SLE', expiresAt, metadata } = req.body;
    const merchant = req.merchant;

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
    const qrCode = await prisma.qRCode.create({
      data: {
        merchantId: merchant.id,
        amount: amount ? parseFloat(amount) : null,
        currency,
        qrCodeData: qrData,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    });

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
    const merchant = req.merchant;
    const { status } = req.query;

    const where = { merchantId: merchant.id };
    if (status) {
      where.status = status;
    }

    const qrCodes = await prisma.qRCode.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json({ qrCodes });
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
    const merchant = req.merchant;
    const qrCode = await prisma.qRCode.findFirst({
      where: {
        id: req.params.id,
        merchantId: merchant.id
      }
    });

    if (!qrCode) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    // Check if expired
    if (qrCode.expiresAt && new Date(qrCode.expiresAt) < new Date()) {
      await prisma.qRCode.update({
        where: { id: req.params.id },
        data: { status: 'EXPIRED' }
      });
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
    const qrCode = await prisma.qRCode.findUnique({
      where: { id: req.params.id }
    });

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
    await prisma.qRCode.update({
      where: { id: req.params.id },
      data: { scanCount: { increment: 1 } }
    });

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
    const merchant = req.merchant;
    const qrCode = await prisma.qRCode.findFirst({
      where: {
        id: req.params.id,
        merchantId: merchant.id
      }
    });

    if (!qrCode) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    if (qrCode.status === 'DISABLED') {
      return res.status(400).json({ error: 'QR code is already disabled' });
    }

    const updated = await prisma.qRCode.update({
      where: { id: req.params.id },
      data: { status: 'DISABLED' }
    });

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
    const merchant = req.merchant;
    const qrCode = await prisma.qRCode.findFirst({
      where: {
        id: req.params.id,
        merchantId: merchant.id
      }
    });

    if (!qrCode) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    if (qrCode.status === 'ACTIVE') {
      return res.status(400).json({ error: 'QR code is already active' });
    }

    if (qrCode.expiresAt && new Date(qrCode.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Cannot enable expired QR code' });
    }

    const updated = await prisma.qRCode.update({
      where: { id: req.params.id },
      data: { status: 'ACTIVE' }
    });

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
    const merchant = req.merchant;
    const qrCode = await prisma.qRCode.findFirst({
      where: {
        id: req.params.id,
        merchantId: merchant.id
      }
    });

    if (!qrCode) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    await prisma.qRCode.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'QR code deleted successfully' });
  } catch (error) {
    console.error('Delete QR code error:', error);
    res.status(500).json({ error: 'Failed to delete QR code' });
  }
});

module.exports = router;
