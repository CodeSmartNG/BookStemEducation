import React from 'react';
import PayButton from './PayButton';

const SubscriptionPlan = ({ plan, userEmail }) => {
  return (
    <div className="subscription-card">
      <div className="plan-header">
        <h4>{plan.name}</h4>
        <div className="plan-price">
          <span className="amount">₦{plan.price}</span>
          <span className="period">/month</span>
        </div>
      </div>
      
      <ul className="plan-features">
        {plan.features.map((feature, index) => (
          <li key={index}>✓ {feature}</li>
        ))}
      </ul>
      
      <PayButton
        email={userEmail}
        amount={plan.price}
        metadata={{
          plan_id: plan.id,
          plan_name: plan.name,
          subscription: true
        }}
        onSuccess={() => window.location.href = '/dashboard'}
        buttonText={`Subscribe Now`}
        className="subscribe-button"
      />
    </div>
  );
};

export default SubscriptionPlan;