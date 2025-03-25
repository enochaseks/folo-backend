module.exports = (sequelize, DataTypes) => {
    const Review = sequelize.define("Review", {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      businessName: { type: DataTypes.STRING, allowNull: false },
      businessType: { type: DataTypes.STRING, allowNull: false },
      rating: { type: DataTypes.FLOAT, allowNull: false },
      customerService: { type: DataTypes.FLOAT, allowNull: false },
      timeManagement: { type: DataTypes.FLOAT, allowNull: false },
      price: { type: DataTypes.FLOAT, allowNull: false },
      experience: { type: DataTypes.FLOAT, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: false },
      pros: { type: DataTypes.TEXT, allowNull: false },
      cons: { type: DataTypes.TEXT, allowNull: false },
      userId: { type: DataTypes.INTEGER, allowNull: false },
    });
  
    return Review;
  };