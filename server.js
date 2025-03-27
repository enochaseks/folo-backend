const express = require("express");
const cors = require("cors");
const { Sequelize, DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const path = require('path');
const authRoutes = require('./routes/authRoutes');



dotenv.config();
const app = express();

// Redirect HTTP to HTTPS in production
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV === 'production') {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});

// Add this middleware before your routes
app.use((req, res, next) => {
  if (req.path !== '/api/login' && req.path !== '/api/signup') {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      try {
        jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        return res.status(401).json({ 
          message: "Session expired. Please login again.",
          code: "TOKEN_REVOKED" 
        });
      }
    }
  }
  next();
});

const frontendPath = path.join(__dirname, '../folo-app/build');
app.use(express.static(frontendPath));

app.use(express.static(path.join(__dirname, '../folo-app/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../folo-app/build', 'index.html'));
});

// Middleware
const corsOptions = {
  origin: [
    'https://folo-frontend.onrender.com',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use('/api/auth', authRoutes);

// Password verification endpoint (temporary for debugging)
app.post('/api/verify-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const user = await User.findOne({ 
      where: { email },
      attributes: ['id', 'email', 'password', 'isVerified']
    });

    if (!user) {
      return res.json({ 
        exists: false,
        message: "User not found" 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    
    res.json({
      exists: true,
      isVerified: user.isVerified,
      passwordMatch: isMatch,
      email: user.email
    });

  } catch (err) {
    console.error('Password verification error:', err);
    res.status(500).json({ error: "Server error during verification" });
  }
});

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
});

// Test Database Connection
sequelize.authenticate()
  .then(() => console.log('Database connected!'))
  .catch(err => console.error('Unable to connect to database:', err));

// Model Definitions
const User = sequelize.define('User', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, allowNull: false },
  isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
  verificationToken: { type: DataTypes.STRING },
  deletionScheduled: { type: DataTypes.BOOLEAN, defaultValue: false },
  deletionDate: { type: DataTypes.DATE }
});

const Service = sequelize.define('Service', {
  category: { type: DataTypes.STRING, allowNull: false },
  businessName: { type: DataTypes.STRING, allowNull: false },
  location: { type: DataTypes.JSONB, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  items: { type: DataTypes.ARRAY(DataTypes.STRING) },
  photos: { type: DataTypes.ARRAY(DataTypes.STRING) },
  businessType: { type: DataTypes.STRING },
  businessOrigin: { type: DataTypes.STRING },
  address: { type: DataTypes.STRING },
  country: { type: DataTypes.STRING },
  postCode: { type: DataTypes.STRING },
  currency: { type: DataTypes.STRING },
  deliveryOption: { type: DataTypes.BOOLEAN },
  ownVehicle: { type: DataTypes.BOOLEAN },
  deliveryFee: { type: DataTypes.DECIMAL(10, 2) },
  remoteOperation: { type: DataTypes.BOOLEAN },
  runOnSocialMedia: { type: DataTypes.BOOLEAN },
  socialMedia: { type: DataTypes.JSONB },
  documentation: { type: DataTypes.ARRAY(DataTypes.STRING) },
  willSellAlcohol: { type: DataTypes.BOOLEAN },
  services: { type: DataTypes.ARRAY(DataTypes.STRING) },
  thumbnail: { type: DataTypes.STRING }
});

const Review = sequelize.define('Review', {
  businessName: { type: DataTypes.STRING, allowNull: false },
  businessType: { type: DataTypes.STRING, allowNull: false },
  rating: { type: DataTypes.INTEGER, allowNull: false },
  customerService: { type: DataTypes.INTEGER, allowNull: false },
  timeManagement: { type: DataTypes.INTEGER, allowNull: false },
  price: { type: DataTypes.INTEGER, allowNull: false },
  experience: { type: DataTypes.TEXT, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  pros: { type: DataTypes.TEXT, allowNull: false },
  cons: { type: DataTypes.TEXT, allowNull: false }
});

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
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user to check token version
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Check token version matches
    if (decoded.version !== user.tokenVersion) {
      return res.status(401).json({ 
        message: "Session expired. Please login again.",
        code: "TOKEN_REVOKED" 
      });
    }

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
      { userId: user.id, version: 2 }, // Added version
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    const refreshToken = jwt.sign(
      { userId: user.id, version: 2 }, // Added version
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
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

// In your server.js
app.post('/api/force-password-reset', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate proper bcrypt hash
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ 
      success: true,
      message: "Password reset successfully" 
    });
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ error: err.message });
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

    if (!businessName || !businessType || !rating || !customerService || 
        !timeManagement || !price || !experience || !description || 
        !pros || !cons || !userId) {
      return res.status(400).json({ message: "All fields are required" });
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

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "Invalid review ID" });
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
  
  if (!refreshToken) {
    return res.status(400).json({ success: false, message: "Refresh token required" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    // Verify refresh token version matches
    if (decoded.version !== user.tokenVersion) {
      return res.status(401).json({ 
        success: false,
        message: "Refresh token invalidated" 
      });
    }

    // Generate new tokens with current version
    const newToken = jwt.sign(
      { userId: user.id, version: user.tokenVersion },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const newRefreshToken = jwt.sign(
      { userId: user.id, version: user.tokenVersion },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ 
      success: true,
      token: newToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error("Refresh token error:", err);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: "Refresh token expired" });
    }
    
    return res.status(401).json({ success: false, message: "Invalid refresh token" });
  }
});

app.post('/api/invalidate-tokens', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Increment token version to invalidate all existing tokens
    await user.update({ tokenVersion: user.tokenVersion + 1 });

    res.json({ 
      success: true,
      message: "All sessions invalidated. Please login again."
    });
  } catch (err) {
    console.error("Error invalidating tokens:", err);
    res.status(500).json({ 
      success: false,
      message: "Error invalidating sessions" 
    });
  }
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    message: 'Internal Server Error',
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
