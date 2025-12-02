// src/components/TeacherBankDetails.jsx
import React, { useState } from 'react';
import { updateTeacher } from '../utils/storage';

const TeacherBankDetails = ({ currentUser, onUpdate }) => {
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountNumber: '',
    routingNumber: '',
  });

  const handleChange = (e) => {
    setBankDetails({ ...bankDetails, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // For a real app, send data securely to the backend for Stripe Connect
    console.log('Bank details submitted:', bankDetails);
    onUpdate(currentUser.id, { ...bankDetails });
  };

  return (
    <div className="form-container">
      <h2>Enter Bank Details</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="bankName"
          placeholder="Bank Name"
          value={bankDetails.bankName}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="accountNumber"
          placeholder="Account Number"
          value={bankDetails.accountNumber}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="routingNumber"
          placeholder="Routing Number"
          value={bankDetails.routingNumber}
          onChange={handleChange}
          required
        />
        <button type="submit">Save Bank Details</button>
      </form>
    </div>
  );
};

export default TeacherBankDetails;
