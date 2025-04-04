// controllers/verificationController.js
const { verifyWithThirdParty } = require('../services/ageVerificationService');

exports.verifyAge = async (req, res) => {
  try {
    const { dob, document_type } = req.body;
    const document = req.file;

    // Basic age verification
    const birthDate = new Date(dob);
    const age = calculateAge(birthDate);
    
    if (age < 18) {
      return res.status(400).json({ 
        verified: false,
        message: "You must be at least 18 years old" 
      });
    }

    // Document verification if needed
    if (age < 21 || document) {
      const result = await verifyWithThirdParty({ dob, document, documentType: document_type });
      if (!result.verified) return res.status(400).json(result);
    }

    // Update user verification status in database
    await req.user.update({ isAgeVerified: true, age });

    return res.json({ 
      verified: true,
      age,
      message: "Age verified successfully" 
    });

  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ 
      verified: false,
      message: "Age verification failed. Please try again later." 
    });
  }
};

function calculateAge(birthDate) {
  // ... same implementation ...
}