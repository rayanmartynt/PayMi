require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const db = require('./db/index');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { connectRedis, setUserOnline, setUserOffline, getUserStatus } = require('./db/redis');
const { setSocketIO } = require('./socket');
const { logError, logInfo } = require('./utils/logger');
// const rabbitMQ = require('./services/rabbitmq');
// const paymentProcessor = require('./services/paymentProcessor');
// const notificationService = require('./services/notificationService');
// const redis = require('./services/redis');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

setSocketIO(io);

const PORT = process.env.PORT || 5000;

// Security headers with CSRF protection
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CSRF protection using SameSite cookies
app.use((req, res, next) => {
  res.cookie('sameSiteCookie', '1', {
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 86400000 // 24 hours
  });
  next();
});

// CORS configuration - restrict to localhost:3000 in development
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting configuration
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for localhost development
      return process.env.NODE_ENV === 'development' && req.ip === '::1' || req.ip === '127.0.0.1'
    }
  });
};

// Different rate limits for different endpoints
const authLimiter = createRateLimiter(15 * 60 * 1000, 5, 'Too many authentication attempts, please try again later'); // 5 requests per 15 minutes
const generalLimiter = createRateLimiter(15 * 60 * 1000, 100, 'Too many requests from this IP, please try again later'); // 100 requests per 15 minutes
const strictLimiter = createRateLimiter(60 * 60 * 1000, 20, 'Too many requests from this IP, please try again later'); // 20 requests per hour
const twoFactorLimiter = createRateLimiter(15 * 60 * 1000, 10, 'Too many 2FA attempts, please try again later'); // 10 requests per 15 minutes

// Apply general rate limiting to all routes
app.use(generalLimiter);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files with CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '../uploads')));

app.use(require('./middleware/sandbox').sandboxMiddleware);
app.use(require('./middleware/i18n').i18nMiddleware);

// Socket.io connection handling
const socketIdToUserId = new Map();
const jwt = require('jsonwebtoken');
const { eq } = require('drizzle-orm');
const { users } = require('./db/schema');

io.on('connection', (socket) => {
  logInfo('SocketConnection', 'Client connected', { socketId: socket.id });

  socket.on('join', async (data) => {
    try {
      logInfo('SocketJoin', 'Join event received', { 
        socketId: socket.id, 
        hasData: !!data, 
        dataType: typeof data,
        dataKeys: data ? Object.keys(data) : []
      });
      
      const { token, userId } = data;
      
      logInfo('SocketJoin', 'Extracted data', { 
        socketId: socket.id, 
        hasToken: !!token, 
        hasUserId: !!userId,
        tokenLength: token ? token.length : 0,
        userId: userId || 'missing'
      });
      
      if (!token || !userId) {
        logInfo('SocketJoin', 'Missing token or userId', { socketId: socket.id });
        socket.emit('error', { message: 'Token and userId are required' });
        // Don't disconnect - let the socket stay connected for other features
        return;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const tokenUserId = decoded.userId || decoded.id;
      
      // Ensure the token's userId matches the requested userId
      if (tokenUserId !== userId) {
        logInfo('SocketJoin', 'Token userId mismatch', { socketId: socket.id, tokenUserId, requestedUserId: userId });
        socket.emit('error', { message: 'Token does not match requested userId' });
        return;
      }

      // Verify user exists in database
      const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!userResult[0]) {
        logInfo('SocketJoin', 'Invalid user', { socketId: socket.id, userId });
        socket.emit('error', { message: 'Invalid user' });
        return;
      }

      socket.join(userId);
      socketIdToUserId.set(socket.id, userId);
      await setUserOnline(userId, socket.id);
      logInfo('SocketJoin', 'User joined room', { userId });
      
      // Broadcast status change to friends
      io.emit('user_status_change', {
        userId,
        online: true,
        lastSeen: Date.now()
      });
    } catch (error) {
      logError('SocketJoin', error, { socketId: socket.id });
      socket.emit('error', { message: 'Authentication failed' });
      socket.disconnect();
    }
  });

  socket.on('disconnect', async () => {
    logInfo('SocketDisconnect', 'Client disconnected', { socketId: socket.id });
    const userId = socketIdToUserId.get(socket.id);
    if (userId) {
      await setUserOffline(userId);
      socketIdToUserId.delete(socket.id);
      
      // Broadcast status change to friends
      io.emit('user_status_change', {
        userId,
        online: false,
        lastSeen: Date.now()
      });
    }
  });
});

