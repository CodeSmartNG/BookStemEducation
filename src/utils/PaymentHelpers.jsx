// Utility functions for payments
export const formatAmount = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
  }).format(amount);
};

export const generateReference = (prefix = 'CSNG') => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const getPaymentErrorMessage = (errorCode) => {
  const errorMessages = {
    'insufficient_funds': 'Insufficient funds in your account',
    'transaction_declined': 'Transaction was declined by your bank',
    'invalid_card': 'Invalid card details',
    'expired_card': 'Your card has expired',
    'network_error': 'Network error occurred. Please check your connection',
    'timeout': 'Payment timeout. Please try again',
    'default': 'Payment failed. Please try again or contact support'
  };
  
  return errorMessages[errorCode] || errorMessages.default;
};