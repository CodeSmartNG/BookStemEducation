import React, { useState } from 'react';

const PayButton = ({ email, amount, buttonText = 'Pay Now' }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Get and validate the key
  const getValidatedKey = () => {
    // Get from environment
    const publicKey = process.env.REACT_APP_PAYSTACK_PUBLIC_KEY;
    
    // MY KEY - DELETE THIS!
    const MY_WRONG_KEY = 'pk_live_d8d97b1f913f518b06d50f9cc21d84bee176a49d';
    
    // Check if you're using MY key
    if (publicKey === MY_WRONG_KEY) {
      setError('❌ STOP! You are using MY Paystack key!\n\nGet YOUR OWN key at: dashboard.paystack.com');
      alert('CRITICAL: You are using someone else\'s Paystack key!\n\nGo to: dashboard.paystack.com\nLogin → Settings → API & Webhooks\nCopy YOUR Live Public Key\nUpdate your .env file');
      return null;
    }
    
    // Check for placeholder
    if (!publicKey || publicKey.includes('YOUR') || publicKey.includes('your_')) {
      setError('❌ Paystack key not configured!\n\nAdd REACT_APP_PAYSTACK_PUBLIC_KEY to your .env file');
      return null;
    }
    
    // Check format
    if (!publicKey.startsWith('pk_live_')) {
      setError('❌ Invalid key format!\n\nMust start with "pk_live_"');
      return null;
    }
    
    return publicKey;
  };

  const handlePayment = () => {
    if (loading) return;
    
    // Validate key first
    const publicKey = getValidatedKey();
    if (!publicKey) return;
    
    // Get email
    let customerEmail = email;
    if (!customerEmail) {
      customerEmail = prompt('📧 Student email for receipt:');
      if (!customerEmail) return;
    }
    
    setLoading(true);
    
    // Load Paystack
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v2/inline.js';
    
    script.onload = () => {
      try {
        const paystack = new window.PaystackPop();
        
        paystack.newTransaction({
          key: publicKey,
          email: customerEmail,
          amount: amount * 100, // ₦1500 → 150000 kobo
          ref: `PYTHON_${Date.now()}`,
          currency: 'NGN',
          metadata: {
            course: 'Python Programming',
            lesson: 'Python Basics',
            amount: amount
          },
          onSuccess: (response) => {
            console.log('✅ Python lesson purchased!', response);
            setLoading(false);
            alert(`✅ Python Basics purchased!\n\nReference: ${response.reference}\nEmail: ${customerEmail}\n\nYou can now access the lesson!`);
          },
          onCancel: () => {
            console.log('Payment cancelled');
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Payment error:', error);
        setLoading(false);
        alert('Payment failed. Please check your Paystack key.');
      }
    };
    
    script.onerror = () => {
      setLoading(false);
      alert('Failed to load payment system');
    };
    
    document.head.appendChild(script);
  };

  return (
    <div style={{ margin: '15px 0' }}>
      <div style={{
        background: '#d4edda',
        border: '1px solid #c3e6cb',
        color: '#155724',
        padding: '10px',
        borderRadius: '6px',
        marginBottom: '10px',
        fontSize: '14px'
      }}>
        <strong>🎯 Course:</strong> Python Basics
        <div><strong>💰 Price:</strong> ₦{amount || '1,500'}</div>
        <div><strong>📧 Email:</strong> {email || 'Will be requested'}</div>
      </div>
      
      {error && (
        <div style={{
          background: '#f8d7da',
          color: '#721c24',
          padding: '10px',
          borderRadius: '6px',
          marginBottom: '10px',
          border: '1px solid #f5c6cb'
        }}>
          <strong>⚠️ {error}</strong>
          <div style={{ marginTop: '8px' }}>
            <a 
              href="https://dashboard.paystack.com/#/settings/developer"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: '#dc3545',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '4px',
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              👉 Get Your Key Now
            </a>
          </div>
        </div>
      )}
      
      <button 
        onClick={handlePayment}
        disabled={loading || !!error}
        style={{
          background: error ? '#dc3545' : 
                     loading ? '#6c757d' : 
                     '#28a745',
          color: 'white',
          border: 'none',
          padding: '15px 30px',
          fontSize: '16px',
          fontWeight: 'bold',
          borderRadius: '8px',
          cursor: (loading || !!error) ? 'not-allowed' : 'pointer',
          width: '100%',
          transition: 'all 0.3s'
        }}
      >
        {loading ? 'Processing Payment...' : 
         error ? 'Fix Configuration First' : 
         buttonText || `Enroll in Python Basics - ₦${amount}`}
      </button>
      
      <div style={{
        fontSize: '12px',
        color: '#666',
        marginTop: '8px',
        textAlign: 'center'
      }}>
        <div>💳 <strong>Test Card:</strong> 4084 0840 8408 4081</div>
        <div>📅 <strong>Expiry:</strong> Any future date | <strong>CVV:</strong> 408</div>
      </div>
    </div>
  );
};

export default PayButton;