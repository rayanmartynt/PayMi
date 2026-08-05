const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { customerAuth } = require('../middleware/auth');
const prisma = require('../lib/prisma');
const {
  getCustomerProfile,
  updateCustomerProfile,
  uploadCustomerProfilePicture
} = require('../controllers/customers');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'customer-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter
});

// Get customer profile
router.get('/profile', customerAuth, getCustomerProfile);

// Update customer profile
router.put('/profile', customerAuth, updateCustomerProfile);

// Upload customer profile picture
router.post('/profile/picture', customerAuth, upload.single('profilePicture'), uploadCustomerProfilePicture);

// Get customer analytics
router.get('/analytics', customerAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const customer = await prisma.customer.findUnique({
      where: { userId: req.user.id }
    });

    const where = {
      customerId: customer.id,
      status: 'SUCCESSFUL'
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
    const transactionCount = transactions.length;

    res.json({
      totalSpent,
      transactionCount,
      transactions
    });
  } catch (error) {
    console.error('Get customer analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

// Get all customers (for admin/merchant use)
router.get('/', customerAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ]
    } : {};

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          user: true
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.customer.count({ where })
    ]);

    res.json({
      customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Failed to get customers' });
  }
});

module.exports = router;
