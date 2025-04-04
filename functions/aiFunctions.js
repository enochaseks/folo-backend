const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

// Initialize AI service clients (you'll need to set up these services)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const TENSORFLOW_SERVER_URL = process.env.TENSORFLOW_SERVER_URL;

// Service Recommendations
exports.recommendServices = functions.https.onCall(async (data, context) => {
  try {
    const { userPreferences, browsingHistory, location } = data;
    
    // Call OpenAI for personalized recommendations
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-4",
      messages: [{
        role: "system",
        content: "Generate personalized service recommendations based on user data"
      }, {
        role: "user",
        content: JSON.stringify({ userPreferences, browsingHistory, location })
      }]
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      success: true,
      recommendations: response.data.choices[0].message.content
    };
  } catch (error) {
    console.error('Service recommendation error:', error);
    return { success: false, error: error.message };
  }
});

// Payment Fraud Detection
exports.detectPaymentFraud = functions.https.onCall(async (data, context) => {
  try {
    const { transaction, userHistory, marketConditions } = data;
    
    // Call TensorFlow model for fraud detection
    const response = await axios.post(TENSORFLOW_SERVER_URL + '/predict', {
      features: {
        transaction,
        userHistory,
        marketConditions
      }
    });

    return {
      success: true,
      isFraudulent: response.data.prediction > 0.5,
      confidence: response.data.prediction
    };
  } catch (error) {
    console.error('Fraud detection error:', error);
    return { success: false, error: error.message };
  }
});

// Service Quality Prediction
exports.predictServiceQuality = functions.https.onCall(async (data, context) => {
  try {
    const { serviceData, userHistory, marketData } = data;
    
    // Call TensorFlow model for quality prediction
    const response = await axios.post(TENSORFLOW_SERVER_URL + '/quality', {
      features: {
        serviceData,
        userHistory,
        marketData
      }
    });

    return {
      success: true,
      quality: response.data.prediction,
      factors: response.data.factors
    };
  } catch (error) {
    console.error('Quality prediction error:', error);
    return { success: false, error: error.message };
  }
});

// Smart Notifications
exports.generateSmartNotifications = functions.https.onCall(async (data, context) => {
  try {
    const { userActivity, notificationHistory, preferences } = data;
    
    // Call OpenAI for notification generation
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-4",
      messages: [{
        role: "system",
        content: "Generate smart notifications based on user activity and preferences"
      }, {
        role: "user",
        content: JSON.stringify({ userActivity, notificationHistory, preferences })
      }]
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      success: true,
      notifications: JSON.parse(response.data.choices[0].message.content)
    };
  } catch (error) {
    console.error('Notification generation error:', error);
    return { success: false, error: error.message };
  }
}); 