const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const path = require('path');

// Load env variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Secure HTTP headers
app.use(helmet({
  contentSecurityPolicy: false, // disable CSP to avoid interfering with React bundle scripts during dev/build
  crossOriginEmbedderPolicy: false
}));

// Body Parser Middleware
app.use(express.json());

// Enable CORS
app.use(cors());

// Rate Limiter configuration for sensitive authentication endpoints
const isLocalhostOrDev = (req) => {
  const ip = req.ip || req.connection.remoteAddress;
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === '::ffff:127.0.0.1' ||
    process.env.NODE_ENV === 'development'
  );
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 attempts per 15 minutes
  skip: isLocalhostOrDev,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
    errors: null
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiter ONLY to sensitive authentication endpoints
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/farmer/login', authLimiter);
app.use('/api/v1/auth/forgot-password', authLimiter);
app.use('/api/v1/auth/farmer/forgot-password', authLimiter);
app.use('/api/v1/auth/farmer/first-login', authLimiter);

// HTTP request logger middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve uploads folder statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount Routes
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/dairy', require('./routes/dairyRoutes'));
app.use('/api/v1/farmers/portal', require('./routes/farmerPortalRoutes'));
app.use('/api/v1/farmers', require('./routes/farmerRoutes'));
app.use('/api/v1/rates', require('./routes/rateRoutes'));
app.use('/api/v1/collections', require('./routes/collectionRoutes'));
app.use('/api/v1/invoices', require('./routes/invoiceRoutes'));
app.use('/api/v1/payments', require('./routes/paymentRoutes'));
app.use('/api/v1/reports', require('./routes/reportRoutes'));
app.use('/api/v1/notifications', require('./routes/notificationRoutes'));
app.use('/api/v1/users', require('./routes/userRoutes'));
app.use('/api/v1/backup', require('./routes/backupRoutes'));
app.use('/api/v1/security', require('./routes/securityRoutes'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'ANR Dairy Management API is running successfully',
    data: { status: 'healthy', version: 'v1' },
    errors: null 
  });
});

// Centralized Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  // Initialize automatic backup scheduler service
  const { runBackupScheduler } = require('./services/backupScheduler');
  runBackupScheduler();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
