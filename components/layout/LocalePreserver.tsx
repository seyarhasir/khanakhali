'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { locales } from '@/i18n/request';
import { initHistoryInterceptor } from '@/lib/utils/historyInterceptor';

interface LocalePreserverProps {
  locale: string;
}

export function LocalePreserver({ locale }: LocalePreserverProps) {
  const router = useRouter();
  const pathname = usePathname();
  const localeRef = useRef(locale);
  const isFixingLocale = useRef(false);

  // Update ref when locale changes
  useEffect(() => {
    localeRef.current = locale;
  }, [locale]);

  // Initialize history interceptor on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const cleanup = initHistoryInterceptor();
    return cleanup;
  }, []);

  // Set cookie immediately on every render to ensure it's always current
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Always update cookie immediately - this is critical
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    sessionStorage.setItem('preferredLocale', locale);
  }, [locale]);

  // Function to check and fix locale mismatch - use useCallback to keep reference stable
  const checkAndFixLocale = useCallback(() => {
    if (isFixingLocale.current) return;
    if (typeof window === 'undefined') return;
    
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search; // Preserve query params
    const cookieMatch = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
    const cookieLocale = cookieMatch?.[1];
    
    // Only fix if we have a cookie
    if (cookieLocale && locales.includes(cookieLocale as typeof locales[number])) {
      const pathLocale = locales.find(
        (loc) => currentPath.startsWith(`/${loc}/`) || currentPath === `/${loc}`
      );
      
      // If path has no locale OR path has different locale than cookie, fix it
      // BUT don't interfere with paths that have query params (filter pages) unless locale is wrong
      if (!pathLocale || pathLocale !== cookieLocale) {
        // Skip if we're on login page to avoid interfering with auth flows
        if (currentPath.includes('/login')) {
          return;
        }
        
        isFixingLocale.current = true;
        
        // Build correct path with cookie locale
        let pathWithoutLocale = currentPath;
        for (const loc of locales) {
          if (pathWithoutLocale.startsWith(`/${loc}/`)) {
            pathWithoutLocale = pathWithoutLocale.slice(`/${loc}`.length);
            break;
          } else if (pathWithoutLocale === `/${loc}`) {
            pathWithoutLocale = '/';
            break;
          }
        }
        
        const newPath = pathWithoutLocale === '/' ? `/${cookieLocale}` : `/${cookieLocale}${pathWithoutLocale}`;
        const newUrl = newPath + currentSearch; // Preserve query params
        
        if (window.location.pathname + window.location.search !== newUrl) {
          // Use window.location.replace for immediate, synchronous redirect
          // This prevents the page from rendering with wrong locale
          window.location.replace(newUrl);
          return;
        }
        
        isFixingLocale.current = false;
      }
    }
  }, []);

  // Handle browser back/forward buttons (including gesture navigation)
  // NOTE: The historyInterceptor already handles popstate, so we don't need to duplicate it here
  // We only check on mount, not on navigation to avoid interfering with back navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check immediately on mount only
    checkAndFixLocale();
  }, []); // Only on mount - don't interfere with navigation

  return null;
}
