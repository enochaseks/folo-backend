const express = require('express');
const router = express.Router();
const onboardingController = require('../controllers/onboardingController');
const { authenticate } = require('../middleware/auth');

router.post('/age-verification', authenticate, onboardingController.ageVerification);
router.post('/user-type', authenticate, onboardingController.userType);
router.post('/buyer-interests', authenticate, onboardingController.buyerInterests);
router.post('/seller-details', authenticate, onboardingController.sellerDetails);
router.post('/seller-business', authenticate, onboardingController.sellerBusiness);
router.post('/complete', authenticate, onboardingController.completeOnboarding);

module.exports = router;