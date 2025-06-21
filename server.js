require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const { Op } = require('sequelize');

const app = express();

// Import models
const db = require('./models');
const { User, InterviewExperience, College } = db;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/experiences', require('./routes/experiences'));
app.use('/api/users', require('./routes/users'));

// Admin routes
const adminRouter = require('./routes/admin');
app.use('/api/admin', adminRouter);

// College routes (non-admin)
app.use('/api/colleges', require('./routes/colleges'));

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to CATerview API' });
});

// Initialize database and start server
async function initializeDatabase() {
  try {
    // Test the database connection
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
    
    // Sync models with database
    console.log('🔄 Syncing database models...');
    await sequelize.sync({ alter: process.env.NODE_ENV !== 'production' });
    console.log('✅ Database models synced successfully.');
    
    // Start the server after successful database sync
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
    
    // Handle process termination
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
  } catch (error) {
    console.error('Unable to initialize database:', error);
    process.exit(1);
  }
}

// Graceful shutdown handler
async function gracefulShutdown() {
  console.log('Shutting down gracefully...');
  try {
    await sequelize.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({ 
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Initialize database and start server
initializeDatabase();
