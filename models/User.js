const bcrypt = require('bcryptjs');

module.exports = (sequelize, Sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'password',
      set(value) {
        if (value) {
          console.log('Hashing password in User model...');
          const salt = bcrypt.genSaltSync(10);
          const hash = bcrypt.hashSync(value, salt);
          console.log('Password hashed successfully');
          this.setDataValue('password', hash);
        } else {
          console.log('Password is empty or null, setting to null');
          this.setDataValue('password', null);
        }
      }
    },
    googleId: {
      type: DataTypes.STRING,
      field: 'google_id',
      allowNull: true,
      unique: true
    },
    resetPasswordOtp: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'reset_password_otp'
    },
    resetPasswordOtpExpires: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'reset_password_otp_expires'
    },
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'user',
      validate: {
        isIn: [['user', 'admin']]
      }
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      field: 'is_verified',
      defaultValue: false
    },
    lastLogin: {
      type: DataTypes.DATE,
      field: 'last_login',
      allowNull: true
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
      field: 'reset_password_token',
      allowNull: true
    },
    resetPasswordExpires: {
      type: DataTypes.DATE,
      field: 'reset_password_expires',
      allowNull: true
    },
    otp: {
      type: DataTypes.STRING,
      allowNull: true
    },
    otpExpires: {
      type: DataTypes.DATE,
      field: 'otp_expires',
      allowNull: true
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
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    paranoid: true,
    defaultScope: {
      attributes: { 
        exclude: ['password', 'googleId', 'resetPasswordToken', 'resetPasswordExpires'] 
      }
    },
    scopes: {
      withPassword: {
        attributes: { include: ['password'] }
      },
      withSensitiveData: {
        attributes: { 
          include: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt', 'password', 'resetPasswordToken', 'resetPasswordExpires'] 
        }
      }
    },
    indexes: [
      {
        unique: true,
        fields: ['email']
      },
      {
        unique: true,
        fields: ['google_id']
      }
    ]
  });

  // Instance methods
  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    // Ensure sensitive fields are never sent to client
    delete values.password;
    delete values.resetPasswordToken;
    delete values.resetPasswordExpires;
    console.log('toJSON called, returning user data (sensitive fields removed)');
    return values;
  };
  
  // Add method to check password
  User.prototype.validPassword = async function(password) {
    try {
      // Ensure we have the password loaded
      let passwordHash = this.getDataValue('password');
      
      // If password is not loaded, try to fetch it
      if (!passwordHash) {
        console.log('Password not loaded, fetching user with password...');
        const userWithPassword = await User.scope('withPassword').findByPk(this.id);
        if (userWithPassword) {
          passwordHash = userWithPassword.getDataValue('password');
        }
      }
      
      if (!passwordHash) {
        console.log('No password hash found for user');
        return false;
      }
      
      const isValid = await bcrypt.compare(password, passwordHash);
      console.log('Password validation result:', isValid);
      return isValid;
    } catch (error) {
      console.error('Error in validPassword:', error);
      return false;
    }
  };

  // Associations
  User.associate = (models) => {
    User.hasMany(models.InterviewExperience, {
      foreignKey: 'userId',
      as: 'interviewExperiences',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  };

  // Hooks
  User.beforeUpdate((user) => {
    user.updatedAt = new Date();
  });

  return User;
};
