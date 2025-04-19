const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    let token = req.header('Authorization')?.replace('Bearer ', '') || 
                req.cookies?.accessToken ||
                req.query?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'MISSING_TOKEN'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.scope('withSensitiveData').findOne({
      where: {
        id: decoded.userId,
        tokenVersion: decoded.version || 0,
        deletedAt: null
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed',
        code: 'INVALID_TOKEN'
      });
    }

    if (process.env.REQUIRE_EMAIL_VERIFICATION === 'true' && 
        !user.verified && 
        !user.authProvider) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before accessing this resource',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    let statusCode = 401;
    let message = 'Invalid token';
    let code = 'INVALID_TOKEN';

    if (error.name === 'TokenExpiredError') {
      message = 'Token expired';
      code = 'TOKEN_EXPIRED';
    } else if (error.name === 'JsonWebTokenError') {
      message = 'Malformed token';
      code = 'MALFORMED_TOKEN';
    }

    res.status(statusCode).json({
      success: false,
      message,
      code,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (roles.length === 0) return next();
    if (roles.includes(req.user.role)) return next();
    res.status(403).json({
      success: false,
      message: 'Unauthorized access',
      code: 'INSUFFICIENT_PERMISSIONS',
      requiredRoles: roles,
      userRole: req.user.role
    });
  };
};

const checkAccountActive = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (user?.deletedAt) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Account verification failed'
    });
  }
};

module.exports = {
  authenticate,
  authorize,
  checkAccountActive
};