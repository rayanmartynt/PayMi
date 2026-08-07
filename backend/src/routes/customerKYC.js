const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { fileTypeFromBuffer } = require('file-type');
const { customerAuth } = require('../middleware/auth');
const prisma = require('../db/index');

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
    const customer = await prisma.customer.findUnique({
      where: { userId: req.user.id }
    });

    const documents = await prisma.customerKYCDocument.findMany({
      where: { customerId: customer.id },
      orderBy: { submittedAt: 'desc' }
    });

    res.json(documents);
  } catch (error) {
    console.error('Get customer KYC documents error:', error);
    res.status(500).json({ error: 'Failed to get KYC documents' });
  }
});

// Upload customer KYC document
router.post('/documents', customerAuth, upload.single('document'), async (req, res) => {
  try {
    const { documentType } = req.body;
    const customer = await prisma.customer.findUnique({
      where: { userId: req.user.id }
    });

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
    console.error('Upload customer KYC document error:', error);
    res.status(500).json({ error: 'Failed to upload KYC document' });
  }
});

module.exports = router;
