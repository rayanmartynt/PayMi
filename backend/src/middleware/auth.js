const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        merchant: true,
        customer: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

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
