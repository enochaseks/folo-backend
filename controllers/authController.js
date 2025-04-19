const jwt = require('jsonwebtoken');
const { User, OnboardingData, Op } = require('../models');
const nodemailer = require('nodemailer');
const admin = require('../services/firebaseAuth');

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
    sendMagicLinkEmail: async (email, token) => {
      const apiInstance = new brevo.TransactionalEmailsApi();
      await apiInstance.sendTransacEmail({
        sender: { email: process.env.EMAIL_FROM },
        to: [{ email }],
        subject: 'Your Folo Magic Link',
        htmlContent: generateMagicLinkEmail(token)
      });
    }
  };
  console.log('Using Brevo API for emails');
} catch (err) {
  console.warn('Falling back to SMTP:', err.message);
  
  // SMTP fallback configuration
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT === '465',
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
    sendMagicLinkEmail: async (email, token) => {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Your Folo Magic Link',
        html: generateMagicLinkEmail(token)
      });
    }
  };
}

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// Helper function to generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );
};

// Helper function to generate verification email HTML
const generateVerificationEmail = (name, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to Folo!</h2>
      <p>Hi ${name},</p>
      <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email</a>
      </div>
      <p>Or copy and paste this link in your browser:</p>
      <p>${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create an account, you can safely ignore this email.</p>
      <p>Best regards,<br>The Folo Team</p>
    </div>
  `;
};

// Helper function to generate magic link email HTML
const generateMagicLinkEmail = (token) => {
  const magicLinkUrl = `${process.env.FRONTEND_URL}/login?token=${token}`;
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Your Folo Magic Link</h2>
      <p>Click the button below to log in to your Folo account:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${magicLinkUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Log In to Folo</a>
      </div>
      <p>Or copy and paste this link in your browser:</p>
      <p>${magicLinkUrl}</p>
      <p>This link will expire in 15 minutes.</p>
      <p>If you didn't request this link, you can safely ignore this email.</p>
      <p>Best regards,<br>The Folo Team</p>
    </div>
  `;
};

// Signup controller
const signup = async (req, res) => {
  try {
    const { email, name, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create verification token
    const verificationToken = jwt.sign(
      { email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Create user
    const user = await User.create({
      email,
      name,
      role: role || 'buyer',
      verificationToken,
      isEmailVerified: false
    });

    // Send verification email
    await emailService.sendVerificationEmail(email, name, verificationToken);

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Update user with refresh token
    await user.update({ refreshToken });

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating account'
    });
  }
};

// Login controller
const login = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email'
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email first'
      });
    }

    // Generate magic link token
    const magicLinkToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Send magic link email
    await emailService.sendMagicLinkEmail(email, magicLinkToken);

    res.json({
      success: true,
      message: 'Magic link sent to your email'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login'
    });
  }
};

// Firebase authentication
const firebaseAuth = async (req, res) => {
  try {
    const { idToken } = req.body;
    
    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email } = decodedToken;
    
    // Check if user exists in our database
    let user = await User.findOne({ where: { firebaseUid: uid } });
    
    if (!user) {
      // Create new user if they don't exist
      user = await User.create({
        email,
        firebaseUid: uid,
        isEmailVerified: true, // Firebase has already verified the email
        authProvider: 'firebase'
      });
    }
    
    // Generate JWT token
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    
    // Update user's refresh token
    await user.update({ refreshToken });
    
    res.json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Firebase auth error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Token refresh
const refreshToken = async (req, res) => {
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
    
    // Find user
    const user = await User.findOne({ where: { id: decoded.id } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const newToken = generateToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    // Update user's refresh token
    await user.update({ refreshToken: newRefreshToken });

    res.json({
      success: true,
      token: newToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
};

// Delete account
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete user
    await user.destroy();

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting account'
    });
  }
};

// Google callback
const googleCallback = async (req, res) => {
  try {
    const { id, displayName, emails } = req.user;
    const email = emails[0].value;
    
    // Check if user exists
    let user = await User.findOne({ where: { email } });
    
    if (!user) {
      // Create new user
      user = await User.create({
        email,
        name: displayName,
        isEmailVerified: true,
        authProvider: 'google',
        googleId: id
      });
    }
    
    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    
    // Update user's refresh token
    await user.update({ refreshToken });
    
    // Redirect to frontend with tokens
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&refreshToken=${refreshToken}`);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
  }
};

// Facebook callback
const facebookCallback = async (req, res) => {
  try {
    const { id, displayName, emails } = req.user;
    const email = emails[0].value;
    
    // Check if user exists
    let user = await User.findOne({ where: { email } });
    
    if (!user) {
      // Create new user
      user = await User.create({
        email,
        name: displayName,
        isEmailVerified: true,
        authProvider: 'facebook',
        facebookId: id
      });
    }
    
    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    
    // Update user's refresh token
    await user.update({ refreshToken });
    
    // Redirect to frontend with tokens
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&refreshToken=${refreshToken}`);
  } catch (error) {
    console.error('Facebook callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=facebook_auth_failed`);
  }
};

module.exports = {
  signup,
  login,
  firebaseAuth,
  refreshToken,
  deleteAccount,
  googleCallback,
  facebookCallback
};