// utils/paymentService.js

// REAL Paystack payment gateway service
export const paymentService = {
  // REAL Paystack Payment Initialization
  async initializePaystackPayment(email, amount, metadata = {}) {
    try {
      // Use environment variable - never hardcode live keys!
      const PAYSTACK_SECRET_KEY = process.env.REACT_APP_PAYSTACK_SECRET_KEY;
      
      if (!PAYSTACK_SECRET_KEY) {
        console.error('❌ Paystack secret key not configured');
        throw new Error('Payment gateway not configured. Please contact support.');
      }

      console.log('🔐 Initializing REAL Paystack payment:', { 
        email, 
        amount, 
        metadata 
      });

      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          amount: amount * 100, // Convert to kobo
          currency: 'NGN',
          metadata: metadata,
          callback_url: `${window.location.origin}/payment-callback`,
          channels: ['card', 'bank', 'ussd', 'qr']
        })
      });

      const data = await response.json();

      if (data.status) {
        console.log('✅ Paystack payment initialized:', data);
        return {
          status: true,
          message: 'Payment initialized successfully',
          data: {
            authorization_url: data.data.authorization_url,
            access_code: data.data.access_code,
            reference: data.data.reference
          }
        };
      } else {
        console.error('❌ Paystack initialization failed:', data);
        throw new Error(data.message || 'Failed to initialize payment');
      }
    } catch (error) {
      console.error('❌ Paystack API error:', error);
      
      // Only simulate in development mode
      if (process.env.NODE_ENV === 'development' || 
          window.location.hostname === 'localhost') {
        console.log('🔄 Using simulated Paystack payment for development');
        return this.simulatePaystackPayment(email, amount, metadata);
      }

      throw new Error('Failed to connect to payment gateway. Please try again.');
    }
  },

  // Direct payment with payment link
  async initiateDirectPayment(paymentData = {}) {
    try {
      console.log('🔗 Initiating direct Paystack payment');

      // Store payment data for verification
      localStorage.setItem('paystack_payment_data', JSON.stringify({
        ...paymentData,
        timestamp: new Date().toISOString()
      }));

      return {
        status: true,
        message: 'Payment link ready',
        data: {
          payment_url: 'https://paystack.shop/pay/8wikapcy3c',
          reference: `direct_${Date.now()}`,
          amount: paymentData.amount || 0
        }
      };
    } catch (error) {
      console.error('Direct payment error:', error);
      throw new Error('Failed to create payment link');
    }
  },

  // Simulated Paystack for development/testing
  simulatePaystackPayment(email, amount, metadata = {}) {
    console.log('🔄 Using SIMULATED Paystack payment');

    return new Promise((resolve) => {
      setTimeout(() => {
        const reference = `paystack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        resolve({
          status: true,
          message: 'Simulated payment initialized',
          data: {
            authorization_url: 'https://paystack.shop/pay/8wikapcy3c',
            access_code: `simulated_access_${reference}`,
            reference: reference
          }
        });
      }, 1000);
    });
  },

  // REAL Paystack Payment Verification
  async verifyPaystackPayment(reference) {
    try {
      // Use environment variable - never hardcode live keys!
      const PAYSTACK_SECRET_KEY = process.env.REACT_APP_PAYSTACK_SECRET_KEY;
      
      if (!PAYSTACK_SECRET_KEY) {
        console.error('❌ Paystack secret key not configured');
        return {
          status: false,
          message: 'Payment verification service not configured'
        };
      }

      console.log('🔍 Verifying REAL Paystack payment:', reference);

      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (data.status && data.data.status === 'success') {
        console.log('✅ Paystack payment verified:', data);
        return {
          status: true,
          message: 'Payment verified successfully',
          data: {
            status: data.data.status,
            reference: data.data.reference,
            amount: data.data.amount / 100,
            gateway_response: data.data.gateway_response,
            paid_at: data.data.paid_at,
            customer: data.data.customer,
            metadata: data.data.metadata
          }
        };
      } else {
        console.error('❌ Paystack verification failed:', data);
        return {
          status: false,
          message: data.message || 'Payment verification failed'
        };
      }
    } catch (error) {
      console.error('❌ Paystack verification error:', error);

      // Only simulate in development mode
      if (process.env.NODE_ENV === 'development' || 
          window.location.hostname === 'localhost') {
        console.log('🔄 Using simulated verification for development');
        return this.simulatePaystackVerification(reference);
      }

      return {
        status: false,
        message: 'Payment verification failed. Please contact support.'
      };
    }
  },

  // Simple redirect to payment link
  redirectToPaymentLink(paymentData = {}) {
    // Store payment data
    const paymentInfo = {
      ...paymentData,
      timestamp: new Date().toISOString(),
      reference: `link_${Date.now()}`
    };

    localStorage.setItem('paystack_payment_info', JSON.stringify(paymentInfo));

    // Redirect to payment link
    window.location.href = 'https://paystack.shop/pay/8wikapcy3c';

    return {
      success: true,
      message: 'Redirecting to payment page...'
    };
  },

  // Simulated verification for development
  simulatePaystackVerification(reference) {
    console.log('🔄 Using SIMULATED Paystack verification');

    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate successful verification 80% of the time
        const isSuccess = Math.random() > 0.2;

        if (isSuccess) {
          resolve({
            status: true,
            message: 'Simulated verification successful',
            data: {
              status: 'success',
              reference: reference,
              amount: 500000, // 5000 Naira in kobo
              gateway_response: 'Approved',
              paid_at: new Date().toISOString(),
              customer: {
                email: 'test@example.com',
                name: 'Test User'
              },
              metadata: {
                lesson_id: 'lesson_123',
                course_key: 'math101'
              }
            }
          });
        } else {
          resolve({
            status: false,
            message: 'Simulated verification failed'
          });
        }
      }, 1500);
    });
  },

  // Get Paystack banks list
  async getPaystackBanks() {
    try {
      const PAYSTACK_SECRET_KEY = process.env.REACT_APP_PAYSTACK_SECRET_KEY;
      
      if (!PAYSTACK_SECRET_KEY) {
        throw new Error('Paystack secret key not configured');
      }

      const response = await fetch('https://api.paystack.co/bank', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        }
      });

      const data = await response.json();

      if (data.status) {
        return {
          status: true,
          banks: data.data
        };
      } else {
        throw new Error('Failed to fetch banks');
      }
    } catch (error) {
      console.error('Bank fetch error:', error);

      // Return demo banks for development
      if (process.env.NODE_ENV === 'development') {
        return {
          status: true,
          banks: [
            { name: 'Access Bank', code: '044', slug: 'access-bank' },
            { name: 'Guaranty Trust Bank', code: '058', slug: 'guaranty-trust-bank' },
            { name: 'Zenith Bank', code: '057', slug: 'zenith-bank' },
            { name: 'First Bank of Nigeria', code: '011', slug: 'first-bank-of-nigeria' },
            { name: 'United Bank for Africa', code: '033', slug: 'united-bank-for-africa' }
          ]
        };
      }

      throw error;
    }
  },

  // Generate USSD payment code
  async generatePaystackUSSD(amount, bankCode) {
    try {
      const PAYSTACK_SECRET_KEY = process.env.REACT_APP_PAYSTACK_SECRET_KEY;
      
      if (!PAYSTACK_SECRET_KEY) {
        throw new Error('Paystack secret key not configured');
      }

      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount * 100,
          email: 'customer@example.com',
          currency: 'NGN',
          channels: ['ussd'],
          metadata: {
            bank_code: bankCode,
            payment_type: 'ussd'
          }
        })
      });

      const data = await response.json();

      if (data.status) {
        return {
          status: true,
          data: {
            ussd_code: data.data.ussd_code,
            reference: data.data.reference,
            bank: bankCode,
            amount: amount
          }
        };
      } else {
        throw new Error(data.message || 'Failed to generate USSD code');
      }
    } catch (error) {
      console.error('USSD generation error:', error);

      // Simulated USSD for development
      if (process.env.NODE_ENV === 'development') {
        return this.simulateUSSDCode(amount, bankCode);
      }

      throw error;
    }
  },

  // Simulated USSD for development
  simulateUSSDCode(amount, bankCode) {
    const banks = {
      '044': '*901*',
      '058': '*737*',
      '057': '*966*',
      '011': '*894*',
      '033': '*919*'
    };

    const ussdPrefix = banks[bankCode] || '*322*';
    const ussdCode = `${ussdPrefix}${amount}#`;

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          status: 'success',
          data: {
            ussd_code: ussdCode,
            bank: bankCode,
            amount: amount,
            instructions: `Dial ${ussdCode} on your phone to complete payment`
          }
        });
      }, 1000);
    });
  }
};

