'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { locales, type Locale } from '@/i18n/request';
import { setIntentionalLocaleSwitch } from '@/lib/utils/historyInterceptor';

const languageNames: Record<Locale, string> = {
  en: 'English',
  fa: 'فارسی',
};

export const LanguageSwitcher: React.FC = () => {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const isOpeningRef = useRef(false);

  const switchLocale = (newLocale: Locale) => {
    if (newLocale === locale) {
      setIsOpen(false);
      return;
    }
    
    // Set flag for intentional locale switch BEFORE updating cookie/navigation
    setIntentionalLocaleSwitch();
    
    // Update cookie immediately before navigation
    if (typeof window !== 'undefined') {
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
      sessionStorage.setItem('preferredLocale', newLocale);
    }
    
    // Remove current locale from pathname
    let pathWithoutLocale = pathname;
    for (const loc of locales) {
      pathWithoutLocale = pathWithoutLocale.replace(`/${loc}`, '');
    }
    if (!pathWithoutLocale || pathWithoutLocale === '') {
      pathWithoutLocale = '/';
    }
    
    // Add new locale
    router.push(`/${newLocale}${pathWithoutLocale}`);
    router.refresh();
    setIsOpen(false);
  };

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updatePosition = () => {
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          const dropdownWidth = 192; // w-48 = 192px
          const dropdownHeight = 80; // Approximate height for 2 items
          const spacing = 8;
          
          // Calculate right position (distance from right edge of viewport)
          // Since we're using fixed positioning, this is viewport-relative
          let right = viewportWidth - rect.right;
          
          // Ensure dropdown doesn't go off screen on the right
          if (right < spacing) {
            right = spacing;
          }
          
          // Ensure dropdown doesn't go off screen on the left
          if (right + dropdownWidth > viewportWidth) {
            right = viewportWidth - dropdownWidth - spacing;
          }
          
          // Calculate top position (viewport-relative for fixed positioning)
          let top = rect.bottom + spacing;
          
          // If dropdown would go off bottom of screen, show above button instead
          const spaceBelow = viewportHeight - rect.bottom;
          const spaceAbove = rect.top;
          
          if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
            // Show above button
            top = rect.top - dropdownHeight - spacing;
          } else if (spaceBelow < dropdownHeight) {
            // Not enough space above or below, position at bottom of viewport
            top = viewportHeight - dropdownHeight - spacing;
          }
          
          // Ensure dropdown doesn't go above viewport
          if (top < spacing) {
            top = spacing;
          }
          
          setDropdownPosition({ top, right });
        }
      };
      
      // Update position immediately
      updatePosition();
      
      // Update on scroll/resize with debounce
      let timeoutId: NodeJS.Timeout;
      const handleUpdate = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(updatePosition, 10);
      };
      
      window.addEventListener('scroll', handleUpdate, true);
      window.addEventListener('resize', handleUpdate);
      
      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('scroll', handleUpdate, true);
        window.removeEventListener('resize', handleUpdate);
      };
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) {
      isOpeningRef.current = false;
      return;
    }
    
    // Set flag when opening
    isOpeningRef.current = true;
    const openingTimeout = setTimeout(() => {
      isOpeningRef.current = false;
    }, 200);
    
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      // Don't close if we're still in the opening phase
      if (isOpeningRef.current) {
        return;
      }
      
      const target = event.target as Node;
      
      // Check if click is outside both button container and dropdown
      const isOutsideContainer = containerRef.current && !containerRef.current.contains(target);
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(target);
      
      if (isOutsideContainer && isOutsideDropdown) {
        setIsOpen(false);
      }
    };

    // Use a delay to avoid closing immediately when opening
    const timeoutId = setTimeout(() => {
      // Use capture phase to catch events early
      document.addEventListener('mousedown', handleClickOutside, true);
      document.addEventListener('touchstart', handleClickOutside, true);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(openingTimeout);
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
    };
  }, [isOpen]);

  return (
    <>
      <div className="relative" ref={containerRef}>
        <button
          ref={buttonRef}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          onMouseDown={(e) => {
            // Prevent dropdown from closing immediately when clicking button
            e.preventDefault();
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 text-white text-xs font-medium transition-colors h-8"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          <span>{locale.toUpperCase()}</span>
          <svg 
            className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div 
          ref={dropdownRef}
          className="fixed w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[9999]"
          style={{
            top: `${dropdownPosition.top}px`,
            right: `${dropdownPosition.right}px`,
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
        >
          {locales.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                switchLocale(loc);
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors touch-manipulation ${
                locale === loc
                  ? 'bg-brand-primary-soft text-brand-primary font-medium'
                  : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              {languageNames[loc]}
            </button>
          ))}
        </div>
      )}
    </>
  );
};
