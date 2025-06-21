require('dotenv').config();
const { Sequelize } = require('sequelize');

// Create a custom naming function to ensure consistent table names
const makeTableName = (modelName) => modelName.toLowerCase();

// Database configuration
const dbConfig = {
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  dialect: 'postgres',
  logging: process.env.DB_LOGGING === 'true' ? console.log : false,
  define: {
    freezeTableName: true,
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true,
    // Use the custom naming function for all models
    name: {
      singular: makeTableName,
      plural: makeTableName
    }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  // Add support for SSL if needed (for production)
  dialectOptions: process.env.NODE_ENV === 'production' ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {}
};

// Initialize Sequelize with the configuration
const sequelize = new Sequelize(dbConfig);

// Test the database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
};

// Execute the connection test
testConnection();

// Export the sequelize instance and Sequelize class
module.exports = {
  sequelize,
  Sequelize,
  dbConfig
};
