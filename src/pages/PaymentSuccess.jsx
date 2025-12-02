import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PaymentSuccess = ({ setCurrentView }) => {
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Simulate API call to verify payment
  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // For demo purposes, we'll simulate an API call
        // In a real app, this would be your backend endpoint
        const urlParams = new URLSearchParams(window.location.search);
        const courseId = urlParams.get('courseId');
        const lessonId = urlParams.get('lessonId');
        const amount = urlParams.get('amount');
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock successful payment verification
        const mockResponse = {
          data: {
            success: true,
            payment: {
              courseId: courseId || 'demo-course',
              lessonId: lessonId || 'demo-lesson',
              amount: amount || '5000',
              status: 'completed',
              transactionId: 'txn_' + Math.random().toString(36).substr(2, 9),
              timestamp: new Date().toISOString()
            }
          }
        };
        
        setPaymentDetails(mockResponse.data.payment);
        setLoading(false);
        
        console.log('Payment verified successfully:', mockResponse.data.payment);
        
      } catch (err) {
        console.error('Payment verification failed:', err);
        setError('Failed to verify payment. Please contact support.');
        setLoading(false);
      }
    };

    verifyPayment();
  }, []);

  const handleViewCourses = () => {
    setCurrentView('courses');
  };

  const handleGoToDashboard = () => {
    setCurrentView('dashboard');
  };

  if (loading) {
    return (
      <div className="payment-success-container">
        <div className="payment-success-card">
          <div className="loading-spinner"></div>
          <h2>Verifying Payment...</h2>
          <p>Please wait while we confirm your payment details.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-success-container">
        <div className="payment-success-card error">
          <div className="error-icon">❌</div>
          <h2>Verification Failed</h2>
          <p>{error}</p>
          <button 
            className="btn btn-primary"
            onClick={handleGoToDashboard}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-success-container">
      <div className="payment-success-card">
        <div className="success-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <h1>Payment Successful! 🎉</h1>
        
        <div className="success-message">
          <p>Thank you for your purchase! Your payment has been processed successfully.</p>
          <p>You now have full access to your purchased content.</p>
          
          {paymentDetails && (
            <div className="payment-details">
              <h3>Payment Details:</h3>
              <p><strong>Amount:</strong> ₦{paymentDetails.amount}</p>
              <p><strong>Transaction ID:</strong> {paymentDetails.transactionId}</p>
              {paymentDetails.courseId && <p><strong>Course ID:</strong> {paymentDetails.courseId}</p>}
              {paymentDetails.lessonId && <p><strong>Lesson ID:</strong> {paymentDetails.lessonId}</p>}
              <p><strong>Status:</strong> <span className="status-completed">Completed</span></p>
              <p><strong>Date:</strong> {new Date(paymentDetails.timestamp).toLocaleDateString()}</p>
            </div>
          )}
        </div>
        
        <div className="success-actions">
          <button 
            className="btn btn-primary"
            onClick={handleViewCourses}
          >
            View My Courses
          </button>
          <button 
            className="btn btn-secondary"
            onClick={handleGoToDashboard}
          >
            Go to Dashboard
          </button>
        </div>
        
        <div className="support-info">
          <p>Need help? <span 
            className="support-link" 
            onClick={() => setCurrentView('support')}
            style={{color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline'}}
          >
            Contact Support
          </span></p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;