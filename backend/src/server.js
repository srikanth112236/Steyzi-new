const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

// Import configurations
const connectDB = require('./config/database');
const logger = require('./utils/logger');

// Import services
const paymentService = require('./services/payment.service');
const SubscriptionWebSocketService = require('./services/subscriptionWebSocket.service');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const pgRoutes = require('./routes/pg.routes');
const ticketRoutes = require('./routes/ticket.routes');
const paymentRoutes = require('./routes/payment.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const reportRoutes = require('./routes/report.routes');
const auditRoutes = require('./routes/audit.routes');
const branchRoutes = require('./routes/branch.routes');
const residentRoutes = require('./routes/resident.routes');
const documentRoutes = require('./routes/document.routes');
const qrCodeRoutes = require('./routes/qrCode.routes');
const publicRoutes = require('./routes/public.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const paymentInfoRoutes = require('./routes/paymentInfo.routes');
const superadminRoutes = require('./routes/superadmin.routes');
const activityRoutes = require('./routes/activity.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const subscriptionManagementRoutes = require('./routes/subscriptionManagement.routes');
const subscriptionPaymentRoutes = require('./routes/subscriptionPayment.routes');
const salesRoutes = require('./routes/sales.routes');
const salesManagerRoutes = require('./routes/salesManager.routes');
const securityRoutes = require('./routes/security.routes');
const advancedFeaturesRoutes = require('./routes/advancedFeatures.routes');
const onboardingRoutes = require('./routes/onboarding.routes');
const logsRoutes = require('./routes/logs.routes');
const maintainerRoutes = require('./routes/maintainer.routes');
// Import middleware
const errorHandler = require('./middleware/errorHandler.middleware');
const { apiRateLimit, noRateLimit } = require('./middleware/rateLimit.middleware');
const { optionalAuthenticate } = require('./middleware/auth.middleware');

// Import cron job setups
const { setupVacationCron } = require('./scripts/setup-vacation-cron');
const { setupPaymentStatusCron } = require('./scripts/payment-status-cron');
const { startTrialNotificationCron } = require('./scripts/trial-expiry-notifications');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Set up vacation processor cron job
setupVacationCron();

// Set up payment status cron job
setupPaymentStatusCron();

// Set up trial notification cron job
startTrialNotificationCron();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration - Allow multiple origins for development
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://192.168.0.3:5173',
  
  // Mobile app development ports and IP addresses
  'http://localhost:8081',
  'http://localhost:8082',
  'exp://192.168.0.4:8081',
  'exp://192.168.0.4:8082',
  
  // Allow any local network IP addresses for mobile testing
  /^http:\/\/192\.168\.\d+\.\d+:3000$/,
  /^http:\/\/192\.168\.\d+\.\d+:5173$/,
  /^http:\/\/192\.168\.\d+\.\d+:8081$/,
  /^http:\/\/192\.168\.\d+\.\d+:8082$/,
  /^exp:\/\/192\.168\.\d+\.\d+:8081$/,
  /^exp:\/\/192\.168\.\d+\.\d+:8082$/,
  /^http:\/\/10\.\d+\.\d+\.\d+:3000$/,
  /^http:\/\/10\.\d+\.\d+\.\d+:5173$/,
  /^http:\/\/10\.\d+\.\d+\.\d+:8081$/,
  /^http:\/\/10\.\d+\.\d+\.\d+:8082$/,
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      console.log(`✅ CORS: Allowing origin ${origin}`);
      callback(null, true);
    } else {
      console.log(`❌ CORS: Blocking origin ${origin}`);
      console.log(`📝 CORS: Allowed origins are:`, allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },  
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting - Disabled in development, permissive in production
app.use('/api/', noRateLimit);

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser middleware
app.use(cookieParser());

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'PG Maintenance API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    rateLimiting: process.env.NODE_ENV === 'development' ? 'Disabled (Development)' : 'Enabled (Production)',
    cors: process.env.CORS_ORIGIN || 'http://localhost:3000',
  });
});

// API routes - Order matters! Specific routes before general ones
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pg', pgRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/residents', residentRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/qr', qrCodeRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payment-info', paymentInfoRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/subscription-management', subscriptionManagementRoutes);
app.use('/api/subscription-payments', subscriptionPaymentRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/sales-managers', salesManagerRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/advanced', advancedFeaturesRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/maintainers', maintainerRoutes);

// Add subscription routes
app.use('/api/subscriptions', subscriptionRoutes);

// Optional authentication middleware for all routes
app.use(optionalAuthenticate);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use(errorHandler);

// Start server - listen on all interfaces for mobile development
const server = app.listen(PORT, '0.0.0.0', async () => {  
  
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
  console.log(`📱 Mobile API: http://192.168.0.3:${PORT}/api`);
  console.log(`📧 Email Service: ${process.env.EMAIL_USER || 'Not configured'}`);
  console.log(`🗄️ Database: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
  
  // Initialize payment service to clean up problematic data
  try {
    await paymentService.initialize();
  } catch (error) {
    console.error('⚠️ Payment service initialization failed:', error.message);
    // Continue server startup even if payment service initialization fails
  }
});

// Initialize Socket.IO and attach to app
let subscriptionWebSocketService = null;
try {
  const { Server } = require('socket.io');
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST']
    }
  });

  app.set('io', io);

  // Initialize subscription WebSocket service
  subscriptionWebSocketService = new SubscriptionWebSocketService(io);
  app.set('subscriptionWebSocketService', subscriptionWebSocketService);

  console.log('🚀 Subscription WebSocket service initialized');

} catch (e) {
  console.warn('⚠️ Socket.IO initialization failed:', e?.message);
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');

  // Cleanup subscription WebSocket service
  if (subscriptionWebSocketService) {
    subscriptionWebSocketService.cleanup();
  }

  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');

  // Cleanup subscription WebSocket service
  if (subscriptionWebSocketService) {
    subscriptionWebSocketService.cleanup();
  }

  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', err);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app; 