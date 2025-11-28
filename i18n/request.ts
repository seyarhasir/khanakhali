import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const locales = ['en', 'fa'] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ requestLocale }) => {
  // Get locale from request, fallback to default
  let locale = await requestLocale;
  
  // Validate locale
  if (!locale || !locales.includes(locale as Locale)) {
    locale = 'fa'; // Default fallback
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});

