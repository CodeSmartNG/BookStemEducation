import React, { useState } from 'react';

const PayButton = ({ email, amount, buttonText = 'Pay Now' }) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = () => {
    if (loading) return;
    
    // ⚠️ IMPORTANT: Use YOUR key here
    const YOUR_PUBLIC_KEY = 'pk_live_YOUR_REAL_KEY_HERE'; // ⚠️ REPLACE THIS
    
    // Or use from environment variable
    // const YOUR_PUBLIC_KEY = process.env.REACT_APP_PAYSTACK_PUBLIC_KEY;
    
    // Check if you're still using MY key
    if (YOUR_PUBLIC_KEY.includes('d8d97b1f913f518b06d50f9cc21d84bee176a49d')) {
      alert('❌ STOP! You are using MY Paystack key!\n\nGo to: dashboard.paystack.com\nGet YOUR OWN keys from Settings → API & Webhooks\n\nThen update your .env file!');
      return;
    }
    
    // Check if using placeholder
    if (YOUR_PUBLIC_KEY.includes('YOUR_') || !YOUR_PUBLIC_KEY.startsWith('pk_live_')) {
      alert('❌ Invalid Paystack key!\n\n1. Go to dashboard.paystack.com\n2. Login to YOUR account\n3. Go to Settings → API & Webhooks\n4. Copy YOUR Live Public Key\n5. Paste it in your .env file');
      return;
    }
    
    setLoading(true);
    
    // Get email
    let customerEmail = email;
    if (!customerEmail) {
      customerEmail = prompt('Enter email for payment receipt:');
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
          key: YOUR_PUBLIC_KEY, // This should be YOUR key
          email: customerEmail,
          amount: amount * 100,
          ref: `BOOKSTEM_${Date.now()}`,
          currency: 'NGN',
          onSuccess: (response) => {
            console.log('✅ Payment successful!');
            setLoading(false);
            alert(`✅ Payment successful!\nReference: ${response.reference}\nAmount: ₦${amount}`);
          },
          onCancel: () => {
            console.log('Payment cancelled');
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Payment error:', error);
        setLoading(false);
        alert('Payment failed: ' + error.message);
      }
    };
    
    script.onerror = () => {
      setLoading(false);
      alert('Failed to load payment system');
    };
    
    document.head.appendChild(script);
  };

  return (
    <div style={{ padding: '10px' }}>
      <div style={{
        background: '#d1ecf1',
        border: '1px solid #bee5eb',
        color: '#0c5460',
        padding: '10px',
        borderRadius: '5px',
        marginBottom: '15px',
        fontSize: '14px'
      }}>
        <strong>⚠️ IMPORTANT:</strong> Make sure you're using <strong>YOUR OWN</strong> Paystack keys!
        <div style={{ marginTop: '5px' }}>
          <a 
            href="https://dashboard.paystack.com/#/settings/developer" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#007bff', textDecoration: 'none' }}
          >
            🔗 Click here to get YOUR keys from Paystack
          </a>
        </div>
      </div>
      
      <button 
        onClick={handlePayment}
        disabled={loading}
        style={{
          background: loading ? '#6c757d' : '#28a745',
          color: 'white',
          border: 'none',
          padding: '15px 30px',
          fontSize: '16px',
          fontWeight: 'bold',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer',
          width: '100%',
          transition: 'all 0.3s'
        }}
        onMouseOver={e => {
          if (!loading) e.target.style.transform = 'translateY(-2px)';
        }}
        onMouseOut={e => {
          if (!loading) e.target.style.transform = 'translateY(0)';
        }}
      >
        {loading ? 'Processing Payment...' : (buttonText || `Pay ₦${amount}`)}
      </button>
    </div>
  );
};

export default PayButton;