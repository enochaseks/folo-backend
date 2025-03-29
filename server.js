require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Sequelize } = require('sequelize');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const fs = require('fs');
const rfs = require('rotating-file-stream');

// Import routes
const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const userRoutes = require('./routes/userRoutes');

// Initialize Express app
const app = express();

// Database Configuration
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: { 
      require: true, // Required for Render
      rejectUnauthorized: false 
    }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  retry: { // Add automatic retries
    match: [/ECONNREFUSED/, /ECONNRESET/],
    max: 3 // Retry 3 times on connection failures
  }
});

// Test Database Connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully!');
    
    // Sync models in development
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('Database synced');
    }
  } catch (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
})();

// Add this right after your Sequelize configuration
sequelize.authenticate()
  .then(() => console.log('Database connected successfully!'))
  .catch(err => {
    console.error('FATAL DATABASE ERROR:', err);
    process.exit(1); // Exit if DB connection fails
  });

// Create log directory if it doesn't exist
const logDirectory = path.join(__dirname, 'logs');
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

// Create a rotating write stream for logs
const accessLogStream = rfs.createStream('access.log', {
  interval: '1d',
  path: logDirectory
});

// Middleware Setup
app.use(morgan('combined', { stream: accessLogStream }));
app.use(morgan('dev')); // Log to console in development

// Security Middleware
app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use(limiter);

// Force HTTPS in production
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV === 'production') {
    return res.redirect(301, 'https://' + req.headers.host + req.url);
  }
  next();
});
  
  const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'https://localhost:3000',
      'http://www.foloapp.co.uk',
      'https://www.foloapp.co.uk'
    ].filter(Boolean);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
  
// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../folo-app/build');
  
  // Ensure the build directory exists
  if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(frontendPath, 'index.html'));
    });
  } else {
    console.warn('Frontend build directory not found. Serving API only.');
  }
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Healthy',
    database: 'Connected',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('ERROR DETAILS:', {
    message: err.message,
    stack: err.stack,
    fullError: JSON.stringify(err)
  });
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors
    });
  }
  
  // Handle rate limit errors
  if (err.name === 'RateLimitError') {
    return res.status(429).json({
      success: false,
      message: 'Too many requests'
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Server Shutdown Handler
const gracefulShutdown = () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Force shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start Server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`
    Server running in ${process.env.NODE_ENV || 'development'} mode
    Listening on port ${PORT}
    Database: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'local'}
  `);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  server.close(() => process.exit(1));
});