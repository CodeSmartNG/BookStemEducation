import React from 'react';
import { getCourses, initializeStorage } from './utils/storage';

const TestComponent = () => {
  const testCourses = () => {
    console.clear();
    console.log('🧪 ===== STARTING COURSES TEST =====');
    
    // Test 1: Check localStorage directly
    console.log('🧪 TEST 1: Checking localStorage directly...');
    try {
      const raw = localStorage.getItem('hausaStem_courses');
      console.log('🧪 Raw localStorage value:', raw);
      console.log('🧪 Type of raw value:', typeof raw);
    } catch (error) {
      console.error('🧪 Error accessing localStorage:', error);
    }
    
    // Test 2: Call getCourses
    console.log('🧪 TEST 2: Calling getCourses()...');
    const courses = getCourses();
    console.log('🧪 getCourses() result:', courses);
    console.log('🧪 Type of result:', typeof courses);
    console.log('🧪 Is null?', courses === null);
    console.log('🧪 Is undefined?', courses === undefined);
    
    // Test 3: Test Object.entries directly
    console.log('🧪 TEST 3: Testing Object.entries directly...');
    try {
      const entries = Object.entries(courses);
      console.log('🧪 Object.entries SUCCESS:', entries);
    } catch (error) {
      console.error('🧪 Object.entries FAILED:', error);
      console.error('🧪 Error details:', error.message);
    }
    
    // Test 4: Test safe function
    console.log('🧪 TEST 4: Testing safe function...');
    const safeEntries = safeObjectEntries(courses);
    console.log('🧪 safeObjectEntries result:', safeEntries);
    
    // Test 5: Initialize storage if needed
    console.log('🧪 TEST 5: Initializing storage...');
    initializeStorage();
    console.log('🧪 Storage initialized');
    
    console.log('🧪 ===== TEST COMPLETE =====');
  };

  const safeObjectEntries = (obj) => {
    console.log('🔧 safeObjectEntries called with:', obj);
    try {
      if (obj === null || obj === undefined) {
        console.log('🔧 Input is null/undefined, returning empty array');
        return [];
      }
      if (typeof obj !== 'object') {
        console.log('🔧 Input is not an object, returning empty array');
        return [];
      }
      const entries = Object.entries(obj);
      console.log('🔧 safeObjectEntries success');
      return entries;
    } catch (err) {
      console.error('🔧 safeObjectEntries error:', err);
      return [];
    }
  };

  React.useEffect(() => {
    testCourses();
  }, []);

  const resetStorage = () => {
    console.log('🔄 Resetting storage...');
    localStorage.removeItem('hausaStem_courses');
    localStorage.removeItem('hausaStem_students');
    localStorage.removeItem('hausaStem_users');
    console.log('✅ Storage reset');
    testCourses();
  };

  return (
    <div style={{ padding: '20px', background: '#f0f0f0', fontFamily: 'Arial' }}>
      <h2>🧪 Debug Test Component</h2>
      <button onClick={testCourses} style={{ padding: '10px', margin: '5px' }}>
        Run Test Again
      </button>
      <button onClick={resetStorage} style={{ padding: '10px', margin: '5px', background: '#ff4444' }}>
        Reset Storage
      </button>
      <p>Check browser console for detailed results</p>
    </div>
  );
};

export default TestComponent;