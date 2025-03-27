const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const rateLimit = require('express-rate-limit');

// Enhanced rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Increased from 5 to 10
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

// Updated routes
router.post('/signup', 
  authLimiter, 
  express.json({ limit: '10kb' }), // Limit request size
  authController.signup
);

router.post('/login', 
  authLimiter,
  express.json({ limit: '10kb' }),
  authController.login
);

router.get('/verify-email', 
  rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20
  }),
  authController.verifyEmail
);

// Add new route for password strength check
router.post('/check-password', (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ 
      success: false,
      message: 'Password is required'
    });
  }

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
});

module.exports = router;
