const { sequelize, Sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

// Import model files
const User = require('./User');
const College = require('./College');
const InterviewExperience = require('./InterviewExperience');

// Initialize models with sequelize instance
const db = {
  User: User(sequelize, Sequelize, DataTypes),
  College: College(sequelize, Sequelize, DataTypes),
  InterviewExperience: InterviewExperience(sequelize, Sequelize, DataTypes)
};

// Set up model associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Export models and sequelize instance
module.exports = db;
