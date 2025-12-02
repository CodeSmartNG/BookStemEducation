import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  disabled, 
  className = '', 
  fullWidth = false,
  type = 'button',
  ...props 
}) => {
  const baseClasses = 'btn';
  const widthClass = fullWidth ? 'btn-full-width' : '';
  const disabledClass = disabled ? 'btn-disabled' : '';
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${widthClass} ${disabledClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;