import React, { useState } from 'react';
import PaymentModal from './payments/PaymentModal';
import { processTeacherPayment } from '../utils/teacherPaymentService';
import { getCurrentUser, grantCourseAccess } from '../utils/storage';

const CoursePurchase = ({ course, userEmail, userId, student }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Extract teacher info from course
  const teacherInfo = {
    teacherId: course.teacherId || 'default_teacher',
    teacherName: course.teacherName || 'Course Instructor'
  };

  const handlePaymentClick = () => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      alert('Please log in to purchase courses');
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (paymentData) => {
    try {
      setLoading(true);
      
      // 1. Process teacher payment
      const teacherPaymentSuccess = await processTeacherPayment(
        paymentData,
        { 
          ...course,
          title: course.title || 'Course',
          price: course.price,
          courseId: course.id,
          ...teacherInfo
        },
        student || { id: userId, email: userEmail, name: 'Student' }
      );

      // 2. Grant course access to student
      const accessGranted = grantCourseAccess(userId, course.id);
      
      if (accessGranted) {
        // Show success message
        if (teacherPaymentSuccess) {
          alert('🎉 Enrollment successful! Course access granted and teacher payment processed.');
        } else {
          alert('🎉 Enrollment successful! Course access granted. Teacher payment is being processed.');
        }
        
        // Close modal and redirect
        setShowPaymentModal(false);
        window.location.href = `/courses/${course.id}/start`;
      } else {
        alert('❌ Error granting course access. Please contact support.');
      }
    } catch (error) {
      console.error('Error processing enrollment:', error);
      alert('❌ Enrollment completed but there was an issue with access. Please contact support.');
      
      // Still close modal
      setShowPaymentModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentClose = () => {
    setShowPaymentModal(false);
  };

  return (
    <div className="course-purchase-card">
      <div className="course-purchase-header">
        <h3>{course.title || 'Course'}</h3>
        {course.teacherName && (
          <div className="course-instructor">
            <small>Instructor: {course.teacherName}</small>
          </div>
        )}
      </div>
      
      <div className="course-features">
        <ul>
          <li>✅ {course.lessons?.length || 0} Lessons</li>
          <li>✅ Lifetime Access</li>
          <li>✅ Certificate of Completion</li>
          <li>✅ Instructor Support</li>
        </ul>
      </div>
      
      <div className="price-section">
        <div className="price">₦{course.price?.toLocaleString() || '0'}</div>
        <div className="payment-methods">
          <small>Card • Bank Transfer • USSD</small>
        </div>
      </div>

      <button 
        onClick={handlePaymentClick}
        disabled={loading}
        className="enroll-button"
      >
        {loading ? 'Processing...' : `Enroll Now - ₦${course.price?.toLocaleString() || '0'}`}
      </button>

      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={handlePaymentClose}
          lesson={{
            ...course,
            title: course.title || 'Course',
            courseId: course.id,
            price: course.price,
            ...teacherInfo
          }}
          student={student || { 
            id: userId, 
            email: userEmail, 
            name: 'Student' 
          }}
          onPaymentSuccess={handlePaymentSuccess}
          type="course"
        />
      )}
    </div>
  );
};

export default CoursePurchase;