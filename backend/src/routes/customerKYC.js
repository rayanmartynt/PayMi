const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fileType = require('file-type');
const { customerAuth } = require('../middleware/auth');
const db = require('../db/index');
const { eq, desc } = require('drizzle-orm');
const { customers, customerKycDocuments } = require('../db/schema');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for customer KYC document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'customer-kyc-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'application/pdf';

  if (!extname || !mimetype) {
    return cb(new Error('Only JPEG, PNG, and PDF files are allowed'));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter
});

// Get customer KYC documents
router.get('/documents', customerAuth, async (req, res) => {
  try {
    const customerResult = await db.select()
      .from(customers)
      .where(eq(customers.userId, req.user.id))
      .limit(1);
    
    const customer = customerResult[0];

    const documentsResult = await db.select()
      .from(customerKycDocuments)
      .where(eq(customerKycDocuments.customerId, customer.id))
      .orderBy(desc(customerKycDocuments.submittedAt));

    res.json(documentsResult);
  } catch (error) {
    console.error('Get customer KYC documents error:', error);
    res.status(500).json({ error: 'Failed to get KYC documents' });
  }
});

// Upload customer KYC document
router.post('/documents', customerAuth, upload.single('document'), async (req, res) => {
  try {
    const { documentType } = req.body;
    const customerResult = await db.select()
      .from(customers)
      .where(eq(customers.userId, req.user.id))
      .limit(1);
    
    const customer = customerResult[0];

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file content
    const filePath = path.join(__dirname, '../../uploads', req.file.filename);
    const buffer = fs.readFileSync(filePath);
    const type = await fileType.fromBuffer(buffer);
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    
    if (!type || !allowedMimeTypes.includes(type.mime)) {
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
    console.error('Upload customer KYC document error:', error);
    res.status(500).json({ error: 'Failed to upload KYC document' });
  }
});

module.exports = router;
