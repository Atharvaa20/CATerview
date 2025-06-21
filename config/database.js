// config/database.js
require('dotenv').config();
const { Sequelize } = require('sequelize');
const { URL } = require('url');

// Parse database configuration from environment variables
const getDatabaseConfig = () => {
  if (process.env.DATABASE_URL) {
    try {
      const dbUrl = new URL(process.env.DATABASE_URL);
      const sslRequired = process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true';
      
      return {
        connectionString: process.env.DATABASE_URL,
        username: dbUrl.username,
        password: dbUrl.password,
        host: dbUrl.hostname,
        port: dbUrl.port || 5432,
        database: dbUrl.pathname.substring(1),
        protocol: dbUrl.protocol.replace(':', ''),
        ssl: sslRequired ? {
          require: true,
          rejectUnauthorized: false
        } : false
      };
    } catch (error) {
      console.error('❌ Error parsing DATABASE_URL:', error.message);
      process.exit(1);
    }
  }

  // Fallback to individual environment variables
  return {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME,
    ssl: process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  };
};

const dbConfig = getDatabaseConfig();

// Database configuration
const sequelizeConfig = {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? (msg) => console.log(`[Sequelize] ${msg}`) : false,
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
    max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX, 10) : 20,
    min: process.env.DB_POOL_MIN ? parseInt(process.env.DB_POOL_MIN, 10) : 2,
    acquire: 30000,
    idle: 10000,
    evict: 10000
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

if (process.env.DATABASE_URL) {
  // Use connection string directly for Railway
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    ...sequelizeConfig,
    dialectOptions: {
      ...sequelizeConfig.dialectOptions,
      ssl: dbConfig.ssl
    }
  });
} else {
  // Use individual config for local development
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      ...sequelizeConfig,
      host: dbConfig.host,
      port: dbConfig.port,
      protocol: dbConfig.protocol
    }
  );
}

// Test the database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    // Log database name for verification
    const [results] = await sequelize.query('SELECT current_database() as db_name');
    console.log(`📊 Connected to database: ${results[0]?.db_name || 'unknown'}`);
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    if (error.original) {
      console.error('Original error:', error.original);
    }
    process.exit(1);
  }
};

// Function to safely close the database connection
const closeConnection = async () => {
  try {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error.message);
  }
};

// Handle application termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT. Closing database connections...');
  await closeConnection();
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = {
  sequelize,
  Sequelize,
  testConnection,
  closeConnection,
  syncModels: async (options = {}) => {
    try {
      await testConnection();
      const syncOptions = {
        alter: process.env.NODE_ENV !== 'production',
        force: false,
        ...options
      };
      
      console.log('🔄 Syncing database...');
      await sequelize.sync(syncOptions);
      console.log('✅ Database synchronized successfully');
      return true;
    } catch (error) {
      console.error('❌ Error syncing database:', error.message);
      if (error.original) {
        console.error('Original error:', error.original);
      }
      throw error;
    }
  }
};