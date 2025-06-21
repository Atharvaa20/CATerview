const { models: { User } } = require('../config/database');

async function checkAdmin() {
  try {
    const adminUsers = await User.findAll({
      where: { role: 'admin' }
    });
    
    console.log('Admin users found:', adminUsers.length);
    if (adminUsers.length === 0) {
      console.log('No admin users found. Creating admin user...');
      
      const admin = await User.create({
        name: 'Admin User',
        email: 'admin@caterview.com',
        password: 'adminpassword',
        role: 'admin'
      });
      
      console.log('Admin user created:', admin.id);
    } else {
      console.log('Admin users:', adminUsers.map(u => ({ id: u.id, email: u.email })));
    }
  } catch (error) {
    console.error('Error checking admin users:', error);
  }
}

checkAdmin();
