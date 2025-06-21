const { models: { User } } = require('../config/database');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create admin user
    const hashedPassword = await queryInterface.sequelize.query(
      `SELECT crypt('admin123', gen_salt('bf')) as password`
    );
    
    await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword[0][0].password,
      role: 'admin',
      isVerified: true
    });

    // Create sample users
    const sampleUsers = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: await queryInterface.sequelize.query(
          `SELECT crypt('password123', gen_salt('bf')) as password`
        ),
        role: 'user',
        isVerified: true
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: await queryInterface.sequelize.query(
          `SELECT crypt('password123', gen_salt('bf')) as password`
        ),
        role: 'user',
        isVerified: true
      }
    ];

    await Promise.all(sampleUsers.map(async (user) => {
      await User.create({
        ...user,
        password: user.password[0][0].password
      });
    }));
  },

  down: async (queryInterface, Sequelize) => {
    await User.destroy({ where: {} });
  }
};
