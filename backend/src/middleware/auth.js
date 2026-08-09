const jwt = require('jsonwebtoken');
const db = require('../db/index');
const { eq } = require('drizzle-orm');
const { users, merchants, customers } = require('../db/schema');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Handle both userId and id in token payload
    const userId = decoded.userId || decoded.id;
    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const user = userResult[0];

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Get merchant and customer data
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, user.id)).limit(1);
    const customerResult = await db.select().from(customers).where(eq(customers.userId, user.id)).limit(1);

    user.merchant = merchantResult[0] || null;
    user.customer = customerResult[0] || null;

    req.user = user;
    
    // Check if token is about to expire (within 5 minutes) and auto-refresh
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - now;
    
    if (timeUntilExpiry < 300 && timeUntilExpiry > 0) { // Less than 5 minutes remaining
      const newToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30m' });
      res.setHeader('X-New-Token', newToken);
    }
    
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware to check if both phone and email are verified before transactions
const requireFullVerification = async (req, res, next) => {
  try {
    if (!req.user.phoneVerified) {
      return res.status(403).json({ 
        error: 'Phone number not verified. Please verify your phone number to perform transactions.',
        requiresPhoneVerification: true,
        phoneNumber: req.user.phoneNumber
      });
    }

    if (!req.user.emailVerified) {
      return res.status(403).json({ 
        error: 'Email not verified. Please verify your email to perform transactions.',
        requiresEmailVerification: true,
        email: req.user.email
      });
    }

    next();
  } catch (error) {
    console.error('Verification check error:', error);
    res.status(500).json({ error: 'Verification check failed' });
  }
};

const customerAuth = async (req, res, next) => {
  try {
    await auth(req, res, (err) => {
      if (err) return next(err);
    });
    
    if (req.user.role !== 'CUSTOMER') {
      return res.status(403).json({ error: 'Access denied. Customer only.' });
    }

    if (!req.user.customer) {
      return res.status(403).json({ error: 'Customer profile not found' });
    }

    req.customer = req.user.customer;
    next();
  } catch (error) {
    if (!res.headersSent) {
      res.status(401).json({ error: 'Authentication failed' });
    }
  }
};

const merchantAuth = async (req, res, next) => {
  try {
    await auth(req, res, (err) => {
      if (err) return next(err);
    });
    
    if (req.user.role !== 'MERCHANT') {
      return res.status(403).json({ error: 'Access denied. Merchant only.' });
    }

    if (!req.user.merchant) {
      return res.status(403).json({ error: 'Merchant profile not found' });
    }

    req.merchant = req.user.merchant;

    next();
  } catch (error) {
    if (!res.headersSent) {
      res.status(401).json({ error: 'Authentication failed' });
    }
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, (err) => {
      if (err) return next(err);
    });
    
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    next();
  } catch (error) {
    if (!res.headersSent) {
      res.status(401).json({ error: 'Authentication failed' });
    }
  }
};

module.exports = { auth, customerAuth, merchantAuth, adminAuth, requireFullVerification };
