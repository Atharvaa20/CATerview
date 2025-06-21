const express = require('express');
const { sequelize, syncModels } = require('./config/database');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'x-auth-token'
  ]
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable pre-flight for all routes

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/colleges', require('./routes/colleges'));
app.use('/api/experiences', require('./routes/experiences'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('\n--- ERROR ---');
  console.error('Timestamp:', new Date().toISOString());
  console.error('Request URL:', req.originalUrl);
  console.error('Request Method:', req.method);
  console.error('Request Body:', req.body);
  console.error('Error Stack:', err.stack);
  console.error('Error Details:', err);
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token. Please log in again!'
    });
  }
  
  // Handle token expiration
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'Your token has expired! Please log in again.'
    });
  }
  
  // Handle validation errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const messages = err.errors.map(e => e.message);
    return res.status(400).json({
      status: 'fail',
      message: 'Validation error',
      errors: messages
    });
  }
  
  // Handle other types of errors
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong!';
  
  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Database and server initialization
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync models based on environment
    if (process.env.NODE_ENV === 'development') {
      await syncModels();
      console.log('🔄 Database synced successfully.');
    } else if (process.env.NODE_ENV === 'production') {
      // In production, use migrations instead of sync
      await sequelize.sync();
      console.log('🚀 Database ready for production.');
    }

    // Start server
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      console.log(`🌍 API: http://localhost:${PORT}/api`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('UNHANDLED REJECTION! 💥 Shutting down...');
      console.error(err);
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
      console.error(err);
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
};

// Handle SIGTERM for graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  sequelize.close().then(() => {
    console.log('💾 Database connection closed.');
    process.exit(0);
  });
});

// Start the server
startServer();

// Export for testing
module.exports = app;
