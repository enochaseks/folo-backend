const { User, OnboardingData } = require('../models');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');

module.exports = {
  getAllUsers: async (req, res) => {
    try {
      const { page = 1, limit = 10, role, verified, search } = req.query;
      const offset = (page - 1) * limit;
      const where = {};
      if (role) where.role = role;
      if (verified) where.verified = verified === 'true';
      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ];
      }
      const { count, rows } = await User.findAndCountAll({
        where,
        attributes: { exclude: ['password', 'verificationToken', 'resetToken'] },
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });
      res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users'
      });
    }
  },

  getProfile: async (req, res) => {
    try {
      const user = await User.findByPk(req.user.userId, {
        attributes: { exclude: ['password', 'verificationToken', 'resetToken'] }
      });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch profile'
      });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const { name, dateOfBirth } = req.body;
      const user = await User.findByPk(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      if (name && name.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Name must be at least 2 characters'
        });
      }
      const updatedData = {};
      if (name) updatedData.name = name;
      if (dateOfBirth) updatedData.dateOfBirth = dateOfBirth;
      await user.update(updatedData);
      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          dateOfBirth: user.dateOfBirth
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  },

  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findByPk(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters'
        });
      }
      await user.update({
        password: await bcrypt.hash(newPassword, 12),
        tokenVersion: user.tokenVersion + 1
      });
      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to change password'
      });
    }
  },

  deleteAccount: async (req, res) => {
    try {
      const user = await User.findByPk(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      await user.update({ 
        deletedAt: new Date(),
        tokenVersion: user.tokenVersion + 1
      });
      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete account'
      });
    }
  },

  updateUserRole: async (req, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      if (!['buyer', 'seller'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role'
        });
      }
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      await user.update({ 
        role,
        tokenVersion: user.tokenVersion + 1
      });
      res.json({
        success: true,
        message: 'User role updated successfully',
        data: {
          id: user.id,
          role: user.role
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update user role'
      });
    }
  },

  verifyEmail: async (req, res) => {
    try {
      const { token } = req.query;
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Verification token is required'
        });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({
        where: {
          email: decoded.email,
          verificationToken: token,
          verificationTokenExpires: { [Op.gt]: new Date() }
        }
      });
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired verification link'
        });
      }
      await user.update({
        verified: true,
        verificationToken: null,
        verificationTokenExpires: null
      });
      res.json({
        success: true,
        message: 'Email verified successfully!'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Email verification failed. The link may be invalid or expired.'
      });
    }
  },

  getOnboardingStatus: async (req, res) => {
    try {
      const onboardingData = await OnboardingData.findAll({
        where: { userId: req.user.id },
        attributes: ['step', 'createdAt']
      });
      res.json({
        success: true,
        data: {
          onboardingComplete: req.user.onboardingComplete,
          stepsCompleted: onboardingData.map(item => item.step)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get onboarding status'
      });
    }
  }
};