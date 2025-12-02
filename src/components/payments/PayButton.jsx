import React from "react";
import { PaystackButton } from "react-paystack";

const PayButton = ({ email, amount, metadata, onSuccess, onClose }) => {
  const publicKey = "pk_test_xxxxxxxxxxxxxxxxxxxxxx";  // CHANGE THIS

  const componentProps = {
    email,
    amount: amount * 100, // convert to Kobo
    metadata,
    publicKey,
    text: "Pay Now",
    onSuccess: () => {
      alert("Payment Successful!");
      if (onSuccess) onSuccess(); 
    },
    onClose: () => {
      alert("Payment Closed");
      if (onClose) onClose();
    }
  };

  return (
    <div>
      <PaystackButton {...componentProps} className="payment-btn" />
    </div>
  );
};

export default PayButton;