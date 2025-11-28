'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';
import { listingsService } from '@/lib/services/listings.service';
import { Listing } from '@/lib/types/listing.types';
import { ListingCard } from '@/components/listings/ListingCard';
import { Button } from '@/components/ui/Button';

export default function FavoritesPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { isAuthenticated, favorites } = useAuthStore();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
      return;
    }

    const fetchFavorites = async () => {
      try {
        setIsLoading(true);
        // Fetch all listings and filter to favorites
        const allListings = await listingsService.fetchListings();
        const favoriteListings = allListings.filter((listing) =>
          favorites.includes(listing.id)
        );
        setListings(favoriteListings);
      } catch (error) {
        console.error('Error fetching favorites:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (favorites.length > 0) {
      fetchFavorites();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, favorites, router, locale]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-brand-slate mb-4">
            {t('favorites.title')}
          </h1>
          <p className="text-xl text-brand-gray">
            {t('favorites.subtitle')}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-brand-soft animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border-2 border-brand-soft">
            <div className="w-20 h-20 bg-brand-primary-soft rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-brand-slate mb-3">{t('favorites.noSavedHomes')}</h3>
            <p className="text-brand-gray text-lg mb-6">
              {t('favorites.startExploring')}
            </p>
            <Link href={`/${locale}`}>
              <Button>{t('favorites.browseProperties')}</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
