module.exports = (sequelize, DataTypes) => {
    const Service = sequelize.define("Service", {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      category: { type: DataTypes.STRING, allowNull: false },
      businessName: { type: DataTypes.STRING, allowNull: false },
      location: { type: DataTypes.STRING, allowNull: false },
      phone: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false },
      items: { type: DataTypes.JSON, defaultValue: [] },
      photos: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
      userId: { type: DataTypes.INTEGER, allowNull: false },
    });
  
    return Service;
  };