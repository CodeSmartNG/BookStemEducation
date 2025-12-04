import React, { useState, useEffect } from 'react';
import { getCurrentUser, processLessonPayment, purchaseLesson } from '../../utils/storage';
import PayButton from './PayButton'; // ✅ IMPORT YOUR NEW PayButton
import './PaymentModal.css';

const PaymentModal = ({ lesson, course, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('payment'); // Changed from 'paystack'
  const [error, setError] = useState('');
  const [paymentTimeout, setPaymentTimeout] = useState(null);
  const [paymentReference, setPaymentReference] = useState('');

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
    setStep('payment');
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
      setPaymentReference(reference);
      trackPaymentEvent('payment_completed', gateway, safeLesson.price, 'success');

      // Notify parent component after 2 seconds
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

  // ✅ NEW: Handle PayButton payment success
  const handlePaymentSuccess = (paymentResult) => {
    console.log('🎉 Payment successful via PayButton:', paymentResult);
    completePayment(paymentResult.reference || paymentResult.paymentId, 'paystack');
  };

  // ✅ NEW: Handle PayButton payment close
  const handlePaymentClose = () => {
    console.log('Payment closed by user');
    // Don't close modal, just reset state
    setError('Payment was cancelled');
    setStep('payment');
  };

  // ✅ NEW: Handle PayButton error
  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    setError(error.message || 'Payment failed. Please try again.');
    setStep('error');
    trackPaymentEvent('payment_failed', 'paystack', safeLesson.price, 'payment_error');
  };

  const renderStep = () => {
    switch (step) {
      case 'payment':
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
              {safeCourse.teacherName && (
                <div className="summary-item">
                  <span>Teacher:</span>
                  <span>{safeCourse.teacherName}</span>
                </div>
              )}
              <div className="summary-item total">
                <span>Total Amount:</span>
                <span>₦{(safeLesson.price || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* ✅ UPDATED: Using your PayButton component */}
            <div className="paystack-only-section">
              <div className="paystack-header">
                <h3>💳 Secure Payment</h3>
                <p className="subtitle">Pay with cards, bank transfer, or USSD</p>
              </div>

              <div className="paystack-features">
                <div className="feature-item">
                  <span className="feature-icon">🔒</span>
                  <span>Secure & Encrypted</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">✅</span>
                  <span>Instant Access</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🎓</span>
                  <span>Support Learning</span>
                </div>
              </div>

              {/* ✅ PAYBUTTON COMPONENT */}
              <div className="paybutton-container">
                <PayButton
                  email={currentUser?.email || ''}
                  amount={safeLesson.price || 0}
                  metadata={{
                    course_id: safeCourse.key,
                    course_name: safeCourse.title,
                    lesson_id: safeLesson.id,
                    lesson_title: safeLesson.title,
                    teacher_id: safeCourse.teacherId,
                    teacher_name: safeCourse.teacherName,
                    student_id: currentUser?.id,
                    student_name: currentUser?.name,
                    platform: 'Edustem Academy'
                  }}
                  onSuccess={handlePaymentSuccess}
                  onClose={handlePaymentClose}
                  buttonText={`Pay ₦${(safeLesson.price || 0).toLocaleString()}`}
                  className="modal-pay-button"
                />
              </div>

              {/* Alternative payment option */}
              <div className="alternative-payment">
                <p>Prefer other payment methods?</p>
                <div className="alt-options">
                  <a 
                    href={`https://wa.me/234${safeCourse.teacherPhone || '1234567890'}?text=I want to pay for "${safeLesson.title}" (₦${safeLesson.price})`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whatsapp-alt-btn"
                  >
                    💬 WhatsApp Payment
                  </a>
                  <button className="bank-transfer-btn" onClick={() => alert('Bank transfer details will be shown')}>
                    🏦 Bank Transfer
                  </button>
                </div>
              </div>
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
              {paymentReference && (
                <div className="detail-item">
                  <span>Reference:</span>
                  <strong className="ref-code">{paymentReference.substring(0, 12)}...</strong>
                </div>
              )}
            </div>
            <div className="success-actions">
              <button className="start-learning-btn" onClick={onClose}>
                Start Learning Now
              </button>
              <button className="download-receipt-btn" onClick={() => {
                alert('Receipt would be generated here');
                // Generate receipt logic
              }}>
                📄 Download Receipt
              </button>
            </div>
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
                <li>Try a different payment method</li>
              </ul>
            </div>
            <div className="action-buttons">
              <button className="retry-btn" onClick={handleRetryPayment}>
                Try Again
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
          <h2>🔓 Unlock Premium Content</h2>
          {step === 'payment' && (
            <button className="close-button" onClick={onClose}>×</button>
          )}
        </div>

        <div className="modal-body">
          {renderStep()}
        </div>

        <div className="modal-footer">
          <div className="security-notice">
            <div className="payment-providers">
              <span className="provider-badge paystack-badge">Powered by Paystack</span>
              <span className="provider-badge secure-badge">🔒 SSL Encrypted</span>
              <span className="provider-badge pci-badge">PCI DSS Compliant</span>
            </div>
            <p className="security-text">
              Your payment is secure. We don't store your card details. All transactions are encrypted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;