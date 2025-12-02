import React from 'react';
import Button from '../ui/Button';

const PaymentFailed = ({ error, onRetry, onTryAnotherMethod, onContactSupport, onCancel }) => {
  return (
    <div className="payment-failed-container">
      <div className="payment-status-header">
        <div className="status-icon failed">
          ❌
        </div>
        <h2>Payment Failed</h2>
        <p className="status-description">
          Failed to complete payment processing
        </p>
      </div>

      <div className="suggestions-section">
        <h3>Suggestions:</h3>
        <ul className="suggestions-list">
          <li className="suggestion-item">
            <input type="checkbox" id="check-internet" />
            <label htmlFor="check-internet">Check your internet connection</label>
          </li>
          <li className="suggestion-item">
            <input type="checkbox" id="check-funds" />
            <label htmlFor="check-funds">Ensure you have sufficient funds</label>
          </li>
          <li className="suggestion-item">
            <input type="checkbox" id="check-method" />
            <label htmlFor="check-method">Try a different payment method</label>
          </li>
          <li className="suggestion-item">
            <input type="checkbox" id="contact-support" />
            <label htmlFor="contact-support">Contact support if issue persists</label>
          </li>
        </ul>
      </div>

      <div className="error-details">
        {error && (
          <div className="error-message alert alert-error">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      <div className="action-buttons">
        <Button 
          onClick={onRetry}
          className="btn-primary"
          fullWidth
        >
          Try Again
        </Button>
        
        <Button 
          onClick={onTryAnotherMethod}
          className="btn-secondary"
          fullWidth
        >
          Try Another Payment Method
        </Button>
        
        <Button 
          onClick={onContactSupport}
          className="btn-outline"
          fullWidth
        >
          Contact Support
        </Button>
        
        <Button 
          onClick={onCancel}
          className="btn-link"
          fullWidth
        >
          Cancel Payment
        </Button>
      </div>

      <div className="security-notice">
        <p>🔒 All payments are secure and encrypted. Your financial information is protected.</p>
      </div>
    </div>
  );
};

export default PaymentFailed;