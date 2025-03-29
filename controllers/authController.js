const { User } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const brevo = require('@getbrevo/brevo');
const { Op } = require('sequelize');

// Configure Brevo email service
const brevoApiInstance = new brevo.TransactionalEmailsApi();
brevoApiInstance.apiKey = process.env.BREVO_API_KEY;

// Helper function to calculate age
const calculateAge = (dateString) => {
  const today = new Date();
  const birthDate = new Date(dateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Send verification email with retry logic
const sendVerificationEmail = async (email, name, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  const emailData = {
    sender: { 
      email: process.env.BREVO_SENDER_EMAIL || 'no-reply@foloapp.com',
      name: process.env.BREVO_SENDER_NAME || 'Folo Team'
    },
    to: [{ email }],
    subject: 'Verify Your Email for Folo',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to Folo, ${name}!</h2>
        <p>Please verify your email address:</p>
        <a href="${verificationUrl}" 
           style="display: inline-block; padding: 12px 24px; 
                  background-color: #2563eb; color: white; 
                  text-decoration: none; border-radius: 5px; margin: 15px 0;">
          Verify Email
        </a>
        <p style="color: #666; font-size: 14px;">
          This link expires in 24 hours. If you didn't request this, please ignore this email.
        </p>
      </div>
    `,
    params: {
      name,
      verification_url: verificationUrl
    }
  };

  let attempts = 0;
  while (attempts < 3) {
    try {
      await brevoApiInstance.sendTransacEmail(emailData);
      return;
    } catch (error) {
      attempts++;
      if (attempts === 3) {
        console.error('Failed to send verification email after 3 attempts:', error);
        throw new Error('Failed to send verification email');
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
    }
  }
};

exports.signup = async (req, res) => {
  try {
    const { name, email, password, role = 'buyer', dateOfBirth } = req.body;

    // Age verification
    const age = calculateAge(dateOfBirth);
    if (age < 18) {
      return res.status(400).json({
        success: false,
        message: 'You must be at least 18 years old to register'
      });
    }

    // Check for existing user
    const existingUser = await User.findOne({ 
      where: { 
        [Op.or]: [
          { email },
          { name }
        ]
      } 
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Email or username already exists' 
      });
    }

    // Create user with verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      dateOfBirth,
      verificationToken,
      isVerified: false,
      tokenVersion: 1
    });

    // Send verification email
    await sendVerificationEmail(email, name, verificationToken);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for verification.'
    });

  } catch (error) {
    console.error('Signup error:', {
      message: error.message,
      stack: error.stack,
      ...(error.errors && { errors: error.errors.map(e => e.message) })
    });
    
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ 
      where: { email },
      attributes: ['id', 'name', 'email', 'password', 'role', 'isVerified']
    });

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email first'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    const token = jwt.sign(
      { userId: user.id, version: user.tokenVersion },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    const user = await User.findOne({ 
      where: { verificationToken: token } 
    });

    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired verification token' 
      });
    }

    await user.update({ 
      isVerified: true,
      verificationToken: null 
    });

    res.json({ 
      success: true,
      message: 'Email verified successfully' 
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Email verification failed'
    });
  }
};

exports.checkPassword = (req, res) => {
  try {
    const { password } = req.body;
    
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
      message: "Password check failed"
    });
  }
};
