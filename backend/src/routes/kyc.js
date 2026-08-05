const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth, merchantAuth, customerAuth } = require('../middleware/auth');
const prisma = require('../lib/prisma');

// Import email service with error handling
let sendKYCStatusEmail;
try {
  const emailService = require('../services/email');
  sendKYCStatusEmail = emailService.sendKYCStatusEmail;
} catch (error) {
  console.warn('Email service not available:', error.message);
  sendKYCStatusEmail = async () => { /* no-op */ };
}

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for KYC document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'kyc-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'application/pdf';

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and PDF files are allowed'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter
});

// Submit merchant KYC document
router.post('/merchant', merchantAuth, upload.single('document'), async (req, res) => {
  try {
    const { documentType } = req.body;
    const merchant = await prisma.merchant.findUnique({
      where: { userId: req.user.id }
    });

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const documentUrl = `/uploads/${req.file.filename}`;

    const kycDocument = await prisma.kYCDocument.create({
      data: {
        merchantId: merchant.id,
        documentType,
        documentUrl,
        status: 'PENDING',
        submittedAt: new Date()
      }
    });

    // Update merchant onboarding step
    await prisma.merchant.update({
      where: { id: merchant.id },
      data: { onboardingStep: 'KYC_PENDING' }
    });

    res.json(kycDocument);
  } catch (error) {
    console.error('Submit merchant KYC error:', error);
    res.status(500).json({ error: 'Failed to submit KYC document' });
  }
});

// Submit customer KYC document
router.post('/customer', customerAuth, upload.single('document'), async (req, res) => {
  try {
    const { documentType } = req.body;
    const customer = await prisma.customer.findUnique({
      where: { userId: req.user.id }
    });

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const documentUrl = `/uploads/${req.file.filename}`;

    const kycDocument = await prisma.customerKYCDocument.create({
      data: {
        customerId: customer.id,
        documentType,
        documentUrl,
        status: 'PENDING',
        submittedAt: new Date()
      }
    });

    res.json(kycDocument);
  } catch (error) {
    console.error('Submit customer KYC error:', error);
    res.status(500).json({ error: 'Failed to submit KYC document' });
  }
});

// Get merchant KYC documents
router.get('/merchant', merchantAuth, async (req, res) => {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { userId: req.user.id }
    });

    const documents = await prisma.kYCDocument.findMany({
      where: { merchantId: merchant.id },
      orderBy: { submittedAt: 'desc' }
    });

    res.json(documents);
  } catch (error) {
    console.error('Get merchant KYC error:', error);
    res.status(500).json({ error: 'Failed to get KYC documents' });
  }
});

// Get customer KYC documents
router.get('/customer', customerAuth, async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { userId: req.user.id }
    });

    const documents = await prisma.customerKYCDocument.findMany({
      where: { customerId: customer.id },
      orderBy: { submittedAt: 'desc' }
    });

    res.json(documents);
  } catch (error) {
    console.error('Get customer KYC error:', error);
    res.status(500).json({ error: 'Failed to get KYC documents' });
  }
});

// Admin: Review merchant KYC document
router.put('/merchant/:id/review', auth, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status, rejectionReason, adminComment } = req.body;

    const kycDocument = await prisma.kYCDocument.update({
      where: { id: req.params.id },
      data: {
        status,
        rejectionReason,
        adminComment,
        reviewedAt: new Date()
      },
      include: {
        merchant: {
          include: {
            user: true
          }
        }
      }
    });

    // Update merchant KYC status
    await prisma.merchant.update({
      where: { id: kycDocument.merchantId },
      data: {
        kycStatus: status === 'APPROVED' ? 'APPROVED' : status === 'REJECTED' ? 'REJECTED' : 'UNDER_REVIEW'
      }
    });

    // Update user KYC status
    await prisma.user.update({
      where: { id: kycDocument.merchant.userId },
      data: {
        kycStatus: status === 'APPROVED' ? 'APPROVED' : status === 'REJECTED' ? 'REJECTED' : 'UNDER_REVIEW'
      }
    });

    // Send email notification
    await sendKYCStatusEmail(
      kycDocument.merchant.user.email,
      kycDocument.merchant.user.name,
      status,
      rejectionReason
    );

    // Notify merchant via socket
    if (global.io) {
      global.io.to(kycDocument.merchant.userId).emit('kyc_status_update', {
        documentId: kycDocument.id,
        status,
        rejectionReason
      });
    }

    res.json(kycDocument);
  } catch (error) {
    console.error('Review KYC error:', error);
    res.status(500).json({ error: 'Failed to review KYC document' });
  }
});

module.exports = router;
