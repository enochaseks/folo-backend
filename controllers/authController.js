// authController.js
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { User } = require('../models'); // Adjust based on your model path

// Signup with email confirmation
const signup = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Check if user already exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user (set confirmed to false by default)
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      confirmed: false, // Add this field to your User model
    });

    // Generate confirmation token
    const confirmationToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Send confirmation email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Confirm Your Email',
      text: `Please click the following link to confirm your email: http://yourapp.com/confirm-email?token=${confirmationToken}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });

    res.status(201).json({ message: "User created successfully. Please check your email to confirm your account." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { signup };