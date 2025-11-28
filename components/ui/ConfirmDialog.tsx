'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface ConfirmDialogContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | undefined>(undefined);

export const useConfirm = () => {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmDialogProvider');
  }
  return context;
};

export const ConfirmDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);

    return new Promise<boolean>((resolve) => {
      setResolvePromise(() => resolve);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (resolvePromise) {
      resolvePromise(true);
    }
    setIsOpen(false);
    setOptions(null);
    setResolvePromise(null);
  }, [resolvePromise]);

  const handleCancel = useCallback(() => {
    if (resolvePromise) {
      resolvePromise(false);
    }
    setIsOpen(false);
    setOptions(null);
    setResolvePromise(null);
  }, [resolvePromise]);

  const getTypeStyles = () => {
    switch (options?.type) {
      case 'danger':
        return {
          icon: <AlertTriangle className="w-12 h-12 text-red-600" />,
          confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
          bgClass: 'bg-red-50',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-12 h-12 text-yellow-600" />,
          confirmClass: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          bgClass: 'bg-yellow-50',
        };
      case 'info':
      default:
        return {
          icon: <CheckCircle className="w-12 h-12 text-blue-600" />,
          confirmClass: 'bg-brand-primary hover:bg-brand-primary/90 text-white',
          bgClass: 'bg-blue-50',
        };
    }
  };

  if (!isOpen || !options) return <ConfirmDialogContext.Provider value={{ confirm }}>{children}</ConfirmDialogContext.Provider>;

  const styles = getTypeStyles();

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[9998] animate-fade-in"
        onClick={handleCancel}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-scale-in">
          {/* Header */}
          <div className={`${styles.bgClass} p-6 rounded-t-xl flex items-center justify-between`}>
            <div className="flex items-center gap-4">
              {styles.icon}
              <h3 className="text-xl font-bold text-brand-slate">{options.title}</h3>
            </div>
            <button
              onClick={handleCancel}
              className="text-brand-gray hover:text-brand-slate transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            <p className="text-brand-gray leading-relaxed">{options.message}</p>
          </div>

          {/* Footer */}
          <div className="p-6 bg-gray-50 rounded-b-xl flex gap-3 justify-end">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="px-6"
            >
              {options.cancelText || 'Cancel'}
            </Button>
            <Button
              onClick={handleConfirm}
              className={`px-6 ${styles.confirmClass}`}
            >
              {options.confirmText || 'Confirm'}
            </Button>
          </div>
        </div>
      </div>
    </ConfirmDialogContext.Provider>
  );
};

