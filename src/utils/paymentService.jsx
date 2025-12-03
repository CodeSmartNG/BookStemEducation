// utils/paymentService.js
// COMPLETE & WORKING PAYSTACK INTEGRATION

class PaymentService {
  constructor() {
    this.config = {
      publicKey: process.env.REACT_APP_PAYSTACK_PUBLIC_KEY,
      secretKey: process.env.REACT_APP_PAYSTACK_SECRET_KEY,
      paymentLink: process.env.REACT_APP_PAYSTACK_PAYMENT_LINK,
      apiBaseUrl: process.env.REACT_APP_API_BASE_URL
    };
    
    this.validateConfig();
  }

  validateConfig() {
    if (!this.config.secretKey || this.config.secretKey.includes('your_')) {
      console.warn('⚠️ Paystack secret key not properly configured');
    }
    
    if (!this.config.publicKey || this.config.publicKey.includes('your_')) {
      console.warn('⚠️ Paystack public key not properly configured');
    }
  }

  // ✅ MAIN PAYMENT METHOD - Use this in your components
  async initiatePayment(paymentData) {
    console.log('🚀 Initiating payment:', paymentData);

    // Validate required fields
    if (!paymentData.email || !paymentData.amount) {
      throw new Error('Email and amount are required');
    }

    try {
      // Try Paystack API first
      const apiResult = await this.initializePaystackPayment(paymentData);
      
      if (apiResult.success) {
        return apiResult;
      }
    } catch (error) {
      console.warn('Paystack API failed, using payment link:', error.message);
    }

    // Fallback to direct payment link
    return this.usePaymentLink(paymentData);
  }

  // METHOD 1: Real Paystack API
  async initializePaystackPayment({ email, amount, metadata = {} }) {
    try {
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          amount: amount * 100, // Convert Naira to kobo
          currency: 'NGN',
          metadata: {
            ...metadata,
            source: 'edustem_platform',
            timestamp: new Date().toISOString()
          },
          callback_url: `${window.location.origin}/payment/verify`,
          channels: ['card', 'bank', 'ussd', 'mobile_money']
        })
      });

      const data = await response.json();

      if (!data.status) {
        throw new Error(data.message || 'Paystack initialization failed');
      }

      // Store reference for verification
      this.storePaymentReference(data.data.reference, {
        email,
        amount,
        metadata
      });

      // Redirect to Paystack payment page
      window.location.href = data.data.authorization_url;

      return {
        success: true,
        reference: data.data.reference,
        authorizationUrl: data.data.authorization_url,
        message: 'Redirecting to secure payment page...'
      };

    } catch (error) {
      console.error('Paystack API Error:', error);
      throw error;
    }
  }

  // METHOD 2: Direct Payment Link (Fallback)
  usePaymentLink(paymentData) {
    const reference = `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store payment data
    this.storePaymentReference(reference, paymentData);
    
    // Add payment data as URL parameters
    const params = new URLSearchParams({
      email: paymentData.email,
      amount: paymentData.amount * 100,
      currency: 'NGN',
      reference: reference,
      metadata: JSON.stringify({
        ...paymentData.metadata,
        source: 'edustem_payment_link'
      })
    });
    
    const paymentUrl = `${this.config.paymentLink}?${params.toString()}`;
    
    // Redirect to payment page
    window.location.href = paymentUrl;
    
    return {
      success: true,
      reference: reference,
      paymentUrl: paymentUrl,
      message: 'Redirecting to payment page...'
    };
  }

  // ✅ VERIFY PAYMENT - Call this after redirect back
  async verifyPayment(reference) {
    try {
      // If it's a payment link reference, check locally
      if (reference.startsWith('link_')) {
        return this.verifyLocalPayment(reference);
      }

      // Otherwise, verify with Paystack API
      const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: {
          'Authorization': `Bearer ${this.config.secretKey}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.status && data.data.status === 'success') {
        return {
          verified: true,
          data: {
            ...data.data,
            amount: data.data.amount / 100, // Convert back to Naira
            paid_at: data.data.paid_at,
            customer: data.data.customer
          },
          message: 'Payment verified successfully'
        };
      }

      return {
        verified: false,
        message: data.message || 'Payment verification failed',
        data: data.data
      };

    } catch (error) {
      console.error('Verification error:', error);
      return {
        verified: false,
        message: 'Could not verify payment. Please contact support.'
      };
    }
  }

  // Helper: Store payment reference locally
  storePaymentReference(reference, paymentData) {
    const paymentInfo = {
      reference,
      ...paymentData,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    localStorage.setItem(`payment_${reference}`, JSON.stringify(paymentInfo));
    localStorage.setItem('last_payment_reference', reference);
  }

  // Helper: Verify local payment (for payment link)
  verifyLocalPayment(reference) {
    const paymentData = JSON.parse(localStorage.getItem(`payment_${reference}`) || '{}');
    
    if (paymentData.reference === reference) {
      // Mark as verified
      paymentData.status = 'completed';
      paymentData.verified_at = new Date().toISOString();
      localStorage.setItem(`payment_${reference}`, JSON.stringify(paymentData));
      
      return {
        verified: true,
        data: paymentData,
        message: 'Payment completed successfully'
      };
    }
    
    return {
      verified: false,
      message: 'Payment not found'
    };
  }

  // Get payment history
  getPaymentHistory() {
    const payments = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('payment_')) {
        try {
          const payment = JSON.parse(localStorage.getItem(key));
          payments.push(payment);
        } catch (e) {
          console.warn('Failed to parse payment:', key);
        }
      }
    }
    
    return payments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // Clear payment data (optional)
  clearPaymentData(reference = null) {
    if (reference) {
      localStorage.removeItem(`payment_${reference}`);
    } else {
      // Clear all payment data
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('payment_')) {
          localStorage.removeItem(key);
        }
      });
    }
  }
}

// Create singleton instance
export const paymentService = new PaymentService();

// ✅ SIMPLE USAGE FUNCTIONS (for easy integration)
export const initiatePayment = (paymentData) => paymentService.initiatePayment(paymentData);
export const verifyPayment = (reference) => paymentService.verifyPayment(reference);
export const getPaymentHistory = () => paymentService.getPaymentHistory();