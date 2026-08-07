const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { merchantAuth, auth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const db = require('../db/index');
const { eq, desc } = require('drizzle-orm');
const { users, merchants, transactions, withdrawals, customers } = require('../db/schema');
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

// Upgrade customer to merchant
router.post('/upgrade', auth, 
  [
    body('businessName').trim().notEmpty().withMessage('Business name is required'),
    body('businessType').isIn(['INDIVIDUAL', 'COMPANY']).withMessage('Invalid business type'),
    body('phoneNumber').trim().notEmpty().withMessage('Phone number is required')
  ],
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { businessName, businessType, phoneNumber, businessEmail, businessAddress } = req.body;

    // Check if user is a customer
    if (req.user.role !== 'CUSTOMER') {
      return res.status(400).json({ error: 'Only customers can upgrade to merchant' });
    }

    // Check if merchant already exists for this user
    const existingMerchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    if (existingMerchantResult[0]) {
      return res.status(400).json({ error: 'Merchant account already exists' });
    }

    // Create merchant account
    const merchantResult = await db.insert(merchants).values({
      userId: req.user.id,
      businessName,
      businessType,
      phoneNumber,
      businessEmail: businessEmail || null,
      businessAddress: businessAddress || null,
      balance: '0',
      isApproved: false,
      kycVerified: false
    }).returning();
    
    const merchant = merchantResult[0];

    // Update user role to MERCHANT
    await db.update(users)
      .set({ role: 'MERCHANT' })
      .where(eq(users.id, req.user.id));

    // Delete customer record
    await db.delete(customers).where(eq(customers.userId, req.user.id));

    res.json({
      message: 'Account upgraded to merchant successfully',
      merchant: {
        id: merchant.id,
        businessName: merchant.businessName,
        businessType: merchant.businessType,
        isApproved: merchant.isApproved,
        kycVerified: merchant.kycVerified
      }
    });
  } catch (error) {
    console.error('Upgrade to merchant error:', error);
    res.status(500).json({ error: 'Failed to upgrade account' });
  }
});

// Get merchant balance
router.get('/balance', merchantAuth, async (req, res) => {
  try {
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const transactionsResult = await db.select()
      .from(transactions)
      .where(eq(transactions.merchantId, merchant.id));

    const withdrawalsResult = await db.select()
      .from(withdrawals)
      .where(eq(withdrawals.merchantId, merchant.id));

    const totalRevenue = transactionsResult.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalWithdrawn = withdrawalsResult.reduce((sum, w) => sum + parseFloat(w.amount), 0);
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
    res.json({ settlements: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
  } catch (error) {
    console.error('Get settlements error:', error);
    res.status(500).json({ error: 'Failed to get settlements' });
  }
});

// Request withdrawal
router.post('/withdrawals', merchantAuth, async (req, res) => {
  try {
    const { amount, mobileMoneyProvider, mobileNumber } = req.body;
    
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    // Check balance
    const transactionsResult = await db.select()
      .from(transactions)
      .where(eq(transactions.merchantId, merchant.id));

    const withdrawalsResult = await db.select()
      .from(withdrawals)
      .where(eq(withdrawals.merchantId, merchant.id));

    const totalRevenue = transactionsResult.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalWithdrawn = withdrawalsResult.reduce((sum, w) => sum + parseFloat(w.amount), 0);
    const availableBalance = totalRevenue - totalWithdrawn;

    // Calculate fee (10% for merchant withdrawals)
    const fee = amount * 0.10;
    const totalDeduction = amount + fee;

    if (availableBalance < totalDeduction) {
      return res.status(400).json({ error: `Insufficient balance. Amount: ${amount}, Fee: ${fee}, Total required: ${totalDeduction}` });
    }

    const withdrawalResult = await db.insert(withdrawals).values({
      merchantId: merchant.id,
      amount: amount.toString(),
      fee: fee.toString(),
      currency: 'SLE',
      mobileMoneyProvider,
      mobileNumber,
      status: 'PENDING'
    }).returning();

    res.json(withdrawalResult[0]);
  } catch (error) {
    console.error('Request withdrawal error:', error);
    res.status(500).json({ error: 'Failed to request withdrawal' });
  }
});

// Get withdrawals
router.get('/withdrawals', merchantAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const merchant = merchantResult[0];

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const withdrawalsResult = await db.select()
      .from(withdrawals)
      .where(eq(withdrawals.merchantId, merchant.id))
      .orderBy(desc(withdrawals.createdAt))
      .limit(parseInt(limit))
      .offset(offset);

    // Count total
    const countResult = await db.select({ count: withdrawals.id })
      .from(withdrawals)
      .where(eq(withdrawals.merchantId, merchant.id));
    const total = countResult.length;

    res.json({
      withdrawals: withdrawalsResult,
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
