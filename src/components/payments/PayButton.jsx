import React, { useState } from 'react';

const PayButton = ({ email, amount, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = () => {
    setLoading(true);
    
    // Direct script injection each time (simplest approach)
    const script = document.createElement('script');
    script.src = "https://js.paystack.co/v2/inline.js";
    script.async = true;
    
    script.onload = () => {
      try {
        const paystack = new window.PaystackPop();
        
        paystack.newTransaction({
          key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_xxxxxxxx',
          email: email || 'test@example.com',
          amount: amount * 100,
          ref: `PAY_${Date.now()}`,
          onSuccess: (transaction) => {
            console.log('Success:', transaction);
            setLoading(false);
            if (onSuccess) onSuccess(transaction);
          },
          onCancel: () => {
            console.log('Cancelled');
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Error:', error);
        setLoading(false);
        alert('Payment error: ' + error.message);
      }
    };
    
    script.onerror = () => {
      setLoading(false);
      alert('Failed to load payment system');
    };
    
    document.head.appendChild(script);
  };

  return (
    <button onClick={handlePayment} disabled={loading}>
      {loading ? 'Loading...' : `Pay ₦${amount}`}
    </button>
  );
};

export default PayButton;