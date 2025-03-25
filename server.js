const express = require("express");
const cors = require("cors");
const { Sequelize, DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const { body, validationResult } = require("express-validator");
const crypto = require("crypto");

dotenv.config();
const app = express();

// Force HTTPS in production
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV === 'production') {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});

// Middleware
const corsOptions = {
  origin: [
    'https://folo-frontend.onrender.com', // Your frontend
    'http://localhost:3000'               // Local dev
  ],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));

// Database Configuration
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
})

// Test Database Connection
sequelize.authenticate()
  .then(() => console.log('Database connected!'))
  .catch(err => console.error('Unable to connect to database:', err));

// Model Definitions
const User = require("./models/User")(sequelize, DataTypes);
const Service = require("./models/Service")(sequelize, DataTypes);
const Review = require("./models/Review")(sequelize, DataTypes);
const Subscriber = require("./models/Subscriber")(sequelize, DataTypes);

// Model Relationships
User.hasMany(Service, { foreignKey: "userId" });
Service.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Review, { foreignKey: "userId" });
Review.belongsTo(User, { foreignKey: "userId" });

// Database Synchronization
sequelize.sync({ force: false })
  .then(() => console.log("Database synced!"))
  .catch((err) => console.error("Error syncing database:", err));

// Utility Functions
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Authentication Middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired" });
    }
    
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Email Configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp-relay.brevo.com",
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || "88d3b8002@smtp-brevo.com",
    pass: process.env.EMAIL_PASS || "B6TL5UZ7mdtSHG4h"
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV !== "production"
  }
});

// Email Template Builders
const buildConfirmationEmail = (link) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h1 style="color: #ff6f61;">Welcome to Folo!</h1>
    <p>Thank you for subscribing to our newsletter.</p>
    <p>Please confirm your email by clicking below:</p>
    <a href="${link}" 
       style="background: #ff6f61; color: white; padding: 12px 24px; 
              display: inline-block; border-radius: 5px; text-decoration: none;">
      Confirm Email
    </a>
    <p style="margin-top: 20px; color: #666;">
      If you didn't request this, please ignore this email.
    </p>
  </div>
`;

const buildWelcomeEmail = () => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h1 style="color: #ff6f61;">You're Confirmed!</h1>
    <p>Thank you for joining Folo's community.</p>
    <p>You'll now receive:</p>
    <ul>
      <li>Exclusive early access</li>
      <li>Special member discounts</li>
      <li>Updates on Black-owned businesses</li>
    </ul>
    <p>We're excited to have you with us!</p>
  </div>
`;

// Newsletter Subscription Endpoint
app.post("/api/newsletter/subscribe", [
  body("email").isEmail().withMessage("Must be a valid email").normalizeEmail(),
  body("name").optional().trim().escape()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("[VALIDATION ERROR]", errors.array());
    return res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
  }

  const { email, name } = req.body;
  console.log("[SUBSCRIBE] New request for:", email);

  try {
    const existing = await Subscriber.findOne({ where: { email } });
    if (existing) {
      console.log("[DUPLICATE] Already exists:", email);
      return res.status(409).json({ 
        success: false,
        message: "This email is already subscribed"
      });
    }

    const confirmationToken = crypto.randomBytes(32).toString('hex');
    const confirmationLink = `${process.env.FRONTEND_URL}/confirm-subscription?token=${confirmationToken}`;
    
    const subscriber = await Subscriber.create({ 
      email, 
      name: name || null,
      confirmed: false,
      confirmationToken
    });
    
    console.log("[NEW SUBSCRIBER] Created ID:", subscriber.id);

    try {
      const mailResult = await transporter.sendMail({
        from: `"Folo Team" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: "Confirm Your Subscription",
        html: buildConfirmationEmail(confirmationLink),
        text: `Please confirm your subscription by visiting: ${confirmationLink}`,
        headers: {
          'X-Mailin-custom': 'folo-newsletter'
        }
      });

      console.log("[EMAIL SENT] Message ID:", mailResult.messageId);
      console.log("[EMAIL RESPONSE]", mailResult.response);

      return res.status(200).json({ 
        success: true,
        message: "Subscription successful. Please check your email.",
        data: {
          email: subscriber.email,
          id: subscriber.id
        }
      });
    } catch (emailError) {
      console.error("[EMAIL ERROR]", emailError);
      // Delete the subscriber if email failed
      await subscriber.destroy();
      throw new Error("Failed to send confirmation email");
    }

  } catch (error) {
    console.error("[FATAL ERROR]", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// In your server.js
app.post('/api/newsletter/confirm', async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Verification token is required'
    });
  }

  try {
    const subscriber = await Subscriber.findOne({ where: { confirmationToken: token } });
    
    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Invalid verification token'
      });
    }

    if (subscriber.confirmed) {
      return res.status(200).json({
        success: true,
        message: 'Email already confirmed'
      });
    }

    await subscriber.update({ confirmed: true, confirmationToken: null });
    
    return res.status(200).json({
      success: true,
      message: 'Email successfully confirmed'
    });
    
  } catch (error) {
    console.error('Confirmation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during confirmation'
    });
  }
});

// Signup Route
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    const verificationToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    user.verificationToken = verificationToken;
    await user.save();

    const verificationLink = `http://localhost:5000/api/confirm-email?token=${verificationToken}`;

    const mailOptions = {
      from: '"Folo App" <no-reply@foloapp.co.uk>',
      to: email,
      subject: "Verify Your Email",
      text: `Click the link to verify your email: ${verificationLink}`,
      html: `<p>Click the link to verify your email: <a href="${verificationLink}">Verify Email</a></p>`,
    };

    await transporter.sendMail(mailOptions);
    console.log("Verification email sent successfully.");

    res.status(201).json({
      message: "Signup successful! Please check your email to verify your account.",
    });
  } catch (err) {
    console.error("Error in /api/signup:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

// Login Route
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Email and password are required" 
      });
    }

    const user = await User.findOne({
      where: { email },
      attributes: ["id", "name", "email", "password", "role", "isVerified"],
    });

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email first"
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    const token = jwt.sign(
      { userId: user.id }, 
      process.env.JWT_SECRET, 
      { expiresIn: "1h" }
    );
    
    const refreshToken = jwt.sign(
      { userId: user.id }, 
      process.env.REFRESH_TOKEN_SECRET, 
      { expiresIn: "7d" }
    );

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      refreshToken,
      user: userResponse
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
});

// Email Verification Route
app.get("/api/confirm-email", async (req, res) => {
  try {
    const { token } = req.query;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(400).json({ message: "Invalid token" });
    }

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    res.status(200).json({ message: "Email verified successfully!" });
  } catch (error) {
    console.error("Email verification failed:", error);
    res.status(400).json({ message: "Invalid or expired token." });
  }
});

