require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const db = require('./db/index');
const { createServer } = require('http');
const { Server } = require('socket.io');
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

const PORT = process.env.PORT || 5000;

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

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
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
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
// app.use('/api/payments', require('./routes/payments'));
// app.use('/api/kyc', require('./routes/kyc'));
// app.use('/api/webhooks', require('./routes/webhooks'));
// app.use('/api/api-keys', require('./routes/apiKeys'));
// app.use('/api/notifications', require('./routes/notifications'));
// app.use('/api/customer-kyc', require('./routes/customerKYC'));

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
