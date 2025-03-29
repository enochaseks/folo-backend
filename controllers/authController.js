const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Op } = require('../models');
const nodemailer = require('nodemailer');

// Email Service Initialization
let emailService;

try {
  // Try to use Brevo API first
  const brevo = require('@getbrevo/brevo');
  const defaultClient = brevo.ApiClient.instance;
  const apiKey = defaultClient.authentications['api-key'];
  apiKey.apiKey = process.env.BREVO_API_KEY;
  
  emailService = {
    sendVerificationEmail: async (email, name, token) => {
      const apiInstance = new brevo.TransactionalEmailsApi();
      await apiInstance.sendTransacEmail({
        sender: { email: process.env.EMAIL_FROM },
        to: [{ email }],
        subject: 'Verify Your Folo Account',
        htmlContent: generateVerificationEmail(name, token)
      });
    },
    sendPasswordResetEmail: async (email, token) => {
      const apiInstance = new brevo.TransactionalEmailsApi();
      await apiInstance.sendTransacEmail({
        sender: { email: process.env.EMAIL_FROM },
        to: [{ email }],
        subject: 'Password Reset Request',
        htmlContent: generatePasswordResetEmail(token)
      });
    }
  };
  console.log('Using Brevo API for emails');
} catch (err) {
  console.warn('Falling back to SMTP:', err.message);
  
  // SMTP fallback configuration
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  
  emailService = {
    sendVerificationEmail: async (email, name, token) => {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Verify Your Folo Account',
        html: generateVerificationEmail(name, token)
      });
    },
    sendPasswordResetEmail: async (email, token) => {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Password Reset Request',
        html: generatePasswordResetEmail(token)
      });
    }
  };
}

// Email template generators
const generateVerificationEmail = (name, token) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #2563eb;">Welcome to Folo, ${name}!</h2>
    <p>Please verify your email address to complete your registration:</p>
    <a href="${process.env.FRONTEND_URL}/verify-email?token=${token}"
       style="display: inline-block; padding: 12px 24px; background-color: #2563eb; 
              color: white; text-decoration: none; border-radius: 4px; margin: 15px 0;">
      Verify Email
    </a>
    <p>This link will expire in 24 hours.</p>
    <p>If you didn't request this, please ignore this email.</p>
  </div>
`;

const generatePasswordResetEmail = (token) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #2563eb;">Password Reset Request</h2>
    <p>We received a request to reset your password. Click the link below to proceed:</p>
    <a href="${process.env.FRONTEND_URL}/reset-password?token=${token}"
       style="display: inline-block; padding: 12px 24px; background-color: #2563eb; 
              color: white; text-decoration: none; border-radius: 4px; margin: 15px 0;">
      Reset Password
    </a>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn't request this, please secure your account immediately.</p>
  </div>
`;

// Token generation utilities
const generateToken = (userId) => jwt.sign(
  { userId }, 
  process.env.JWT_SECRET, 
  { expiresIn: '15m' }
);

const generateRefreshToken = (userId) => jwt.sign(
  { userId }, 
  process.env.REFRESH_TOKEN_SECRET, 
  { expiresIn: '7d' }
);

