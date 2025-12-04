import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration
app.use(cors({
  origin: [
    'https://book-stem-education.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true
}));

app.use(express.json());

// ========================
// CRITICAL: Fix Your Paystack Key Here
// ========================

// ❌ DELETE THIS HARDCODED KEY - It's causing "Invalid key" error!
// const PAYSTACK_SECRET = "sk_test_xxxxxxx";

// ✅ USE ENVIRONMENT VARIABLE INSTEAD
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

// Validate key on startup
if (!PAYSTACK_SECRET) {
  console.error('❌ CRITICAL ERROR: PAYSTACK_SECRET_KEY not found in .env file!');
  console.error('Add this to your .env file:');
  console.error('PAYSTACK_SECRET_KEY=sk_live_YOUR_NEW_KEY_HERE');
  process.exit(1);
}

// Show safe preview of key
const keyPreview = PAYSTACK_SECRET.substring(0, 8) + '...' + PAYSTACK_SECRET.substring(PAYSTACK_SECRET.length - 4);
console.log('🔑 Paystack Key Loaded:', keyPreview);
console.log('✅ Backend server starting...');

// ========================
// STEP 1: Initialize Payment (UPDATED)
// ========================
app.post("/init-payment", async (req, res) => {
  try {
    const { email, amount, metadata = {} } = req.body;

    // Input validation
    if (!email || !email.includes('@')) {
      return res.json({ 
        status: false, 
        message: "Valid email address is required" 
      });
    }

    if (!amount || amount <= 0) {
      return res.json({ 
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
          platform: "BookStem Education"
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
    
    if (error.response?.data?.message?.includes('Invalid')) {
      errorMessage = "Invalid Paystack key. Please check your .env file";
    } else if (error.response?.status === 401) {
      errorMessage = "Paystack authentication failed. Check your secret key";
    }
    
    res.json({ 
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
      return res.json({ 
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
    res.json({ 
      status: false, 
      message: "Payment verification failed",
      error: error.response?.data?.message || error.message
    });
  }
});

// ========================
// NEW: Health Check Endpoint
// ========================
app.get("/health", (req, res) => {
  const keyType = PAYSTACK_SECRET.startsWith('sk_live_') ? 'Live' : 
                  PAYSTACK_SECRET.startsWith('sk_test_') ? 'Test' : 'Unknown';
  
  res.json({
    status: "online",
    service: "BookStem Payment Backend",
    timestamp: new Date().toISOString(),
    paystack: {
      configured: true,
      key_type: keyType,
      key_preview: keyPreview
    }
  });
});

// ========================
// NEW: Test Payment Endpoint
// ========================
app.post("/test-payment", async (req, res) => {
  try {
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
    res.json({
      status: false,
      test: "failed",
      error: error.response?.data?.message || error.message,
      message: "Paystack key might be invalid"
    });
  }
});

// ========================
// Server Start
// ========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
🚀 ========================================
   BookStem Payment Backend
   Port: ${PORT}
   Key Type: ${PAYSTACK_SECRET.startsWith('sk_live_') ? 'Live' : 'Test'}
   Key Preview: ${keyPreview}
   ========================================
✅ Server running!
🔗 Health Check: http://localhost:${PORT}/health
🔗 Test Payment: POST http://localhost:${PORT}/test-payment
  `);
});