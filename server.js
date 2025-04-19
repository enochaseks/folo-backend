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
const passport = require('passport');
const session = require('express-session');
const { createClient } = require('redis');
const RedisStore = require('connect-redis').default;
const admin = require('firebase-admin');
const verificationRoutes = require('./routes/verificationRoutes');

// ==================== INITIALIZATION ====================
const app = express();

// ==================== ENVIRONMENT VALIDATION ====================
const REQUIRED_ENV = [
  'SESSION_SECRET',
  'DATABASE_URL',
  'REDIS_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'FACEBOOK_APP_ID',
  'FACEBOOK_APP_SECRET',
  'FRONTEND_URL'
];

const missingEnv = REQUIRED_ENV.filter(key => !process.env[key]);
if (missingEnv.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnv);
  process.exit(1);
}

// ==================== REDIS CONFIGURATION ====================
let redisClient;
let redisStore;

if (process.env.REDIS_URL) {
  redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
      tls: process.env.NODE_ENV === 'production',
      reconnectStrategy: (retries) => Math.min(retries * 100, 5000)
    }
  });

  (async () => {
    try {
      await redisClient.connect();
      console.log('✅ Redis connected successfully');
      
      redisStore = new RedisStore({
        client: redisClient,
        prefix: 'folo:'
      });
    } catch (error) {
      console.warn('⚠️ Redis connection failed:', error.message);
      console.log('ℹ️ Continuing without Redis cache...');
    }
  })();
}

// ==================== DATABASE CONFIGURATION ====================
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false
});

// Test Database Connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully!');
    
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('🔄 Database synced');
    }
  } catch (err) {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  }
})();

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined
  })
});

// ==================== SESSION CONFIGURATION ====================
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: redisStore || new session.MemoryStore(),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// ==================== PASSPORT CONFIGURATION ====================
app.use(passport.initialize());
app.use(passport.session());

// ==================== MIDDLEWARE ====================
// Logging
const logDirectory = path.join(__dirname, 'logs');
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

const accessLogStream = rfs.createStream('access.log', {
  interval: '1d',
  path: logDirectory,
  compress: 'gzip'
});

app.use(morgan('combined', { stream: accessLogStream }));
app.use(morgan('dev'));
app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate Limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests, please try again later'
}));

// HTTPS Redirect
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV === 'production') {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

// CORS
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'https://localhost:3000',
      'http://www.foloapp.co.uk',
      'https://www.foloapp.co.uk'
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// ==================== ROUTES ====================
// Static Files in Production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../folo-app/build');
  if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(frontendPath, 'index.html'));
    });
  }
}

// API Routes - FULLY RESTORED
app.use('/api/verification', verificationRoutes);
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/onboarding', require('./routes/onboardingRoutes'));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    database: 'Connected',
    redis: redisClient ? 'Connected' : 'Disconnected',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// ==================== ERROR HANDLING ====================
// 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('💥 Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  const statusCode = err.statusCode || 500;
  const response = {
    success: false,
    message: err.message || 'Internal server error'
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
});

// ==================== SERVER STARTUP ====================
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`
  🚀 Server running in ${process.env.NODE_ENV || 'development'} mode
  📡 Listening on port ${PORT}
  🔐 Authentication Providers:
     Google: ${process.env.GOOGLE_CLIENT_ID ? '✅' : '❌'}
     Facebook: ${process.env.FACEBOOK_APP_ID ? '✅' : '❌'}
  🌐 Frontend URL: ${process.env.FRONTEND_URL || 'Not configured'}
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down gracefully...');
  server.close(() => {
    if (redisClient) {
      redisClient.quit().then(() => {
        sequelize.close().then(() => {
          process.exit(0);
        });
      });
    } else {
      sequelize.close().then(() => {
        process.exit(0);
      });
    }
  });
});