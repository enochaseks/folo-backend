const { User, OnboardingData } = require('../models');

module.exports = {
  async ageVerification(req, res) {
    try {
      const { dateOfBirth, idDocument } = req.body;
      
      // In a real app, you would verify the ID document
      await OnboardingData.create({
        userId: req.user.id,
        step: 'age_verification',
        data: { dateOfBirth, idVerified: true }
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to verify age'
      });
    }
  },

  async userType(req, res) {
    try {
      const { role } = req.body;
      
      await User.update({ role }, { where: { id: req.user.id } });
      
      await OnboardingData.create({
        userId: req.user.id,
        step: 'user_type',
        data: { role }
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update user type'
      });
    }
  },

  async buyerInterests(req, res) {
    try {
      const { interests } = req.body;
      
      await OnboardingData.create({
        userId: req.user.id,
        step: 'buyer_interests',
        data: { interests }
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to save buyer interests'
      });
    }
  },

  async sellerDetails(req, res) {
    try {
      const { businessType, businessName, operationType, documents, socialHandle } = req.body;
      
      // In a real app, you would process and store the documents
      await OnboardingData.create({
        userId: req.user.id,
        step: 'seller_details',
        data: { 
          businessType, 
          businessName, 
          operationType,
          documentsUploaded: documents ? documents.length : 0,
          socialHandle 
        }
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to save seller details'
      });
    }
  },

  async sellerBusiness(req, res) {
    try {
      const { businessOrigin, businessAge, productTypes } = req.body;
      
      await OnboardingData.create({
        userId: req.user.id,
        step: 'seller_business',
        data: { businessOrigin, businessAge, productTypes }
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to save business details'
      });
    }
  },

  async completeOnboarding(req, res) {
    try {
      await User.update({ onboardingComplete: true }, { where: { id: req.user.id } });
      
      res.json({ 
        success: true,
        redirectTo: req.user.role === 'seller' ? '/seller-dashboard' : '/'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to complete onboarding'
      });
    }
  }
};