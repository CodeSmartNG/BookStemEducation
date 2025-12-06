import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration for Render deployment
const allowedOrigins = [
  'https://book-stem-education.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  // Add your Render frontend URL here if you have one
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

// ========================
// CRITICAL: Fix Your Paystack Key Here
// ========================
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

// Validate key on startup
if (!PAYSTACK_SECRET) {
  console.error('❌ CRITICAL ERROR: PAYSTACK_SECRET_KEY not found in environment variables!');
  console.error('For Render deployment:');
  console.error('1. Go to your Render dashboard');
  console.error('2. Select your service');
  console.error('3. Go to Environment tab');
  console.error('4. Add: PAYSTACK_SECRET_KEY=sk_live_YOUR_NEW_KEY_HERE');
  console.error('Or for test: PAYSTACK_SECRET_KEY=sk_test_YOUR_TEST_KEY');
  process.exit(1);
}

// Show safe preview of key
const keyPreview = PAYSTACK_SECRET.substring(0, 8) + '...' + PAYSTACK_SECRET.substring(PAYSTACK_SECRET.length - 4);
console.log('🔑 Paystack Key Loaded:', keyPreview);
console.log('✅ Backend server starting...');

// ========================
// RENDER SPECIFIC: Root endpoint
// ========================
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to BookStem Education Payment API",
    service: "Online",
    endpoints: {
      health: "/health",
      init_payment: "POST /init-payment",
      verify_payment: "GET /verify-payment/:reference",
      test_payment: "POST /test-payment"
    },
    documentation: "API for handling Paystack payments for BookStem Education",
    deploy_platform: "Render"
  });
});

// ========================
// STEP 1: Initialize Payment (UPDATED)
// ========================
app.post("/init-payment", async (req, res) => {
  try {
    const { email, amount, metadata = {} } = req.body;

    // Input validation
    if (!email || !email.includes('@')) {
      return res.status(400).json({ 
        status: false, 
        message: "Valid email address is required" 
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        status: false, 
        message: "Valid amount is required" 
      });
    }

    console.log('💰 Initializing payment:', { email, amount });

    const paystackRes = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amount * 100, // Convert Naira to kobo
        currency: "NGN",
        channels: ["card", "bank", "ussd", "qr"],
        metadata: {
          ...metadata,
          platform: "BookStem Education",
          backend: "render"
        },
        callback_url: "https://book-stem-education.vercel.app/payment/verify"
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
        timeout: 10000 // 10 second timeout
      }
    );

    console.log('✅ Payment initialized:', paystackRes.data.data.reference);

    res.json({
      status: true,
      authorization_url: paystackRes.data.data.authorization_url,
      reference: paystackRes.data.data.reference,
      access_code: paystackRes.data.data.access_code,
      message: "Payment initialized successfully"
    });

  } catch (error) {
    console.error('❌ Payment initialization error:', error.response?.data || error.message);

    // Provide helpful error messages
    let errorMessage = "Payment initialization failed";
    let statusCode = 500;

    if (error.response?.data?.message?.includes('Invalid')) {
      errorMessage = "Invalid Paystack key. Please check your environment variables";
      statusCode = 400;
    } else if (error.response?.status === 401) {
      errorMessage = "Paystack authentication failed. Check your secret key";
      statusCode = 401;
    }

    res.status(statusCode).json({ 
      status: false, 
      message: errorMessage,
      paystack_error: error.response?.data?.message
    });
  }
});

// ========================
// STEP 2: Verify Payment (UPDATED)
// ========================
app.get("/verify-payment/:reference", async (req, res) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({ 
        status: false, 
        message: "Payment reference is required" 
      });
    }

    console.log('🔍 Verifying payment:', reference);

    const verify = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
        },
        timeout: 10000
      }
    );

    if (verify.data.data.status === "success") {
      console.log('✅ Payment successful:', reference);

      // Extract useful data
      const paymentData = {
        reference: verify.data.data.reference,
        amount: verify.data.data.amount / 100, // Convert back to Naira
        currency: verify.data.data.currency,
        status: verify.data.data.status,
        paid_at: verify.data.data.paid_at,
        customer: {
          email: verify.data.data.customer.email,
          name: verify.data.data.customer.name
        },
        metadata: verify.data.data.metadata
      };

      // TODO: Store payment → unlock course here
      // await unlockCourseForStudent(paymentData.metadata.student_id, paymentData.metadata.course_id);

      return res.json({
        status: true,
        message: "Payment successful! Course access granted.",
        data: paymentData
      });
    } else {
      console.log('⚠️ Payment not successful:', reference, verify.data.data.status);
      return res.json({ 
        status: false, 
        message: `Payment status: ${verify.data.data.status}`,
        data: verify.data.data
      });
    }
  } catch (error) {
    console.error('❌ Verification error:', error.response?.data || error.message);
    res.status(500).json({ 
      status: false, 
      message: "Payment verification failed",
      error: error.response?.data?.message || error.message
    });
  }
});

// ========================
// Health Check Endpoint
// ========================
app.get("/health", (req, res) => {
  const keyType = PAYSTACK_SECRET.startsWith('sk_live_') ? 'Live' : 
                  PAYSTACK_SECRET.startsWith('sk_test_') ? 'Test' : 'Unknown';

  res.json({
    status: "online",
    service: "BookStem Payment Backend",
    deploy_platform: "Render",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    paystack: {
      configured: true,
      key_type: keyType,
      key_preview: keyPreview
    }
  });
});

// ========================
// Test Payment Endpoint
// ========================
app.post("/test-payment", async (req, res) => {
  try {
    const keyType = PAYSTACK_SECRET.startsWith('sk_live_') ? 'Live' : 
                    PAYSTACK_SECRET.startsWith('sk_test_') ? 'Test' : 'Unknown';
    
    // Test with a small amount (₦100)
    const testRes = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: "test@bookstem.com",
        amount: 10000, // ₦100 in kobo
        reference: `TEST_${Date.now()}`,
        currency: "NGN"
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        }
      }
    );

    res.json({
      status: true,
      test: "payment_initialization",
      paystack_response: {
        success: testRes.data.status,
        message: testRes.data.message,
        has_url: !!testRes.data.data?.authorization_url
      },
      key_info: {
        type: keyType,
        preview: keyPreview
      }
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      test: "failed",
      error: error.response?.data?.message || error.message,
      message: "Paystack key might be invalid"
    });
  }
});

// ========================
// 404 Handler
// ========================
app.use((req, res) => {
  res.status(404).json({
    status: false,
    message: "Endpoint not found",
    available_endpoints: [
      "GET /",
      "GET /health",
      "POST /init-payment",
      "GET /verify-payment/:reference",
      "POST /test-payment"
    ]
  });
});

// ========================
// Server Start
// ========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
🚀 ========================================
   BookStem Payment Backend
   Deployed on: Render
   Port: ${PORT}
   Environment: ${process.env.NODE_ENV || 'development'}
   Key Type: ${PAYSTACK_SECRET.startsWith('sk_live_') ? 'Live' : 'Test'}
   Key Preview: ${keyPreview}
   ========================================
✅ Server running on Render!
🔗 Root URL: https://your-app-name.onrender.com
🔗 Health Check: /health
🔗 Test Payment: POST /test-payment
  `);
});