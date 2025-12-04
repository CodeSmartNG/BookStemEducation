const PayButton = ({ email, amount, metadata, buttonText, onSuccess }) => {
  const handlePayment = () => {
    // Load Paystack inline script
    const script = document.createElement('script');
    script.src = "  https://js.paystack.co/v2/inline.js ";
    script.async = true;

    script.onload = () => {
      // @ts-ignore - Paystack is loaded globally
      const handler = PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email: email,
        amount: amount * 100,
        ref: `EDUSTEM_${Date.now()}`,
        metadata: metadata,
        callback: (response) => {
          console.log('Payment successful:', response);
          onSuccess(response);
        },
        onClose: () => {
          console.log('Payment window closed');
        }
      });

      handler.openIframe();
    };

    document.head.appendChild(script);
  };

  return (
    <button onClick={handlePayment} className="payment-btn">
      {buttonText || `Pay ₦${amount}`}
    </button>
  );
};

// ✅ ADD THIS LINE - DEFAULT EXPORT
export default PayButton;