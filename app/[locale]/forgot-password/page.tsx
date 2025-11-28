'use client';

import React, { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { authService } from '@/lib/services/auth.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ForgotPasswordPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (): boolean => {
    if (!email.trim()) {
      setError(t('auth.email') + ' is required');
      return false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail()) return;

    setIsLoading(true);
    setError('');
    try {
      await authService.sendPasswordReset(email);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email');
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-brand-slate mb-2">{t('forgotPassword.title')}</h1>
          <p className="text-brand-gray">
            {isSuccess
              ? t('forgotPassword.checkInbox')
              : t('forgotPassword.subtitle')}
          </p>
        </div>

        {isSuccess ? (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-brand-slate mb-2">{t('forgotPassword.emailSent')}</h2>
              <p className="text-brand-gray mb-4">
                {t('forgotPassword.checkEmail')} <strong>{email}</strong>
              </p>
              <p className="text-sm text-brand-gray">
                {t('forgotPassword.checkInbox')}
              </p>
            </div>
            <div className="pt-4 space-y-3">
              <Link href={`/${locale}/login`}>
                <Button fullWidth>{t('common.back')} to {t('common.signIn')}</Button>
              </Link>
              <button
                onClick={() => {
                  setIsSuccess(false);
                  setEmail('');
                }}
                className="text-sm text-brand-primary hover:underline"
              >
                {t('forgotPassword.sendAnother')}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label={t('auth.email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
              placeholder={t('auth.email')}
              disabled={isLoading}
            />

            <Button type="submit" fullWidth disabled={isLoading} className="mt-8">
              {isLoading ? t('forgotPassword.sending') : t('forgotPassword.sendResetLink')}
            </Button>
          </form>
        )}

        <p className="mt-8 text-center text-brand-gray">
          <Link href={`/${locale}/login`} className="text-brand-primary font-semibold hover:underline inline-flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('common.back')} to {t('common.signIn')}
          </Link>
        </p>
      </div>
    </div>
  );
}
