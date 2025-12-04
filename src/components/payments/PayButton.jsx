import React, { useState } from 'react';

const PayButton = ({ email, amount, buttonText = 'Pay Now' }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePayment = () => {
    if (loading) return;
    
    // Get the key - VERIFY THIS IS YOUR REAL KEY
    const publicKey = 'YOUR_REAL_KEY_HERE'; // ⚠️ REPLACE THIS
    
    // Or use environment variable (make sure it's set)
    // const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    
    // Validate key
    if (!publicKey || publicKey.includes('YOUR') || publicKey.includes('d8d97b1f913f518b06d50f9cc21d84bee176a49d')) {
      setError('❌ You are using MY key! Get YOUR OWN key from Paystack dashboard.');
      alert('You are using someone else\'s Paystack key. Get your own key at dashboard.paystack.com');
      return;
    }
    
    if (!publicKey.startsWith('pk_live_')) {
      setError('❌ Invalid key format. Must start with "pk_live_"');
      return;
    }
    
    setLoading(true);
    setError('');
    
    // Get email
    let customerEmail = email;
    if (!customerEmail) {
      customerEmail = prompt('Enter email for receipt:');
      if (!customerEmail) {
        setLoading(false);
        return;
      }
    }
    
    // Load Paystack
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v2/inline.js';
    
    script.onload = () => {
      try {
        const paystack = new window.PaystackPop();
        
        paystack.newTransaction({
          key: publicKey,
          email: customerEmail,
          amount: amount * 100,
          ref: `PAY_${Date.now()}`,
          currency: 'NGN',
          onSuccess: (response) => {
            console.log('✅ Success:', response);
            setLoading(false);
            alert(`Payment successful! Ref: ${response.reference}`);
          },
          onCancel: () => {
            console.log('Cancelled');
            setLoading(false);
          }
        });
      } catch (err) {
        console.error('Error:', err);
        setLoading(false);
        setError('Payment failed: ' + err.message);
      }
    };
    
    script.onerror = () => {
      setLoading(false);
      setError('Failed to load Paystack');
    };
    
    document.head.appendChild(script);
  };

  return (
    <div>
      {error && (
        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffeaa7',
          color: '#856404',
          padding: '10px',
          borderRadius: '5px',
          marginBottom: '10px'
        }}>
          <strong>⚠️ {error}</strong>
          <div style={{ marginTop: '5px', fontSize: '14px' }}>
            <a 
              href="https://dashboard.paystack.com/#/settings/developer" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#007bff' }}
            >
              👉 Get your key from Paystack Dashboard
            </a>
          </div>
        </div>
      )}
      
      <button 
        onClick={handlePayment}
        disabled={loading}
        style={{
          background: loading ? '#6c757d' : '#28a745',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          fontSize: '16px',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          width: '100%'
        }}
      >
        {loading ? 'Processing...' : buttonText}
      </button>
      
      <div style={{ fontSize: '12px', color: '#666', marginTop: '5px', textAlign: 'center' }}>
        🔒 Secured by Paystack • 💳 Test with card: 4084084084084081
      </div>
    </div>
  );
};

export default PayButton;