// Connect to Redis
connectRedis().then(() => {
  logInfo('Redis', 'Connection established');
}).catch((err) => {
  logError('Redis', err);
  logInfo('Redis', 'Continuing without Redis');
});

// Make io available globally
global.io = io;

// Export db instance and rate limiters before importing routes
module.exports = { db, io, authLimiter, twoFactorLimiter, strictLimiter };

// Routes
app.use('/api/customers', require('./routes/customers'));
app.use('/api/customers/payments', require('./routes/customerPayments'));
app.use('/api/customers/payment-methods', require('./routes/customerPaymentMethods'));
app.use('/api/customers/transfers', require('./routes/customerTransfers'));
app.use('/api/customers/withdrawals', require('./routes/customerWithdrawals'));
app.use('/api/merchants', require('./routes/merchants'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/two-factor', require('./routes/twoFactor'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin/fees', require('./routes/adminFees'));
// Social features
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/friendships', require('./routes/friendships'));
app.use('/api/chats', require('./routes/chats'));
app.use('/api/messaging-settings', require('./routes/messagingSettings'));
app.use('/api/merchant-payments', require('./routes/merchantPayments'));
app.use('/api/money-requests', require('./routes/moneyRequests'));
app.use('/api/wallet-funding', require('./routes/walletFunding'));
// API features
app.use('/api/merchants/api-keys', require('./routes/merchantApiKeys'));
app.use('/api/merchants/webhooks', require('./routes/merchantWebhooks'));
app.use('/api/v1', require('./routes/apiPayments'));
// Temporarily disabled routes that need Prisma->Drizzle conversion
// app.use('/api/customers/disputes', require('./routes/customerDisputes'));
// app.use('/api/customers/support-tickets', require('./routes/customerSupportTickets'));
// app.use('/api/sandbox', require('./routes/sandbox'));
// app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/analytics', require('./routes/analytics'));
// app.use('/api/subscriptions', require('./routes/subscriptions'));
// app.use('/api/split-payments', require('./routes/splitPayments'));
// app.use('/api/escrow', require('./routes/escrow'));
// app.use('/api/qr-codes', require('./routes/qrCodes'));
// app.use('/api/invoices', require('./routes/invoices'));
// app.use('/api/instant-settlement', require('./routes/instantSettlement'));
// app.use('/api/push-notifications', require('./routes/pushNotifications'));
// app.use('/api/quick-payments', require('./routes/quickPayments'));
// app.use('/api/referrals', require('./routes/referrals'));
// app.use('/api/loyalty', require('./routes/loyalty'));
// app.use('/api/promotions', require('./routes/promotions'));
// app.use('/api/currency', require('./routes/currency'));
// app.use('/api/bulk-payments', require('./routes/bulkPayments'));
// app.use('/api/chatbot', require('./routes/chatbot'));
// app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/transactions', require('./routes/transactions'));
// app.use('/api/payments', require('./routes/payments'));
app.use('/api/payments', require('./routes/payments'));
// app.use('/api/kyc', require('./routes/kyc'));
app.use('/api/kyc', require('./routes/kyc'));
// app.use('/api/webhooks', require('./routes/webhooks'));
// app.use('/api/api-keys', require('./routes/apiKeys'));
// app.use('/api/notifications', require('./routes/notifications'));
// app.use('/api/customer-kyc', require('./routes/customerKYC'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/customer-kyc', require('./routes/customerKYC'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'PayMe API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const startServer = async () => {
  // Redis and RabbitMQ disabled - caching and message queue features unavailable
  console.warn('Redis and RabbitMQ disabled - caching and message queue features unavailable');
  
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
