// models/User.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM("buyer", "seller"), defaultValue: "buyer" },
    githubId: { type: DataTypes.STRING, unique: true },
    verificationToken: { type: DataTypes.STRING, allowNull: true },
    isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
    resetToken: { type: DataTypes.STRING, allowNull: true },
    resetTokenExpiry: { type: DataTypes.DATE, allowNull: true },
  }, { timestamps: true });

  return User;
};