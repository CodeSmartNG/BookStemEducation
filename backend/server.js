import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: ['https://book-stem-education.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Validate environment variables
const validateEnv = () => {
  const required = ['PAYSTACK_SECRET_KEY', 'PAYSTACK_PUBLIC_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing);
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
  
  console.log('✅ Environment variables loaded');
};

validateEnv();

// ✅ 1. Initialize Payment
app.post("/api/paystack/initialize", async (req, res) => {
  try {
    const { email, amount, metadata, reference } = req.body;

    // Validate required fields
    if (!email || !amount) {
      return res.status(400).json({ 
        status: false, 
        message: "Email and amount are required" 
      });
    }

    // Generate reference if not provided
    const paymentRef = reference || `BOOKSTEM_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // Convert to kobo
        reference: paymentRef,
        currency: "NGN",
        channels: ["card", "bank", "ussd", "mobile_money"],
        metadata: {
          ...metadata,
          platform: "BookStem Education",
          timestamp: new Date().toISOString()
        },
        callback_url: `${process.env.FRONTEND_URL || 'https://book-stem-education.vercel.app'}/payment/verify`
      })
    });

    const data = await response.json();
    
    if (data.status) {
      console.log('✅ Payment initialized:', { reference: paymentRef, email, amount });
      
      // Store payment info (in production, save to database)
      const paymentData = {
        reference: paymentRef,
        email,
        amount,
        metadata,
        status: 'initialized',
        timestamp: new Date().toISOString()
      };
      
      // You should save this to a database here
      // await savePaymentToDB(paymentData);
      
      res.json({
        status: true,
        message: "Payment initialized successfully",
        data: {
          authorization_url: data.data.authorization_url,
          reference: paymentRef,
          access_code: data.data.access_code
        }
      });
    } else {
      console.error('❌ Paystack error:', data.message);
      res.status(400).json({
        status: false,
        message: data.message || "Failed to initialize payment"
      });
    }
  } catch (error) {
    console.error('❌ Initialize error:', error);
    res.status(500).json({
      status: false,
      message: "Internal server error"
    });
  }
});

// ✅ 2. Verify Payment
app.get("/api/paystack/verify/:reference", async (req, res) => {
  try {
    const { reference } = req.params;

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      }
    });

    const data = await response.json();

    if (data.status && data.data.status === "success") {
      console.log('✅ Payment verified:', reference);
      
      // Update payment status in database
      // await updatePaymentStatus(reference, 'success', data.data);
      
      res.json({
        status: true,
        message: "Payment verified successfully",
        data: {
          reference: data.data.reference,
          amount: data.data.amount / 100, // Convert back to Naira
          status: data.data.status,
          paid_at: data.data.paid_at,
          customer: data.data.customer,
          metadata: data.data.metadata
        }
      });
    } else {
      res.json({
        status: false,
        message: data.message || "Payment verification failed",
        data: data.data
      });
    }
  } catch (error) {
    console.error('❌ Verification error:', error);
    res.status(500).json({
      status: false,
      message: "Internal server error"
    });
  }
});

// ✅ 3. Webhook Handler (CRITICAL)
app.post("/api/paystack/webhook", async (req, res) => {
  try {
    // Verify Paystack signature
    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');
    
    if (hash !== req.headers['x-paystack-signature']) {
      console.error('❌ Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    console.log('📩 Webhook received:', event.event);

    // Handle different events
    switch (event.event) {
      case 'charge.success':
        await handleSuccessfulPayment(event.data);
        break;
        
      case 'transfer.success':
        await handleTransferSuccess(event.data);
        break;
        
      case 'subscription.create':
        await handleSubscription(event.data);
        break;
        
      default:
        console.log('Unhandled event:', event.event);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ✅ 4. Get Banks List (for USSD/Bank transfer)
app.get("/api/paystack/banks", async (req, res) => {
  try {
    const response = await fetch("https://api.paystack.co/bank", {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      }
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('❌ Banks fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch banks' });
  }
});

// ✅ 5. Health Check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    paystack_configured: !!process.env.PAYSTACK_SECRET_KEY
  });
});

// ✅ Payment event handlers
async function handleSuccessfulPayment(paymentData) {
  console.log('💰 Payment successful:', {
    reference: paymentData.reference,
    amount: paymentData.amount / 100,
    email: paymentData.customer.email,
    metadata: paymentData.metadata
  });

  // Grant course access
  const { course_id, lesson_id, student_id } = paymentData.metadata || {};
  
  if (course_id && student_id) {
    // Save to database
    // await grantCourseAccess(student_id, course_id, lesson_id, paymentData.reference);
    console.log(`✅ Granted access: Student ${student_id} to ${course_id}`);
  }

  // Process teacher payout (70% to teacher, 30% platform)
  if (paymentData.metadata?.teacher_id) {
    const teacherAmount = (paymentData.amount * 0.7) / 100; // 70% in Naira
    // await processTeacherPayout(paymentData.metadata.teacher_id, teacherAmount, paymentData.reference);
    console.log(`👨‍🏫 Teacher payout: ₦${teacherAmount} to ${paymentData.metadata.teacher_id}`);
  }
}

async function handleTransferSuccess(transferData) {
  console.log('💸 Transfer successful:', transferData);
  // Update teacher payment status
}

async function handleSubscription(subscriptionData) {
  console.log('🔄 Subscription created:', subscriptionData);
  // Handle recurring payments
}

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 Paystack initialized: http://localhost:${PORT}/api/paystack/initialize`);
});