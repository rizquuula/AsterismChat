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
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-black focus:ring-offset-white';
  
  const variantStyles = {
    primary: 'dark:bg-blue-500 bg-blue-500 text-white hover:dark:bg-blue-400 hover:bg-blue-600 focus:ring-blue-500 disabled:dark:bg-blue-500/50 disabled:bg-blue-500/50',
    secondary: 'dark:bg-gray-800 bg-gray-100 dark:text-white text-gray-900 hover:dark:bg-gray-700 hover:bg-gray-200 focus:ring-gray-500 disabled:dark:bg-gray-800/50 disabled:bg-gray-100/50',
    danger: 'dark:bg-red-500 bg-red-500 text-white hover:dark:bg-red-400 hover:bg-red-600 focus:ring-red-500 disabled:dark:bg-red-500/50 disabled:bg-red-500/50',
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