const jwt = require('jsonwebtoken');
const { User } = require('../models');

module.exports = {
  // Authentication middleware
  authenticate: async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({
        where: {
          id: decoded.userId,
          tokenVersion: decoded.version
        }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication failed'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  },

  // Authorization middleware
  authorize: (role) => {
    return (req, res, next) => {
      if (req.user.role !== role) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized access'
        });
      }
      next();
    };
  }
};