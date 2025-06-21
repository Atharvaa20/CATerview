// config/database.js
require('dotenv').config();
const { Sequelize } = require('sequelize');

const getDatabaseConfig = () => {
  // Always log the environment for debugging
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('DATABASE_URL available:', !!process.env.DATABASE_URL);

  if (process.env.DATABASE_URL) {
    console.log('Using DATABASE_URL for connection');
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    };
  }

  console.log('Using individual DB_* variables for connection');
  return {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'caterview',
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  };
};

const dbConfig = getDatabaseConfig();

// Database configuration
const sequelizeConfig = {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    freezeTableName: true,
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

// Add SSL configuration if needed
if (dbConfig.ssl) {
  sequelizeConfig.dialectOptions = {
    ssl: dbConfig.ssl
  };
}

// Initialize Sequelize
let sequelize;

try {
  if (process.env.DATABASE_URL) {
    console.log('Initializing Sequelize with connection string');
    sequelize = new Sequelize(process.env.DATABASE_URL, {
      ...sequelizeConfig,
      dialectOptions: {
        ...sequelizeConfig.dialectOptions,
        ssl: dbConfig.ssl
      }
    });
  } else {
    console.log('Initializing Sequelize with individual config');
    sequelize = new Sequelize(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      {
        ...sequelizeConfig,
        host: dbConfig.host,
        port: dbConfig.port
      }
    );
  }
} catch (error) {
  console.error('❌ Failed to initialize Sequelize:', error.message);
  process.exit(1);
}

// Test the database connection
const testConnection = async () => {
  try {
    console.log('Attempting to authenticate with database...');
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    console.error('Connection details:', {
      database: sequelize.config.database,
      host: sequelize.config.host,
      port: sequelize.config.port,
      user: sequelize.config.username
    });
    process.exit(1);
  }
};

module.exports = {
  sequelize,
  Sequelize,
  testConnection
};