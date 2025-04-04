module.exports = (sequelize, DataTypes) => {
    const OnboardingData = sequelize.define('OnboardingData', {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      step: {
        type: DataTypes.STRING,
        allowNull: false
      },
      data: {
        type: DataTypes.JSONB,
        allowNull: false
      }
    }, {
      timestamps: true
    });
  
    OnboardingData.associate = (models) => {
      OnboardingData.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    };
  
    return OnboardingData;
  };