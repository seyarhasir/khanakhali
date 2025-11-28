'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { authService } from '@/lib/services/auth.service';
import { useAuthStore } from '@/lib/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SignupPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const validateForm = (): boolean => {
    const newErrors = {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    };
    let isValid = true;

    if (!formData.displayName.trim()) {
      newErrors.displayName = t('auth.fullName') + ' is required';
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = t('auth.email') + ' is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = t('auth.password') + ' is required';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const user = await authService.signUp(
        formData.email,
        formData.password,
        formData.displayName
      );
      setUser(user);
      router.push(`/${locale}`);
    } catch (error: any) {
      setErrors({
        displayName: '',
        email: error.message || 'Failed to create account',
        password: '',
        confirmPassword: '',
      });
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-brand-slate mb-2">{t('auth.signUpTitle')}</h1>
          <p className="text-brand-gray">{t('auth.signUpSubtitle')}</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          <Input
            label={t('auth.fullName')}
            type="text"
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            error={errors.displayName}
            placeholder={t('auth.fullName')}
            disabled={isLoading}
          />

          <Input
            label={t('auth.email')}
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
            placeholder={t('auth.email')}
            disabled={isLoading}
          />

          <Input
            label={t('auth.password')}
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={errors.password}
            placeholder={t('auth.password')}
            disabled={isLoading}
          />

          <Input
            label={t('auth.confirmPassword')}
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            error={errors.confirmPassword}
            placeholder={t('auth.confirmPassword')}
            disabled={isLoading}
          />

          <Button type="submit" fullWidth disabled={isLoading} className="mt-8">
            {isLoading ? t('auth.creatingAccount') : t('common.signUp')}
          </Button>
        </form>

        <p className="mt-8 text-center text-brand-gray">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link href={`/${locale}/login`} className="text-brand-primary font-semibold hover:underline">
            {t('common.signIn')}
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
