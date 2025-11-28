import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-brand-slate mb-2">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-3.5 rounded-xl border-2 ${
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
            : 'border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary-soft'
        } focus:outline-none transition-all bg-white text-brand-slate placeholder:text-gray-400 ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-brand-danger">{error}</p>
      )}
    </div>
  );
};

