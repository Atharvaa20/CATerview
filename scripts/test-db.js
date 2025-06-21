require('dotenv').config();
const { sequelize } = require('../models');

async function testDatabase() {
  try {
    console.log('🔌 Testing database connection...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Test model synchronization
    console.log('🔄 Syncing models...');
    await sequelize.sync({ alter: true });
    console.log('✅ Models synced successfully.');
    
    // Test raw query
    const [results] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('\n📋 Database tables:');
    results.forEach(row => console.log(`- ${row.table_name}`));
    
    console.log('\n✅ Database test completed successfully!');
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

testDatabase();
