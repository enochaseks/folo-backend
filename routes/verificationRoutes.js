// routes/verificationRoutes.js
const express = require('express');
const router = express.Router();
const { verifyAge } = require('../controllers/verificationController');
const upload = require('../middleware/uploadMiddleware'); // For file uploads

router.post('/verify-age', upload.single('document'), verifyAge);

module.exports = router;