import React, { useState } from 'react';
import Button from '../ui/Button';
import Loader from '../ui/Loader';
import './PaystackPayment.css';
const PaystackPayment = ({ lesson, student, onSuccess, onClose, onError }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [paymentStep, setPaymentStep] = useState('init'); // init, processing, success, failed

  // Simulate Paystack payment initialization
  const simulatePaystackPayment = () => {
    return new Promise((resolve, reject) => {
      // Simulate API call to Paystack
      setTimeout(() => {
        const isSuccess = Math.random() > 0.2; // 80% success rate for demo
        if (isSuccess) {
          resolve({
            reference: `PSK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            transaction: `TXN_${Date.now()}`,
            status: 'success',
            message: 'Payment successful'
          });
        } else {
          reject(new Error('Payment failed. Please check your card details and try again.'));
        }
      }, 3000);
    });
  };

  const handlePaymentSuccess = (reference) => {
    setIsProcessing(false);
    setPaymentStep('success');
    console.log('Payment successful:', reference);
    
    // Simulate successful payment processing
    setTimeout(() => {
      onSuccess({
        paymentId: reference.reference,
        gateway: 'paystack',
        amount: lesson.price,
        lessonId: lesson.id,
        studentId: student.id,
        timestamp: new Date().toISOString(),
        transactionData: reference
      });
    }, 1500);
  };

  const handlePaymentError = (error) => {
    setIsProcessing(false);
    setPaymentStep('failed');
    console.error('Payment error:', error);
    setError(error.message || 'Payment failed. Please try again.');
    onError(error);
  };

  const handlePaymentClick = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setPaymentStep('processing');
    setError(null);
    
    try {
      // Simulate Paystack payment
      const paymentResult = await simulatePaystackPayment();
      handlePaymentSuccess(paymentResult);
    } catch (err) {
      handlePaymentError(err);
    }
  };

  const handleRetryPayment = () => {
    setPaymentStep('init');
    setError(null);
  };

  const handleCancelPayment = () => {
    setIsProcessing(false);
    setPaymentStep('init');
    setError(null);
    onClose();
  };

  // Payment success screen
  if (paymentStep === 'success') {
    return (
      <div className="payment-success-screen">
        <div className="success-icon">🎉</div>
        <h3>Payment Successful!</h3>
        <p>Your payment of <strong>₦{lesson.price.toLocaleString()}</strong> has been processed successfully.</p>
        <p>You now have access to <strong>{lesson.title}</strong></p>
        <div className="success-actions">
          <Button 
            onClick={() => onClose()}
            className="btn-primary"
          >
            Continue to Lesson
          </Button>
        </div>
      </div>
    );
  }

  // Payment processing screen
  if (paymentStep === 'processing') {
    return (
      <div className="payment-processing">
        <Loader size="large" />
        <h3>Processing Payment...</h3>
        <p>Please wait while we process your payment.</p>
        <p className="processing-note">Do not close this window.</p>
      </div>
    );
  }

  // Payment failed screen
  if (paymentStep === 'failed') {
    return (
      <div className="payment-failed-screen">
        <div className="failed-icon">❌</div>
        <h3>Payment Failed</h3>
        <p>{error}</p>
        <div className="failed-actions">
          <Button 
            onClick={handleRetryPayment}
            className="btn-primary"
          >
            Try Again
          </Button>
          <Button 
            onClick={handleCancelPayment}
            className="btn-outline"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Initial payment screen
  return (
    <div className="paystack-payment">
      {error && (
        <div className="payment-error alert alert-error">
          <p>{error}</p>
        </div>
      )}
      
      <div className="payment-summary">
        <h3>Order Summary</h3>
        <div className="summary-item">
          <span>Lesson:</span>
          <span>{lesson.title}</span>
        </div>
        <div className="summary-item">
          <span>Course:</span>
          <span>{lesson.courseTitle}</span>
        </div>
        <div className="summary-item total">
          <span>Total:</span>
          <span>₦{lesson.price.toLocaleString()}</span>
        </div>
      </div>

      <div className="payment-methods">
        <h4>Select Payment Method</h4>
        <div className="payment-option">
          <input type="radio" id="card" name="payment" defaultChecked />
          <label htmlFor="card">💳 Debit/Credit Card</label>
        </div>
        <div className="payment-option">
          <input type="radio" id="transfer" name="payment" />
          <label htmlFor="transfer">🏦 Bank Transfer</label>
        </div>
        <div className="payment-option">
          <input type="radio" id="ussd" name="payment" />
          <label htmlFor="ussd">📱 USSD</label>
        </div>
      </div>

      <div className="card-details">
        <h4>Card Details</h4>
        <div className="form-group">
          <label>Card Number</label>
          <input 
            type="text" 
            placeholder="1234 5678 9012 3456" 
            className="form-input"
            maxLength="19"
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Expiry Date</label>
            <input 
              type="text" 
              placeholder="MM/YY" 
              className="form-input"
              maxLength="5"
            />
          </div>
          <div className="form-group">
            <label>CVV</label>
            <input 
              type="text" 
              placeholder="123" 
              className="form-input"
              maxLength="3"
            />
          </div>
        </div>
      </div>
      
      <Button
        onClick={handlePaymentClick}
        disabled={isProcessing}
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
      
      <p className="payment-note">
        🔒 Secure payment encrypted with SSL technology
      </p>
      
      <div className="payment-security">
        <div className="security-features">
          <span>✅ PCI DSS Compliant</span>
          <span>✅ 3D Secure</span>
          <span>✅ SSL Encrypted</span>
        </div>
      </div>

      <div className="payment-footer">
        <Button 
          onClick={handleCancelPayment}
          className="btn-link"
          fullWidth
        >
          Cancel Payment
        </Button>
      </div>
    </div>
  );
};

export default PaystackPayment;