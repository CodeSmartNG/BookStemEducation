import React, { useState, useEffect } from 'react';
import './StudentProfile.css';

const StudentProfile = ({ student, setStudent }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  // Initialize formData when student changes
  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || '',
        email: student.email || '',
        level: student.level || 'Beginner'
      });
    }
  }, [student]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Fix: Only update the specific fields, keep the rest of student data intact
    setStudent({
      ...student, // Keep all existing student data
      name: formData.name,
      email: formData.email,
      level: formData.level
    });
    
    setIsEditing(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Add safety checks for student and student.progress
  if (!student) {
    return (
      <div className="student-profile">
        <h2>Student Profile</h2>
        <div className="loading-state">Loading profile...</div>
      </div>
    );
  }

  const progress = student.progress || {};

  return (
    <div className="student-profile">
      <h2>Student Profile</h2>

      {!isEditing ? (
        <div className="profile-view">
          <div className="profile-info">
            <p><strong>Sunan:</strong> {student.name}</p>
            <p><strong>Imel:</strong> {student.email}</p>
            <p><strong>Matsayi:</strong> {student.level}</p>
          </div>

          <div className="progress-section">
            <h3>Progress</h3>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{width: `${progress.webDevelopment || 0}%`}}
              >
                Web Development: {progress.webDevelopment || 0}%
              </div>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{width: `${progress.python || 0}%`}}
              >
                Python: {progress.python || 0}%
              </div>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{width: `${progress.mathematics || 0}%`}}
              >
                Mathematics: {progress.mathematics || 0}%
              </div>
            </div>
          </div>

          <button onClick={() => setIsEditing(true)} className="edit-btn">
            Edit
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Level:</label>
            <select
              name="level"
              value={formData.level || 'Beginner'}
              onChange={handleChange}
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div className="form-buttons">
            <button type="submit" className="save-btn">Save</button>
            <button 
              type="button" 
              onClick={() => setIsEditing(false)} 
              className="cancel-btn"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default StudentProfile;