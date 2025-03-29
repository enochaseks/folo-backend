const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');

// Rate limiting configuration
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per window
  message: {
    success: false,
    message: "Too many attempts, please try again later"
  },
  skip: (req) => {
    // Skip rate limiting for certain IPs in development
    return process.env.NODE_ENV === 'development' && 
           ['::1', '127.0.0.1'].includes(req.ip);
  }
});

// Input validation middleware
const validateSignup = [
  body('name').trim().isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2-50 characters'),
  body('email').isEmail().normalizeEmail()
    .withMessage('Invalid email address'),
  body('password').isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('dateOfBirth').isISO8601()
    .withMessage('Invalid date format (YYYY-MM-DD)'),
  body('role').optional().isIn(['buyer', 'seller'])
    .withMessage('Invalid role specified')
];

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

// Routes
router.post(
  '/signup',
  authLimiter,
  express.json({ limit: '10kb' }),
  validateSignup,
  authController.signup
);

router.post(
  '/login',
  authLimiter,
  express.json({ limit: '10kb' }),
  validateLogin,
  authController.login
);

router.get(
  '/verify-email',
  rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20
  }),
  authController.verifyEmail
);

router.post(
  '/check-password',
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 50
  }),
  express.json({ limit: '2kb' }),
  body('password').isString().notEmpty(),
  authController.checkPassword
);

// Error handling for these routes
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
