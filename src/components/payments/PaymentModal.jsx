import React, { useState, useEffect } from 'react';
import Button from './Button';
import Loader from './Loader';
import './PaymentModal.css';

const PaymentModal = ({ 
  lesson, 
  course, 
  student, 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [paymentStep, setPaymentStep] = useState('details'); // 'details', 'processing', 'success', 'failed'
  const [paymentReference, setPaymentReference] = useState('');
  const [userDetails, setUserDetails] = useState({
    email: student?.email || '',
    name: student?.name || '',
    phone: ''
  });

  // Check for payment verification on mount
  useEffect(() => {
    if (!isOpen) return;

    const verifyPendingPayment = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const reference = urlParams.get('reference') || localStorage.getItem('last_payment_reference');
      
      if (reference && !isProcessing) {
        setIsProcessing(true);
        setPaymentStep('processing');
        
        try {
          // Verify payment with your backend
          const response = await fetch(`https://book-stem-education.vercel.app/api/verify-payment/${reference}`);
          const data = await response.json();
          
          if (data.status && data.data?.status === 'success') {
            setPaymentStep('success');
            setPaymentReference(reference);
            
            // Clear stored references
            localStorage.removeItem('last_payment_reference');
            
            // Remove reference from URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Call success callback after delay
            setTimeout(() => {
              if (onSuccess) {
                onSuccess(data.data);
              }
            }, 2000);
            
          } else {
            setPaymentStep('failed');
            setError(data.message || 'Payment verification failed');
          }
        } catch (error) {
          setPaymentStep('failed');
          setError('Failed to verify payment. Please contact support.');
        } finally {
          setIsProcessing(false);
        }
      }
    };
    
    verifyPendingPayment();
  }, [isOpen, onSuccess, isProcessing]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserDetails(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  // Initialize payment with your backend
  const handlePayment = async () => {
    if (isProcessing) return;
    
    // Validate email
    if (!userDetails.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userDetails.email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsProcessing(true);
    setPaymentStep('processing');
    setError('');

    try {
      // Call your backend to initialize payment
      const response = await fetch('https://book-stem-education.vercel.app/api/init-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userDetails.email,
          amount: lesson?.price || 0,
          metadata: {
            lesson_id: lesson?.id,
            lesson_title: lesson?.title || 'Premium Content',
            course_key: course?.key,
            course_name: course?.title || 'Course',
            student_id: student?.id,
            student_name: userDetails.name || student?.name,
            teacher_id: course?.teacherId,
            phone: userDetails.phone
          }
        })
      });

      const data = await response.json();
      
      if (data.status && data.authorization_url) {
        // Store reference for verification
        localStorage.setItem('last_payment_reference', data.reference);
        setPaymentReference(data.reference);
        
        // Redirect to Paystack payment page
        window.location.href = data.authorization_url;
        
        console.log('✅ Payment initialized:', data.reference);
      } else {
        throw new Error(data.message || 'Failed to initialize payment');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setIsProcessing(false);
      setPaymentStep('failed');
      setError(err.message || 'Payment failed. Please try again.');
    }
  };

  // Retry payment
  const handleRetry = () => {
    setPaymentStep('details');
    setError('');
    setIsProcessing(false);
  };

  // Close modal
  const handleClose = () => {
    if (isProcessing) return;
    onClose();
  };

  // Don't render if not open
  if (!isOpen) return null;

  // Don't render if no lesson
  if (!lesson) {
    return (
      <div className="payment-modal-overlay">
        <div className="payment-modal">
          <div className="modal-header">
            <h2>Error</h2>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <p>No lesson information provided.</p>
            <Button onClick={onClose} fullWidth>Close</Button>
          </div>
        </div>
      </div>
    );
  }

  // Render different steps
  const renderStep = () => {
    switch (paymentStep) {
      case 'details':
        return (
          <>
            <div className="modal-header">
              <h2>🔓 Unlock Premium Content</h2>
              <button className="close-button" onClick={handleClose} disabled={isProcessing}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="payment-summary">
                <h3>Order Summary</h3>
                <div className="summary-item">
                  <span>Content:</span>
                  <span>{lesson.title || 'Premium Lesson'}</span>
                </div>
                {course?.title && (
                  <div className="summary-item">
                    <span>Course:</span>
                    <span>{course.title}</span>
                  </div>
                )}
                {course?.teacherName && (
                  <div className="summary-item">
                    <span>Instructor:</span>
                    <span>{course.teacherName}</span>
                  </div>
                )}
                <div className="summary-item total">
                  <span>Total Amount:</span>
                  <span>₦{(lesson.price || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="payment-form">
                <div className="form-group">
                  <label htmlFor="email">📧 Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={userDetails.email}
                    onChange={handleInputChange}
                    placeholder="student@example.com"
                    disabled={isProcessing}
                    required
                  />
                  <small>Payment receipt will be sent here</small>
                </div>

                <div className="form-group">
                  <label htmlFor="name">👤 Full Name (Optional)</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={userDetails.name}
                    onChange={handleInputChange}
                    placeholder="Your name"
                    disabled={isProcessing}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">📱 Phone Number (Optional)</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={userDetails.phone}
                    onChange={handleInputChange}
                    placeholder="08012345678"
                    disabled={isProcessing}
                  />
                  <small>For payment notifications</small>
                </div>
              </div>

              {error && (
                <div className="error-message">
                  ⚠️ {error}
                </div>
              )}

              <div className="payment-actions">
                <Button
                  onClick={handlePayment}
                  disabled={isProcessing || !userDetails.email}
                  className={`payment-btn ${isProcessing ? 'processing' : ''}`}
                  fullWidth
                >
                  {isProcessing ? (
                    <>
                      <Loader size="small" />
                      Processing...
                    </>
                  ) : (
                    `Pay ₦${(lesson.price || 0).toLocaleString()}`
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
          </>
        );

      case 'processing':
        return (
          <>
            <div className="modal-header">
              <h2>Processing Payment</h2>
            </div>
            <div className="modal-body processing-state">
              <div className="loading-spinner-large">
                <Loader size="large" />
              </div>
              <h3>Processing Your Payment...</h3>
              <p>Please wait while we process your transaction</p>
              <p className="hint">Do not close this window</p>
            </div>
          </>
        );

      case 'success':
        return (
          <>
            <div className="modal-header">
              <h2>✅ Payment Successful!</h2>
            </div>
            <div className="modal-body success-state">
              <div className="success-icon">🎉</div>
              <h3>Thank You for Your Purchase!</h3>
              <p>You now have access to:</p>
              
              <div className="success-details">
                <div className="detail-item">
                  <span>Content:</span>
                  <strong>{lesson.title || 'Premium Lesson'}</strong>
                </div>
                {course?.title && (
                  <div className="detail-item">
                    <span>Course:</span>
                    <strong>{course.title}</strong>
                  </div>
                )}
                <div className="detail-item">
                  <span>Amount Paid:</span>
                  <strong>₦{(lesson.price || 0).toLocaleString()}</strong>
                </div>
                {paymentReference && (
                  <div className="detail-item">
                    <span>Reference:</span>
                    <strong className="reference-code">{paymentReference.substring(0, 12)}...</strong>
                  </div>
                )}
                <div className="detail-item">
                  <span>Status:</span>
                  <strong className="status-success">Completed ✓</strong>
                </div>
              </div>

              <div className="success-actions">
                <Button
                  onClick={onClose}
                  className="start-learning-btn"
                  fullWidth
                >
                  Start Learning Now
                </Button>
                
                <button
                  onClick={() => {
                    // Generate receipt (implement as needed)
                    alert('Receipt will be emailed to you');
                  }}
                  className="receipt-btn"
                >
                  📄 Get Receipt
                </button>
              </div>
            </div>
          </>
        );

      case 'failed':
        return (
          <>
            <div className="modal-header">
              <h2>❌ Payment Failed</h2>
              <button className="close-button" onClick={handleClose}>×</button>
            </div>
            <div className="modal-body failed-state">
              <div className="error-icon">⚠️</div>
              <h3>Payment Not Completed</h3>
              <p className="error-description">{error || 'Something went wrong with your payment'}</p>
              
              <div className="suggestions">
                <p>💡 Suggestions:</p>
                <ul>
                  <li>Check your internet connection</li>
                  <li>Ensure you have sufficient funds</li>
                  <li>Verify your card details are correct</li>
                  <li>Try a different payment method</li>
                  <li>Contact support if issue persists</li>
                </ul>
              </div>

              <div className="retry-actions">
                <Button
                  onClick={handleRetry}
                  className="retry-btn"
                  fullWidth
                >
                  Try Again with Paystack
                </Button>
                
                <button
                  onClick={handleClose}
                  className="cancel-btn"
                >
                  Cancel Payment
                </button>
              </div>

              <div className="alternative-payment">
                <p>Need help with payment?</p>
                <a 
                  href={`https://wa.me/234${course?.teacherPhone || '1234567890'}?text=Need help paying for ${lesson.title} (₦${lesson.price})`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whatsapp-help"
                >
                  💬 Get Help on WhatsApp
                </a>
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal">
        {renderStep()}
        
        <div className="modal-footer">
          <div className="security-notice">
            <div className="security-badges">
              <span className="badge paystack-badge">Powered by Paystack</span>
              <span className="badge secure-badge">🔒 SSL Encrypted</span>
              <span className="badge pci-badge">PCI DSS Compliant</span>
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