'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Starting schema update...');
      
      // 1. Get table info using raw query
      const [tables] = await queryInterface.sequelize.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
      );
      
      const tableNames = tables.map(t => t.table_name);
      
      // 2. Check if interview_experiences table exists
      if (tableNames.includes('interview_experiences')) {
        // Check and add columns if they don't exist
        const [columns] = await queryInterface.sequelize.query(
          "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'interview_experiences'"
        );
        
        const columnNames = columns.map(c => c.column_name);
        
        // Add year column if it doesn't exist
        if (!columnNames.includes('year')) {
          await queryInterface.sequelize.query(
            'ALTER TABLE "interview_experiences" ADD COLUMN IF NOT EXISTS year INTEGER NOT NULL DEFAULT 2023',
            { transaction }
          );
          console.log('Added year column to interview_experiences table');
        }
        
        // Add profile column if it doesn't exist
        if (!columnNames.includes('profile')) {
          await queryInterface.sequelize.query(
            `ALTER TABLE "interview_experiences" 
             ADD COLUMN IF NOT EXISTS profile JSONB NOT NULL 
             DEFAULT '{"stream":"","category":"general","workExperience":0,"catPercentile":0}'`,
            { transaction }
          );
          console.log('Added profile column to interview_experiences table');
        }
        
        // Add wat_summary column if it doesn't exist
        if (!columnNames.includes('wat_summary')) {
          await queryInterface.sequelize.query(
            'ALTER TABLE "interview_experiences" ADD COLUMN IF NOT EXISTS wat_summary TEXT NOT NULL DEFAULT \'\'',
            { transaction }
          );
          console.log('Added wat_summary column to interview_experiences table');
        }
        
        // Add pi_questions column if it doesn't exist
        if (!columnNames.includes('pi_questions')) {
          await queryInterface.sequelize.query(
            'ALTER TABLE "interview_experiences" ADD COLUMN IF NOT EXISTS pi_questions JSONB NOT NULL DEFAULT \'[]\'',
            { transaction }
          );
          console.log('Added pi_questions column to interview_experiences table');
        }
        
        // Add final_remarks column if it doesn't exist
        if (!columnNames.includes('final_remarks')) {
          await queryInterface.sequelize.query(
            'ALTER TABLE "interview_experiences" ADD COLUMN IF NOT EXISTS final_remarks TEXT NOT NULL DEFAULT \'\'',
            { transaction }
          );
          console.log('Added final_remarks column to interview_experiences table');
        }
        
        // Remove title and description columns if they exist
        if (columnNames.includes('title')) {
          await queryInterface.sequelize.query(
            'ALTER TABLE "interview_experiences" DROP COLUMN IF EXISTS title',
            { transaction }
          );
          console.log('Removed title column from interview_experiences table');
        }
        
        if (columnNames.includes('description')) {
          await queryInterface.sequelize.query(
            'ALTER TABLE "interview_experiences" DROP COLUMN IF EXISTS description',
            { transaction }
          );
          console.log('Removed description column from interview_experiences table');
        }
      }
      
      // 3. Update colleges table if it exists
      if (tableNames.includes('colleges')) {
        const [columns] = await queryInterface.sequelize.query(
          "SELECT column_name FROM information_schema.columns WHERE table_name = 'colleges'"
        );
        
        const columnNames = columns.map(c => c.column_name);
        
        // Remove unnecessary columns
        const columnsToRemove = ['description', 'location', 'website'];
        for (const column of columnsToRemove) {
          if (columnNames.includes(column)) {
            await queryInterface.sequelize.query(
              `ALTER TABLE "colleges" DROP COLUMN IF EXISTS "${column}"`,
              { transaction }
            );
            console.log(`Removed ${column} column from colleges table`);
          }
        }
      }
      
      await transaction.commit();
      console.log('Schema update completed successfully!');
    } catch (error) {
      await transaction.rollback();
      console.error('Schema update failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // This is a one-way migration, so we don't implement a down migration
    console.log('This migration cannot be rolled back automatically.');
  }
};