// Account Deletion Route
app.post("/api/account/delete", async (req, res) => {
  try {
    const { userId, deletionDate } = req.body;

    await User.update(
      {
        deletionScheduled: true,
        deletionDate: new Date(deletionDate),
      },
      {
        where: { id: userId },
      }
    );

    const user = await User.findByPk(userId);
    const mailOptions = {
      from: "your@email.com",
      to: user.email,
      subject: "Account Deletion Scheduled",
      html: `
        <p>Your account has been scheduled for deletion.</p>
        <p>You have 14 days to recover your account by logging in before it is permanently deleted.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Account deletion scheduled" });
  } catch (error) {
    res.status(500).json({ error: "Error scheduling account deletion" });
  }
});

// Service Routes
app.post("/api/services", async (req, res) => {
  try {
    const { category, businessName, location, phone, email, items, photos, userId } = req.body;

    if (!category || !businessName || !location || !phone || !email || !userId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const serviceItems = Array.isArray(items) ? items : [];

    const service = await Service.create({
      category,
      businessName,
      location,
      phone,
      email,
      items: serviceItems,
      photos,
      userId,
    });

    res.status(201).json({ message: "Service created successfully!", service });
  } catch (err) {
    console.error("Error creating service:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

app.get("/api/services", async (req, res) => {
  try {
    const services = await Service.findAll({
      include: [{ model: User, as: "User", attributes: ["id", "name"] }],
    });
    res.status(200).json(services);
  } catch (err) {
    console.error("Error fetching services:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

app.get("/api/services/nearby", async (req, res) => {
  try {
    const { latitude, longitude, radius = 50 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Latitude and longitude are required" });
    }

    const services = await Service.findAll({
      include: [{ model: User, as: "User", attributes: ["id", "name"] }],
    });

    const nearbyServices = services.filter((service) => {
      const serviceLocation = JSON.parse(service.location);
      const distance = calculateDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        serviceLocation.latitude,
        serviceLocation.longitude
      );
      return distance <= radius;
    });

    res.status(200).json(nearbyServices);
  } catch (err) {
    console.error("Error fetching nearby services:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

app.get("/api/services/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "Invalid service ID" });
    }

    const service = await Service.findByPk(id, {
      include: [{ model: User, as: "User", attributes: ["id", "name"] }],
    });

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.status(200).json(service);
  } catch (err) {
    console.error("Error fetching service:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

app.put("/api/services/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.userId;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid service ID" 
      });
    }

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({
        success: false,
        message: "Invalid update data"
      });
    }

    const service = await Service.findOne({ where: { id, userId } });
    if (!service) {
      return res.status(404).json({ 
        success: false,
        message: "Service not found or unauthorized" 
      });
    }

    const allowedUpdates = {
      businessName: true,
      businessType: true,
      businessOrigin: true,
      address: true,
      country: true,
      postCode: true,
      phone: true,
      email: true,
      currency: true,
      deliveryOption: true,
      ownVehicle: true,
      deliveryFee: true,
      remoteOperation: true,
      runOnSocialMedia: true,
      socialMedia: true,
      documentation: true,
      willSellAlcohol: true,
      items: true,
      services: true,
      photos: true,
      thumbnail: true
    };

    const filteredUpdates = {};
    
    for (const key in allowedUpdates) {
      if (updates.hasOwnProperty(key)) {
        if (key === 'socialMedia') {
          filteredUpdates[key] = {
            ...(service.socialMedia || {}),
            ...(updates.socialMedia || {})
          };
        } else if (key === 'items' || key === 'services') {
          filteredUpdates[key] = Array.isArray(updates[key]) ? updates[key] : [];
        } else {
          filteredUpdates[key] = updates[key];
        }
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update"
      });
    }

    await service.update(filteredUpdates);

    const updatedService = await Service.findByPk(id, {
      include: [{ model: User, as: "User", attributes: ["id", "name"] }]
    });

    return res.status(200).json({
      success: true,
      message: "Service updated successfully",
      service: updatedService
    });

  } catch (err) {
    console.error("Error updating service:", err);
    
    const statusCode = err.name === 'SequelizeValidationError' ? 400 : 500;
    
    return res.status(statusCode).json({
      success: false,
      message: "Error updating service",
      error: process.env.NODE_ENV === 'production' ? undefined : err.message,
      details: process.env.NODE_ENV === 'production' ? undefined : err.errors
    });
  }
});

app.delete("/api/services/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "Invalid service ID" });
    }

    const service = await Service.findByPk(id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    await service.destroy();

    res.status(200).json({ message: "Service deleted successfully!" });
  } catch (err) {
    console.error("Error deleting service:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

app.get("/api/services/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const services = await Service.findAll({ where: { userId } });
    res.status(200).json(services);
  } catch (err) {
    console.error("Error fetching user services:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

// Review Routes
app.post("/api/reviews", async (req, res) => {
  try {
    const {
      businessName,
      businessType,
      rating,
      customerService,
      timeManagement,
      price,
      experience,
      description,
      pros,
      cons,
      userId,
    } = req.body;

    console.log("Request Body:", req.body);
    console.log("User ID:", userId);

    if (
      !businessName ||
      !businessType ||
      !rating ||
      !customerService ||
      !timeManagement ||
      !price ||
      !experience ||
      !description ||
      !pros ||
      !cons ||
      !userId
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const review = await Review.create({
      businessName,
      businessType,
      rating,
      customerService,
      timeManagement,
      price,
      experience,
      description,
      pros,
      cons,
      userId,
    });

    res.status(201).json({ message: "Review created successfully!", review });
  } catch (err) {
    console.error("Error creating review:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

app.get("/api/reviews", async (req, res) => {
  try {
    const reviews = await Review.findAll({
      include: [{ model: User, as: "User", attributes: ["id", "name"] }],
    });
    res.status(200).json(reviews);
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

app.get("/api/reviews/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const reviews = await Review.findAll({ where: { userId } });
    res.status(200).json(reviews);
  } catch (err) {
    console.error("Error fetching user reviews:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

app.get("/api/reviews/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "Invalid review ID" });
    }

    const review = await Review.findByPk(id, {
      include: [{ model: User, as: "User", attributes: ["id", "name"] }],
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.status(200).json(review);
  } catch (err) {
    console.error("Error fetching review:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

app.put("/api/reviews/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      businessName,
      businessType,
      rating,
      customerService,
      timeManagement,
      price,
      experience,
      description,
      pros,
      cons,
    } = req.body;

    console.log("Review ID:", id);
    console.log("Request Body:", req.body);

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "Invalid review ID" });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Validation failed", errors: errors.array() });
    }

    const review = await Review.findByPk(id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    await review.update({
      businessName,
      businessType,
      rating,
      customerService,
      timeManagement,
      price,
      experience,
      description,
      pros,
      cons,
    });

    res.status(200).json({
      success: true,
      message: "Review updated successfully!",
      data: review,
    });
  } catch (err) {
    console.error("Error updating review:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

app.delete("/api/reviews/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "Invalid review ID" });
    }

    const review = await Review.findByPk(id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    await review.destroy();

    res.status(200).json({ message: "Review deleted successfully!" });
  } catch (err) {
    console.error("Error deleting review:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

// Token Refresh Route
app.post('/api/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;
  
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: "Invalid user" });
    }
    
    const newToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });
    
    res.json({ token: newToken });
    
  } catch (err) {
    res.status(401).json({ message: "Invalid refresh token" });
  }
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    message: 'Something broke!',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
});

app.get('/', (req, res) => {
  res.json({ 
    status: 'API is running', 
    docs: 'Use /api/ endpoints' 
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'Healthy' });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
