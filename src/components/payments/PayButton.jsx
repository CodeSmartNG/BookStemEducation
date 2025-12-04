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

  const handlePayment = () => {
    if (disabled || isLoading) return;

    // Validate inputs
    if (!email || !email.includes('@')) {
      console.error('Valid email is required for payment');
      alert('Please provide a valid email address');
      return;
    }

    if (!amount || amount <= 0) {
      console.error('Invalid amount for payment');
      alert('Please enter a valid amount');
      return;
    }

    const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    if (!publicKey || publicKey.includes('your_') || publicKey.includes('test_')) {
      console.error('Paystack public key not configured');
      alert('Payment gateway not configured. Please contact support.');
      return;
    }

    setIsLoading(true);

    // Load Paystack V2 inline script
    const script = document.createElement('script');
    script.src = "https://js.paystack.co/v2/inline.js";
    script.async = true;

    script.onload = () => {
      try {
        // Generate unique reference
        const reference = `EDUSTEM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // V2: Use PaystackPop constructor
        const paystack = new window.PaystackPop();
        
        paystack.newTransaction({
          key: publicKey,
          email: email,
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
                display_name: "Payment Type",
                variable_name: "payment_type",
                value: metadata.payment_type || "Course Payment"
              }
            ]
          },
          channels: ['card', 'bank', 'ussd', 'mobile_money'],
          
          // V2: Callback names changed
          onSuccess: (transaction) => {
            console.log('✅ V2 Payment successful:', transaction);
            setIsLoading(false);
            
            // Store payment info
            localStorage.setItem(`payment_${transaction.reference}`, JSON.stringify({
              ...transaction,
              email,
              amount,
              metadata,
              timestamp: new Date().toISOString(),
              status: 'completed'
            }));
            
            if (onSuccess) onSuccess(transaction);
          },
          
          onCancel: () => {
            console.log('V2 Payment cancelled by user');
            setIsLoading(false);
            if (onClose) onClose();
          }
        });
      } catch (error) {
        console.error('Error setting up V2 Paystack payment:', error);
        setIsLoading(false);
        alert('Error initializing payment. Please try again.');
      }
    };

    script.onerror = () => {
      console.error('Failed to load Paystack V2 script');
      setIsLoading(false);
      alert('Failed to load payment gateway. Please check your connection.');
    };

    // Check if script already loaded
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
    >
      {isLoading ? 'Processing...' : (buttonText || `Pay ₦${amount.toLocaleString()}`)}
    </button>
  );
};

// Default export
export default PayButton;