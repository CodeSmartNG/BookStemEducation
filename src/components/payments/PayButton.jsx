import React, { useState, useEffect } from 'react';

const PayButton = ({ 
  email, 
  amount, 
  metadata = {}, 
  buttonText, 
  onSuccess,
  onClose,
  disabled = false,
  currency = "NGN"
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paystackLoaded, setPaystackLoaded] = useState(false);

  // Load Paystack script once when component mounts
  useEffect(() => {
    if (window.PaystackPop) {
      setPaystackLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = "https://js.paystack.co/v2/inline.js";
    script.async = true;
    script.id = 'paystack-script';

    script.onload = () => {
      console.log('✅ Paystack V2 script loaded');
      setPaystackLoaded(true);
    };

    script.onerror = () => {
      console.error('❌ Failed to load Paystack script');
      setPaystackLoaded(false);
    };

    // Remove existing script if any
    const existingScript = document.getElementById('paystack-script');
    if (existingScript) {
      existingScript.remove();
    }

    document.head.appendChild(script);

    // Cleanup on unmount
    return () => {
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const getPublicKey = () => {
    // Try multiple ways to get the key
    const viteKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    const craKey = process.env.REACT_APP_PAYSTACK_PUBLIC_KEY;
    
    const publicKey = viteKey || craKey;
    
    if (!publicKey) {
      console.warn('No Paystack key found. Using test mode.');
      // Use a real test key format (replace with yours)
      return 'pk_test_e2c7e4e4d8e3c6c5f4a4b3a2c1d0e9f8a7b6c5d4';
    }
    
    return publicKey;
  };

  const handlePayment = () => {
    // Prevent multiple clicks
    if (disabled || isLoading) {
      return;
    }

    // Check if Paystack is loaded
    if (!paystackLoaded || !window.PaystackPop) {
      alert('Payment system is loading, please try again in a moment.');
      console.error('Paystack not loaded yet');
      return;
    }

    // Get email from props or prompt
    let customerEmail = email;
    if (!customerEmail) {
      customerEmail = prompt('Enter your email for payment receipt:');
      if (!customerEmail || !customerEmail.includes('@')) {
        alert('Valid email is required for payment');
        return;
      }
    }

    // Validate amount
    if (!amount || isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const publicKey = getPublicKey();
    
    // Show loading
    setIsLoading(true);

    try {
      // IMPORTANT: Use the CORRECT constructor name
      // For V2, it should be: new PaystackPop()
      const paystack = new window.PaystackPop();
      
      // Generate reference
      const reference = `EDUSTEM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Configure payment
      paystack.newTransaction({
        key: publicKey,
        email: customerEmail,
        amount: amount * 100, // Convert to kobo
        ref: reference,
        currency: currency,
        metadata: {
          ...metadata,
          custom_fields: [
            {
              display_name: "Platform",
              variable_name: "platform",
              value: "Edustem Academy"
            },
            {
              display_name: "Student",
              variable_name: "student_email",
              value: customerEmail
            }
          ]
        },
        channels: ['card', 'bank', 'ussd'],
        
        // Payment success
        onSuccess: (transaction) => {
          console.log('✅ Payment successful:', transaction);
          setIsLoading(false);
          
          // Store payment data
          localStorage.setItem(`payment_${reference}`, JSON.stringify({
            ...transaction,
            email: customerEmail,
            amount: amount,
            timestamp: new Date().toISOString()
          }));
          
          // Show success message
          alert(`Payment successful!\nReference: ${transaction.reference}`);
          
          // Call success callback
          if (onSuccess) {
            onSuccess(transaction);
          }
        },
        
        // Payment cancelled
        onCancel: () => {
          console.log('Payment cancelled by user');
          setIsLoading(false);
          
          if (onClose) {
            onClose();
          }
        }
      });
      
    } catch (error) {
      console.error('Payment initialization error:', error);
      setIsLoading(false);
      
      // Show specific error messages
      if (error.message.includes('not a constructor')) {
        alert('Payment system error. Please refresh the page and try again.');
      } else {
        alert(`Payment Error: ${error.message || 'Please try again'}`);
      }
    }
  };

  return (
    <button 
      onClick={handlePayment}
      disabled={disabled || isLoading || !paystackLoaded}
      style={{
        background: isLoading ? '#6c757d' : 
                   !paystackLoaded ? '#ccc' : 
                   'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        padding: '12px 24px',
        fontSize: '16px',
        fontWeight: '600',
        borderRadius: '8px',
        cursor: (disabled || isLoading || !paystackLoaded) ? 'not-allowed' : 'pointer',
        opacity: (disabled || !paystackLoaded) ? 0.7 : 1,
        transition: 'all 0.3s ease',
        minWidth: '140px',
        position: 'relative'
      }}
    >
      {!paystackLoaded ? (
        'Loading Payment...'
      ) : isLoading ? (
        <>
          Processing...
          <span style={{
            display: 'inline-block',
            width: '16px',
            height: '16px',
            border: '2px solid rgba(255,255,255,0.3)',
            borderTopColor: 'white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginLeft: '8px'
          }}></span>
        </>
      ) : (
        buttonText || `Pay ₦${amount.toLocaleString()}`
      )}
      
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </button>
  );
};

export default PayButton;