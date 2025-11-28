'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Smartphone, Mail, Phone, MapPin, ChevronDown } from 'lucide-react';

export const Footer: React.FC = () => {
  const t = useTranslations();
  const locale = useLocale();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    quickLinks: false,
    about: false,
    support: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <footer className="bg-brand-navy text-white">
      {/* Download App Section */}
      <div className="bg-gradient-to-r from-brand-primary to-brand-secondary py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {locale === 'fa' ? (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
              <div className="text-right flex-1" dir="rtl" style={{ direction: 'rtl', textAlign: 'right', unicodeBidi: 'embed' }}>
                <div className="mb-2 md:mb-3" dir="rtl">
                  <h3 className="text-xl md:text-2xl font-bold text-right" dir="rtl" style={{ direction: 'rtl', textAlign: 'right' }}>
                    {t('footer.downloadApp')}
                  </h3>
                </div>
                <p className="text-white/90 text-sm md:text-base text-right" dir="rtl" style={{ direction: 'rtl', textAlign: 'right' }}>
                  {t('footer.downloadAppDescription')}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:flex-row-reverse" dir="ltr">
                <a
                  href="#"
                  className="inline-flex items-center justify-center px-4 py-2 bg-black rounded-lg hover:bg-gray-900 transition-all shadow-md hover:shadow-lg flex-row-reverse"
                  aria-label="Download on App Store"
                >
                  <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C1.79 15.25 2.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  <div className="text-right">
                    <div className="text-xs leading-tight">Download on the</div>
                    <div className="text-base font-semibold leading-tight">App Store</div>
                  </div>
                </a>
                <a
                  href="#"
                  className="inline-flex items-center justify-center px-4 py-2 bg-black rounded-lg hover:bg-gray-900 transition-all shadow-md hover:shadow-lg flex-row-reverse"
                  aria-label="Get it on Google Play"
                >
                  <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  <div className="text-right">
                    <div className="text-xs leading-tight">Get it on</div>
                    <div className="text-base font-semibold leading-tight">Google Play</div>
                  </div>
                </a>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
              <div className="text-center md:text-left flex-1">
                <div className="mb-2 md:mb-3">
                  <h3 className="text-xl md:text-2xl font-bold text-center md:text-left">
                    {t('footer.downloadApp')}
                  </h3>
                </div>
                <p className="text-white/90 text-sm md:text-base text-left max-w-2xl">
                  {t('footer.downloadAppDescription')}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="#"
                  className="inline-flex items-center justify-center px-4 py-2 bg-black rounded-lg hover:bg-gray-900 transition-all shadow-md hover:shadow-lg"
                  aria-label="Download on App Store"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C1.79 15.25 2.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-xs leading-tight">Download on the</div>
                    <div className="text-base font-semibold leading-tight">App Store</div>
                  </div>
                </a>
                <a
                  href="#"
                  className="inline-flex items-center justify-center px-4 py-2 bg-black rounded-lg hover:bg-gray-900 transition-all shadow-md hover:shadow-lg"
                  aria-label="Get it on Google Play"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-xs leading-tight">Get it on</div>
                    <div className="text-base font-semibold leading-tight">Google Play</div>
                  </div>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Link href={`/${locale}`} className="flex items-center gap-2 sm:gap-3 mb-4 hover:opacity-80 transition-opacity">
              <img
                src="/home/manzil logo transparent update.png"
                alt="Asan Manzil Logo"
                className="h-10 sm:h-12 md:h-14 w-auto object-contain"
              />
              <span className="text-brand-secondary font-bold text-lg sm:text-xl md:text-2xl">
                {locale === 'fa' ? 'آسان منزل' : 'Asan Manzil'}
              </span>
            </Link>
            <p className="text-white/80 text-sm md:text-base mb-4">
              {t('footer.tagline')}
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 text-white/80">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{t('footer.address')}</span>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{t('footer.phone')}</span>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{t('footer.email')}</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <button
              onClick={() => toggleSection('quickLinks')}
              className="md:pointer-events-none w-full flex items-center justify-between text-base font-semibold mb-3 md:mb-3"
            >
              <span>{t('footer.quickLinks')}</span>
              <ChevronDown
                className={`w-5 h-5 md:hidden transition-transform ${
                  openSections.quickLinks ? 'rotate-180' : ''
                }`}
              />
            </button>
            <ul
              className={`space-y-2 transition-all duration-300 overflow-hidden ${
                openSections.quickLinks ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 md:max-h-96 md:opacity-100'
              }`}
            >
              <li>
                <Link href={`/${locale}`} className="text-white/80 hover:text-white transition-colors text-sm md:text-base">
                  {t('footer.home')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}#listings`} className="text-white/80 hover:text-white transition-colors text-sm md:text-base">
                  {t('footer.properties')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/favorites`} className="text-white/80 hover:text-white transition-colors text-sm md:text-base">
                  {t('footer.favorites')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/profile`} className="text-white/80 hover:text-white transition-colors text-sm md:text-base">
                  {t('footer.profile')}
                </Link>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <button
              onClick={() => toggleSection('about')}
              className="md:pointer-events-none w-full flex items-center justify-between text-base font-semibold mb-3 md:mb-3"
            >
              <span>{t('footer.about')}</span>
              <ChevronDown
                className={`w-5 h-5 md:hidden transition-transform ${
                  openSections.about ? 'rotate-180' : ''
                }`}
              />
            </button>
            <ul
              className={`space-y-2 transition-all duration-300 overflow-hidden ${
                openSections.about ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 md:max-h-96 md:opacity-100'
              }`}
            >
              <li>
                <Link href={`/${locale}/about`} className="text-white/80 hover:text-white transition-colors text-sm md:text-base">
                  {t('footer.aboutUs')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/contact`} className="text-white/80 hover:text-white transition-colors text-sm md:text-base">
                  {t('footer.contactUs')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/terms`} className="text-white/80 hover:text-white transition-colors text-sm md:text-base">
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/privacy`} className="text-white/80 hover:text-white transition-colors text-sm md:text-base">
                  {t('footer.privacy')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <button
              onClick={() => toggleSection('support')}
              className="md:pointer-events-none w-full flex items-center justify-between text-base font-semibold mb-3 md:mb-3"
            >
              <span>{t('footer.support')}</span>
              <ChevronDown
                className={`w-5 h-5 md:hidden transition-transform ${
                  openSections.support ? 'rotate-180' : ''
                }`}
              />
            </button>
            <ul
              className={`space-y-2 transition-all duration-300 overflow-hidden ${
                openSections.support ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 md:max-h-96 md:opacity-100'
              }`}
            >
              <li>
                <Link href={`/${locale}/help`} className="text-white/80 hover:text-white transition-colors text-sm md:text-base">
                  {t('footer.helpCenter')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/faq`} className="text-white/80 hover:text-white transition-colors text-sm md:text-base">
                  {t('footer.faq')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/support`} className="text-white/80 hover:text-white transition-colors text-sm md:text-base">
                  {t('footer.customerSupport')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 mt-6 pt-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/60 text-sm text-center md:text-left">
              {t('footer.copyright')}
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-white/60 hover:text-white transition-colors text-sm">
                {t('footer.terms')}
              </a>
              <a href="#" className="text-white/60 hover:text-white transition-colors text-sm">
                {t('footer.privacy')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

