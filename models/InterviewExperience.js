module.exports = (sequelize, Sequelize, DataTypes) => {
  const InterviewExperience = sequelize.define('InterviewExperience', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        notEmpty: true,
        len: [5, 255]
      }
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true,
        min: 2000,
        max: new Date().getFullYear()
      }
    },
    profile: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        notEmpty: true
      },
      get() {
        const rawValue = this.getDataValue('profile');
        return typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
      },
      set(value) {
        this.setDataValue('profile', typeof value === 'string' ? value : JSON.stringify(value));
      }
    },
    watSummary: {
      type: DataTypes.TEXT,
      field: 'wat_summary',
      allowNull: true,
      validate: {
        len: [0, 5000]
      }
    },
    piQuestions: {
      type: DataTypes.JSONB,
      field: 'pi_questions',
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('piQuestions');
        return rawValue ? (typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue) : [];
      },
      set(value) {
        const questions = Array.isArray(value) ? value : [];
        this.setDataValue('piQuestions', JSON.stringify(questions));
      }
    },
    finalRemarks: {
      type: DataTypes.TEXT,
      field: 'final_remarks',
      allowNull: true,
      validate: {
        len: [0, 1000]
      }
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      field: 'is_verified',
      defaultValue: false
    },
    isAnonymous: {
      type: DataTypes.BOOLEAN,
      field: 'is_anonymous',
      defaultValue: false
    },
    views: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        isInt: true,
        min: 0
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      field: 'user_id',
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    collegeId: {
      type: DataTypes.INTEGER,
      field: 'college_id',
      allowNull: false,
      references: {
        model: 'colleges',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
      defaultValue: DataTypes.NOW
    },
    deletedAt: {
      type: DataTypes.DATE,
      field: 'deleted_at',
      allowNull: true
    }
  }, {
    tableName: 'interview_experiences',
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['college_id']
      },
      {
        fields: ['year']
      },
      {
        fields: ['is_verified']
      },
      {
        fields: ['created_at']
      }
    ],
    defaultScope: {
      where: {
        isVerified: true
      },
      order: [['created_at', 'DESC']]
    },
    scopes: {
      withUnverified: {
        where: {}
      },
      byCollege(collegeId) {
        return {
          where: { collegeId }
        };
      },
      byUser(userId) {
        return {
          where: { userId }
        };
      },
      recent(limit = 10) {
        return {
          limit,
          order: [['created_at', 'DESC']]
        };
      }
    }
  });

  // Instance methods
  InterviewExperience.prototype.incrementViews = async function() {
    return this.increment('views', { by: 1 });
  };

  // Associations
  InterviewExperience.associate = (models) => {
    InterviewExperience.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    InterviewExperience.belongsTo(models.College, {
      foreignKey: 'collegeId',
      as: 'college'
    });
  };

  // Hooks
  InterviewExperience.beforeUpdate((experience) => {
    experience.updatedAt = new Date();
  });

  return InterviewExperience;
};
