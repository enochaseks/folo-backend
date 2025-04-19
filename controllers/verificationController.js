// controllers/verificationController.js
const { verifyWithThirdParty } = require('../services/ageVerificationService');

exports.verifyAge = async (req, res) => {
  try {
    const { dob, document_type } = req.body;
    const document = req.file;

    if (!dob) {
      return res.status(400).json({ 
        verified: false,
        message: "Date of birth is required" 
      });
    }

    // Basic age verification
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) {
      return res.status(400).json({ 
        verified: false,
        message: "Invalid date of birth format" 
      });
    }

    const age = calculateAge(birthDate);
    
    if (age < 18) {
      return res.status(400).json({ 
        verified: false,
        message: "You must be at least 18 years old" 
      });
    }

    // Document verification if needed
    if (age < 21 || document) {
      if (!document) {
        return res.status(400).json({ 
          verified: false,
          message: "Document upload is required for users under 21" 
        });
      }

      const result = await verifyWithThirdParty({ 
        dob, 
        document, 
        documentType: document_type || 'id' 
      });
      
      if (!result.verified) {
        return res.status(400).json({
          verified: false,
          message: result.message || "Document verification failed"
        });
      }
    }

    // Update user verification status in database
    await req.user.update({ 
      isAgeVerified: true, 
      age,
      verificationMethod: document ? 'document' : 'basic',
      ageVerifiedAt: new Date()
    });

    return res.json({ 
      verified: true,
      age,
      message: "Age verified successfully" 
    });

  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ 
      verified: false,
      message: "Age verification failed. Please try again later.",
      error: error.message 
    });
  }
};

function calculateAge(birthDate) {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}