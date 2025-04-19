const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authenticate = require('../middleware/authenticate');

router.post('/', authenticate, reviewController.createReview);
router.get('/', reviewController.getReviews);
// Add other review routes...

module.exports = router;