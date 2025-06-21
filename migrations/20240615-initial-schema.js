'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Creating initial database schema...');
      
      // Create Users table
      await queryInterface.sequelize.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          google_id VARCHAR(255) UNIQUE,
          role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
          is_verified BOOLEAN NOT NULL DEFAULT false,
          last_login TIMESTAMP WITH TIME ZONE,
          reset_password_token VARCHAR(255),
          reset_password_expires TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          deleted_at TIMESTAMP WITH TIME ZONE
        )
      `, { transaction });
      
      console.log('Created users table');
      
      // Create Colleges table
      await queryInterface.sequelize.query(`
        CREATE TABLE IF NOT EXISTS colleges (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          slug VARCHAR(255) NOT NULL UNIQUE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          deleted_at TIMESTAMP WITH TIME ZONE
        )
      `, { transaction });
      
      console.log('Created colleges table');
      
      // Create Interview Experiences table
      await queryInterface.sequelize.query(`
        CREATE TABLE IF NOT EXISTS interview_experiences (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          year INTEGER NOT NULL,
          profile JSONB NOT NULL DEFAULT '{}'::jsonb,
          wat_summary TEXT NOT NULL DEFAULT '',
          pi_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
          final_remarks TEXT NOT NULL DEFAULT '',
          is_verified BOOLEAN NOT NULL DEFAULT false,
          is_anonymous BOOLEAN NOT NULL DEFAULT false,
          views INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          deleted_at TIMESTAMP WITH TIME ZONE,
          CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          CONSTRAINT fk_college FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
        )
      `, { transaction });
      
      console.log('Created interview_experiences table');
      
      // Create indexes
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_interview_experiences_college_id ON interview_experiences(college_id);
        CREATE INDEX IF NOT EXISTS idx_interview_experiences_user_id ON interview_experiences(user_id);
        CREATE INDEX IF NOT EXISTS idx_interview_experiences_year ON interview_experiences(year);
        CREATE INDEX IF NOT EXISTS idx_interview_experiences_created_at ON interview_experiences(created_at);
      `, { transaction });
      
      console.log('Created indexes');
      
      await transaction.commit();
      console.log('✅ Database schema created successfully!');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error creating database schema:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Dropping database schema...');
      
      // Drop tables in reverse order to respect foreign key constraints
      await queryInterface.sequelize.query('DROP TABLE IF EXISTS interview_experiences CASCADE', { transaction });
      await queryInterface.sequelize.query('DROP TABLE IF EXISTS colleges CASCADE', { transaction });
      await queryInterface.sequelize.query('DROP TABLE IF EXISTS users CASCADE', { transaction });
      
      await transaction.commit();
      console.log('✅ Database schema dropped successfully!');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error dropping database schema:', error);
      throw error;
    }
  }
};
