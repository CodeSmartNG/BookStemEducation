import React, { useState } from 'react';

const PayButton = ({ email, amount, courseName }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePayment = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Call YOUR backend (not Paystack directly)
      const response = await fetch('https://book-stem-education.vercel.app/init-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email || prompt('Enter your email:'),
          amount: amount,
          metadata: {
            course_name: courseName,
            timestamp: new Date().toISOString()
          }
        })
      });
      
      const data = await response.json();
      
      if (data.status && data.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = data.authorization_url;
      } else {
        setError(data.message || 'Payment initialization failed');
        alert(`Payment Error: ${data.message}`);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      alert('Network error. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handlePayment}
      disabled={loading}
      style={{
        background: loading ? '#6c757d' : '#28a745',
        color: 'white',
        border: 'none',
        padding: '12px 24px',
        fontSize: '16px',
        borderRadius: '8px',
        cursor: loading ? 'not-allowed' : 'pointer',
        width: '100%'
      }}
    >
      {loading ? 'Processing...' : `Enroll in ${courseName} - ₦${amount}`}
    </button>
  );
};

export default PayButton;