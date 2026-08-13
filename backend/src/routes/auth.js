const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const db = require('../db/index');
const { eq, and, gt, or } = require('drizzle-orm');
const { users, merchants, customers, refreshTokens } = require('../db/schema');
const { auth } = require('../middleware/auth');
const { authLimiter } = require('../server');
const { createAuditLog, AUDIT_ACTIONS } = require('../services/auditLog');
const { passport, generateOAuthToken } = require('../services/oauth');
const { sendVerificationEmail } = require('../services/email');
const smsService = require('../services/sms');

const router = express.Router();

// Generate refresh token
const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

// Generate 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
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

// Initiate Registration (send verification code first)
router.post('/initiate-registration',
  authLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('verificationMethod').isIn(['email', 'phone']).withMessage('Invalid verification method'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Invalid email address'),
    body('phoneNumber').optional().notEmpty().withMessage('Phone number is required'),
    body('role').optional().isIn(['MERCHANT', 'CUSTOMER', 'ADMIN']).withMessage('Invalid role')
  ],
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, password, verificationMethod, email, phoneNumber, role } = req.body;

    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    // Check if email is already registered
    if (verificationMethod === 'email') {
      const existingUserResult = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingUserResult[0]) {
        return res.status(400).json({ error: 'Email already registered' });
      }
    }

    // Check if phone number is already registered
    if (verificationMethod === 'phone') {
      // Validate phone number format first
      if (!smsService.isValidPhoneNumber(phoneNumber)) {
        return res.status(400).json({ 
          error: 'Invalid phone number format. Please use Sierra Leone format (e.g., 076123456 or +23276123456)' 
        });
      }
      
      const formattedPhone = smsService.formatPhoneNumber(phoneNumber);
      const existingPhoneResult = await db.select().from(users).where(eq(users.phoneNumber, formattedPhone)).limit(1);
      if (existingPhoneResult[0]) {
        return res.status(400).json({ error: 'Phone number already registered' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store registration data temporarily (in a real app, use Redis or similar)
    const registrationData = {
      name,
      password: hashedPassword,
      role: role || 'CUSTOMER',
      email: verificationMethod === 'email' ? email : null,
      phoneNumber: verificationMethod === 'phone' ? smsService.formatPhoneNumber(phoneNumber) : null,
      verificationCode,
      verificationCodeExpires,
      verificationMethod
    };

    // Store in memory (for production, use Redis with TTL)
    const tempToken = crypto.randomBytes(32).toString('hex');
    global.pendingRegistrations = global.pendingRegistrations || {};
    global.pendingRegistrations[tempToken] = registrationData;

    // Send verification code
    if (verificationMethod === 'email') {
      await sendVerificationEmail(email, verificationCode);
    } else {
      const formattedPhone = smsService.formatPhoneNumber(phoneNumber);
      await smsService.sendVerificationCode(formattedPhone, verificationCode);
    }

    res.json({
      message: 'Verification code sent successfully',
      tempToken,
      verificationMethod,
      contact: verificationMethod === 'email' ? email : phoneNumber
    });
  } catch (error) {
    console.error('Initiate registration error:', error);
    res.status(500).json({ error: 'Failed to initiate registration' });
  }
});

// Register
router.post('/register', 
  authLimiter,
  [
    body('email').optional().isEmail().normalizeEmail().withMessage('Invalid email address'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('role').optional().isIn(['MERCHANT', 'CUSTOMER', 'ADMIN']).withMessage('Invalid role'),
    body('phoneNumber').optional().notEmpty().withMessage('Phone number is required')
  ],
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, role, phoneNumber } = req.body;

    // Require at least email or phone
    if (!email && !phoneNumber) {
      return res.status(400).json({ error: 'Email or phone number is required' });
    }

    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    // Check if email is already registered (only if email is provided)
    if (email) {
      const existingUserResult = await db.select().from(users).where(eq(users.email, email)).limit(1);
      const existingUser = existingUserResult[0];
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }
    }

    // Check if phone number is already registered (only if phone is provided)
    if (phoneNumber) {
      // Validate phone number format first
      if (!smsService.isValidPhoneNumber(phoneNumber)) {
        return res.status(400).json({ 
          error: 'Invalid phone number format. Please use Sierra Leone format (e.g., 076123456 or +23276123456)' 
        });
      }
      
      const formattedPhone = smsService.formatPhoneNumber(phoneNumber);
      const existingPhoneResult = await db.select().from(users).where(eq(users.phoneNumber, formattedPhone)).limit(1);
      if (existingPhoneResult[0]) {
        return res.status(400).json({ error: 'Phone number already registered' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const userResult = await db.insert(users).values({
      email: email || null,
      password: hashedPassword,
      name,
      role: role || 'CUSTOMER',
      phoneNumber: phoneNumber ? smsService.formatPhoneNumber(phoneNumber) : null,
      emailVerified: !!email, // Auto-verify if email provided during registration
      phoneVerified: !!phoneNumber, // Auto-verify if phone provided during registration
      verificationCode,
      verificationCodeExpires
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

    // Send verification email only if email was provided
    if (email) {
      try {
        await sendVerificationEmail(email, verificationCode);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Continue with registration even if email fails
      }
    }

    res.status(201).json({
      message: email 
        ? 'User registered successfully. Please check your email for verification code.'
        : 'User registered successfully. Please add and verify your email in your dashboard.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified
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

// Verify Email (for authenticated users in dashboard)
router.post('/verify-email',
  authLimiter,
  auth,
  [
    body('code').notEmpty().withMessage('Verification code is required')
  ],
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { code } = req.body;
    const user = req.user;

    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Check if code matches and is not expired
    if (user.verificationCode !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (!user.verificationCodeExpires || new Date(user.verificationCodeExpires) < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    // Mark email as verified
    await db.update(users)
      .set({ 
        emailVerified: true,
        verificationCode: null,
        verificationCodeExpires: null
      })
      .where(eq(users.id, user.id));

    // Audit log
    await createAuditLog(
      AUDIT_ACTIONS.EMAIL_VERIFIED,
      user.id,
      user.role,
      { email: user.email },
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: true,
        phoneVerified: user.phoneVerified,
        phoneNumber: user.phoneNumber
      }
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Email verification failed' });
  }
});

// Verify Email (public endpoint for registration flow)
router.post('/verify-email-public',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Verification code must be 6 digits')
  ],
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, code } = req.body;

    const userResult = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = userResult[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Check if code matches and is not expired
    if (user.verificationCode !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (!user.verificationCodeExpires || new Date(user.verificationCodeExpires) < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    // Mark email as verified
    await db.update(users)
      .set({ 
        emailVerified: true,
        verificationCode: null,
        verificationCodeExpires: null
      })
      .where(eq(users.id, user.id));

    // Generate tokens after verification
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30m' });
    const refreshToken = generateRefreshToken();

    await db.insert(refreshTokens).values({
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    // Audit log
    await createAuditLog(
      AUDIT_ACTIONS.EMAIL_VERIFIED,
      user.id,
      user.role,
      { email: user.email },
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      message: 'Email verified successfully',
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: true
      }
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Email verification failed' });
  }
});

// Resend Verification Code (for authenticated users in dashboard)
router.post('/resend-verification',
  authLimiter,
  auth,
  [
    body('email').optional().notEmpty().withMessage('Email is required')
  ],
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // If no email provided, use authenticated user's email
    let userEmail = req.body.email;
    let user;
    
    if (!userEmail) {
      userEmail = req.user.email;
      user = req.user;
    } else {
      const userResult = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);
      user = userResult[0];
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has an email address
    if (!userEmail) {
      return res.status(400).json({ 
        error: 'No email address associated with your account. Please add an email address to verify.' 
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);

    await db.update(users)
      .set({ 
        verificationCode,
        verificationCodeExpires
      })
      .where(eq(users.id, user.id));

    // Send verification email
    await sendVerificationEmail(userEmail, verificationCode);

    // Audit log
    await createAuditLog(
      AUDIT_ACTIONS.EMAIL_VERIFICATION_SENT,
      user.id,
      user.role,
      { email: userEmail },
      req.ip,
      req.headers['user-agent']
    );

    res.json({ message: 'Verification code sent successfully' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification code' });
  }
});

// Complete Registration with Phone Verification
router.post('/complete-registration-phone',
  authLimiter,
  [
    body('tempToken').notEmpty().withMessage('Temporary token is required'),
    body('code').notEmpty().withMessage('Verification code is required')
  ],
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tempToken, code } = req.body;

    // Retrieve pending registration data
    const pendingData = global.pendingRegistrations?.[tempToken];
    if (!pendingData) {
      return res.status(400).json({ error: 'Invalid or expired registration token' });
    }

    // Verify the code
    if (pendingData.verificationCode !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (new Date() > new Date(pendingData.verificationCodeExpires)) {
      delete global.pendingRegistrations[tempToken];
      return res.status(400).json({ error: 'Verification code expired' });
    }

    // Create the user account
    const userResult = await db.insert(users).values({
      name: pendingData.name,
      password: pendingData.password,
      role: pendingData.role,
      phoneNumber: pendingData.phoneNumber,
      email: pendingData.email || null, // Null email if phone signup
      phoneVerified: true,
      emailVerified: false, // Email must be verified later in dashboard
    }).returning();

    const user = userResult[0];

    // Create merchant or customer based on role
    if (pendingData.role === 'MERCHANT') {
      await db.insert(merchants).values({
        userId: user.id,
        businessName: pendingData.name,
        phoneNumber: pendingData.phoneNumber || '',
        businessType: 'INDIVIDUAL'
      });
    } else {
      await db.insert(customers).values({
        userId: user.id,
        name: pendingData.name,
        phone: pendingData.phoneNumber || null,
        balance: '0',
        kycVerified: false
      });
    }

    // Clean up pending registration
    delete global.pendingRegistrations[tempToken];

    // Generate tokens
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '30m' }
    );

    const refreshToken = generateRefreshToken();

    await db.insert(refreshTokens).values({
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    // Audit log
    await createAuditLog(
      AUDIT_ACTIONS.USER_REGISTER,
      user.id,
      user.role,
      { verificationMethod: 'phone', phoneNumber: pendingData.phoneNumber },
      req.ip,
      req.headers['user-agent']
    );

    // Send welcome email if email is provided
    if (user.email) {
      try {
        const emailService = require('../services/email');
        await emailService.sendWelcomeEmail(user.email, user.name);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail registration if email fails
      }
    }

    res.json({
      message: 'Registration successful',
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phoneVerified: true,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    console.error('Complete registration phone error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Complete Registration with Email Verification
router.post('/complete-registration-email',
  authLimiter,
  [
    body('tempToken').notEmpty().withMessage('Temporary token is required'),
    body('code').notEmpty().withMessage('Verification code is required')
  ],
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tempToken, code } = req.body;

    // Retrieve pending registration data
    const pendingData = global.pendingRegistrations?.[tempToken];
    if (!pendingData) {
      return res.status(400).json({ error: 'Invalid or expired registration token' });
    }

    // Verify the code
    if (pendingData.verificationCode !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (new Date() > new Date(pendingData.verificationCodeExpires)) {
      delete global.pendingRegistrations[tempToken];
      return res.status(400).json({ error: 'Verification code expired' });
    }

    // Create the user account
    const userResult = await db.insert(users).values({
      name: pendingData.name,
      password: pendingData.password,
      role: pendingData.role,
      email: pendingData.email,
      phoneNumber: pendingData.phoneNumber,
      emailVerified: true,
      phoneVerified: false, // Phone must be verified later in dashboard
    }).returning();

    const user = userResult[0];

    // Create merchant or customer based on role
    if (pendingData.role === 'MERCHANT') {
      await db.insert(merchants).values({
        userId: user.id,
        businessName: pendingData.name,
        phoneNumber: pendingData.phoneNumber || '',
        businessType: 'INDIVIDUAL'
      });
    } else {
      await db.insert(customers).values({
        userId: user.id,
        name: pendingData.name,
        phone: pendingData.phoneNumber || null,
        balance: '0',
        kycVerified: false
      });
    }

    // Clean up pending registration
    delete global.pendingRegistrations[tempToken];

    // Generate tokens
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '30m' }
    );

    const refreshToken = generateRefreshToken();

    await db.insert(refreshTokens).values({
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    // Audit log
    await createAuditLog(
      AUDIT_ACTIONS.USER_REGISTER,
      user.id,
      user.role,
      { verificationMethod: 'email', email: pendingData.email },
      req.ip,
      req.headers['user-agent']
    );

    // Send welcome email
    try {
      const emailService = require('../services/email');
      await emailService.sendWelcomeEmail(user.email, user.name);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail registration if email fails
    }

    res.json({
      message: 'Registration successful',
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: true,
        phoneVerified: user.phoneVerified
      }
    });
  } catch (error) {
    console.error('Complete registration email error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail
    });
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// Resend Verification Code (public endpoint for registration flow)
router.post('/resend-verification-public',
  authLimiter,
  [
    body('tempToken').notEmpty().withMessage('Temporary token is required')
  ],
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tempToken } = req.body;

    // Retrieve pending registration data
    const pendingData = global.pendingRegistrations?.[tempToken];
    if (!pendingData) {
      return res.status(400).json({ error: 'Invalid or expired registration token' });
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);

    // Update pending data with new code
    pendingData.verificationCode = verificationCode;
    pendingData.verificationCodeExpires = verificationCodeExpires;
    global.pendingRegistrations[tempToken] = pendingData;

    // Send verification code
    if (pendingData.verificationMethod === 'email') {
      await sendVerificationEmail(pendingData.email, verificationCode);
    } else {
      await smsService.sendVerificationCode(pendingData.phoneNumber, verificationCode);
    }

    res.json({
      message: 'Verification code sent successfully',
      contact: pendingData.verificationMethod === 'email' ? pendingData.email : pendingData.phoneNumber
    });
  } catch (error) {
    console.error('Resend verification public error:', error);
    res.status(500).json({ error: 'Failed to resend verification code' });
  }
});

// Send Phone Verification Code (for authenticated users in dashboard)
router.post('/send-phone-verification',
  authLimiter,
  auth,
  [
    body('phoneNumber').optional().notEmpty().withMessage('Phone number is required')
  ],
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Use authenticated user's phone number if not provided
    let phoneNumber = req.body.phoneNumber;
    if (!phoneNumber) {
      phoneNumber = req.user.phoneNumber;
    }
    
    const formattedPhone = smsService.formatPhoneNumber(phoneNumber);

    // Check if user exists with this phone number (use authenticated user)
    const user = req.user;

    if (!user.phoneNumber) {
      return res.status(400).json({ error: 'No phone number associated with your account' });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with verification code
    await db.update(users)
      .set({
        phoneVerificationCode: verificationCode,
        phoneVerificationCodeExpires: expiresAt
      })
      .where(eq(users.id, user.id));

    // Send SMS
    const smsSent = await smsService.sendVerificationCode(formattedPhone, verificationCode);

    if (!smsSent) {
      return res.status(500).json({ error: 'Failed to send SMS' });
    }

    // Audit log
    await createAuditLog(
      AUDIT_ACTIONS.PHONE_VERIFICATION_SENT,
      user.id,
      user.role,
      { phoneNumber: formattedPhone },
      req.ip,
      req.headers['user-agent']
    );

    res.json({ message: 'Verification code sent successfully' });
  } catch (error) {
    console.error('Send phone verification error:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

// Verify Phone Number (for authenticated users in dashboard)
router.post('/verify-phone',
  authLimiter,
  auth,
  [
    body('code').notEmpty().withMessage('Verification code is required')
  ],
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { code } = req.body;
    const user = req.user;

    if (!user.phoneNumber) {
      return res.status(400).json({ error: 'No phone number associated with your account' });
    }

    // Check if code is valid and not expired
    if (!user.phoneVerificationCode || user.phoneVerificationCode !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (new Date() > new Date(user.phoneVerificationCodeExpires)) {
      return res.status(400).json({ error: 'Verification code expired' });
    }

    // Mark phone as verified
    await db.update(users)
      .set({
        phoneVerified: true,
        phoneVerificationCode: null,
        phoneVerificationCodeExpires: null
      })
      .where(eq(users.id, user.id));

    // Audit log
    await createAuditLog(
      AUDIT_ACTIONS.PHONE_VERIFIED,
      user.id,
      user.role,
      { phoneNumber: user.phoneNumber },
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      message: 'Phone verified successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phoneVerified: true,
        emailVerified: user.emailVerified,
        phoneNumber: user.phoneNumber
      }
    });
  } catch (error) {
    console.error('Verify phone error:', error);
    res.status(500).json({ error: 'Phone verification failed' });
  }
});

// Login
router.post('/login',
  authLimiter,
  [
    body('identifier').notEmpty().withMessage('Email or phone number is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body('twoFactorToken').optional().isString().withMessage('2FA token must be a string')
  ],
  async (req, res) => {
  try {
    const { identifier, password, twoFactorToken } = req.body;

    if (!identifier) {
      return res.status(400).json({ error: 'Email or phone number is required' });
    }

    // Check if identifier is email or phone number
    const isEmail = identifier.includes('@');
    let userResult;
    
    if (isEmail) {
      userResult = await db.select().from(users).where(eq(users.email, identifier)).limit(1);
    } else {
      const formattedPhone = smsService.formatPhoneNumber(identifier);
      userResult = await db.select().from(users).where(eq(users.phoneNumber, formattedPhone)).limit(1);
    }
    
    const user = userResult[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if phone is verified (only if user has a phone number)
    if (user.phoneNumber && !user.phoneVerified) {
      return res.status(403).json({ 
        error: 'Phone not verified. Please verify your phone first.',
        requiresPhoneVerification: true,
        phoneNumber: user.phoneNumber
      });
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
    }
    // Allow login without 2FA if user hasn't set it up yet
    // User will be prompted to set up 2FA after first login

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30m' });
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
    const newToken = jwt.sign({ userId: storedToken.userId }, process.env.JWT_SECRET, { expiresIn: '30m' });

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

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    // Get merchant and customer data
    const merchantResult = await db.select().from(merchants).where(eq(merchants.userId, req.user.id)).limit(1);
    const customerResult = await db.select().from(customers).where(eq(customers.userId, req.user.id)).limit(1);
    req.user.merchant = merchantResult[0] || null;
    req.user.customer = customerResult[0] || null;

    const profileData = {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      emailVerified: req.user.emailVerified,
      twoFactorEnabled: req.user.twoFactorEnabled,
      merchant: req.user.merchant,
      customer: req.user.customer
    };
    res.json(profileData);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
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
