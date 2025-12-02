import React from 'react';

const Loader = ({ size = 'medium', color = 'currentColor' }) => {
  const sizeClass = `loader-${size}`;
  
  return (
    <div className={`loader ${sizeClass}`}>
      <div className="loader-spinner" style={{ borderColor: color }}></div>
    </div>
  );
};

export default Loader;