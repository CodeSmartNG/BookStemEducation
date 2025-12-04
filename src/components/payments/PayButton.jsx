import React, { useState, useEffect } from 'react';

const PayButton = ({ 
  email, 
  amount, 
  metadata = {}, 
  buttonText, 
  onSuccess,
  onClose,
  disabled = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Get and validate the public key
  const getValidatedKey = () => {
    // Try multiple environment variable names
    const keys = [
      import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      process.env.REACT_APP_PAYSTACK_PUBLIC_KEY,
      localStorage.getItem('paystack_public_key')
    ];
    
    let publicKey = keys.find(key => key && key.length > 30);
    
    // If no key found, show helpful error
    if (!publicKey) {
      setError('Paystack key not configured. Please add VITE_PAYSTACK_PUBLIC_KEY to your .env file.');
      return null;
    }
    
    // Validate key format
    const isValidFormat = publicKey.startsWith('pk_live_') || publicKey.startsWith('pk_test_');
    
    if (!isValidFormat) {
      setError('Invalid Paystack key format. Key should start with "pk_live_" or "pk_test_"');
      return null;
    }
    
    // Check for placeholder/expired keys
    const invalidPatterns = [
      'your_paystack',
      'xxxxxxxx',
      'test_key',
      'demo_key',
      'example'
    ];
    
    if (invalidPatterns.some(pattern => publicKey.includes(pattern))) {
      setError('Invalid or placeholder Paystack key detected. Please use your actual key from Paystack dashboard.');
      return null;
    }
    
    return publicKey;
  };

  const handlePayment = async () => {
    // Clear previous errors
    setError('');
    
    if (disabled || isLoading) return;
    
    // Validate email
    let customerEmail = email;
    if (!customerEmail) {
      customerEmail = prompt('📧 Enter your email for payment receipt:');
      if (!customerEmail || !customerEmail.includes('@')) {
        setError('Valid email is required');
        return;
      }
    }
    
    // Validate amount
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    // Get and validate key
    const publicKey = getValidatedKey();
    if (!publicKey) {
      // Error already set by getValidatedKey
      return;
    }
    
    setIsLoading(true);
    
    // Load Paystack script
    const script = document.createElement('script');
    script.src = "https://js.paystack.co/v2/inline.js";
    script.async = true;
    
    script.onload = () => {
      try {
        // Check if Paystack is available
        if (!window.PaystackPop || typeof window.PaystackPop !== 'function') {
          throw new Error('Paystack payment system failed to load');
        }
        
        const paystack = new window.PaystackPop();
        const reference = `EDU_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        
        paystack.newTransaction({
          key: publicKey,
          email: customerEmail,
          amount: amount * 100,
          ref: reference,
          currency: 'NGN',
          metadata: {
            ...metadata,
            platform: 'Edustem Academy',
            timestamp: new Date().toISOString()
          },
          channels: ['card', 'bank', 'ussd'],
          
          onSuccess: (transaction) => {
            console.log('✅ Payment successful:', transaction);
            setIsLoading(false);
            
            // Store locally
            localStorage.setItem('last_payment', JSON.stringify({
              reference: transaction.reference,
              amount: amount,
              email: customerEmail,
              timestamp: new Date().toISOString()
            }));
            
            alert(`✅ Payment Successful!\nAmount: ₦${amount}\nReference: ${transaction.reference}`);
            
            if (onSuccess) onSuccess(transaction);
          },
          
          onCancel: () => {
            console.log('Payment cancelled');
            setIsLoading(false);
            if (onClose) onClose();
          }
        });
        
      } catch (error) {
        console.error('Payment error:', error);
        setIsLoading(false);
        setError(`Payment Error: ${error.message || 'Please check your Paystack key'}`);
      }
    };
    
    script.onerror = () => {
      setIsLoading(false);
      setError('Failed to load payment gateway. Check your internet connection.');
    };
    
    document.head.appendChild(script);
  };

  // Test function to validate key without payment
  const testKey = () => {
    const key = getValidatedKey();
    if (key) {
      alert(`✅ Key appears valid!\n\nStarts with: ${key.substring(0, 20)}...\n\nTest this key in Paystack dashboard to confirm.`);
    }
  };

  return (
    <div style={{ margin: '10px 0' }}>
      {error && (
        <div style={{
          background: '#f8d7da',
          color: '#721c24',
          padding: '10px',
          borderRadius: '6px',
          marginBottom: '10px',
          border: '1px solid #f5c6cb'
        }}>
          <strong>⚠️ Error:</strong> {error}
          
          <div style={{ marginTop: '8px' }}>
            <button 
              onClick={testKey}
              style={{
                background: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '4px',
                marginRight: '8px',
                fontSize: '12px'
              }}
            >
              Test Key
            </button>
            
            <button 
              onClick={() => setError('')}
              style={{
                background: 'transparent',
                color: '#721c24',
                border: '1px solid #721c24',
                padding: '5px 10px',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      
      <button 
        onClick={handlePayment}
        disabled={disabled || isLoading || !!error}
        style={{
          background: error ? '#dc3545' : 
                     isLoading ? '#6c757d' : 
                     'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: '600',
          borderRadius: '8px',
          cursor: (disabled || isLoading || !!error) ? 'not-allowed' : 'pointer',
          opacity: (disabled || !!error) ? 0.6 : 1,
          width: '100%',
          position: 'relative'
        }}
      >
        {isLoading ? (
          <>
            Processing Payment...
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
        ) : error ? (
          'Fix Configuration First'
        ) : (
          buttonText || `Pay ₦${amount.toLocaleString()}`
        )}
      </button>
      
      <div style={{
        fontSize: '12px',
        color: '#666',
        marginTop: '8px',
        textAlign: 'center'
      }}>
        <button 
          onClick={testKey}
          style={{
            background: 'none',
            border: 'none',
            color: '#667eea',
            cursor: 'pointer',
            textDecoration: 'underline',
            fontSize: '11px'
          }}
        >
          🔧 Test Payment Configuration
        </button>
      </div>
      
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default PayButton;