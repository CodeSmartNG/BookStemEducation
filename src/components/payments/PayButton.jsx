import React, { useState } from 'react';
import Button from '../Button'; // Your existing Button component

const PayButton = ({ 
  email, 
  amount, 
  courseName = 'Course',
  metadata = {},
  buttonText = 'Pay Now',
  disabled = false,
  onSuccess,
  onError,
  className = '',
  fullWidth = true,
  // New props for your backend
  backendUrl = 'https://book-stem-education.vercel.app/api/paystack/init',
  verifyUrl = 'https://book-stem-education.vercel.app/api/paystack/verify',
  ...props 
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');

  const handlePayment = async () => {
    if (loading || disabled) return;
    
    setLoading(true);
    setPaymentStatus('initializing');

    try {
      // 1. Get customer email if not provided
      let customerEmail = email;
      if (!customerEmail) {
        customerEmail = prompt('📧 Enter your email for payment receipt:');
        if (!customerEmail || !customerEmail.includes('@')) {
          alert('A valid email is required for payment');
          setLoading(false);
          return;
        }
      }

      // 2. Call YOUR backend to initialize payment
      setPaymentStatus('contacting_backend');
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: customerEmail,
          amount: amount,
          metadata: {
            ...metadata,
            course_name: courseName,
            timestamp: new Date().toISOString(),
            platform: 'BookStem Education'
          }
        })
      });

      const data = await response.json();
      
      if (!data.status) {
        throw new Error(data.message || 'Failed to initialize payment');
      }

      // 3. Redirect to Paystack payment page
      setPaymentStatus('redirecting_to_paystack');
      
      if (data.authorization_url) {
        // Store payment reference for verification later
        localStorage.setItem('last_payment_reference', data.reference);
        
        // Open Paystack payment page
        window.location.href = data.authorization_url;
        
        // Optional: Open in new tab
        // window.open(data.authorization_url, '_blank');
        
      } else {
        throw new Error('No payment URL received');
      }

    } catch (error) {
      console.error('Payment initialization error:', error);
      setPaymentStatus('error');
      
      // Show user-friendly error messages
      let errorMessage = 'Payment failed. Please try again.';
      
      if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message.includes('Invalid key')) {
        errorMessage = 'Payment system configuration error. Please contact support.';
      }
      
      alert(`❌ ${errorMessage}\n\nError: ${error.message}`);
      
      // Call error callback if provided
      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to verify payment after redirect back
  const verifyPayment = async (reference) => {
    try {
      const response = await fetch(`${verifyUrl}/${reference}`);
      const data = await response.json();
      
      if (data.status && data.data?.status === 'success') {
        // Payment verified successfully
        if (onSuccess) {
          onSuccess(data.data);
        }
        
        // Show success message
        alert(`✅ Payment Successful!\n\nCourse: ${courseName}\nAmount: ₦${amount}\nReference: ${reference}`);
        
        // Clear stored reference
        localStorage.removeItem('last_payment_reference');
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Verification error:', error);
      return false;
    }
  };

  // Check for payment verification on component mount
  React.useEffect(() => {
    const checkPendingPayment = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const reference = urlParams.get('reference') || localStorage.getItem('last_payment_reference');
      
      if (reference && !loading) {
        setPaymentStatus('verifying');
        const verified = await verifyPayment(reference);
        
        if (verified) {
          // Remove reference from URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    };
    
    checkPendingPayment();
  }, []);

  // Determine button text based on state
  const getButtonText = () => {
    if (loading) {
      switch(paymentStatus) {
        case 'initializing': return 'Initializing...';
        case 'contacting_backend': return 'Contacting payment gateway...';
        case 'redirecting_to_paystack': return 'Redirecting to secure payment...';
        case 'verifying': return 'Verifying payment...';
        default: return 'Processing...';
      }
    }
    
    return `${buttonText} - ₦${amount.toLocaleString()}`;
  };

  // Determine button style based on state
  const getButtonVariant = () => {
    if (loading) return 'loading';
    if (paymentStatus === 'error') return 'error';
    return 'primary';
  };

  return (
    <div className="pay-button-container">
      <Button
        onClick={handlePayment}
        disabled={disabled || loading}
        fullWidth={fullWidth}
        className={`pay-button ${className} ${getButtonVariant()}`}
        type="button"
        {...props}
      >
        <span className="button-content">
          {loading && (
            <span className="loading-spinner">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="4" strokeDasharray="64" strokeDashoffset="48">
                  <animateTransform 
                    attributeName="transform" 
                    type="rotate" 
                    from="0 12 12" 
                    to="360 12 12" 
                    dur="1s" 
                    repeatCount="indefinite"
                  />
                </circle>
              </svg>
            </span>
          )}
          <span className="button-text">{getButtonText()}</span>
        </span>
      </Button>
      
      {/* Payment status info */}
      {paymentStatus && (
        <div className="payment-status">
          {paymentStatus === 'error' && (
            <small style={{ color: '#dc3545' }}>❌ Payment failed. Please try again.</small>
          )}
          {paymentStatus === 'verifying' && (
            <small style={{ color: '#17a2b8' }}>🔍 Verifying your payment...</small>
          )}
        </div>
      )}
      
      {/* Course info */}
      <div className="course-info">
        <small>🎓 {courseName}</small>
        <small>💰 ₦{amount.toLocaleString()}</small>
      </div>
    </div>
  );
};

export default PayButton;