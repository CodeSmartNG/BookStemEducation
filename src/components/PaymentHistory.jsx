import React, { useState, useEffect } from 'react';
import { getPaymentHistory, getCurrentUser } from '../utils/storage';

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentHistory();
  }, []);

  const loadPaymentHistory = () => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      const paymentHistory = getPaymentHistory(currentUser.id);
      setPayments(paymentHistory);
    }
    setLoading(false);
  };

  if (loading) return <div>Loading payment history...</div>;

  return (
    <div className="payment-history">
      <h2>Payment History</h2>
      {payments.length === 0 ? (
        <p>No payment history found.</p>
      ) : (
        <div className="payments-list">
          {payments.map(payment => (
            <div key={payment.id} className="payment-item">
              <div className="payment-info">
                <h4>Lesson Purchase</h4>
                <p>Amount: ₦{payment.amount}</p>
                <p>Date: {new Date(payment.date).toLocaleDateString()}</p>
                <p>Status: <span className="status-completed">Completed</span></p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;