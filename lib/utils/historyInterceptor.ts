/**
 * History API Interceptor
 * 
 * Overrides browser history methods to ensure URLs always match the preferred locale
 * before they enter the browser history. This prevents wrong-locale URLs from
 * being stored in history, which causes language changes on back navigation.
 */

const locales = ['en', 'fa'] as const;

/**
 * Get the preferred locale from cookie or sessionStorage
 */
function getPreferredLocale(): string {
  if (typeof window === 'undefined') return 'fa';
  
  // Check cookie first (most reliable)
  const cookieMatch = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
  if (cookieMatch && locales.includes(cookieMatch[1] as typeof locales[number])) {
    return cookieMatch[1];
  }
  
  // Fallback to sessionStorage
  const sessionLocale = sessionStorage.getItem('preferredLocale');
  if (sessionLocale && locales.includes(sessionLocale as typeof locales[number])) {
    return sessionLocale;
  }
  
  return 'fa'; // Default
}

/**
 * Extract locale from pathname
 */
function getLocaleFromPath(pathname: string): string | null {
  return locales.find(
    (loc) => pathname.startsWith(`/${loc}/`) || pathname === `/${loc}`
  ) || null;
}

/**
 * Normalize a pathname to include the preferred locale
 */
function normalizePathWithLocale(pathname: string, preferredLocale: string): string {
  // Remove any existing locale
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
  
  // Add preferred locale
  if (pathWithoutLocale === '/') {
    return `/${preferredLocale}`;
  }
  return `/${preferredLocale}${pathWithoutLocale}`;
}

/**
 * Check if this is an intentional locale switch
 */
function isIntentionalLocaleSwitch(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem('INTENTIONAL_LOCALE_SWITCH') === 'true';
}

/**
 * Clear the intentional locale switch flag
 */
function clearIntentionalLocaleSwitch(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('INTENTIONAL_LOCALE_SWITCH');
}

let isIntercepting = false;

/**
 * Initialize history API interception
 */
