require('dotenv').config();
const { Sequelize } = require('sequelize');

async function resetDatabase() {
  // Create a new connection without using the models to avoid issues
  const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      dialect: 'postgres',
      logging: console.log,
      define: {
        freezeTableName: true,
        underscored: true,
        quoteIdentifiers: false
      }
    }
  );

  try {
    console.log('🔁 Resetting database...');
    
    // Disable foreign key checks
    await sequelize.query('SET session_replication_role = \'replica\'');
    
    // Get all tables in the public schema
    const [tables] = await sequelize.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
    );
    
    // Drop each table
    for (const table of tables) {
      const tableName = table.tablename;
      if (tableName !== 'spatial_ref_sys') { // Skip PostGIS system table
        try {
          console.log(`Dropping table: ${tableName}`);
          await sequelize.query(`DROP TABLE IF EXISTS \"${tableName}\" CASCADE`);
        } catch (error) {
          console.error(`Error dropping table ${tableName}:`, error.message);
        }
      }
    }
    
    // Drop enum types
    try {
      await sequelize.query('DROP TYPE IF EXISTS enum_users_role');
    } catch (error) {
      console.error('Error dropping enum types:', error.message);
    }
    
    // Re-enable foreign key checks
    await sequelize.query('SET session_replication_role = \'origin\'');
    
    console.log('✅ Database reset successfully!');
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the reset function
resetDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
