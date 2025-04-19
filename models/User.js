const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true // Allow null for social auth users
    },
    firebaseUid: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: true
      }
    },
    age: {
      type: DataTypes.VIRTUAL,
      get() {
        if (!this.dateOfBirth) return null;
        const birthDate = new Date(this.dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return age;
      }
    },
    isAgeVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    ageVerifiedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    verificationMethod: {
      type: DataTypes.ENUM('basic', 'document', 'third_party'),
      allowNull: true
    },
    verificationService: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Name of third-party verification service used (e.g., "onfido")'
    },
    verificationDocumentId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Reference ID from verification service'
    },
    role: {
      type: DataTypes.ENUM('buyer', 'seller', 'admin'),
      defaultValue: 'buyer'
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    verificationToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    verificationTokenExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    resetToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    resetTokenExpiry: {
      type: DataTypes.DATE,
      allowNull: true
    },
    tokenVersion: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    authProvider: {
      type: DataTypes.ENUM('google', 'facebook', 'apple'),
      allowNull: true
    },
    providerId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    onboardingComplete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    paranoid: true, // Enable soft deletes
    defaultScope: {
      attributes: { 
        exclude: [
          'password', 
          'verificationToken', 
          'resetToken',
          'verificationDocumentId'
        ] 
      }
    },
    scopes: {
      withSensitiveData: {
        attributes: { 
          include: [
            'password', 
            'verificationToken', 
            'resetToken',
            'verificationDocumentId'
          ] 
        }
      },
      withAgeVerification: {
        attributes: { 
          include: [
            'dateOfBirth',
            'isAgeVerified',
            'ageVerifiedAt',
            'verificationMethod'
          ] 
        }
      }
    },
    indexes: [
      {
        unique: true,
        fields: ['email']
      },
      {
        fields: ['authProvider', 'providerId']
      },
      {
        fields: ['isAgeVerified']
      },
      {
        fields: ['onboardingComplete']
      }
    ]
  });

  User.associate = (models) => {
    User.hasMany(models.OnboardingData, {
      foreignKey: 'userId',
      as: 'onboardingData'
    });
    
    // Add association for verification documents if you store them
    User.hasMany(models.VerificationDocument, {
      foreignKey: 'userId',
      as: 'verificationDocuments'
    });
  };

  // Instance method to compare passwords
  User.prototype.comparePassword = async function(candidatePassword) {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
  };

  // Instance method to check if user is of age
  User.prototype.isOfAge = function(minAge = 18) {
    return this.age >= minAge;
  };

  // Hook to hash password before creating/updating
  User.beforeSave(async (user) => {
    if (user.changed('password')) {
      user.password = await bcrypt.hash(user.password, 12);
    }
    
    // Update age verification status if DOB changes
    if (user.changed('dateOfBirth') && user.dateOfBirth) {
      const age = user.age;
      if (age < 18) {
        user.isAgeVerified = false;
      }
    }
  });

  return User;
};