export function initHistoryInterceptor(): () => void {
  if (typeof window === 'undefined') return () => {};
  if (isIntercepting) return () => {}; // Already initialized
  
  isIntercepting = true;
  
  // Store original methods
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  const originalBack = history.back;
  const originalForward = history.forward;
  const originalGo = history.go;
  
  // Override pushState
  history.pushState = function(
    state: any,
    title: string,
    url?: string | URL | null
  ) {
    if (!url) {
      return originalPushState.call(this, state, title, url);
    }
    
    const urlString = typeof url === 'string' ? url : url.pathname;
    const pathname = new URL(urlString, window.location.origin).pathname;
    const preferredLocale = getPreferredLocale();
    const pathLocale = getLocaleFromPath(pathname);
    
    // If intentional switch, allow it but clear the flag
    if (isIntentionalLocaleSwitch()) {
      clearIntentionalLocaleSwitch();
      return originalPushState.call(this, state, title, url);
    }
    
    // If path already has correct locale, proceed normally
    if (pathLocale === preferredLocale) {
      return originalPushState.call(this, state, title, url);
    }
    
    // Normalize URL to preferred locale
    const normalizedPath = normalizePathWithLocale(pathname, preferredLocale);
    const normalizedUrl = typeof url === 'string' 
      ? normalizedPath + (url.includes('?') ? url.substring(url.indexOf('?')) : '')
      : normalizedPath;
    
    return originalPushState.call(this, state, title, normalizedUrl);
  };
  
  // Override replaceState
  history.replaceState = function(
    state: any,
    title: string,
    url?: string | URL | null
  ) {
    if (!url) {
      return originalReplaceState.call(this, state, title, url);
    }
    
    const urlString = typeof url === 'string' ? url : url.pathname;
    const pathname = new URL(urlString, window.location.origin).pathname;
    const preferredLocale = getPreferredLocale();
    const pathLocale = getLocaleFromPath(pathname);
    
    // If intentional switch, allow it but clear the flag
    if (isIntentionalLocaleSwitch()) {
      clearIntentionalLocaleSwitch();
      return originalReplaceState.call(this, state, title, url);
    }
    
    // If path already has correct locale, proceed normally
    if (pathLocale === preferredLocale) {
      return originalReplaceState.call(this, state, title, url);
    }
    
    // Normalize URL to preferred locale
    const normalizedPath = normalizePathWithLocale(pathname, preferredLocale);
    const normalizedUrl = typeof url === 'string'
      ? normalizedPath + (url.includes('?') ? url.substring(url.indexOf('?')) : '')
      : normalizedPath;
    
    return originalReplaceState.call(this, state, title, normalizedUrl);
  };
  
  // Override back() to check locale before navigating
  history.back = function() {
    const preferredLocale = getPreferredLocale();
    const currentPath = window.location.pathname;
    const currentLocale = getLocaleFromPath(currentPath);
    
    // If current locale doesn't match preferred, fix it first
    if (currentLocale && currentLocale !== preferredLocale) {
      const normalizedPath = normalizePathWithLocale(currentPath, preferredLocale);
      history.replaceState(null, '', normalizedPath);
    }
    
    return originalBack.call(this);
  };
  
  // Override forward() similarly
  history.forward = function() {
    const preferredLocale = getPreferredLocale();
    const currentPath = window.location.pathname;
    const currentLocale = getLocaleFromPath(currentPath);
    
    if (currentLocale && currentLocale !== preferredLocale) {
      const normalizedPath = normalizePathWithLocale(currentPath, preferredLocale);
      history.replaceState(null, '', normalizedPath);
    }
    
    return originalForward.call(this);
  };
  
  // Override go() similarly
  history.go = function(delta?: number) {
    const preferredLocale = getPreferredLocale();
    const currentPath = window.location.pathname;
    const currentLocale = getLocaleFromPath(currentPath);
    
    if (currentLocale && currentLocale !== preferredLocale) {
      const normalizedPath = normalizePathWithLocale(currentPath, preferredLocale);
      history.replaceState(null, '', normalizedPath);
    }
    
    return originalGo.call(this, delta);
  };
  
  // Intercept popstate events to fix locale before navigation completes
  // BUT be very careful not to interfere with normal back navigation, especially filter pages
  const handlePopState = (e: PopStateEvent) => {
    // Use a delay to let navigation complete first
    setTimeout(() => {
      const preferredLocale = getPreferredLocale();
      const currentPath = window.location.pathname;
      const currentSearch = window.location.search; // Preserve query params
      const currentLocale = getLocaleFromPath(currentPath);
      
      // CRITICAL: Don't interfere with filter pages (pages with query params) at all
      // These are normal navigation and should work without interference
      if (currentSearch) {
        return; // Let filter navigation work normally
      }
      
      // Only fix locale if:
      // 1. Current path has a locale
      // 2. That locale doesn't match preferred locale
      // 3. The path is not /login (to avoid interfering with auth flows)
      if (currentLocale && 
          currentLocale !== preferredLocale && 
          !currentPath.includes('/login')) {
        const normalizedPath = normalizePathWithLocale(currentPath, preferredLocale);
        const newUrl = normalizedPath + currentSearch;
        window.location.replace(newUrl);
      }
    }, 100); // Longer delay to ensure browser navigation completes fully
  };
  
  window.addEventListener('popstate', handlePopState, true);
  
  // Return cleanup function
  return () => {
    isIntercepting = false;
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
    history.back = originalBack;
    history.forward = originalForward;
    history.go = originalGo;
    window.removeEventListener('popstate', handlePopState, true);
  };
}

/**
 * Set flag for intentional locale switch
 */
export function setIntentionalLocaleSwitch(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('INTENTIONAL_LOCALE_SWITCH', 'true');
  // Auto-clear after 2 seconds as safety
  setTimeout(() => {
    clearIntentionalLocaleSwitch();
  }, 2000);
}

