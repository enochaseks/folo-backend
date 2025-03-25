// authRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models'); // Adjust based on your model path

// Confirm email route
router.get('/confirm-email', async (req, res) => {
  const { token } = req.query;

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user by email
    const user = await User.findOne({ where: { email: decoded.email } });

    if (!user) {
      return res.status(400).json({ message: "User not found." });
    }

    // Update the user's confirmed status
    user.confirmed = true;
    await user.save();

    res.send('Email confirmed successfully!');
  } catch (error) {
    res.status(400).json({ message: "Invalid or expired token." });
  }
});

module.exports = router;