'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useAuthStore } from '@/lib/store/authStore';
import { authService } from '@/lib/services/auth.service';
import { listingsService } from '@/lib/services/listings.service';
import { Button } from '../ui/Button';
import { LanguageSwitcher } from './LanguageSwitcher';
import { AuthModal } from '../auth/AuthModal';
import { Phone } from 'lucide-react';

export const Navbar: React.FC = () => {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await authService.signOut();
      logout();
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSearchById = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    const searchTerm = searchId.trim();

    try {
      let listing = null;
      
      // Check if search term looks like a propertyId (M1000 or AM1000 format)
      if (searchTerm.match(/^(?:M|AM)\d+$/i)) {
        listing = await listingsService.fetchListingByPropertyId(searchTerm.toUpperCase());
      }
      
      // If not found by propertyId, try Firestore document ID
      if (!listing) {
        listing = await listingsService.fetchListingById(searchTerm);
      }
      
      if (listing) {
        router.push(`/${locale}/listings/${listing.id}`);
        setSearchId('');
      } else {
        setSearchError('Property not found');
      }
    } catch (err: any) {
      setSearchError('Property not found');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <nav className="bg-brand-primary sticky top-0 z-50 shadow-lg relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16 md:h-20 gap-4">
          <Link href={`/${locale}`} className="flex items-center gap-2 sm:gap-3 h-full py-1 hover:opacity-80 transition-opacity flex-shrink-0">
            <img
              src="/home/manzil logo transparent update.png"
              alt="Asan Manzil Logo"
              className="h-10 sm:h-12 md:h-16 w-auto object-contain"
            />
            <span className="text-brand-secondary font-bold text-lg sm:text-xl md:text-2xl">
              {locale === 'fa' ? 'آسان منزل' : 'Asan Manzil'}
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6 flex-shrink-0">
            {/* Phone Number */}
            <a
              href="tel:+93799312771"
              className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg transition-all group"
            >
              <Phone className="w-4 h-4 text-white group-hover:text-brand-secondary transition-colors" />
              <span className="text-sm text-white font-medium group-hover:text-brand-secondary transition-colors" dir="ltr">
                {locale === 'fa' ? '+۹۳ ۷۹۹ ۳۱۲ ۷۷۱' : '+93 799 312 771'}
              </span>
            </a>
            
            {isAuthenticated ? (
              <>
                {(user?.role === 'admin' || user?.role === 'agent') && (
                  <Link
                    href={`/${locale}/admin`}
                    className="text-sm lg:text-base text-white hover:text-brand-secondary transition-colors font-medium"
                  >
                    {t('nav.dashboard')}
                  </Link>
                )}
                <Link
                  href={`/${locale}/favorites`}
                  className="text-sm lg:text-base text-white hover:text-brand-secondary transition-colors font-medium"
                >
                  {t('nav.savedHomes')}
                </Link>
                <Link
                  href={`/${locale}/profile`}
                  className="text-sm lg:text-base text-white hover:text-brand-secondary transition-colors font-medium"
                >
                  {t('nav.profile')}
                </Link>
                <LanguageSwitcher />
                {/* Search Property ID - Desktop */}
                <form onSubmit={handleSearchById} className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchId}
                      onChange={(e) => {
                        setSearchId(e.target.value);
                        setSearchError(null);
                      }}
                      placeholder={t('home.searchByIdPlaceholder')}
                      className="w-40 px-3 py-1.5 pr-8 rounded-lg border border-white/30 bg-white/10 text-white placeholder:text-white/70 focus:outline-none focus:border-white/50 focus:bg-white/20 transition-colors text-xs h-8"
                    />
                    <button
                      type="submit"
                      disabled={isSearching || !searchId.trim()}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors disabled:opacity-50"
                      aria-label="Search"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  </div>
                  {searchError && (
                    <span className="text-xs text-red-300 whitespace-nowrap">{searchError}</span>
                  )}
                </form>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-sm text-white border border-white/30 bg-transparent rounded-lg hover:bg-white/10 hover:border-white/50 transition-all font-medium"
                >
                  {t('common.logout')}
                </button>
              </>
            ) : (
              <>
                <LanguageSwitcher />
                {/* Search Property ID - Desktop */}
                <form onSubmit={handleSearchById} className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchId}
                      onChange={(e) => {
                        setSearchId(e.target.value);
                        setSearchError(null);
                      }}
                      placeholder={t('home.searchByIdPlaceholder')}
                      className="w-40 px-3 py-1.5 pr-8 rounded-lg border border-white/30 bg-white/10 text-white placeholder:text-white/70 focus:outline-none focus:border-white/50 focus:bg-white/20 transition-colors text-xs h-8"
                    />
                    <button
                      type="submit"
                      disabled={isSearching || !searchId.trim()}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors disabled:opacity-50"
                      aria-label="Search"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  </div>
                  {searchError && (
                    <span className="text-xs text-red-300 whitespace-nowrap">{searchError}</span>
                  )}
                </form>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="p-2 rounded-lg text-white hover:bg-white/20 transition-colors"
                  aria-label="Sign in"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-white hover:bg-white/20 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/20 py-4 space-y-3">
            {/* Phone Number - Mobile */}
            <a
              href="tel:+93799312771"
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg transition-all mx-4"
            >
              <Phone className="w-5 h-5 text-white" />
              <span className="text-sm text-white font-medium" dir="ltr">
                {locale === 'fa' ? '+۹۳ ۷۹۹ ۳۱۲ ۷۷۱' : '+93 799 312 771'}
              </span>
            </a>
            
            {/* Language and Auth Icons - Top of Mobile Menu */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-white/20">
              <LanguageSwitcher />
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-sm text-white border border-white/30 bg-transparent rounded-lg hover:bg-white/10 hover:border-white/50 transition-all font-medium"
                >
                  {t('common.logout')}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsAuthModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="p-2 rounded-lg text-white hover:bg-white/20 transition-colors"
                  aria-label="Sign in"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
              )}
            </div>

            {/* Search Property ID - Mobile */}
            <form onSubmit={handleSearchById} className="px-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchId}
                  onChange={(e) => {
                    setSearchId(e.target.value);
                    setSearchError(null);
                  }}
                  placeholder={t('home.searchByIdPlaceholder')}
                  className="w-full px-3 py-1.5 pr-8 rounded-lg border border-white/30 bg-white/10 text-white placeholder:text-white/70 focus:outline-none focus:border-white/50 focus:bg-white/20 transition-colors text-xs h-8"
                />
                <button
                  type="submit"
                  disabled={isSearching || !searchId.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors disabled:opacity-50"
                  aria-label="Search"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
              {searchError && (
                <p className="mt-2 text-xs text-red-300">{searchError}</p>
              )}
            </form>

            {/* Navigation Links */}
            {isAuthenticated && (
              <>
                {(user?.role === 'admin' || user?.role === 'agent') && (
                  <Link
                    href={`/${locale}/admin`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-2 text-white hover:text-brand-secondary hover:bg-white/10 rounded-lg transition-colors font-medium"
                  >
                    {t('nav.dashboard')}
                  </Link>
                )}
                <Link
                  href={`/${locale}/favorites`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-2 text-white hover:text-brand-secondary hover:bg-white/10 rounded-lg transition-colors font-medium"
                >
                  {t('nav.savedHomes')}
                </Link>
                <Link
                  href={`/${locale}/profile`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-2 text-white hover:text-brand-secondary hover:bg-white/10 rounded-lg transition-colors font-medium"
                >
                  {t('nav.profile')}
                </Link>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
      />
    </nav>
  );
};

