module.exports = (sequelize, Sequelize, DataTypes) => {
  const College = sequelize.define('College', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    slug: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        notEmpty: true,
        is: /^[a-z0-9-]+$/
      }
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
      defaultValue: Sequelize.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
      defaultValue: Sequelize.NOW
    }
  }, {
    tableName: 'colleges',
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ['slug']
      },
      {
        unique: true,
        fields: ['name']
      }
    ]
  });

  // Associate with InterviewExperience
  College.associate = (models) => {
    College.hasMany(models.InterviewExperience, {
      foreignKey: 'collegeId',
      as: 'interviewExperiences',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  };

  return College;
};
