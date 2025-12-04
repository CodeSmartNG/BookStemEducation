import React, { useState } from 'react';

const PayButton = ({ email, amount, courseName, metadata, buttonText = 'Pay Now' }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePayment = async () => {
    if (loading) return;
    
    // Get customer email
    let customerEmail = email;
    if (!customerEmail) {
      customerEmail = prompt('📧 Enter email for receipt:');
      if (!customerEmail) return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Call your backend
      const response = await fetch('https://book-stem-education.vercel.app/api/paystack/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: customerEmail,
          amount: amount,
          metadata: {
            ...metadata,
            course_name: courseName,
            platform: 'BookStem'
          }
        })
      });
      
      const data = await response.json();
      
      if (data.status) {
        // Redirect to Paystack payment page
        window.location.href = data.data.authorization_url;
      } else {
        setError(data.message || 'Payment failed to initialize');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ margin: '15px 0' }}>
      {error && (
        <div style={{
          background: '#f8d7da',
          color: '#721c24',
          padding: '10px',
          borderRadius: '6px',
          marginBottom: '10px'
        }}>
          ❌ {error}
        </div>
      )}
      
      <button 
        onClick={handlePayment}
        disabled={loading}
        style={{
          background: loading ? '#6c757d' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          padding: '14px 28px',
          fontSize: '16px',
          fontWeight: 'bold',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer',
          width: '100%',
          transition: 'all 0.3s'
        }}
      >
        {loading ? 'Initializing Payment...' : `${buttonText} - ₦${amount}`}
      </button>
      
      <div style={{
        fontSize: '12px',
        color: '#666',
        marginTop: '8px',
        textAlign: 'center'
      }}>
        🔒 Secure payment via Paystack API
      </div>
    </div>
  );
};

export default PayButton;