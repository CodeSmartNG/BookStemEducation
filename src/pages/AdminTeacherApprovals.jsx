import React from 'react';
import TeacherRegisterForm from '../components/TeacherRegisterForm';
import storage from '../utils/storage'; // path to your storage file

const RegisterTeacherPage = () => {
  const handleRegister = async (formData) => {
    try {
      // Call registerTeacher from your local storage logic
      const result = storage.registerTeacher(formData);
      // Result contains: { user: newUser, confirmationToken }
      // Show success to user
      alert("Registration successful! Please check your email for confirmation. Your account will be reviewed by an admin before you can log in.");
      return true;
    } catch (err) {
      alert(err.message);
      return false;
    }
  };

  return <TeacherRegisterForm onRegister={handleRegister} onSwitchToLogin={() => {/* your logic */}} />;
};

export default RegisterTeacherPage;