// Payment configuration
export const paymentConfig = {
  paystack: {
    publicKey: process.env.REACT_APP_PAYSTACK_PUBLIC_KEY || '',
    secretKey: process.env.REACT_APP_PAYSTACK_SECRET_KEY || '',
    paymentLink: 'https://paystack.shop/pay/8wikapcy3c'
  }
};

// Helper function to check development mode
export const isDevelopmentMode = () => {
  return process.env.NODE_ENV === 'development' || 
         window.location.hostname === 'localhost' ||
         window.location.hostname.includes('netlify.app');
};

// Function to use payment link
export const usePaystackPaymentLink = (paymentData = {}) => {
  const paymentInfo = {
    ...paymentData,
    timestamp: new Date().toISOString(),
    reference: `paylink_${Date.now()}`
  };

  localStorage.setItem('current_payment', JSON.stringify(paymentInfo));
  window.location.href = 'https://paystack.shop/pay/8wikapcy3c';

  return true;
};

// Initialize payment gateway
export const initializePaymentGateway = () => {
  const isDev = isDevelopmentMode();
  const hasKeys = process.env.REACT_APP_PAYSTACK_PUBLIC_KEY && 
                  process.env.REACT_APP_PAYSTACK_SECRET_KEY;
  
  if (isDev) {
    console.log('🚧 Running in development mode');
    if (!hasKeys) {
      console.warn('⚠️ Paystack keys not configured. Using simulation mode.');
    }
  } else {
    console.log('🚀 Running in production mode');
    if (!hasKeys) {
      console.error('❌ Paystack keys not configured in production!');
    }
  }
};

// Initialize on import
initializePaymentGateway();

export default paymentService;