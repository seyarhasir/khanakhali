import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  fullWidth = false,
  className = '',
  children,
  ...props
}) => {
  const baseStyles = 'px-6 py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md';
  
  const variants = {
    primary: 'bg-brand-primary text-white hover:bg-blue-600 active:scale-[0.98] hover:shadow-lg',
    secondary: 'bg-white text-brand-slate border-2 border-gray-200 hover:border-brand-primary hover:text-brand-primary active:scale-[0.98]',
    outline: 'border-2 border-brand-primary text-brand-primary hover:bg-brand-primary-soft active:scale-[0.98] bg-white',
    danger: 'bg-brand-danger text-white hover:bg-red-600 active:scale-[0.98] hover:shadow-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