module.exports = {
  /**
   * Register a new user with email verification
   */
  signup: async (req, res) => {
    try {
      const { name, email, password, role } = req.body;

      // Validate input
      if (!name || !email || !password) {
        return res.status(400).json({ 
          success: false,
          message: "All fields are required" 
        });
      }

      // Check for existing user
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ 
          success: false,
          message: "Email already registered" 
        });
      }

      // Create verification token
      const verificationToken = jwt.sign(
        { email }, 
        process.env.JWT_SECRET, 
        { expiresIn: '24h' }
      );

      // Create user record
      const user = await User.create({
        name,
        email,
        password: await bcrypt.hash(password, 12),
        role: role || 'buyer',
        verificationToken,
        verificationTokenExpires: new Date(Date.now() + 86400000) // 24 hours
      });

      // Send verification email
      await emailService.sendVerificationEmail(email, name, verificationToken);

      return res.status(201).json({
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });

    } catch (error) {
      console.error('Signup error:', error);
      return res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'development' 
          ? error.message 
          : 'Registration failed. Please try again.'
      });
    }
  },

  /**
   * Authenticate user and return JWT tokens
   */
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      // Find user
      const user = await User.findOne({ 
        where: { 
          email,
          deletedAt: null // Exclude soft-deleted users
        } 
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check if email is verified
      if (!user.verified) {
        return res.status(403).json({
          success: false,
          message: 'Please verify your email before logging in'
        });
      }

      // Generate tokens
      const accessToken = generateToken(user.id);
      const refreshToken = generateRefreshToken(user.id);

      return res.json({
        success: true,
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Login failed. Please try again.'
      });
    }
  },

  /**
   * Verify user's email using token
   */
  verifyEmail: async (req, res) => {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Verification token is required'
        });
      }

      // Verify token and find user
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({
        where: {
          email: decoded.email,
          verificationToken: token,
          verificationTokenExpires: { [Op.gt]: new Date() }
        }
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired verification link'
        });
      }

      // Update user as verified
      await user.update({
        verified: true,
        verificationToken: null,
        verificationTokenExpires: null
      });

      return res.json({
        success: true,
        message: 'Email verified successfully!'
      });

    } catch (error) {
      console.error('Email verification error:', error);
      return res.status(400).json({
        success: false,
        message: 'Email verification failed. The link may be invalid or expired.'
      });
    }
  },

  /**
   * Refresh access token using refresh token
   */
  refreshToken: async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      
      // Find user and check token version
      const user = await User.findOne({
        where: {
          id: decoded.userId,
          tokenVersion: decoded.version || 0,
          deletedAt: null // Exclude soft-deleted users
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Generate new access token
      const newAccessToken = generateToken(user.id);

      return res.json({
        success: true,
        accessToken: newAccessToken
      });

    } catch (error) {
      console.error('Token refresh error:', error);
      return res.status(403).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
  },

  /**
   * Invalidate all user's tokens (logout)
   */
  invalidateTokens: async (req, res) => {
    try {
      const user = await User.findByPk(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Increment token version to invalidate all previous tokens
      await user.update({ tokenVersion: user.tokenVersion + 1 });

      return res.json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({
        success: false,
        message: 'Logout failed. Please try again.'
      });
    }
  },

  /**
   * Initiate password reset process
   */
  requestPasswordReset: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      // Find user by email (only active users)
      const user = await User.findOne({ 
        where: { 
          email,
          deletedAt: null 
        } 
      });

      if (user) {
        // Generate reset token
        const resetToken = jwt.sign(
          { userId: user.id },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );

        // Update user with reset token
        await user.update({
          resetToken,
          resetTokenExpiry: new Date(Date.now() + 3600000) // 1 hour
        });

        // Send password reset email
        await emailService.sendPasswordResetEmail(email, resetToken);
      }

      // Always return success to prevent email enumeration
      return res.json({
        success: true,
        message: 'If an account exists with this email, a reset link has been sent'
      });

    } catch (error) {
      console.error('Password reset request error:', error);
      return res.status(500).json({
        success: false,
        message: 'Password reset request failed. Please try again.'
      });
    }
  },

  /**
   * Complete password reset process
   */
  resetPassword: async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Reset token and new password are required'
        });
      }

      // Verify token and find user
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({
        where: {
          id: decoded.userId,
          resetToken: token,
          resetTokenExpiry: { [Op.gt]: new Date() },
          deletedAt: null // Only allow for active users
        }
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token'
        });
      }

      // Validate new password
      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters'
        });
      }

      // Update password and clear reset token
      await user.update({
        password: await bcrypt.hash(newPassword, 12),
        resetToken: null,
        resetTokenExpiry: null,
        tokenVersion: user.tokenVersion + 1 // Invalidate all existing tokens
      });

      return res.json({
        success: true,
        message: 'Password updated successfully'
      });

    } catch (error) {
      console.error('Password reset error:', error);
      return res.status(400).json({
        success: false,
        message: 'Password reset failed. The link may be invalid or expired.'
      });
    }
  }
};