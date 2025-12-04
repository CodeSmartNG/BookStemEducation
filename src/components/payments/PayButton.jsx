import React, { useState } from 'react';

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

  // Get public key with proper validation
  const getPublicKey = () => {
    // Check for Vite environment variable
    const viteKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    
    // Check for Create React App environment variable
    const craKey = process.env.REACT_APP_PAYSTACK_PUBLIC_KEY;
    
    // Use either available key
    const publicKey = viteKey || craKey;
    
    // If no key found, use a test key for development
    if (!publicKey) {
      console.warn('⚠️ No Paystack public key found in environment variables.');
      console.warn('Using test key for development. Add VITE_PAYSTACK_PUBLIC_KEY to your .env file.');
      
      // You can replace this with your actual test key
      return 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
    }
    
    // If using placeholder/demo key, show warning but allow it
    if (publicKey.includes('your_') || publicKey.includes('placeholder')) {
      console.warn('⚠️ Using placeholder/demo key. Replace with your real Paystack key.');
    }
    
    return publicKey;
  };

  const handlePayment = () => {
    // Prevent multiple clicks
    if (disabled || isLoading) return;

    // Get validated email
    const customerEmail = email || prompt('Enter your email for payment receipt:');
    if (!customerEmail || !customerEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    // Validate amount
    if (!amount || isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    // Get the public key
    const publicKey = getPublicKey();
    
    setIsLoading(true);

    // Load Paystack V2 inline script
    const script = document.createElement('script');
    script.src = "https://js.paystack.co/v2/inline.js";
    script.async = true;

    script.onload = () => {
      try {
        // Generate unique reference
        const reference = `EDUSTEM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Initialize Paystack V2
        const paystack = new window.PaystackPop();
        
        // Configure payment
        paystack.newTransaction({
          key: publicKey,
          email: customerEmail,
          amount: amount * 100, // Convert Naira to kobo
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
                display_name: "Student Email",
                variable_name: "student_email",
                value: customerEmail
              }
            ]
          },
          channels: ['card', 'bank', 'ussd', 'mobile_money'],
          
          // Payment success callback
          onSuccess: (transaction) => {
            console.log('✅ Payment successful (V2):', transaction);
            setIsLoading(false);
            
            // Store payment info in localStorage
            const paymentData = {
              ...transaction,
              email: customerEmail,
              amount: amount,
              metadata: metadata,
              timestamp: new Date().toISOString(),
              status: 'completed'
            };
            
            localStorage.setItem(`payment_${transaction.reference}`, JSON.stringify(paymentData));
            
            // Show success message
            alert(`✅ Payment Successful!\nReference: ${transaction.reference}\nAmount: ₦${amount}`);
            
            // Call parent's success callback if provided
            if (onSuccess) {
              onSuccess(transaction);
            }
          },
          
          // Payment cancelled callback
          onCancel: () => {
            console.log('Payment cancelled by user');
            setIsLoading(false);
            
            // Call parent's close callback if provided
            if (onClose) {
              onClose();
            }
          }
        });
      } catch (error) {
        console.error('❌ Error setting up Paystack payment:', error);
        setIsLoading(false);
        alert(`Payment Error: ${error.message || 'Failed to initialize payment'}`);
      }
    };

    // Handle script load errors
    script.onerror = () => {
      console.error('❌ Failed to load Paystack script');
      setIsLoading(false);
      alert('Failed to load payment gateway. Please check your internet connection.');
    };

    // Add script to page if not already loaded
    if (!window.PaystackPop) {
      document.head.appendChild(script);
    } else {
      // Script already loaded, trigger payment directly
      script.onload();
    }
  };

  return (
    <button 
      onClick={handlePayment} 
      className={`payment-btn ${isLoading ? 'loading' : ''} ${disabled ? 'disabled' : ''}`}
      disabled={disabled || isLoading}
      style={{
        background: isLoading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        padding: '12px 24px',
        fontSize: '16px',
        fontWeight: '600',
        borderRadius: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.3s ease',
        position: 'relative',
        minWidth: '140px'
      }}
    >
      {isLoading ? (
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
          
          .payment-btn:hover:not(.disabled):not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
          }
        `}
      </style>
    </button>
  );
};

// Default export
export default PayButton;