#!/usr/bin/env node

require('dotenv').config();
const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs').promises;

// Database configuration
const sequelize = new Sequelize({
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    freezeTableName: true,
    underscored: true,
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  },
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

async function runMigrations() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🚀 Starting database migrations...');
    
    // Create migrations table if it doesn't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
        "name" VARCHAR(255) NOT NULL,
        PRIMARY KEY ("name")
      )
    `, { transaction });
    
    // Get all migration files
    const migrationsPath = path.join(__dirname, '../migrations');
    const files = await fs.readdir(migrationsPath);
    const migrationFiles = files
      .filter(file => file.endsWith('.js') && !file.endsWith('.bak'))
      .sort()
      .map(file => ({
        name: file.replace(/\.js$/, ''),
        path: path.join(migrationsPath, file)
      }));
    
    if (migrationFiles.length === 0) {
      console.log('No migration files found.');
      await transaction.commit();
      return;
    }
    
    // Get executed migrations
    const [executedMigrations] = await sequelize.query(
      'SELECT name FROM "SequelizeMeta"',
      { transaction }
    );
    
    const executedMigrationNames = new Set(executedMigrations.map(m => m.name));
    let migrationsRun = 0;
    
    // Run pending migrations
    for (const migration of migrationFiles) {
      if (!executedMigrationNames.has(migration.name)) {
        console.log(`\n🔧 Running migration: ${migration.name}`);
        
        try {
          // Import the migration module
          const migrationModule = require(migration.path);
          
          // Run the migration
          await migrationModule.up({
            sequelize: sequelize,
            queryInterface: {
              sequelize: sequelize,
              query: (sql, options) => {
                return sequelize.query(sql, { ...options, transaction });
              }
            }
          }, Sequelize);
          
          // Record the migration
          await sequelize.query(
            'INSERT INTO "SequelizeMeta" (name) VALUES ($1)',
            { bind: [migration.name], transaction }
          );
          
          console.log(`✅ Migration ${migration.name} completed successfully`);
          migrationsRun++;
        } catch (error) {
          console.error(`❌ Migration ${migration.name} failed:`, error);
          await transaction.rollback();
          process.exit(1);
        }
      } else {
        console.log(`✓ Already executed: ${migration.name}`);
      }
    }
    
    await transaction.commit();
    
    if (migrationsRun > 0) {
      console.log(`\n✨ Successfully ran ${migrationsRun} migration(s)!`);
    } else {
      console.log('\n✅ Database is up to date. No new migrations to run.');
    }
    
  } catch (error) {
    console.error('❌ Migration process failed:', error);
    if (transaction) {
      try {
        await transaction.rollback();
        console.log('Transaction rolled back due to error');
      } catch (rollbackError) {
        console.error('Error during transaction rollback:', rollbackError);
      }
    }
    process.exit(1);
  } finally {
    try {
      await sequelize.close();
    } catch (closeError) {
      console.error('Error closing database connection:', closeError);
    }
  }
}

// Run migrations
runMigrations();
