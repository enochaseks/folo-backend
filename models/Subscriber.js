module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Subscriber', {
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
      },
      name: DataTypes.STRING,
      confirmed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    }, {
      tableName: 'subscribers' // Explicit table name
    });
  };