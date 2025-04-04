const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/verify-email', userController.verifyEmail);
router.use(authenticate);
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/change-password', userController.changePassword);
router.delete('/account', userController.deleteAccount);
router.get('/onboarding-status', userController.getOnboardingStatus);
router.use(authorize('admin'));
router.get('/', userController.getAllUsers);
router.put('/:userId/role', userController.updateUserRole);

module.exports = router;