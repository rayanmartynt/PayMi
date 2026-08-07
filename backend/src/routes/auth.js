const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const db = require('../db/index');
const { eq, and } = require('drizzle-orm');
const { users, merchants, customers, refreshTokens } = require('../db/schema');
const { auth } = require('../middleware/auth');
const { authLimiter } = require('../server');
const { createAuditLog, AUDIT_ACTIONS } = require('../services/auditLog');
const { passport, generateOAuthToken } = require('../services/oauth');

const router = express.Router();

// Generate refresh token
const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

// Password validation
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return 'Password must be at least 8 characters long';
  }
  if (!hasUpperCase) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!hasLowerCase) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!hasNumbers) {
    return 'Password must contain at least one number';
  }
  if (!hasSpecialChar) {
    return 'Password must contain at least one special character';
  }
  return null;
};

// Register
router.post('/register', 
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('role').optional().isIn(['MERCHANT', 'CUSTOMER', 'ADMIN']).withMessage('Invalid role')
  ],
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, role } = req.body;

    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const existingUserResult = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const existingUser = existingUserResult[0];
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userResult = await db.insert(users).values({
      email,
      password: hashedPassword,
      name,
      role: role || 'CUSTOMER'
    }).returning();
    
    const user = userResult[0];

    // Create merchant or customer based on role
    if (role === 'MERCHANT') {
      await db.insert(merchants).values({
        userId: user.id,
        businessName: name || 'Business',
        phoneNumber: '',
        businessType: 'INDIVIDUAL'
      });
    } else {
      // Default to CUSTOMER
      await db.insert(customers).values({
        userId: user.id,
        name: name || 'Customer',
        phone: ''
      });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = generateRefreshToken();

    // Save refresh token to database (reduced to 24 hours)
    await db.insert(refreshTokens).values({
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

    // Audit log
    await createAuditLog(
      AUDIT_ACTIONS.USER_REGISTER,
      user.id,
      user.role,
      { email: user.email, name: user.name },
      req.ip,
      req.get('user-agent')
    );
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', 
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
    body('password').notEmpty().withMessage('Password is required'),
    body('twoFactorToken').optional().isString().withMessage('2FA token must be a string')
  ],
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, twoFactorToken } = req.body;

    const userResult = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = userResult[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get merchant and customer data
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, user.id)).limit(1);
    const customerResult = await db.select().from(customers).where(eq(customers.userId, user.id)).limit(1);
    user.merchant = merchantResult[0] || null;
    user.customer = customerResult[0] || null;

    // Check if 2FA is enabled (mandatory for all users)
    if (user.twoFactorEnabled) {
      if (!twoFactorToken) {
        return res.status(403).json({ 
          error: 'Two-factor authentication required',
          requiresTwoFactor: true 
        });
      }

      // Verify 2FA token
      const twoFactorService = require('../services/twoFactor');
      const isValid2FA = twoFactorService.verifyToken(user.twoFactorSecret, twoFactorToken);
      
      if (!isValid2FA) {
        return res.status(401).json({ error: 'Invalid two-factor token' });
      }
    } else {
      // 2FA is mandatory - require user to set it up
      return res.status(403).json({ 
        error: 'Two-factor authentication is required. Please set up 2FA first.',
        requiresTwoFactorSetup: true 
      });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = generateRefreshToken();

    // Save refresh token to database (reduced to 24 hours)
    await db.insert(refreshTokens).values({
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    res.json({
      message: 'Login successful',
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
        merchant: user.merchant,
        customer: user.customer
      }
    });

    // Audit log
    await createAuditLog(
      AUDIT_ACTIONS.USER_LOGIN,
      user.id,
      user.role,
      { email: user.email, twoFactorVerified: !!twoFactorToken },
      req.ip,
      req.get('user-agent')
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const userResult = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
    const user = userResult[0];

    // Get merchant and customer data
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, user.id)).limit(1);
    const customerResult = await db.select().from(customers).where(eq(customers.userId, user.id)).limit(1);
    user.merchant = merchantResult[0] || null;
    user.customer = customerResult[0] || null;

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Refresh token
router.post('/refresh', 
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required')
  ],
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Find refresh token in database
    const storedTokenResult = await db.select().from(refreshTokens).where(eq(refreshTokens.token, refreshToken)).limit(1);
    const storedToken = storedTokenResult[0];

    if (!storedToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      await db.delete(refreshTokens).where(eq(refreshTokens.token, refreshToken));
      return res.status(401).json({ error: 'Refresh token expired' });
    }

    // Generate new access token
    const newToken = jwt.sign({ userId: storedToken.userId }, process.env.JWT_SECRET, { expiresIn: '15m' });

    // Generate new refresh token and invalidate old one (24 hours)
    const newRefreshToken = generateRefreshToken();
    await db.transaction(async (tx) => {
      await tx.delete(refreshTokens).where(eq(refreshTokens.token, refreshToken));
      await tx.insert(refreshTokens).values({
        token: newRefreshToken,
        userId: storedToken.userId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });
    });

    res.json({
      token: newToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// Logout
router.post('/logout', auth, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await db.delete(refreshTokens).where(
        and(eq(refreshTokens.token, refreshToken), eq(refreshTokens.userId, req.user.id))
      );
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

// Logout from all devices
router.post('/logout-all', auth, async (req, res) => {
  try {
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, req.user.id));

    res.json({ message: 'Logged out from all devices successfully' });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ error: 'Failed to logout from all devices' });
  }
});

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  async (req, res) => {
    try {
      const token = generateOAuthToken(req.user);
      const refreshToken = generateRefreshToken();

      // Save refresh token to database
      await db.insert(refreshTokens).values({
        token: refreshToken,
        userId: req.user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });

      // Get merchant and customer data
      const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
      const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
      req.user.merchant = merchantResult[0] || null;
      req.user.customer = customerResult[0] || null;

      // Audit log
      await createAuditLog(
        AUDIT_ACTIONS.USER_LOGIN,
        req.user.id,
        req.user.role,
        { email: req.user.email, method: 'google_oauth' },
        req.ip,
        req.get('user-agent')
      );

      // Redirect to frontend with tokens
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/callback?token=${token}&refreshToken=${refreshToken}`);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
    }
  }
);

// Facebook OAuth routes
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login', session: false }),
  async (req, res) => {
    try {
      const token = generateOAuthToken(req.user);
      const refreshToken = generateRefreshToken();

      // Save refresh token to database
      await db.insert(refreshTokens).values({
        token: refreshToken,
        userId: req.user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });

      // Get merchant and customer data
      const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
      const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
      req.user.merchant = merchantResult[0] || null;
      req.user.customer = customerResult[0] || null;

      // Audit log
      await createAuditLog(
        AUDIT_ACTIONS.USER_LOGIN,
        req.user.id,
        req.user.role,
        { email: req.user.email, method: 'facebook_oauth' },
        req.ip,
        req.get('user-agent')
      );

      // Redirect to frontend with tokens
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/callback?token=${token}&refreshToken=${refreshToken}`);
    } catch (error) {
      console.error('Facebook OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
    }
  }
);

module.exports = router;
