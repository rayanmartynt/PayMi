const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { fileTypeFromBuffer } = require('file-type');
const { auth, merchantAuth, customerAuth } = require('../middleware/auth');
const db = require('../db/index');
const { eq } = require('drizzle-orm');
const { users, merchants, customers, kycDocuments, customerKycDocuments } = require('../db/schema');

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

  if (!extname || !mimetype) {
    return cb(new Error('Only JPEG, PNG, and PDF files are allowed'));
  }

  // Additional validation will be done in the route handler using file-type
  cb(null, true);
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
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file content using file-type
    const filePath = path.join(__dirname, '../../uploads', req.file.filename);
    const buffer = fs.readFileSync(filePath);
    const fileType = await fileTypeFromBuffer(buffer);

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    
    if (!fileType || !allowedMimeTypes.includes(fileType.mime)) {
      // Delete the invalid file
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG, and PDF files are allowed' });
    }

    const documentUrl = `/uploads/${req.file.filename}`;

    const kycDocumentResult = await db.insert(kycDocuments).values({
      merchantId: merchant.id,
      documentType,
      documentUrl,
      status: 'PENDING',
      submittedAt: new Date()
    }).returning();
    
    const kycDocument = kycDocumentResult[0];

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
    const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
    const customer = customerResult[0];

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file content
    const filePath = path.join(__dirname, '../../uploads', req.file.filename);
    const buffer = fs.readFileSync(filePath);
    const fileType = await fileTypeFromBuffer(buffer);
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    
    if (!fileType || !allowedMimeTypes.includes(fileType.mime)) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG, and PDF files are allowed' });
    }

    const documentUrl = `/uploads/${req.file.filename}`;

    const kycDocumentResult = await db.insert(customerKycDocuments).values({
      customerId: customer.id,
      documentType,
      documentUrl,
      status: 'PENDING',
      submittedAt: new Date()
    }).returning();
    
    const kycDocument = kycDocumentResult[0];

    res.json(kycDocument);
  } catch (error) {
    console.error('Submit customer KYC error:', error);
    res.status(500).json({ error: 'Failed to submit KYC document' });
  }
});

// Get merchant KYC documents
router.get('/merchant', merchantAuth, async (req, res) => {
  try {
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const documents = await db.select().from(kycDocuments).where(eq(kycDocuments.merchantId, merchant.id));

    res.json(documents);
  } catch (error) {
    console.error('Get merchant KYC error:', error);
    res.status(500).json({ error: 'Failed to get KYC documents' });
  }
});

// Get customer KYC documents
router.get('/customer', customerAuth, async (req, res) => {
  try {
    const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
    const customer = customerResult[0];

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const documents = await db.select().from(customerKycDocuments).where(eq(customerKycDocuments.customerId, customer.id));

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

    const kycDocumentResult = await db.update(kycDocuments)
      .set({
        status,
        rejectionReason,
        adminComment,
        reviewedAt: new Date()
      })
      .where(eq(kycDocuments.id, req.params.id))
      .returning();
    
    const kycDocument = kycDocumentResult[0];

    // Update merchant KYC status
    const kycVerified = status === 'APPROVED';
    await db.update(merchants)
      .set({ kycVerified })
      .where(eq(merchants.id, kycDocument.merchantId));

    // Get merchant user for email
    const merchantResult = await db.select().from(merchants).where(eq(merchants.id, kycDocument.merchantId)).limit(1);
    const merchant = merchantResult[0];
    
    const userResult = await db.select().from(users).where(eq(users.id, merchant.userId)).limit(1);
    const user = userResult[0];

    // Send email notification
    await sendKYCStatusEmail(
      user.email,
      user.name,
      status,
      rejectionReason
    );

    // Notify merchant via socket
    if (global.io) {
      global.io.to(merchant.userId).emit('kyc_status_update', {
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
