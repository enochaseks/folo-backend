const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header or cookie
    let token = req.header('Authorization')?.replace('Bearer ', '') || 
                req.cookies?.accessToken;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'MISSING_TOKEN'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user with matching token version
    const user = await User.findOne({
      where: {
        id: decoded.userId,
        tokenVersion: decoded.version || 0,
        deletedAt: null // Exclude soft-deleted users
      },
      attributes: {
        exclude: ['password', 'verificationToken', 'resetToken']
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed',
        code: 'INVALID_TOKEN'
      });
    }

    // Check if user is verified (if email verification is required)
    if (process.env.REQUIRE_EMAIL_VERIFICATION === 'true' && !user.verified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before accessing this resource',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    
    let statusCode = 401;
    let message = 'Invalid token';
    let code = 'INVALID_TOKEN';

    if (error.name === 'TokenExpiredError') {
      statusCode = 401;
      message = 'Token expired';
      code = 'TOKEN_EXPIRED';
    } else if (error.name === 'JsonWebTokenError') {
      statusCode = 401;
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

/**
 * Authorization middleware
 * Checks if user has required role
 */
const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    // Allow if no roles specified (just checking authentication)
    if (roles.length === 0) return next();
    
    // Check if user has any of the required roles
    if (roles.includes(req.user.role)) {
      return next();
    }

    // Forbidden if no matching roles
    res.status(403).json({
      success: false,
      message: 'Unauthorized access',
      code: 'INSUFFICIENT_PERMISSIONS',
      requiredRoles: roles,
      userRole: req.user.role
    });
  };
};

/**
 * Soft-delete check middleware
 * Prevents access to soft-deleted accounts
 */
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
    console.error('Account check error:', error);
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