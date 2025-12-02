import React, { useEffect } from 'react';

const FlutterwavePayment = ({ lesson, student, onSuccess, onClose }) => {
  useEffect(() => {
    // Load Flutterwave script
    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.onload = () => console.log('Flutterwave loaded');
    document.head.appendChild(script);
  }, []);

  const handleFlutterwavePayment = () => {
    if (window.FlutterwaveCheckout) {
      window.FlutterwaveCheckout({
        public_key: process.env.REACT_APP_FLUTTERWAVE_PUBLIC_KEY,
        tx_ref: Date.now().toString(),
        amount: lesson.price,
        currency: 'NGN',
        payment_options: 'card, banktransfer, ussd, mobilemoney',
        customer: {
          email: student.email || 'student@example.com',
          phonenumber: student.phone || '08012345678',
          name: student.name,
        },
        customizations: {
          title: 'STEM Courses',
          description: `Payment for ${lesson.title}`,
          logo: '/logo.png',
        },
        callback: function(response) {
          console.log('Payment response:', response);
          if (response.status === 'successful') {
            onSuccess({
              paymentId: response.transaction_id,
              gateway: 'flutterwave',
              amount: lesson.price,
              lessonId: lesson.id
            });
          }
        },
        onclose: function() {
          onClose();
        }
      });
    }
  };

  return (
    <div className="flutterwave-payment">
      <button 
        onClick={handleFlutterwavePayment}
        className="payment-btn flutterwave-btn"
      >
        Pay ₦{lesson.price} with Flutterwave
      </button>
      <p className="payment-note">
        Supports OPay, PalmPay, Bank Transfer, and Mobile Money
      </p>
    </div>
  );
};

export default FlutterwavePayment;