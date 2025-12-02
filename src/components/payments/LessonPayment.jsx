import React, { useState } from 'react';
import PaystackPayment from './PaystackPayment';
import PaymentFailed from './PaymentFailed';

const LessonPayment = ({ lesson, student }) => {
  const [paymentStatus, setPaymentStatus] = useState('idle'); // 'idle', 'processing', 'success', 'failed'
  const [error, setError] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('paystack');

  // Sample lesson data (you would get this from props)
  const sampleLesson = lesson || {
    id: 'lesson_1',
    title: 'Introduction to React Hooks',
    price: 5000,
    courseId: 'course_1',
    courseTitle: 'React Masterclass'
  };

  const sampleStudent = student || {
    id: 'student_1',
    name: 'John Doe',
    email: 'john.doe@example.com'
  };

  const handlePaymentSuccess = (paymentData) => {
    setPaymentStatus('success');
    console.log('Payment completed successfully:', paymentData);
    // Here you would typically send the payment data to your backend
  };

  const handlePaymentError = (error) => {
    setPaymentStatus('failed');
    setError(error.message || 'Payment processing failed');
  };

  const handlePaymentClose = () => {
    if (paymentStatus === 'processing') {
      setPaymentStatus('idle');
    }
  };

  const handleRetry = () => {
    setPaymentStatus('idle');
    setError(null);
  };

  const handleTryAnotherMethod = () => {
    setSelectedMethod(selectedMethod === 'paystack' ? 'flutterwave' : 'paystack');
    setPaymentStatus('idle');
    setError(null);
  };

  const handleContactSupport = () => {
    window.location.href = '/support?issue=payment-failed';
  };

  const handleCancel = () => {
    window.history.back();
  };

  if (paymentStatus === 'failed') {
    return (
      <PaymentFailed
        error={error}
        onRetry={handleRetry}
        onTryAnotherMethod={handleTryAnotherMethod}
        onContactSupport={handleContactSupport}
        onCancel={handleCancel}
      />
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div className="payment-success">
        <div className="success-icon">🎉</div>
        <h2>Payment Successful!</h2>
        <p>You now have access to "{sampleLesson.title}"</p>
        <button 
          onClick={() => window.location.href = `/lessons/${sampleLesson.id}`}
          className="btn btn-primary"
        >
          Start Learning
        </button>
      </div>
    );
  }

  return (
    <div className="lesson-payment">
      <div className="payment-header">
        <h2>Complete Your Purchase</h2>
        <div className="lesson-info">
          <h3>{sampleLesson.title}</h3>
          <p className="price">₦{sampleLesson.price.toLocaleString()}</p>
        </div>
      </div>

      <div className="payment-methods">
        <div className="method-option">
          <PaystackPayment
            lesson={sampleLesson}
            student={sampleStudent}
            onSuccess={handlePaymentSuccess}
            onClose={handlePaymentClose}
            onError={handlePaymentError}
          />
        </div>
      </div>

      <div className="payment-footer">
        <button 
          onClick={handleCancel}
          className="btn btn-link"
        >
          Cancel Payment
        </button>
      </div>
    </div>
  );
};

export default LessonPayment;