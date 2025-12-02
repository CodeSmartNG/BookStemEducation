import React, { useState, useEffect } from 'react';
import { paymentService } from '../../utils/paymentService';
import { getCurrentUser, processLessonPayment, purchaseLesson } from '../../utils/storage';
import PaystackPayment from './PaystackPayment';
import './PaymentModal.css';

const PaymentModal = ({ lesson, course, onClose, onSuccess }) => {
  const [selectedMethod, setSelectedMethod] = useState('paystack');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('select');
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState('');
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountNumber: '',
    phoneNumber: ''
  });
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

  const paymentMethods = [
    {
      id: 'paystack',
      name: 'Paystack',
      description: 'Pay with card, bank, or USSD',
      icon: '💳',
      supports: ['Card', 'Bank Transfer', 'USSD', 'QR', 'Mobile Money']
    },
    {
      id: 'flutterwave',
      name: 'Flutterwave',
      description: 'Multiple payment options',
      icon: '🌐',
      supports: ['Card', 'Bank Transfer', 'USSD', 'Mobile Money']
    },
    {
      id: 'bank_transfer',
      name: 'Direct Bank Transfer',
      description: 'Transfer to our account',
      icon: '🏦',
      supports: ['OPay', 'PalmPay', 'GTB', 'Zenith', 'Access', 'First Bank']
    },
    {
      id: 'ussd',
      name: 'USSD Payment',
      description: 'Dial code on your phone',
      icon: '📱',
      supports: ['OPay', 'PalmPay', 'GTB', 'Zenith', 'Access']
    },
    {
      id: 'mobile_money',
      name: 'Mobile Money',
      description: 'OPay, PalmPay, etc.',
      icon: '📲',
      supports: ['OPay', 'PalmPay', 'Carbon', 'Kuda']
    }
  ];

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
    setStep('select');
    setPaymentData(null);
    setBankDetails({
      bankName: '',
      accountNumber: '',
      phoneNumber: ''
    });
    trackPaymentEvent('payment_retried', selectedMethod, safeLesson.price);
  };

  const handlePayment = async () => {
    if (!currentUser) {
      setError('Please log in to make a payment');
      return;
    }

    setLoading(true);
    setError('');
    trackPaymentEvent('payment_initiated', selectedMethod, safeLesson.price);

    try {
      switch (selectedMethod) {
        case 'paystack':
          // Paystack is handled by the separate component
          setStep('processing');
          break;
        case 'flutterwave':
          await handleFlutterwavePayment();
          break;
        case 'bank_transfer':
          await handleBankTransfer();
          break;
        case 'ussd':
          await handleUSSDPayment();
          break;
        case 'mobile_money':
          await handleMobileMoneyPayment();
          break;
        default:
          throw new Error('Invalid payment method');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message || 'Payment failed. Please try again.');
      setStep('error');
      trackPaymentEvent('payment_failed', selectedMethod, safeLesson.price, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFlutterwavePayment = async () => {
    setStep('processing');
    setError('');
    
    try {
      const metadata = {
        lesson_id: safeLesson.id,
        lesson_title: safeLesson.title || 'Lesson',
        course_key: safeCourse.key,
        teacher_id: safeCourse.teacherId,
        student_id: currentUser.id,
        student_name: currentUser.name
      };

      const result = await paymentService.initializeFlutterwavePayment(
        currentUser.email,
        safeLesson.price || 0,
        metadata
      );

      if (result?.status === 'success') {
        setPaymentData(result.data);
        trackPaymentEvent('payment_processing', 'flutterwave', safeLesson.price, 'processing');
        
        // Simulate payment processing
        const timeout = setTimeout(async () => {
          try {
            // In real implementation, you'd verify with Flutterwave API
            const isSuccess = Math.random() > 0.2; // 80% success rate
            
            if (isSuccess) {
              await completePayment(result.data.tx_ref || `flutterwave_${Date.now()}`, 'flutterwave');
            } else {
              setError('Flutterwave payment failed or was cancelled');
              setStep('error');
              trackPaymentEvent('payment_failed', 'flutterwave', safeLesson.price, 'verification_failed');
            }
          } catch (verifyError) {
            console.error('Flutterwave verification error:', verifyError);
            setError('Payment verification failed');
            setStep('error');
            trackPaymentEvent('payment_failed', 'flutterwave', safeLesson.price, 'verification_error');
          }
        }, 3000);

        setPaymentTimeout(timeout);
      } else {
        throw new Error(result?.message || 'Failed to initialize Flutterwave payment');
      }
    } catch (error) {
      console.error('Flutterwave payment error:', error);
      setError(error.message || 'Flutterwave payment failed');
      setStep('error');
      trackPaymentEvent('payment_failed', 'flutterwave', safeLesson.price, 'initialization_error');
    }
  };

  const handleBankTransfer = async () => {
    if (!bankDetails.bankName) {
      setError('Please select a bank');
      return;
    }

    setStep('processing');
    setError('');
    
    try {
      const result = await paymentService.initializeDirectBankTransfer(
        safeLesson.price || 0,
        bankDetails
      );

      if (result?.status === 'success') {
        setPaymentData(result.data);
        setStep('transfer_details');
        trackPaymentEvent('payment_processing', 'bank_transfer', safeLesson.price, 'transfer_details');
      } else {
        throw new Error(result?.message || 'Failed to initialize bank transfer');
      }
    } catch (error) {
      console.error('Bank transfer error:', error);
      setError(error.message || 'Bank transfer initialization failed');
      setStep('error');
      trackPaymentEvent('payment_failed', 'bank_transfer', safeLesson.price, 'initialization_error');
    }
  };

  const handleUSSDPayment = async () => {
    if (!bankDetails.bankName) {
      setError('Please select a bank');
      return;
    }

    setError('');
    
    try {
      const result = await paymentService.generateUSSDCode(
        safeLesson.price || 0,
        bankDetails.bankName
      );

      if (result?.status === 'success') {
        setPaymentData(result.data);
        setStep('ussd_instructions');
        trackPaymentEvent('payment_processing', 'ussd', safeLesson.price, 'ussd_instructions');
      } else {
        throw new Error(result?.message || 'Failed to generate USSD code');
      }
    } catch (error) {
      console.error('USSD payment error:', error);
      setError(error.message || 'USSD payment initialization failed');
      setStep('error');
      trackPaymentEvent('payment_failed', 'ussd', safeLesson.price, 'initialization_error');
    }
  };

  const handleMobileMoneyPayment = async () => {
    if (!bankDetails.phoneNumber) {
      setError('Please enter your phone number');
      return;
    }

    if (!bankDetails.bankName) {
      setError('Please select a mobile money provider');
      return;
    }

    setStep('processing');
    setError('');
    
    try {
      const result = await paymentService.initializeMobileMoneyPayment(
        bankDetails.phoneNumber,
        safeLesson.price || 0,
        bankDetails.bankName
      );

      if (result?.status === 'success') {
        setPaymentData(result.data);
        setStep('mobile_money_pending');
        trackPaymentEvent('payment_processing', 'mobile_money', safeLesson.price, 'pending');
      } else {
        throw new Error(result?.message || 'Failed to initialize mobile money payment');
      }
    } catch (error) {
      console.error('Mobile money payment error:', error);
      setError(error.message || 'Mobile money payment failed');
      setStep('error');
      trackPaymentEvent('payment_failed', 'mobile_money', safeLesson.price, 'initialization_error');
    }
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

  const handleConfirmTransfer = async () => {
    setLoading(true);
    setError('');
    
    try {
      trackPaymentEvent('transfer_confirmed', 'bank_transfer', safeLesson.price, 'waiting');
      
      // Simulate waiting for bank transfer confirmation
      const timeout = setTimeout(async () => {
        await completePayment(paymentData.virtual_account, 'bank_transfer');
        setLoading(false);
      }, 5000);

      setPaymentTimeout(timeout);
    } catch (error) {
      setError(error.message);
      setLoading(false);
      trackPaymentEvent('transfer_failed', 'bank_transfer', safeLesson.price, 'confirmation_error');
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
    setStep('select');
  };

  const renderStep = () => {
    switch (step) {
      case 'select':
        return (
          <div className="payment-methods">
            <h3>Select Payment Method</h3>
            <div className="methods-grid">
              {paymentMethods.map(method => (
                <div
                  key={method.id}
                  className={`method-card ${selectedMethod === method.id ? 'selected' : ''}`}
                  onClick={() => setSelectedMethod(method.id)}
                >
                  <div className="method-icon">{method.icon}</div>
                  <div className="method-info">
                    <h4>{method.name}</h4>
                    <p>{method.description}</p>
                    <div className="method-supports">
                      {method.supports.map(support => (
                        <span key={support} className="support-tag">{support}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Details Form */}
            {(selectedMethod === 'bank_transfer' || selectedMethod === 'ussd' || selectedMethod === 'mobile_money') && (
              <div className="payment-details-form">
                <h4>Payment Details</h4>
                
                {(selectedMethod === 'bank_transfer' || selectedMethod === 'ussd') && (
                  <div className="form-group">
                    <label>Select Bank:</label>
                    <select
                      value={bankDetails.bankName}
                      onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                    >
                      <option value="">Choose your bank</option>
                      <option value="OPAY">OPay</option>
                      <option value="PALMPAY">PalmPay</option>
                      <option value="GTB">Guaranty Trust Bank</option>
                      <option value="ZENITH">Zenith Bank</option>
                      <option value="ACCESS">Access Bank</option>
                      <option value="FIRSTBANK">First Bank</option>
                      <option value="UBA">United Bank for Africa</option>
                    </select>
                  </div>
                )}

                {selectedMethod === 'mobile_money' && (
                  <>
                    <div className="form-group">
                      <label>Mobile Money Provider:</label>
                      <select
                        value={bankDetails.bankName}
                        onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                      >
                        <option value="">Choose provider</option>
                        <option value="OPAY">OPay</option>
                        <option value="PALMPAY">PalmPay</option>
                        <option value="CARBON">Carbon</option>
                        <option value="KUDA">Kuda</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Phone Number:</label>
                      <input
                        type="tel"
                        placeholder="08012345678"
                        value={bankDetails.phoneNumber}
                        onChange={(e) => setBankDetails({...bankDetails, phoneNumber: e.target.value})}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="payment-summary">
              <h4>Order Summary</h4>
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
                <span>Total:</span>
                <span>₦{(safeLesson.price || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Paystack Payment Component */}
            {selectedMethod === 'paystack' ? (
              <PaystackPayment 
                lesson={safeLesson}
                student={currentUser}
                onSuccess={handlePaystackSuccess}
                onClose={handlePaystackClose}
              />
            ) : (
              <button 
                className="pay-now-btn"
                onClick={handlePayment}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="button-spinner"></div>
                    Processing {selectedMethod}...
                  </>
                ) : (
                  `Pay ₦${(safeLesson.price || 0).toLocaleString()}`
                )}
              </button>
            )}
          </div>
        );

      case 'processing':
        return (
          <div className="payment-processing">
            <div className="processing-spinner"></div>
            <h3>Processing Payment...</h3>
            <p>Please wait while we process your payment</p>
            {paymentData?.authorization_url && (
              <div className="redirect-notice">
                <p>You will be redirected to complete your payment</p>
                <a href={paymentData.authorization_url} target="_blank" rel="noopener noreferrer" className="redirect-btn">
                  Click here if not redirected automatically
                </a>
              </div>
            )}
          </div>
        );

      case 'transfer_details':
        return (
          <div className="transfer-details">
            <h3>Bank Transfer Instructions</h3>
            <div className="transfer-info">
              <div className="info-item">
                <label>Bank Name:</label>
                <span>{paymentData?.bank_name || 'Nigerian Bank'}</span>
              </div>
              <div className="info-item">
                <label>Account Number:</label>
                <span className="account-number">{paymentData?.virtual_account || '0123456789'}</span>
              </div>
              <div className="info-item">
                <label>Account Name:</label>
                <span>{paymentData?.account_name || 'STEM Learning Platform'}</span>
              </div>
              <div className="info-item">
                <label>Amount:</label>
                <span>₦{(paymentData?.amount || safeLesson.price || 0).toLocaleString()}</span>
              </div>
              <div className="info-item">
                <label>Expires:</label>
                <span>{paymentData?.expires_in || '24 hours'}</span>
              </div>
            </div>
            
            <div className="instructions">
              <h4>Instructions:</h4>
              <ol>
                <li>Transfer exactly ₦{(paymentData?.amount || safeLesson.price || 0).toLocaleString()} to the account above</li>
                <li>Use your name as transfer reference</li>
                <li>Payment will be confirmed automatically within 24 hours</li>
                <li>Keep your transfer receipt for reference</li>
              </ol>
            </div>

            <div className="action-buttons">
              <button 
                className="confirm-transfer-btn"
                onClick={handleConfirmTransfer}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="button-spinner"></div>
                    Waiting for transfer...
                  </>
                ) : (
                  'I have made the transfer'
                )}
              </button>
              <button 
                className="back-btn"
                onClick={() => setStep('select')}
              >
                Back to Payment Methods
              </button>
            </div>
          </div>
        );

      case 'ussd_instructions':
        return (
          <div className="ussd-instructions">
            <h3>USSD Payment</h3>
            <div className="ussd-code">
              <h4>Dial this code on your phone:</h4>
              <div className="code-display">{paymentData?.ussd_code || '*322*000#'}</div>
            </div>
            <div className="instructions">
              <p>{paymentData?.instructions || 'Dial the code and follow the prompts to complete your payment.'}</p>
              <ol>
                <li>Dial {paymentData?.ussd_code || '*322*000#'} on your phone</li>
                <li>Follow the prompts to complete payment</li>
                <li>Return here after successful payment</li>
                <li>Make sure you have sufficient airtime/account balance</li>
              </ol>
            </div>

            <div className="action-buttons">
              <button 
                className="confirm-payment-btn"
                onClick={() => completePayment(`ussd_${Date.now()}`, 'ussd')}
              >
                I have completed the payment
              </button>
              <button 
                className="back-btn"
                onClick={() => setStep('select')}
              >
                Back to Payment Methods
              </button>
            </div>
          </div>
        );

      case 'mobile_money_pending':
        return (
          <div className="mobile-money-pending">
            <h3>Mobile Money Payment</h3>
            <div className="pending-info">
              <p>📱 Payment request sent to {bankDetails.phoneNumber}</p>
              <p>💰 Amount: ₦{safeLesson.price || 0}</p>
              <p>🏦 Provider: {bankDetails.bankName}</p>
              <p className="instructions">{paymentData?.instructions || 'Please check your mobile money app to approve the payment'}</p>
            </div>
            
            <div className="action-buttons">
              <button 
                className="confirm-payment-btn"
                onClick={() => completePayment(paymentData?.transaction_id || `mobile_${Date.now()}`, 'mobile_money')}
              >
                I have approved the payment
              </button>
              <button 
                className="back-btn"
                onClick={() => setStep('select')}
              >
                Try another method
              </button>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="payment-success">
            <div className="success-icon">✅</div>
            <h3>Payment Successful!</h3>
            <p>You now have access to "{safeLesson.title || 'the lesson'}"</p>
            <div className="success-details">
              <p>💰 Amount: ₦{(safeLesson.price || 0).toLocaleString()}</p>
              <p>📚 Lesson: {safeLesson.title || 'Premium Content'}</p>
              <p>🎓 Course: {safeCourse.title || 'STEM Course'}</p>
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
                <li>Try a different payment method</li>
                <li>Contact support if issue persists</li>
              </ul>
            </div>
            <div className="action-buttons">
              <button className="retry-btn" onClick={handleRetryPayment}>
                Try Another Method
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
          {step === 'select' && (
            <button className="close-button" onClick={onClose}>×</button>
          )}
        </div>
        
        <div className="modal-body">
          {renderStep()}
        </div>

        <div className="modal-footer">
          <p className="security-notice">
            🔒 All payments are secure and encrypted. Your financial information is protected.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;