require('dotenv').config();
const { sequelize } = require('../config/database');
const { User, InterviewExperience, College } = require('../models');

async function initializeDatabase() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🔍 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // Sync all models with proper options
    console.log('🔄 Syncing database models...');
    const syncOptions = {
      force: process.env.FORCE_DB_SYNC === 'true',
      alter: process.env.ALTER_DB_SYNC === 'true',
      logging: console.log,
      transaction
    };
    
    console.log('Sync options:', {
      force: syncOptions.force,
      alter: syncOptions.alter
    });
    
    // Sync models one by one to maintain foreign key constraints
    console.log('🔄 Syncing College model...');
    await College.sync(syncOptions);
    
    console.log('🔄 Syncing User model...');
    await User.sync(syncOptions);
    
    console.log('🔄 Syncing InterviewExperience model...');
    await InterviewExperience.sync(syncOptions);
    
    // Set up associations after all models are synced
    console.log('🔗 Setting up model associations...');
    
    // User associations
    User.associate({ InterviewExperience });
    
    // College associations
    College.associate({ InterviewExperience });
    
    // InterviewExperience associations
    InterviewExperience.associate({ User, College });
    
    await transaction.commit();
    console.log('✅ Database initialized successfully!');
    
    // Log all tables in the database
    try {
      const [tables] = await sequelize.query(
        "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
      );
      console.log('\n📊 Database tables:');
      console.table(tables.map(t => ({ 'Table Name': t.tablename })));
    } catch (error) {
      console.warn('⚠️ Could not list tables:', error.message);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    await transaction.rollback();
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the initialization
initializeDatabase();
