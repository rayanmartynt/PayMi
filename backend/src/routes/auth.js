const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'MERCHANT'
      }
    });

    // Create merchant or customer based on role
    if (role === 'MERCHANT') {
      await prisma.merchant.create({
        data: {
          userId: user.id,
          businessName: name || 'Business',
          phoneNumber: '',
          businessType: 'INDIVIDUAL'
        }
      });
    } else if (role === 'CUSTOMER') {
      await prisma.customer.create({
        data: {
          userId: user.id,
          name: name || 'Customer',
          phone: ''
        }
      });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, twoFactorToken } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        merchant: true,
        customer: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if 2FA is enabled
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
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
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
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        merchant: true,
        customer: true
      }
    });

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

module.exports = router;
