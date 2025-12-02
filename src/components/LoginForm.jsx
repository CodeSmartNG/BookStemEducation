import React, { useState } from 'react';
import './AuthForms.css';

const LoginForm = ({ onLogin, onSwitchToRegister, onSwitchToTeacherRegister }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    const success = await onLogin(formData.email, formData.password);
    if (!success) {
      setError('Invalid email or password');
    }
    
    setIsLoading(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleDemoLogin = (role) => {
    let email, password;
    
    switch(role) {
      case 'admin':
        email = 'codesmartng1@gmail.com';
        password = 'Kb1217@#$%&';
        break;
      case 'teacher':
        email = 'kabir@teacher.com';
        password = '121712';
        break;
      case 'student':
        email = 'student@example.com';
        password = 'password123';
        break;
      default:
        return;
    }
    
    setFormData({ email, password });
    // Auto-submit after setting the values
    setTimeout(() => {
      handleSubmit(new Event('submit'));
    }, 100);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Sign in to your STEM Platform account</p>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              className="form-input"
            />
          </div>

          <button 
            type="submit" 
            className={`btn-primary login-btn ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="spinner"></div>
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Demo Login Buttons */}
        <div className="demo-section">
          <div className="demo-divider">
            <span>Quick Demo Access</span>
          </div>
          <div className="demo-buttons">
            <button 
              type="button" 
              className="demo-btn admin-demo"
              onClick={() => handleDemoLogin('admin')}
            >
              <span className="demo-icon">👑</span>
              Admin Demo
            </button>
            <button 
              type="button" 
              className="demo-btn teacher-demo"
              onClick={() => handleDemoLogin('teacher')}
            >
              <span className="demo-icon">👨‍🏫</span>
              Teacher Demo
            </button>
            <button 
              type="button" 
              className="demo-btn student-demo"
              onClick={() => handleDemoLogin('student')}
            >
              <span className="demo-icon">👨‍🎓</span>
              Student Demo
            </button>
          </div>
        </div>

        <div className="auth-footer">
          <div className="footer-section">
            <p>Don't have an account?</p>
            <div className="register-options">
              <button 
                type="button" 
                className="btn-outline student-register-btn"
                onClick={onSwitchToRegister}
              >
                <span className="btn-icon">👨‍🎓</span>
                Sign up as Student
              </button>
              <div className="divider">
                <span>or</span>
              </div>
              <button 
                type="button" 
                className="btn-teacher teacher-register-btn"
                onClick={onSwitchToTeacherRegister}
              >
                <span className="btn-icon">👨‍🏫</span>
                Apply as Teacher
              </button>
            </div>
          </div>
          
          <div className="teacher-info">
            <h4>Interested in Teaching?</h4>
            <p>Join our platform as an educator and share your knowledge with students</p>
            <ul>
              <li>Create and manage your own courses</li>
              <li>Reach students interested in your expertise</li>
              <li>Get admin approval for quality control</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;