const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { merchantAuth } = require('../middleware/auth');
const prisma = require('../lib/prisma');
const {
  getMerchantProfile,
  updateMerchantProfile,
  uploadMerchantProfilePicture
} = require('../controllers/merchants');

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
    cb(null, 'merchant-' + uniqueSuffix + path.extname(file.originalname));
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

// Get merchant profile
router.get('/profile', merchantAuth, getMerchantProfile);

// Update merchant profile
router.put('/profile', merchantAuth, updateMerchantProfile);

// Upload merchant profile picture
router.post('/profile/picture', merchantAuth, upload.single('profilePicture'), uploadMerchantProfilePicture);

// Get merchant balance
router.get('/balance', merchantAuth, async (req, res) => {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { userId: req.user.id }
    });

    const transactions = await prisma.transaction.findMany({
      where: {
        merchantId: merchant.id,
        status: 'SUCCESSFUL'
      }
    });

    const withdrawals = await prisma.withdrawal.findMany({
      where: {
        merchantId: merchant.id,
        status: 'SUCCESSFUL'
      }
    });

    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
    const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);
    const availableBalance = totalRevenue - totalWithdrawn;

    res.json({
      totalRevenue,
      totalWithdrawn,
      availableBalance
    });
  } catch (error) {
    console.error('Get merchant balance error:', error);
    res.status(500).json({ error: 'Failed to get balance' });
  }
});

// Get settlements
router.get('/settlements', merchantAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const merchant = await prisma.merchant.findUnique({
      where: { userId: req.user.id }
    });

    const [settlements, total] = await Promise.all([
      prisma.settlement.findMany({
        where: { merchantId: merchant.id },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.settlement.count({ where: { merchantId: merchant.id } })
    ]);

    res.json({
      settlements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get settlements error:', error);
    res.status(500).json({ error: 'Failed to get settlements' });
  }
});

// Request withdrawal
router.post('/withdrawals', merchantAuth, async (req, res) => {
  try {
    const { amount, mobileMoneyProvider, mobileNumber } = req.body;
    const merchant = await prisma.merchant.findUnique({
      where: { userId: req.user.id }
    });

    // Check balance
    const transactions = await prisma.transaction.findMany({
      where: {
        merchantId: merchant.id,
        status: 'SUCCESSFUL'
      }
    });

    const withdrawals = await prisma.withdrawal.findMany({
      where: {
        merchantId: merchant.id,
        status: 'SUCCESSFUL'
      }
    });

    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
    const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);
    const availableBalance = totalRevenue - totalWithdrawn;

    if (availableBalance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const withdrawal = await prisma.withdrawal.create({
      data: {
        merchantId: merchant.id,
        amount,
        currency: 'SLE',
        mobileMoneyProvider,
        mobileNumber,
        status: 'PENDING'
      }
    });

    res.json(withdrawal);
  } catch (error) {
    console.error('Request withdrawal error:', error);
    res.status(500).json({ error: 'Failed to request withdrawal' });
  }
});

// Get withdrawals
router.get('/withdrawals', merchantAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const merchant = await prisma.merchant.findUnique({
      where: { userId: req.user.id }
    });

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where: { merchantId: merchant.id },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.withdrawal.count({ where: { merchantId: merchant.id } })
    ]);

    res.json({
      withdrawals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({ error: 'Failed to get withdrawals' });
  }
});

module.exports = router;
