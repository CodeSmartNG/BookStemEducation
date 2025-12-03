import React from "react";
import { PaystackButton } from "react-paystack";

const PayButton = ({ 
  email, 
  amount, 
  metadata, 
  onSuccess, 
  onClose,
  buttonText = "Pay Now",
  className = "payment-btn",
  disabled = false
}) => {
  // ✅ USE YOUR REAL PUBLIC KEY
  const publicKey = process.env.REACT_APP_PAYSTACK_PUBLIC_KEY || 
                   "pk_live_d8d97b1f913f518b06d50f9cc21d84bee176a49d";

  // ✅ Generate unique reference
  const generateReference = () => {
    return `EDUSTEM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const componentProps = {
    email,
    amount: amount * 100, // Convert Naira to kobo
    metadata: {
      ...metadata,
      custom_fields: [
        {
          display_name: "Platform",
          variable_name: "platform",
          value: "Edustem Academy"
        },
        {
          display_name: "Payment Type",
          variable_name: "payment_type",
          value: "Course Payment"
        }
      ]
    },
    publicKey,
    text: buttonText,
    reference: generateReference(),
    currency: "NGN",
    channels: ['card', 'bank', 'ussd', 'mobile_money'],
    label: "Edustem Academy",
    
    onSuccess: (response) => {
      console.log("✅ Payment Successful:", response);
      
      // Store successful payment
      localStorage.setItem(`payment_${response.reference}`, JSON.stringify({
        ...response,
        email,
        amount,
        metadata,
        timestamp: new Date().toISOString(),
        status: 'completed'
      }));
      
      alert(`Payment Successful! Reference: ${response.reference}`);
      
      if (onSuccess) onSuccess(response);
      
      // Optional: Verify payment with backend
      verifyPayment(response.reference);
    },
    
    onClose: () => {
      console.log("Payment window closed");
      if (onClose) onClose();
    }
  };

  // Optional: Verify payment function
  const verifyPayment = async (reference) => {
    try {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_PAYSTACK_SECRET_KEY}`
        }
      });
      
      const data = await response.json();
      console.log("Verification result:", data);
      
      if (data.status && data.data.status === 'success') {
        // Update local storage with verified data
        const paymentData = JSON.parse(localStorage.getItem(`payment_${reference}`) || '{}');
        paymentData.verified = true;
        paymentData.verified_at = new Date().toISOString();
        localStorage.setItem(`payment_${reference}`, JSON.stringify(paymentData));
      }
    } catch (error) {
      console.error("Verification error:", error);
    }
  };

  // Show warning if using test key in production
  const isTestKey = publicKey.includes('pk_test_');
  const isDemoKey = publicKey.includes('your_paystack');

  return (
    <div className="pay-button-container">
      {isDemoKey && (
        <div className="alert alert-warning">
          ⚠️ Using demo public key. Replace with your real Paystack public key.
        </div>
      )}
      
      {isTestKey && process.env.NODE_ENV === 'production' && (
        <div className="alert alert-danger">
          ⚠️ You are using TEST key in PRODUCTION! Switch to live keys.
        </div>
      )}
      
      <PaystackButton 
        {...componentProps} 
        className={`${className} ${disabled ? 'disabled' : ''}`}
        disabled={disabled}
      />
      
      <div className="payment-security-note">
        <small>🔒 Secured by Paystack • 💳 Cards, Bank Transfer, USSD</small>
      </div>
    </div>
  );
};

export default PayButton;