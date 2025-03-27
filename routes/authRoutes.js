const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');

// Enhanced rate limiting configuration
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  handler: (req, res) => {
    res.status(429).json({ 
      success: false,
      message: "Too many attempts, please try again later",
      retryAfter: req.rateLimit.resetTime
    });
  },
  skip: (req) => {
    // Skip rate limiting for certain IPs in development
    return process.env.NODE_ENV === 'development' && 
           ['::1', '127.0.0.1'].includes(req.ip);
  }
});

// Input validation middleware
const validateSignup = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('dateOfBirth').isISO8601().withMessage('Invalid date format')
];

// Route definitions
router.post(
  '/signup',
  authLimiter,
  express.json({ limit: '10kb' }), // Prevent large payloads
  validateSignup,
  authController.signup
);

router.post(
  '/login',
  authLimiter,
  express.json({ limit: '10kb' }),
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  authController.login
);

router.get(
  '/verify-email',
  rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    message: {
      success: false,
      message: "Too many verification attempts"
    }
  }),
  authController.verifyEmail
);

// Password strength check endpoint
router.post(
  '/check-password',
  rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50
  }),
  express.json({ limit: '2kb' }), // Very small payload limit
  body('password').isString().notEmpty(),
  (req, res) => {
    try {
      const { password } = req.body;
      
      // Password complexity checks
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumber = /\d/.test(password);
      const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      const isLongEnough = password.length >= 8;

      res.json({
        success: true,
        strength: {
          hasUppercase,
          hasLowercase,
          hasNumber,
          hasSymbol,
          isLongEnough,
          isValid: hasUppercase && hasLowercase && hasNumber && hasSymbol && isLongEnough
        }
      });
    } catch (error) {
      console.error('Password check error:', error);
      res.status(500).json({
        success: false,
        message: "Internal server error during password check"
      });
    }
  }
);

// Error handling middleware for these routes
router.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ 
      success: false,
      message: "Invalid JSON payload"
    });
  }
  next(err);
});

module.exports = router;
