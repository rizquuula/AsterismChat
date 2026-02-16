import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#000000]';
  
  const variantStyles = {
    primary: 'bg-[#0A84FF] text-white hover:bg-[#409CFF] focus:ring-[#0A84FF] disabled:bg-[#0A84FF]/50',
    secondary: 'bg-[#2C2C2E] text-white hover:bg-[#3C3C3E] focus:ring-[#38383A] disabled:bg-[#2C2C2E]/50',
    danger: 'bg-[#FF453A] text-white hover:bg-[#FF6B60] focus:ring-[#FF453A] disabled:bg-[#FF453A]/50',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-[15px]',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}