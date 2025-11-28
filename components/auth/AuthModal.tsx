'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { authService } from '@/lib/services/auth.service';
import { useAuthStore } from '@/lib/store/authStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (mode === 'signup' && !displayName.trim()) {
      newErrors.displayName = t('auth.fullName') + ' ' + t('auth.required');
      isValid = false;
    }

    if (!email.trim()) {
      newErrors.email = t('auth.email') + ' ' + t('auth.required');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t('auth.invalidEmail');
      isValid = false;
    }

    if (!password) {
      newErrors.password = t('auth.password') + ' ' + t('auth.required');
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = t('auth.passwordMinLength');
      isValid = false;
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        newErrors.confirmPassword = t('auth.passwordsDoNotMatch');
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const user = await authService.signIn(email, password);
      setUser(user);
      onClose();
      
      if (user.role === 'admin') {
        router.push(`/${locale}/admin`);
      } else {
        router.push(`/${locale}`);
      }
      router.refresh();
    } catch (error: any) {
      setErrors({ password: error.message || t('auth.signInFailed') });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const user = await authService.signUp(email, password, displayName);
      setUser(user);
      onClose();
      router.push(`/${locale}`);
      router.refresh();
    } catch (error: any) {
      setErrors({ email: error.message || t('auth.signUpFailed') });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'facebook' | 'google') => {
    // TODO: Implement social login
    console.log(`Social login with ${provider}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors z-10"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8">
          {/* Social Login Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleSocialLogin('facebook')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-brand-primary text-brand-primary rounded-lg font-medium hover:bg-brand-primary-soft transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              {t('auth.continueWithFacebook')}
            </button>
            <button
              onClick={() => handleSocialLogin('google')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-brand-primary text-brand-primary rounded-lg font-medium hover:bg-brand-primary-soft transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t('auth.continueWithGoogle')}
            </button>
          </div>

          {/* OR Separator */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-600">{t('auth.or')}</span>
            </div>
          </div>

          {/* Login Form */}
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.email') + '*'}
                  className={`w-full px-4 py-3 rounded-lg border-2 ${
                    errors.email
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-200 focus:border-brand-primary'
                  } focus:outline-none transition-colors bg-white text-gray-700 placeholder:text-gray-400`}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.password') + '*'}
                  className={`w-full px-4 py-3 rounded-lg border-2 ${
                    errors.password
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-200 focus:border-brand-primary'
                  } focus:outline-none transition-colors bg-white text-gray-700 placeholder:text-gray-400`}
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 border-gray-300 rounded text-brand-primary focus:ring-brand-primary"
                  />
                  {t('auth.rememberMe')}
                </label>
                <Link
                  href={`/${locale}/forgot-password`}
                  onClick={onClose}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                {isLoading ? t('auth.signingIn') : t('auth.signIn')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t('auth.fullName') + '*'}
                  className={`w-full px-4 py-3 rounded-lg border-2 ${
                    errors.displayName
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-200 focus:border-brand-primary'
                  } focus:outline-none transition-colors bg-white text-gray-700 placeholder:text-gray-400`}
                  disabled={isLoading}
                />
                {errors.displayName && (
                  <p className="mt-1 text-sm text-red-500">{errors.displayName}</p>
                )}
              </div>

              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.email') + '*'}
                  className={`w-full px-4 py-3 rounded-lg border-2 ${
                    errors.email
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-200 focus:border-brand-primary'
                  } focus:outline-none transition-colors bg-white text-gray-700 placeholder:text-gray-400`}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.password') + '*'}
                  className={`w-full px-4 py-3 rounded-lg border-2 ${
                    errors.password
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-200 focus:border-brand-primary'
                  } focus:outline-none transition-colors bg-white text-gray-700 placeholder:text-gray-400`}
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              <div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('auth.confirmPassword') + '*'}
                  className={`w-full px-4 py-3 rounded-lg border-2 ${
                    errors.confirmPassword
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-200 focus:border-brand-primary'
                  } focus:outline-none transition-colors bg-white text-gray-700 placeholder:text-gray-400`}
                  disabled={isLoading}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                {isLoading ? t('auth.creatingAccount') : t('auth.signUp')}
              </button>
            </form>
          )}

          {/* Sign Up Section */}
          {mode === 'login' && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-center text-gray-700 font-medium mb-4">{t('auth.areYouNew')}</p>
              <button
                onClick={() => setMode('signup')}
                className="w-full px-4 py-3 bg-white border-2 border-brand-primary text-brand-primary rounded-lg font-medium hover:bg-brand-primary-soft transition-colors"
              >
                {t('auth.signUp')}
              </button>
            </div>
          )}

          {/* Sign In Section */}
          {mode === 'signup' && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-center text-gray-700 font-medium mb-4">{t('auth.alreadyHaveAccount')}</p>
              <button
                onClick={() => setMode('login')}
                className="w-full px-4 py-3 bg-white border-2 border-brand-primary text-brand-primary rounded-lg font-medium hover:bg-brand-primary-soft transition-colors"
              >
                {t('auth.signIn')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

