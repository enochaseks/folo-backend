module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { 
      type: DataTypes.STRING, 
      allowNull: false, 
      unique: true,
      validate: { isEmail: true }
    },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { 
      type: DataTypes.ENUM("buyer", "seller"), 
      defaultValue: "buyer" 
    },
    githubId: { type: DataTypes.STRING, unique: true },
    verificationToken: { type: DataTypes.STRING },
    isVerified: { 
      type: DataTypes.BOOLEAN, 
      defaultValue: false 
    },
    resetToken: { type: DataTypes.STRING },
    resetTokenExpiry: { type: DataTypes.DATE },
    tokenVersion: { 
      type: DataTypes.INTEGER, 
      defaultValue: 0 
    },
    deletionScheduled: { 
      type: DataTypes.BOOLEAN, 
      defaultValue: false 
    },
    deletionDate: { type: DataTypes.DATE }
  }, { 
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    },
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    },
    instanceMethods: {
      validPassword: async function(password) {
        return await bcrypt.compare(password, this.password);
      }
    }
  });
 

  return User;
};
