const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.get('/verify-email', (req, res) => {
  res.status(200).json({ message: 'Email verification endpoint' });
});

// Authenticated routes
router.use(authenticate);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/change-password', userController.changePassword);
router.delete('/account', userController.deleteAccount);

// Admin-only routes
router.use(authorize('admin'));

router.get('/', userController.getAllUsers);
router.put('/:userId/role', userController.updateUserRole);

module.exports = router;