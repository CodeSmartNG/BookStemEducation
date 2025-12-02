import React, { useState } from 'react';
import Button from '../ui/Button';
import Loader from '../ui/Loader';
import { paymentService } from '../../utils/paymentService';
import './PaystackPayment.css';

const PaystackPayment = ({ lesson, student, onSuccess, onClose, onError }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [paymentStep, setPaymentStep] = useState('init');
  const [cardDetails, setCardDetails] = useState({
    email: student?.email || '',
    name: student?.name || ''
  });

  // Handle payment with REAL Paystack
  const handlePaymentWithPaystack = async () => {
    if (isProcessing) return;
    
    // Validate email
    if (!cardDetails.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cardDetails.email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsProcessing(true);
    setPaymentStep('processing');
    setError(null);

    try {
      // Initialize REAL Paystack payment
      const result = await paymentService.initializePaystackPayment(
        cardDetails.email,
        lesson.price,
        {
          lesson_id: lesson.id,
          lesson_title: lesson.title,
          course_key: lesson.courseKey,
          student_id: student.id,
          student_name: student.name
        }
      );

      if (result.status && result.data.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = result.data.authorization_url;
        
        // Store reference for verification
        localStorage.setItem('paystack_reference', result.data.reference);
        localStorage.setItem('paystack_lesson_id', lesson.id);
        localStorage.setItem('paystack_course_key', lesson.courseKey);
        
        // Track payment initiation
        console.log('✅ Payment initiated:', result.data.reference);
      } else {
        throw new Error(result.message || 'Failed to initialize payment');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setIsProcessing(false);
      setPaymentStep('failed');
      setError(err.message || 'Payment failed. Please try again.');
      onError(err);
    }
  };

  // ... rest of your component (success, error screens, etc.)

  return (
    // Your JSX with updated payment button:
    <Button
      onClick={handlePaymentWithPaystack}
      disabled={isProcessing}
      className={`payment-btn paystack-btn ${isProcessing ? 'processing' : ''}`}
      fullWidth
    >
      {isProcessing ? (
        <>
          <Loader size="small" />
          Connecting to Paystack...
        </>
      ) : (
        `Pay ₦${lesson.price.toLocaleString()} with Paystack`
      )}
    </Button>
  );
};
export default PaystackPayment;