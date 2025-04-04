// services/ageVerificationService.js
const axios = require('axios');
const FormData = require('form-data');

exports.verifyWithThirdParty = async ({ document, documentType }) => {
  try {
    const formData = new FormData();
    formData.append('file', document.buffer, {
      filename: document.originalname,
      contentType: document.mimetype
    });

    const response = await axios.post('https://api.onfido.com/v3/documents', formData, {
      headers: {
        'Authorization': `Token token=${process.env.ONFIDO_API_TOKEN}`,
        ...formData.getHeaders()
      }
    });

    return {
      verified: true,
      service: 'onfido',
      documentId: response.data.id
    };
  } catch (error) {
    console.error('Third-party verification failed:', error);
    return {
      verified: false,
      message: error.response?.data?.message || 'Document verification failed'
    };
  }
};