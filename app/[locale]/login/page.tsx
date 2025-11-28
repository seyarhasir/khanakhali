'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { authService } from '@/lib/services/auth.service';
import { useAuthStore } from '@/lib/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });

  const validateForm = (): boolean => {
    const newErrors = { email: '', password: '' };
    let isValid = true;

    if (!email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
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
      
      // Redirect based on role
      if (user.role === 'admin') {
        router.push(`/${locale}/admin`);
      } else {
        router.push(`/${locale}`);
      }
    } catch (error: any) {
      setErrors({ email: '', password: error.message || 'Failed to sign in' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-primary-soft rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-brand-slate mb-2">{t('auth.signInTitle')}</h1>
          <p className="text-brand-gray">{t('auth.signInSubtitle')}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <Input
            label={t('auth.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            placeholder={t('auth.email')}
            disabled={isLoading}
          />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-brand-slate">
                {t('auth.password')}
              </label>
              <Link
                href={`/${locale}/forgot-password`}
                className="text-sm text-brand-primary hover:underline font-medium"
              >
                {t('auth.forgotPassword')}
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-3.5 rounded-xl border-2 ${
                errors.password
                  ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                  : 'border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary-soft'
              } focus:outline-none transition-all bg-white text-brand-slate placeholder:text-gray-400`}
              placeholder="Enter your password"
              disabled={isLoading}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-brand-danger">{errors.password}</p>
            )}
          </div>

          <Button type="submit" fullWidth disabled={isLoading} className="mt-8">
            {isLoading ? t('auth.signingIn') : t('auth.signIn')}
          </Button>
        </form>

        <p className="mt-8 text-center text-brand-gray">
          {t('auth.dontHaveAccount')}{' '}
          <Link href={`/${locale}/signup`} className="text-brand-primary font-semibold hover:underline">
            {t('common.signUp')}
          </Link>
        </p>
        <p className="mt-4 text-center text-brand-gray">
          <Link href={`/${locale}`} className="text-brand-primary font-semibold hover:underline inline-flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('auth.backToHome')}
          </Link>
        </p>
      </div>
    </div>
  );
}

