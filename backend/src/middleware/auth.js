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
    
    const userResult = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);
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
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
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

module.exports = { auth, customerAuth, merchantAuth, adminAuth };
