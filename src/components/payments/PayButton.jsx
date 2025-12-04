import React, { useState } from 'react';

const PayButton = ({ email, amount, metadata = {}, buttonText, onSuccess, onClose, disabled = false }) => {
  const [loading, setLoading] = useState(false);
  const [keyError, setKeyError] = useState('');

  // Validate the Paystack key
  const validatePaystackKey = () => {
    // Get key from environment variable
    const publicKey = process.env.REACT_APP_PAYSTACK_PUBLIC_KEY;
    
    // Check if using MY key
    const MY_KEY = 'pk_live_d8d97b1f913f518b06d50f9cc21d84bee176a49d';
    if (publicKey === MY_KEY) {
      setKeyError('❌ You are using MY Paystack key! Get YOUR OWN from dashboard.paystack.com');
      return null;
    }
    
    // Check for placeholder
    if (!publicKey || publicKey.includes('YOUR_') || publicKey.includes('your_')) {
      setKeyError('❌ Invalid Paystack key. Add YOUR key to .env file');
      return null;
    }
    
    // Check format
    if (!publicKey.startsWith('pk_live_') && !publicKey.startsWith('pk_test_')) {
      setKeyError('❌ Invalid key format. Must start with "pk_live_" or "pk_test_"');
      return null;
    }
    
    return publicKey;
  };

  const handlePayment = () => {
    if (loading || disabled) return;
    
    // Validate key first
    const publicKey = validatePaystackKey();
    if (!publicKey) return;
    
    // Get email
    let customerEmail = email;
    if (!customerEmail) {
      customerEmail = prompt('📧 Enter your email for payment receipt:');
      if (!customerEmail || !customerEmail.includes('@')) {
        alert('Valid email is required');
        return;
      }
    }
    
    setLoading(true);
    
    // Load Paystack V2
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v2/inline.js';
    script.async = true;
    
    script.onload = () => {
      try {
        const paystack = new window.PaystackPop();
        
        paystack.newTransaction({
          key: publicKey,
          email: customerEmail,
          amount: amount * 100,
          ref: `BOOKSTEM_${Date.now()}`,
          currency: 'NGN',
          metadata: metadata,
          onSuccess: (transaction) => {
            console.log('✅ Payment successful:', transaction);
            setLoading(false);
            
            // Call success handler
            if (onSuccess) {
              onSuccess(transaction);
            }
          },
          onCancel: () => {
            console.log('Payment cancelled');
            setLoading(false);
            if (onClose) onClose();
          }
        });
      } catch (error) {
        console.error('Payment error:', error);
        setLoading(false);
        alert(`Payment Error: ${error.message || 'Please check your Paystack key'}`);
      }
    };
    
    script.onerror = () => {
      setLoading(false);
      alert('Failed to load payment system');
    };
    
    document.head.appendChild(script);
  };

  // Debug function to check current key
  const debugKey = () => {
    const key = process.env.REACT_APP_PAYSTACK_PUBLIC_KEY;
    const firstPart = key ? key.substring(0, 20) + '...' : 'undefined';
    alert(`Current Paystack Key:\n${firstPart}\n\nFrom .env file: ${key ? '✅ Loaded' : '❌ Not found'}`);
  };

  return (
    <div style={{ margin: '10px 0' }}>
      {keyError && (
        <div style={{
          background: '#f8d7da',
          color: '#721c24',
          padding: '10px',
          borderRadius: '6px',
          marginBottom: '10px',
          border: '1px solid #f5c6cb',
          fontSize: '14px'
        }}>
          <strong>⚠️ Configuration Error:</strong> {keyError}
          <div style={{ marginTop: '8px' }}>
            <a 
              href="https://dashboard.paystack.com/#/settings/developer"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: '#dc3545',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '4px',
                textDecoration: 'none',
                fontSize: '13px',
                marginRight: '8px'
              }}
            >
              Get Your Keys
            </a>
            <button 
              onClick={debugKey}
              style={{
                background: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '13px'
              }}
            >
              Debug Key
            </button>
          </div>
        </div>
      )}
      
      <button 
        onClick={handlePayment}
        disabled={loading || disabled || !!keyError}
        style={{
          background: keyError ? '#dc3545' : 
                     loading ? '#6c757d' : 
                     'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          padding: '14px 28px',
          fontSize: '16px',
          fontWeight: '600',
          borderRadius: '8px',
          cursor: (loading || disabled || !!keyError) ? 'not-allowed' : 'pointer',
          width: '100%',
          transition: 'all 0.3s'
        }}
      >
        {loading ? (
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
        ) : keyError ? (
          'Fix Configuration First'
        ) : (
          buttonText || `Pay ₦${amount}`
        )}
      </button>
      
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