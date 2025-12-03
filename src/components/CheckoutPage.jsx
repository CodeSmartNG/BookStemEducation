import React from 'react';
import PayButton from './PayButton';

const CheckoutPage = ({ cartItems, userEmail, onPaymentComplete }) => {
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.price, 0);
  };
  
  return (
    <div className="checkout-container">
      <h2>Checkout</h2>
      
      <div className="order-summary">
        {cartItems.map(item => (
          <div key={item.id} className="order-item">
            <span>{item.name}</span>
            <span>₦{item.price.toLocaleString()}</span>
          </div>
        ))}
        
        <div className="order-total">
          <strong>Total</strong>
          <strong>₦{calculateTotal().toLocaleString()}</strong>
        </div>
      </div>
      
      <PayButton
        email={userEmail}
        amount={calculateTotal()}
        metadata={{
          cart_items: cartItems,
          item_count: cartItems.length
        }}
        onSuccess={onPaymentComplete}
        buttonText={`Pay ₦${calculateTotal().toLocaleString()}`}
        className="checkout-button"
      />
    </div>
  );
};

export default CheckoutPage;