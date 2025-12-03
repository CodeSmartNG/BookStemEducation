import React, { useState } from 'react';
import PayButton from './PayButton';

const CoursePurchase = ({ course, userEmail, userId }) => {
  const [loading, setLoading] = useState(false);
  
  const handlePaymentSuccess = (response) => {
    // Redirect to course content
    window.location.href = `/courses/${course.id}/start`;
  };
  
  return (
    <div className="course-purchase-card">
      <h3>{course.title}</h3>
      <div className="price">₦{course.price.toLocaleString()}</div>
      
      <PayButton
        email={userEmail}
        amount={course.price}
        metadata={{
          course_id: course.id,
          course_name: course.title,
          student_id: userId
        }}
        onSuccess={handlePaymentSuccess}
        buttonText={`Enroll for ₦${course.price}`}
        className="enroll-button"
      />
    </div>
  );
};

export default CoursePurchase;