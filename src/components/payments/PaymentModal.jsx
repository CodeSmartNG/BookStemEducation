import React, { useState, useEffect } from 'react';
import { getCurrentUser, processLessonPayment, purchaseLesson } from '../../utils/storage';
import PaystackPayment from './PaystackPayment';
import './PaymentModal.css';

const PaymentModal = ({ lesson, course, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('paystack'); // Start directly with Paystack
  const [error, setError] = useState('');
  const [paymentTimeout, setPaymentTimeout] = useState(null);

  const currentUser = getCurrentUser();

  // Add safety checks for lesson and course
  const safeLesson = lesson || {};
  const safeCourse = course || {};

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (paymentTimeout) {
        clearTimeout(paymentTimeout);
      }
    };
  }, [paymentTimeout]);

  // Track payment events for analytics
  const trackPaymentEvent = (event, method, amount, status = '') => {
    console.log('Payment Event:', {
      event,
      method,
      amount,
      lessonId: safeLesson.id,
      courseKey: safeCourse.key,
      studentId: currentUser?.id,
      status,
      timestamp: new Date().toISOString()
    });
  };

  // Retry payment mechanism
  const handleRetryPayment = () => {
    setError('');
    setStep('paystack');
    trackPaymentEvent('payment_retried', 'paystack', safeLesson.price);
  };

  const completePayment = async (reference, gateway) => {
    try {
      trackPaymentEvent('payment_completing', gateway, safeLesson.price, 'completing');
      
      // Process payment in storage
      await processLessonPayment(
        currentUser.id,
        safeCourse.teacherId,
        safeCourse.key,
        safeLesson.id,
        safeLesson.price || 0
      );

      // Record purchase
      await purchaseLesson(currentUser.id, safeCourse.key, safeLesson.id, safeLesson.price || 0);

      setStep('success');
      trackPaymentEvent('payment_completed', gateway, safeLesson.price, 'success');
      
      // Notify parent component
      setTimeout(() => {
        onSuccess({ 
          reference, 
          gateway, 
          amount: safeLesson.price,
          lessonId: safeLesson.id,
          courseKey: safeCourse.key 
        });
      }, 2000);
    } catch (error) {
      console.error('Payment completion error:', error);
      setError('Failed to complete payment processing');
      setStep('error');
      trackPaymentEvent('payment_failed', gateway, safeLesson.price, 'completion_error');
    }
  };

  // Handle Paystack payment success
  const handlePaystackSuccess = (paymentResult) => {
    console.log('🎉 Paystack payment successful:', paymentResult);
    completePayment(paymentResult.paymentId, 'paystack');
  };

  // Handle Paystack payment close
  const handlePaystackClose = () => {
    console.log('Paystack payment closed by user');
    setStep('paystack');
  };

  // Handle Paystack payment error
  const handlePaystackError = (error) => {
    console.error('Paystack payment error:', error);
    setError(error.message || 'Payment failed. Please try again.');
    setStep('error');
    trackPaymentEvent('payment_failed', 'paystack', safeLesson.price, 'payment_error');
  };

  const renderStep = () => {
    switch (step) {
      case 'paystack':
        return (
          <div className="payment-methods">
            <div className="payment-summary">
              <h3>Order Summary</h3>
              <div className="summary-item">
                <span>Lesson:</span>
                <span>{safeLesson.title || 'Untitled Lesson'}</span>
              </div>
              <div className="summary-item">
                <span>Course:</span>
                <span>{safeCourse.title || 'Untitled Course'}</span>
              </div>
              <div className="summary-item">
                <span>Teacher:</span>
                <span>{safeCourse.teacherName || 'Course Instructor'}</span>
              </div>
              <div className="summary-item total">
                <span>Total Amount:</span>
                <span>₦{(safeLesson.price || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Paystack Payment Component - Only Payment Method */}
            <div className="paystack-only-section">
              <div className="paystack-header">
                <h3>💳 Pay with Paystack</h3>
                <p className="subtitle">Secure card payment powered by Paystack</p>
              </div>
              
              <div className="paystack-features">
                <div className="feature-item">
                  <span className="feature-icon">🔒</span>
                  <span>PCI DSS Compliant</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">✅</span>
                  <span>3D Secure</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🛡️</span>
                  <span>SSL Encrypted</span>
                </div>
              </div>

              <PaystackPayment 
                lesson={safeLesson}
                student={currentUser}
                onSuccess={handlePaystackSuccess}
                onClose={handlePaystackClose}
                onError={handlePaystackError}
              />
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="payment-success">
            <div className="success-icon">✅</div>
            <h3>Payment Successful!</h3>
            <p>Thank you for your purchase! You now have access to:</p>
            <div className="success-details">
              <div className="detail-item">
                <span>Lesson:</span>
                <strong>{safeLesson.title || 'Premium Content'}</strong>
              </div>
              <div className="detail-item">
                <span>Course:</span>
                <strong>{safeCourse.title || 'STEM Course'}</strong>
              </div>
              <div className="detail-item">
                <span>Amount:</span>
                <strong>₦{(safeLesson.price || 0).toLocaleString()}</strong>
              </div>
              <div className="detail-item">
                <span>Payment Method:</span>
                <strong>Paystack</strong>
              </div>
            </div>
            <button className="close-btn" onClick={onClose}>
              Start Learning Now
            </button>
          </div>
        );

      case 'error':
        return (
          <div className="payment-error">
            <div className="error-icon">❌</div>
            <h3>Payment Failed</h3>
            <p>{error || 'Something went wrong with your payment'}</p>
            <div className="error-suggestions">
              <p>💡 Suggestions:</p>
              <ul>
                <li>Check your internet connection</li>
                <li>Ensure you have sufficient funds</li>
                <li>Verify your card details are correct</li>
                <li>Contact support if issue persists</li>
              </ul>
            </div>
            <div className="action-buttons">
              <button className="retry-btn" onClick={handleRetryPayment}>
                Try Again with Paystack
              </button>
              <button className="close-btn" onClick={onClose}>
                Cancel Payment
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Don't render if no lesson data
  if (!lesson) {
    return null;
  }

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal">
        <div className="modal-header">
          <h2>🔒 Unlock Premium Lesson</h2>
          {step === 'paystack' && (
            <button className="close-button" onClick={onClose}>×</button>
          )}
        </div>
        
        <div className="modal-body">
          {renderStep()}
        </div>

        <div className="modal-footer">
          <div className="security-notice">
            <div className="paystack-badge">
              <span>Powered by Paystack</span>
            </div>
            <p>
              🔒 All payments are secure and encrypted. Your financial information is protected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;