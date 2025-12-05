import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Loader from '../ui/Loader';
import './PaystackPayment.css';

const PaystackPayment = ({ lesson, student, onSuccess, onClose, onError }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [paymentStep, setPaymentStep] = useState('init');
  const [cardDetails, setCardDetails] = useState({
    email: student?.email || '',
    name: student?.name || ''
  });

  // Check for payment verification on mount
  useEffect(() => {
    const verifyPaymentAfterRedirect = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const reference = urlParams.get('reference');
      
      if (reference) {
        setIsProcessing(true);
        setPaymentStep('verifying');
        
        try {
          // Verify payment with your backend
          const response = await fetch(`https://book-stem-education.vercel.app/api/verify-payment/${reference}`);
          const data = await response.json();
          
          if (data.status && data.data?.status === 'success') {
            setPaymentStep('success');
            
            // Call success callback
            if (onSuccess) {
              onSuccess(data.data);
            }
            
            // Remove reference from URL
            window.history.replaceState({}, document.title, window.location.pathname);
          } else {
            setPaymentStep('failed');
            setError(data.message || 'Payment verification failed');
          }
        } catch (error) {
          setPaymentStep('failed');
          setError('Failed to verify payment');
        } finally {
          setIsProcessing(false);
        }
      }
    };
    
    verifyPaymentAfterRedirect();
  }, [onSuccess]);

  // Handle payment with your backend
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
      // Call YOUR backend to initialize payment
      const response = await fetch('https://book-stem-education.vercel.app/api/init-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: cardDetails.email,
          amount: lesson.price,
          metadata: {
            lesson_id: lesson.id,
            lesson_title: lesson.title,
            course_key: lesson.courseKey || lesson.course?.key,
            student_id: student?.id,
            student_name: student?.name,
            teacher_id: lesson.teacherId || lesson.course?.teacherId
          }
        })
      });

      const data = await response.json();
      
      if (data.status && data.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = data.authorization_url;
        
        // Store reference for verification
        localStorage.setItem('paystack_reference', data.reference);
        localStorage.setItem('paystack_lesson_id', lesson.id);
        localStorage.setItem('paystack_course_key', lesson.courseKey || lesson.course?.key);
        
        // Track payment initiation
        console.log('✅ Payment initiated:', data.reference);
      } else {
        throw new Error(data.message || 'Failed to initialize payment');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setIsProcessing(false);
      setPaymentStep('failed');
      setError(err.message || 'Payment failed. Please try again.');
      
      if (onError) {
        onError(err);
      }
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCardDetails(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (error) setError(null);
  };

  // Retry payment
  const handleRetry = () => {
    setPaymentStep('init');
    setError(null);
    setIsProcessing(false);
  };

  // Close modal
  const handleClose = () => {
    if (onClose) onClose();
  };

  // Render different steps
  const renderStep = () => {
    switch (paymentStep) {
      case 'init':
        return (
          <div className="payment-init-step">
            <div className="payment-details">
              <h3>🔓 Unlock: {lesson.title}</h3>
              <div className="amount-display">
                <span className="amount-label">Amount:</span>
                <span className="amount-value">₦{lesson.price.toLocaleString()}</span>
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email for receipt</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={cardDetails.email}
                  onChange={handleInputChange}
                  placeholder="student@example.com"
                  disabled={isProcessing}
                  className={error ? 'error' : ''}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="name">Name (Optional)</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={cardDetails.name}
                  onChange={handleInputChange}
                  placeholder="Your name"
                  disabled={isProcessing}
                />
              </div>
            </div>
            
            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}
            
            <div className="payment-actions">
              <Button
                onClick={handlePaymentWithPaystack}
                disabled={isProcessing || !cardDetails.email}
                className={`payment-btn paystack-btn ${isProcessing ? 'processing' : ''}`}
                fullWidth
              >
                {isProcessing ? (
                  <>
                    <Loader size="small" />
                    Processing...
                  </>
                ) : (
                  `Pay ₦${lesson.price.toLocaleString()}`
                )}
              </Button>
              
              <button
                onClick={handleClose}
                className="cancel-btn"
                disabled={isProcessing}
              >
                Cancel
              </button>
            </div>
          </div>
        );

      case 'processing':
        return (
          <div className="payment-processing">
            <div className="loading-spinner-large">
              <Loader size="large" />
            </div>
            <h3>Processing Payment...</h3>
            <p>Redirecting to secure payment gateway</p>
            <p className="hint">Please do not close this window</p>
          </div>
        );

      case 'verifying':
        return (
          <div className="payment-verifying">
            <div className="loading-spinner-large">
              <Loader size="large" />
            </div>
            <h3>Verifying Payment...</h3>
            <p>Confirming your transaction with Paystack</p>
          </div>
        );

      case 'success':
        return (
          <div className="payment-success">
            <div className="success-icon">✅</div>
            <h3>Payment Successful!</h3>
            <p>You now have access to:</p>
            <div className="success-details">
              <div className="detail-item">
                <span>Lesson:</span>
                <strong>{lesson.title}</strong>
              </div>
              <div className="detail-item">
                <span>Amount:</span>
                <strong>₦{lesson.price.toLocaleString()}</strong>
              </div>
              <div className="detail-item">
                <span>Status:</span>
                <strong className="status-success">Completed</strong>
              </div>
            </div>
            <Button
              onClick={handleClose}
              className="continue-btn"
              fullWidth
            >
              Start Learning Now
            </Button>
          </div>
        );

      case 'failed':
        return (
          <div className="payment-failed">
            <div className="error-icon">❌</div>
            <h3>Payment Failed</h3>
            <p className="error-message">{error || 'Something went wrong with your payment'}</p>
            
            <div className="suggestions">
              <p>💡 Suggestions:</p>
              <ul>
                <li>Check your internet connection</li>
                <li>Ensure you have sufficient funds</li>
                <li>Verify your card details are correct</li>
                <li>Try a different payment method</li>
              </ul>
            </div>
            
            <div className="retry-actions">
              <Button
                onClick={handleRetry}
                className="retry-btn"
                fullWidth
              >
                Try Again
              </Button>
              <button
                onClick={handleClose}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="paystack-payment-container">
      {renderStep()}
      
      <div className="payment-security-note">
        <div className="security-badges">
          <span className="badge secure-badge">🔒 Secure</span>
          <span className="badge encrypted-badge">🔐 Encrypted</span>
          <span className="badge pci-badge">💳 PCI DSS</span>
        </div>
        <p className="security-text">
          Powered by Paystack. Your payment information is secure and encrypted.
        </p>
      </div>
    </div>
  );
};

export default PaystackPayment;