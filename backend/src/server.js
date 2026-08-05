require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { createServer } = require('http');
const { Server } = require('socket.io');

const prisma = new PrismaClient();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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

// Export prisma instance before importing routes
module.exports = { prisma, io };

// Routes
app.use('/api/customers', require('./routes/customers'));
app.use('/api/customers/transfers', require('./routes/customerTransfers'));
app.use('/api/customers/payments', require('./routes/customerPayments'));
app.use('/api/customers/payment-methods', require('./routes/customerPaymentMethods'));
app.use('/api/customers/disputes', require('./routes/customerDisputes'));
app.use('/api/customers/support-tickets', require('./routes/customerSupportTickets'));
app.use('/api/customers/withdrawals', require('./routes/customerWithdrawals'));
app.use('/api/merchants', require('./routes/merchants'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/kyc', require('./routes/kyc'));
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/api-keys', require('./routes/apiKeys'));
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
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
