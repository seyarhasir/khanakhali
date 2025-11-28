import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Analytics } from '@vercel/analytics/next';
import { locales } from '@/i18n/request';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { LocalePreserver } from '@/components/layout/LocalePreserver';
import { ToastProvider } from '@/components/ui/Toast';
import { ConfirmDialogProvider } from '@/components/ui/ConfirmDialog';
import type { Locale } from '@/i18n/request';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const { locale } = await Promise.resolve(params);
  
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  const messages = await getMessages({ locale });

  return (
    <html lang={locale} dir={locale === 'fa' ? 'rtl' : 'ltr'}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Run IMMEDIATELY before React hydrates to catch back navigation
                try {
                  const cookieMatch = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
                  const cookieLocale = cookieMatch ? cookieMatch[1] : null;
                  const currentPath = window.location.pathname;
                  const locales = ['en', 'fa'];
                  
                  if (cookieLocale && locales.includes(cookieLocale)) {
                    const pathLocale = locales.find(loc => 
                      currentPath.startsWith('/' + loc + '/') || currentPath === '/' + loc
                    );
                    
                    // If path locale doesn't match cookie, fix it immediately
                    if (!pathLocale || pathLocale !== cookieLocale) {
                      let pathWithoutLocale = currentPath;
                      for (const loc of locales) {
                        if (pathWithoutLocale.startsWith('/' + loc + '/')) {
                          pathWithoutLocale = pathWithoutLocale.slice(('/' + loc).length);
                          break;
                        } else if (pathWithoutLocale === '/' + loc) {
                          pathWithoutLocale = '/';
                          break;
                        }
                      }
                      const newPath = pathWithoutLocale === '/' ? '/' + cookieLocale : '/' + cookieLocale + pathWithoutLocale;
                      if (window.location.pathname !== newPath) {
                        window.location.replace(newPath);
                      }
                    }
                  }
                } catch(e) {
                  // Silently fail if there's an error
                }
              })();
            `,
          }}
        />
      </head>
      <body className="overflow-x-hidden">
        <NextIntlClientProvider messages={messages}>
          <ToastProvider>
            <ConfirmDialogProvider>
              <AuthProvider>
                <LocalePreserver locale={locale} />
                <Navbar />
                <main className="overflow-x-hidden">
                  {children}
                </main>
                <Footer />
              </AuthProvider>
            </ConfirmDialogProvider>
          </ToastProvider>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}

