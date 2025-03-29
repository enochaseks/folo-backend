const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');

// Enhanced rate limiting configuration
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per window
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable legacy headers
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message: "Too many signup attempts. Please try again later."
    });
  }
});

// Enhanced validation middleware
const validateSignup = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2-50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
    
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Password must contain at least one special character'),
    
  body('dateOfBirth')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      const birthDate = new Date(value);
      const ageDiff = Date.now() - birthDate.getTime();
      const ageDate = new Date(ageDiff);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      return age >= 18;
    })
    .withMessage('You must be at least 18 years old'),
    
  body('role')
    .optional()
    .isIn(['buyer', 'seller'])
    .withMessage('Role must be either buyer or seller')
];

// Routes
router.post(
  '/signup',
  authLimiter, // Apply rate limiting
  express.json(), // Parse JSON bodies
  validateSignup, // Apply validation middleware
  authController.signup // Handle the signup logic
);

// Other auth routes remain unchanged
router.post('/login', authLimiter, express.json(), [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], authController.login);

router.get('/verify-email', authController.verifyEmail);
router.post('/refresh-token', authController.refreshToken);
router.post('/invalidate-tokens', authController.invalidateTokens);

module.exports = router;