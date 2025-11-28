import createMiddleware from 'next-intl/middleware';
import { locales } from './i18n/request';
import { NextRequest, NextResponse } from 'next/server';

// Create the base next-intl middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: 'fa',
  localePrefix: 'always',
  localeDetection: false,
});

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Get locale from cookie (most reliable - set by client on every page)
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  
  // Check if pathname already has a locale prefix
  const hasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  
  // Extract locale from pathname if it exists
  const pathLocale = locales.find(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  
  // If no locale prefix, redirect using cookie or default
  if (!hasLocale) {
    // Always prioritize cookie over everything else
    const targetLocale = (cookieLocale && locales.includes(cookieLocale as typeof locales[number]))
      ? cookieLocale
      : 'fa';
      
    const redirectPath = pathname === '/' ? `/${targetLocale}` : `/${targetLocale}${pathname}`;
    const response = NextResponse.redirect(new URL(redirectPath, request.url));
    
    // Set cookie with detected locale
    response.cookies.set('NEXT_LOCALE', targetLocale, {
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
      sameSite: 'lax',
      httpOnly: false,
    });
    return response;
  }
  
  // Check if path locale matches cookie locale
  // If they don't match AND it's not an intentional switch (we can't check sessionStorage in middleware,
  // but the history interceptor will handle this client-side), redirect to cookie locale
  if (pathLocale && cookieLocale && locales.includes(cookieLocale as typeof locales[number])) {
    if (pathLocale !== cookieLocale) {
      // This might be a back navigation issue - redirect to cookie locale
      // The history interceptor should prevent this, but this is a server-side safety net
      let pathWithoutLocale = pathname;
      for (const loc of locales) {
        if (pathWithoutLocale.startsWith(`/${loc}/`)) {
          pathWithoutLocale = pathWithoutLocale.slice(`/${loc}`.length);
          break;
        } else if (pathWithoutLocale === `/${loc}`) {
          pathWithoutLocale = '/';
          break;
        }
      }
      const redirectPath = pathWithoutLocale === '/' ? `/${cookieLocale}` : `/${cookieLocale}${pathWithoutLocale}`;
      const response = NextResponse.redirect(new URL(redirectPath, request.url));
      response.cookies.set('NEXT_LOCALE', cookieLocale, {
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
        sameSite: 'lax',
        httpOnly: false,
      });
      return response;
    }
  }
  
  // Use next-intl middleware for paths with locale
  const response = intlMiddleware(request);
  
  // CRITICAL: Always set/update cookie with current locale on EVERY request
  // This ensures the cookie is always present for back navigation
  if (pathLocale) {
    // Always set cookie, even if it already exists - this ensures it's fresh
    response.cookies.set('NEXT_LOCALE', pathLocale, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
      sameSite: 'lax',
      httpOnly: false, // Allow client-side access
    });
  } else if (cookieLocale && locales.includes(cookieLocale as typeof locales[number])) {
    // Even if path doesn't have locale but cookie does, keep the cookie
    response.cookies.set('NEXT_LOCALE', cookieLocale, {
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
      sameSite: 'lax',
      httpOnly: false,
    });
  }
  
  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};

