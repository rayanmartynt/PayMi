const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { customerAuth } = require('../middleware/auth');
const db = require('../db/index');
const { eq, desc, and, like, or, gte, lte, sql } = require('drizzle-orm');
const { customers, transactions, users } = require('../db/schema');
const {
  getCustomerProfile,
  updateCustomerProfile,
  uploadCustomerProfilePicture,
  deleteCustomerProfilePicture
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

// Delete customer profile picture
router.delete('/profile/picture', customerAuth, deleteCustomerProfilePicture);

// Get customer analytics
router.get('/analytics', customerAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
    const customer = customerResult[0];

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const transactionsResult = await db.execute(sql`
      SELECT 
        id, merchant_id, customer_id, amount, currency, payment_method, 
        status, description, metadata, created_at, updated_at
      FROM transactions
      WHERE customer_id = ${customer.id} AND status = 'SUCCESSFUL'
      ${startDate ? sql`AND created_at >= ${new Date(startDate)}` : sql``}
      ${endDate ? sql`AND created_at <= ${new Date(endDate)}` : sql``}
      ORDER BY created_at DESC
    `);

    const totalSpent = transactionsResult.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const transactionCount = transactionsResult.length;

    res.json({
      totalSpent,
      transactionCount,
      transactions: transactionsResult
    });
  } catch (error) {
    console.error('Get customer analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics', details: error.message });
  }
});

// Get all customers (for admin/merchant use)
router.get('/', customerAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    let conditions = [];
    if (search) {
      conditions.push(
        or(
          like(customers.name, `%${search}%`),
          like(customers.phone, `%${search}%`),
          like(users.email, `%${search}%`)
        )
      );
    }

    const customersResult = await db.select()
      .from(customers)
      .leftJoin(users, eq(customers.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(customers.createdAt))
      .limit(parseInt(limit))
      .offset(offset);

    const total = customersResult.length;

    res.json({
      customers: customersResult,
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
