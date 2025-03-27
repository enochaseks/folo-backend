const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const brevo = require('@getbrevo/brevo');
const { User } = require('../models');

const brevoApiInstance = new brevo.TransactionalEmailsApi();
brevoApiInstance.apiKey = process.env.BREVO_API_KEY;

// Enhanced email sending with retries
const sendVerificationEmail = async (email, name, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  const emailData = {
    sender: { 
      email: process.env.BREVO_SENDER_EMAIL || 'no-reply@foloapp.co.uk',
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

  // Retry logic (3 attempts)
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
      await new Promise(resolve => setTimeout(resolve, 1000 * attempts)); // Exponential backoff
    }
  }
};

exports.signup = async (req, res) => {
  try {
    const { name, email, password, role = 'buyer', dateOfBirth } = req.body;
    
    // Enhanced validation
    if (!name || !email || !password || !dateOfBirth) {
      return res.status(400).json({ 
        success: false,
        message: 'All fields are required' 
      });
    }

    // Age verification
    const age = calculateAge(dateOfBirth);
    if (age < 18) {
      return res.status(400).json({
        success: false,
        message: 'You must be at least 18 years old to register'
      });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Email already exists' 
      });
    }

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
      tokenVersion: 1 // Initialize token version
    });

    await sendVerificationEmail(email, name, verificationToken);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email.'
    });

  } catch (error) {
    console.error('SIGNUP ERROR:', {
      message: error.message,
      stack: error.stack,
      ...(error.errors && { errors: error.errors.map(e => e.message) })
    });
    
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Add this helper function
function calculateAge(dateOfBirth) {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}
