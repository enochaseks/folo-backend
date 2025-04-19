require('dotenv').config();
const firebase = require('firebase/app');
require('firebase/functions');

// Initialize Firebase
firebase.initializeApp({
  projectId: 'folo-app-f12f0',
  apiKey: 'AIzaSyA_Sample_API_Key',
});

// Connect to emulator
firebase.functions().useEmulator('localhost', 5001);

async function runTests() {
  try {
    // 1. Test Business Setup Analysis
    console.log('\n1. Testing Business Setup Analysis...');
    const businessResult = await firebase.functions().httpsCallable('analyzeBusinessSetup')({
      businessName: "Tech Solutions",
      category: "Technology",
      location: { city: "New York", country: "USA" },
      targetMarket: "Small Businesses"
    });
    console.log('Business Analysis Result:', businessResult.data);

    // 2. Test Service Management
    console.log('\n2. Testing Service Management...');
    const serviceResult = await firebase.functions().httpsCallable('manageService')({
      services: [
        { name: "Web Development", price: 1000 },
        { name: "App Development", price: 2000 }
      ],
      location: { city: "New York", country: "USA" },
      userPreferences: { businessType: "Technology", targetMarket: "Small Businesses" }
    });
    console.log('Service Management Result:', serviceResult.data);

    // 3. Test Smart Search
    console.log('\n3. Testing Smart Search...');
    const searchResult = await firebase.functions().httpsCallable('smartSearch')({
      query: "web development services",
      filters: { category: "Technology", maxPrice: 2000 }
    });
    console.log('Smart Search Result:', searchResult.data);

    // 4. Test Customer Support
    console.log('\n4. Testing Customer Support...');
    const supportResult = await firebase.functions().httpsCallable('handleCustomerSupport')({
      message: "How do I update my business profile?",
      supportContext: "Account Settings",
      history: []
    });
    console.log('Customer Support Result:', supportResult.data);

    // 5. Test Marketing Analysis
    console.log('\n5. Testing Marketing Analysis...');
    const marketingResult = await firebase.functions().httpsCallable('analyzeMarketing')({
      campaignData: {
        name: "Summer Promotion",
        budget: 5000,
        channels: ["social", "email"],
        duration: "30 days"
      },
      userData: {
        demographics: { age: "25-34", location: "Urban" },
        interests: ["technology", "business"]
      },
      metrics: ["conversions", "engagement", "roi"]
    });
    console.log('Marketing Analysis Result:', marketingResult.data);

    // 6. Test Security Analysis
    console.log('\n6. Testing Security Analysis...');
    const securityResult = await firebase.functions().httpsCallable('analyzeSecurity')({
      activity: {
        logins: [{ time: "2023-04-04T10:00:00Z", location: "New York" }],
        transactions: [{ amount: 500, time: "2023-04-04T11:00:00Z" }]
      },
      patterns: {
        loginFrequency: "daily",
        transactionVolume: "medium"
      },
      context: "Regular user activity monitoring"
    });
    console.log('Security Analysis Result:', securityResult.data);

    // 7. Test Content Management
    console.log('\n7. Testing Content Management...');
    const contentResult = await firebase.functions().httpsCallable('manageContent')({
      content: "We offer professional web development services for small businesses.",
      type: "service_description",
      context: "Website homepage"
    });
    console.log('Content Management Result:', contentResult.data);

    // 8. Test Analytics Generation
    console.log('\n8. Testing Analytics Generation...');
    const analyticsResult = await firebase.functions().httpsCallable('generateAnalytics')({
      data: {
        visitors: [100, 150, 200, 180, 220],
        conversions: [5, 8, 12, 10, 15],
        revenue: [500, 800, 1200, 1000, 1500]
      },
      metrics: ["visitors", "conversions", "revenue"],
      timeframe: "last_week"
    });
    console.log('Analytics Generation Result:', analyticsResult.data);

  } catch (error) {
    console.error('Test Error:', error);
  }
}

runTests(); 