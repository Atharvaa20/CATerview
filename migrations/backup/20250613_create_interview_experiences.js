const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('InterviewExperiences', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      collegeName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      profile: {
        type: DataTypes.JSON,
        allowNull: false
      },
      watSummary: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      piQuestions: {
        type: DataTypes.JSON,
        allowNull: false
      },
      finalRemarks: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      upvotes: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE
      }
    });

    // Add indexes
    await queryInterface.addIndex('InterviewExperiences', ['collegeName']);
    await queryInterface.addIndex('InterviewExperiences', ['year']);
    await queryInterface.addIndex('InterviewExperiences', ['isVerified']);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('InterviewExperiences');
  }
};
