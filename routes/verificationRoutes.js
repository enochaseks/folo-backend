// routes/verificationRoutes.js
const express = require('express');
const router = express.Router();
const { verifyAge } = require('../controllers/verificationController');
const { upload, handleUploadError } = require('../middleware/uploadMiddleware');

router.post('/verify-age', 
  upload.single('document'),
  handleUploadError,
  verifyAge
);

module.exports = router;