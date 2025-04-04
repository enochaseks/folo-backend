require('dotenv').config();
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { OpenAI } = require('openai');

// Initialize Firebase Admin
admin.initializeApp();

// Initialize OpenAI with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || functions.config().openai.key
});

// Business Intelligence
exports.analyzeBusinessSetup = functions.https.onCall(async (data, context) => {
  try {
    const { businessName, category, location, targetMarket } = data;
    
    // Basic validation and recommendations
    return {
      success: true,
      recommendations: {
        nameValidation: validateBusinessName(businessName),
        categorySuggestions: suggestCategories(category),
        locationOptimization: optimizeLocation(location),
        marketAnalysis: analyzeMarket(targetMarket)
      }
    };
  } catch (error) {
    console.error('Business analysis error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Service Management
exports.manageService = functions.https.onCall(async (data, context) => {
  try {
    const { services, location, userPreferences } = data;
    
    return {
      success: true,
      recommendations: optimizeServices(services, location, userPreferences),
      quality: predictServiceQuality(services),
      optimization: optimizeServiceDelivery(services)
    };
  } catch (error) {
    console.error('Service management error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Smart Search
exports.smartSearch = functions.https.onCall(async (data, context) => {
  try {
    const { query, filters } = data;
    
    // Use OpenAI for semantic search
    const embedding = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: query
    });

    // Get services from Firestore
    const servicesRef = admin.firestore().collection('services');
    let servicesQuery = servicesRef;
    
    // Apply filters
    if (filters) {
      if (filters.category) {
        servicesQuery = servicesQuery.where('category', '==', filters.category);
      }
      if (filters.maxPrice) {
        servicesQuery = servicesQuery.where('price', '<=', filters.maxPrice);
      }
    }

    const services = await servicesQuery.get();
    const searchResults = [];

    // Calculate similarity and rank results
    services.forEach(doc => {
      const service = doc.data();
      const similarity = calculateCosineSimilarity(embedding.data[0].embedding, service.embedding || []);
      if (similarity > 0.7) { // Threshold for relevance
        searchResults.push({
          ...service,
          score: similarity
        });
      }
    });

    // Sort by relevance
    searchResults.sort((a, b) => b.score - a.score);

    return {
      success: true,
      results: searchResults
    };
  } catch (error) {
    console.error('Smart search error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Customer Support
exports.handleCustomerSupport = functions.https.onCall(async (data, context) => {
  try {
    const { message, supportContext, history = [] } = data;
    
    // Get user data for context
    const userId = context.auth?.uid;
    let userContext = '';
    
    if (userId) {
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      const userData = userDoc.data();
      userContext = `User Info: ${userData.name}, Account Type: ${userData.accountType}, 
        Recent Services: ${userData.recentServices?.join(', ')}`;
    }

    // Use OpenAI for customer support
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a helpful customer support assistant for Folo App. 
            Context about the user: ${userContext}
            Support Context: ${supportContext || 'General inquiry'}`
        },
        ...history.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    // Analyze sentiment
    const sentiment = await analyzeSentiment(message);

    // Store conversation in Firestore
    if (userId) {
      await admin.firestore().collection('support_conversations').add({
        userId,
        message,
        response: response.choices[0].message.content,
        sentiment,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    return {
      success: true,
      response: response.choices[0].message.content,
      sentiment
    };
  } catch (error) {
    console.error('Customer support error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Marketing Analytics
exports.analyzeMarketing = functions.https.onCall(async (data, context) => {
  try {
    const { campaignData, userData, metrics } = data;
    
    // Use OpenAI for marketing analysis
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a marketing analytics assistant. Analyze the campaign data and provide insights."
        },
        {
          role: "user",
          content: `Campaign Data: ${JSON.stringify(campaignData)}, User Data: ${JSON.stringify(userData)}, Metrics: ${JSON.stringify(metrics)}`
        }
      ],
      temperature: 0.3
    });

    return {
      success: true,
      analysis: response.choices[0].message.content,
      predictions: await predictCampaignPerformance(campaignData),
      recommendations: []
    };
  } catch (error) {
    console.error('Marketing analysis error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Security Analysis
exports.analyzeSecurity = functions.https.onCall(async (data, context) => {
  try {
    const { activity, patterns, context: securityContext } = data;
    
    // Use OpenAI for security analysis
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a security analysis assistant. Analyze the activity patterns and identify potential threats."
        },
        {
          role: "user",
          content: `Activity: ${JSON.stringify(activity)}, Patterns: ${JSON.stringify(patterns)}, Context: ${securityContext}`
        }
      ],
      temperature: 0.2
    });

    const analysis = response.choices[0].message.content;
    
    return {
      success: true,
      threats: [],
      recommendations: [],
      analysis: analysis
    };
  } catch (error) {
    console.error('Security analysis error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Content Management
exports.manageContent = functions.https.onCall(async (data, context) => {
  try {
    const { content, type, context: contentContext } = data;
    
    // Use OpenAI for content management
    const analysis = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Analyze and optimize content."
        },
        {
          role: "user",
          content: `Content: ${content}, Type: ${type}, Context: ${contentContext}`
        }
      ]
    });

    return {
      success: true,
      analysis: analysis.choices[0].message.content,
      optimization: await optimizeContent(content, type),
      suggestions: await generateContentSuggestions(content, type)
    };
  } catch (error) {
    console.error('Content management error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Analytics and Reporting
exports.generateAnalytics = functions.https.onCall(async (data, context) => {
  try {
    const { data: analyticsData, metrics, timeframe } = data;
    
    // Use OpenAI for analytics
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an analytics assistant. Generate insights from the provided data."
        },
        {
          role: "user",
          content: `Data: ${JSON.stringify(analyticsData)}, Metrics: ${JSON.stringify(metrics)}, Timeframe: ${timeframe}`
        }
      ],
      temperature: 0.3
    });

    return {
      success: true,
      analysis: response.choices[0].message.content,
      predictions: [],
      insights: []
    };
  } catch (error) {
    console.error('Analytics generation error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Helper functions
function validateBusinessName(name) {
  return {
    isValid: name.length > 0,
    suggestions: []
  };
}

function suggestCategories(category) {
  return {
    current: category,
    alternatives: []
  };
}

function optimizeLocation(location) {
  return {
    current: location,
    suggestions: []
  };
}

function analyzeMarket(targetMarket) {
  return {
    analysis: "Basic market analysis",
    recommendations: []
  };
}

function optimizeServices(services, location, preferences) {
  return {
    current: services,
    suggestions: []
  };
}

function predictServiceQuality(services) {
  return {
    score: 0.8,
    factors: []
  };
}

function optimizeServiceDelivery(services) {
  return {
    current: services,
    optimizations: []
  };
}

function calculateCosineSimilarity(vec1, vec2) {
  if (vec1.length !== vec2.length) return 0;
  
  const dotProduct = vec1.reduce((acc, val, i) => acc + val * vec2[i], 0);
  const mag1 = Math.sqrt(vec1.reduce((acc, val) => acc + val * val, 0));
  const mag2 = Math.sqrt(vec2.reduce((acc, val) => acc + val * val, 0));
  
  return dotProduct / (mag1 * mag2);
}

async function analyzeSentiment(text) {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "Analyze the sentiment of the following text and return ONLY one word: positive, negative, or neutral."
      },
      {
        role: "user",
        content: text
      }
    ],
    temperature: 0,
    max_tokens: 10
  });

  return response.choices[0].message.content.toLowerCase().trim();
}

async function predictCampaignPerformance(campaignData) {
  return {
    performance: "Good",
    projectedROI: 1.5,
    suggestedImprovements: []
  };
}

async function optimizeContent(content, type) {
  // Implement content optimization logic
}

async function generateContentSuggestions(content, type) {
  // Implement content suggestions generation logic
} 