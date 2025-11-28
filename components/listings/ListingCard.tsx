'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Listing } from '@/lib/types/listing.types';
import { useAuthStore } from '@/lib/store/authStore';
import { 
  CheckCircle2, 
  Heart, 
  Camera, 
  MapPin, 
  Share2, 
  ImageIcon, 
  Flame, 
  Star, 
  Home, 
  Bath, 
  Ruler, 
  Phone, 
  MessageCircle 
} from 'lucide-react';

interface ListingCardProps {
  listing: Listing;
}

// Helper function to calculate time ago (with translations)
const getTimeAgo = (date: Date | string | any, t: (key: string, params?: any) => string): string => {
  // Handle different date formats
  let dateObj: Date;
  
  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (date?.toDate && typeof date.toDate === 'function') {
    // Firestore Timestamp
    dateObj = date.toDate();
  } else if (date?.seconds) {
    // Firestore Timestamp with seconds
    dateObj = new Date(date.seconds * 1000);
  } else {
    return '';
  }
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  // Handle future dates
  if (diffInSeconds < 0) {
    return t('listings.justNow');
  }
  
  if (diffInSeconds < 60) return t('listings.justNow');
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return t('listings.minutesAgo', { count: minutes });
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return t('listings.hoursAgo', { count: hours });
  }
  if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return t('listings.daysAgo', { count: days });
  }
  if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return t('listings.monthsAgo', { count: months });
  }
  const years = Math.floor(diffInSeconds / 31536000);
  return t('listings.yearsAgo', { count: years });
};

export const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { isAuthenticated, toggleFavorite, isFavorite } = useAuthStore();
  const [isSharing, setIsSharing] = useState(false);
  
  const coverImage = listing.imageUrls && listing.imageUrls.length > 0 ? listing.imageUrls[0] : undefined;
  const imageCount = listing.imageUrls?.length || 0;
  
  const getPropertyTypeLabel = (type: string) => {
    if (type === 'rent') return t('admin.rent');
    if (type === 'pledge' || type === 'bai-wafa') return t('admin.bai-wafa');
    if (type === 'sale') return t('admin.sale');
    if (type === 'sharik-abad') return t('admin.sharik-abad');
    return t('admin.sale');
  };

  const getPropertyCategoryLabel = (category?: string) => {
    if (!category) return null;
    return t(`admin.${category}`);
  };

  const locationLabel = listing.location?.district
    ? `${t(`districts.${listing.location.district}`)}, ${listing.location.city || 'Kabul'}`
    : listing.location?.city && listing.location?.state
    ? `${listing.location.city}, ${listing.location.state}`
    : listing.location?.city || listing.location?.state || t('listings.location');
  
  const favorited = isFavorite(listing.id);
  // Ensure createdAt is a Date object
  let createdAtDate: Date | null = null;
  
  if (listing.createdAt) {
    if (listing.createdAt instanceof Date) {
      createdAtDate = listing.createdAt;
    } else if (typeof listing.createdAt === 'string' || typeof listing.createdAt === 'number') {
      createdAtDate = new Date(listing.createdAt);
    } else {
      // Handle Firestore Timestamp or timestamp objects
      const timestamp = listing.createdAt as any;
      if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
        // Firestore Timestamp
        createdAtDate = timestamp.toDate();
      } else if (timestamp?.seconds !== undefined) {
        // Firestore timestamp object with seconds
        createdAtDate = new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
      } else if (timestamp?._seconds !== undefined) {
        // Alternative Firestore timestamp format
        createdAtDate = new Date(timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1000000);
      }
    }
    
    // Validate the date
    if (createdAtDate && isNaN(createdAtDate.getTime())) {
      createdAtDate = null;
    }
  }
  
  // If createdAt is null but listing exists, use current time as fallback (for very new listings)
  // This handles cases where Firestore hasn't committed the timestamp yet
  if (!createdAtDate && listing.id) {
    createdAtDate = new Date(); // Fallback to now for very new listings
  }
  
  const timeAgo = createdAtDate ? getTimeAgo(createdAtDate, t) : '';

  // Use badges from listing data (manually selected)
    const badges = {
    isHot: listing.isHot || false,
    isVerified: listing.isVerified || false,
    isPremium: listing.isPremium || false,
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
      return;
    }
    toggleFavorite(listing.id);
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSharing) return;
    setIsSharing(true);
    
    const currentUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/${locale}/listings/${listing.id}`
      : '';
    
    try {
      if (navigator.share) {
        const shareData: ShareData = { url: currentUrl };
        if (navigator.canShare && navigator.canShare(shareData)) {
          await navigator.share(shareData);
        } else {
          await navigator.clipboard.writeText(currentUrl);
        }
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(currentUrl);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(currentUrl);
        }
      }
    } finally {
      setTimeout(() => setIsSharing(false), 500);
    }
  };

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const phone = listing.contactWhatsApp || listing.contactPhone || '';
    if (phone) {
      const cleanNumber = phone.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${cleanNumber}`, '_blank');
    }
  };

  const handleCallClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const phone = listing.contactPhone || listing.contactWhatsApp || '';
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  // Store filter state before navigating to detail page
  const handleListingClick = () => {
    if (typeof window !== 'undefined') {
      const currentSearch = window.location.search;
      if (currentSearch) {
        // Store the filter query params in sessionStorage
        sessionStorage.setItem('listingBackFilters', currentSearch);
      }
    }
  };

  return (
    <Link href={`/${locale}/listings/${listing.id}`} onClick={handleListingClick}>
      {/* Mobile: Horizontal Layout */}
      <div className="md:hidden group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200">
        <div className="flex">
          {/* Image Section - Left Side */}
          {coverImage ? (
            <div className="relative w-32 sm:w-40 h-32 sm:h-40 flex-shrink-0 overflow-hidden bg-gray-100">
              <Image
                src={coverImage}
                alt={listing.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                priority
              />
              
              {/* Badges on Top Left */}
              <div className="absolute top-2 left-2 z-10 flex flex-col gap-1.5">
                {badges.isHot && (
                  <div className="bg-red-600 text-white p-1.5 rounded-full shadow-lg flex items-center justify-center">
                    <Flame className="w-3.5 h-3.5" />
                  </div>
                )}
                {badges.isVerified && (
                  <div className="bg-green-600 text-white p-1.5 rounded-full shadow-lg flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                )}
                {badges.isPremium && (
                  <div className="bg-gray-800 text-white p-1.5 rounded-full shadow-lg flex items-center justify-center">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  </div>
                )}
              </div>

              {/* Top Right - Favorite Button */}
              <div className="absolute top-1.5 right-1.5 z-10">
                <button
                  onClick={handleFavoriteClick}
                  className={`p-1.5 rounded-full backdrop-blur-sm shadow-md transition-all ${
                    favorited
                      ? 'bg-red-500 text-white'
                      : 'bg-white/90 text-gray-600 hover:bg-white'
                  }`}
                  aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart className={`w-3.5 h-3.5 ${favorited ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Bottom Left - Photo Count */}
              {imageCount > 0 && (
                <div className="absolute bottom-1.5 left-1.5 z-10">
                  <div className="bg-black/70 backdrop-blur-sm text-white px-1.5 py-0.5 rounded flex items-center gap-1 shadow-md">
                    <Camera className="w-3 h-3" />
                    <span className="text-[10px] sm:text-xs font-semibold">{imageCount}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-32 sm:w-40 h-32 sm:h-40 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
          )}

          {/* Details Section - Right Side */}
          <div className="flex-1 p-2.5 sm:p-3 flex flex-col min-w-0">
            {/* Price */}
            <div className="mb-1">
              <div className="text-base sm:text-lg font-bold text-brand-primary">
                {listing.price.toLocaleString()} {t('common.currency')}
                {listing.priceInDollar && (
                  <span className="text-sm font-normal text-gray-600 ml-1">
                    (${listing.priceInDollar.toLocaleString()})
                  </span>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-1 mb-1.5 min-w-0">
              <MapPin className="w-3 h-3 text-gray-500 flex-shrink-0" />
              <span className="text-xs text-gray-700 font-medium truncate">{locationLabel}</span>
            </div>

            {/* Property Features */}
            <div className="flex items-center gap-3 mb-1.5">
              {listing.bedrooms && (
                <div className="flex items-center gap-1">
                  <Home className="w-3 h-3 text-gray-600" />
                  <span className="text-xs font-semibold text-gray-700">{listing.bedrooms}</span>
                </div>
              )}
              {listing.bathrooms && (
                <div className="flex items-center gap-1">
                  <Bath className="w-3 h-3 text-gray-600" />
                  <span className="text-xs font-semibold text-gray-700">{listing.bathrooms}</span>
                </div>
              )}
              {listing.area && (
                <div className="flex items-center gap-1">
                  <Ruler className="w-3 h-3 text-gray-600" />
                  <span className="text-xs font-semibold text-gray-700">{listing.area} m²</span>
                </div>
              )}
            </div>

            {/* Time Ago */}
            <div className="text-[10px] text-gray-500 mb-1.5">
              {t('listings.added')}: {timeAgo || t('listings.justNow')}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 mt-auto pt-1.5">
              {(listing.contactWhatsApp || listing.contactPhone) && (
                <>
                  <button
                    onClick={handleCallClick}
                    className="flex-1 flex items-center justify-center gap-1 bg-blue-500 hover:bg-brand-secondary text-white px-2 py-1.5 rounded text-[10px] sm:text-xs font-semibold transition-all"
                  >
                    <Phone className="w-3 h-3" />
                    <span className="hidden sm:inline">{t('listings.call')}</span>
                  </button>
                  <button
                    onClick={handleWhatsAppClick}
                    className="flex-1 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white px-2 py-1.5 rounded text-[10px] sm:text-xs font-semibold transition-all"
                    aria-label="WhatsApp"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.372a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    <span className="hidden sm:inline">{t('listings.whatsappButton')}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: Compact Vertical Layout */}
      <div className="hidden md:block group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200">
        {/* Image Section */}
        {coverImage ? (
          <div className="relative h-40 lg:h-48 w-full overflow-hidden bg-gray-100">
            <Image
              src={coverImage}
              alt={listing.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              priority
            />
            
            {/* Badges on Top Left */}
            <div className="absolute top-2 left-2 z-10 flex flex-col gap-1.5">
              {badges.isHot && (
                <div className="bg-red-600 text-white p-2 rounded-full shadow-lg flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
              )}
              {badges.isVerified && (
                <div className="bg-green-600 text-white p-2 rounded-full shadow-lg flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
              {badges.isPremium && (
                <div className="bg-gray-800 text-white p-2 rounded-full shadow-lg flex items-center justify-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                </div>
              )}
            </div>
            
            {/* Top Right - Favorite Button */}
            <div className="absolute top-2 right-2 z-10">
              <button
                onClick={handleFavoriteClick}
                className={`p-1.5 rounded-full backdrop-blur-sm shadow-lg transition-all ${
                  favorited
                    ? 'bg-red-500 text-white'
                    : 'bg-white/90 text-gray-600 hover:bg-white'
                }`}
                aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Bottom Left - Photo Count */}
            {imageCount > 0 && (
              <div className="absolute bottom-2 left-2 z-10">
                <div className="bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded flex items-center gap-1.5 shadow-lg">
                  <Camera className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold">{imageCount}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-40 lg:h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center">
            <ImageIcon className="w-12 h-12 text-gray-400" />
          </div>
        )}

        {/* Details Section */}
        <div className="p-3 lg:p-4">
          {/* Price */}
          <div className="mb-2">
            <div className="text-xl lg:text-2xl font-bold text-brand-primary">
              {listing.price.toLocaleString()} {t('common.currency')}
              {listing.priceInDollar && (
                <span className="text-base lg:text-lg font-normal text-gray-600 ml-1.5">
                  (${listing.priceInDollar.toLocaleString()})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-500">
                {getPropertyTypeLabel(listing.propertyType || 'sale')}
              </span>
              {listing.propertyCategory && (
                <>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-blue-600 font-medium">
                    {getPropertyCategoryLabel(listing.propertyCategory)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1.5 mb-2">
            <MapPin className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
            <span className="text-sm text-gray-700 font-medium truncate">{locationLabel}</span>
          </div>

          {/* Property Features */}
          <div className="flex items-center gap-3 mb-2 pb-2 border-b border-gray-100">
            {listing.bedrooms && (
              <div className="flex items-center gap-1">
                <Home className="w-3.5 h-3.5 text-gray-600" />
                <span className="text-sm font-semibold text-gray-700">{listing.bedrooms}</span>
              </div>
            )}
            {listing.bathrooms && (
              <div className="flex items-center gap-1">
                <Bath className="w-3.5 h-3.5 text-gray-600" />
                <span className="text-sm font-semibold text-gray-700">{listing.bathrooms}</span>
              </div>
            )}
            {listing.area && (
              <div className="flex items-center gap-1">
                <Ruler className="w-3.5 h-3.5 text-gray-600" />
                <span className="text-sm font-semibold text-gray-700">{listing.area} m²</span>
              </div>
            )}
          </div>

          {/* Title */}
          <h3 className="text-sm lg:text-base font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-brand-primary transition-colors">
            {listing.title}
          </h3>

          {/* Time Ago */}
          <div className="text-xs text-gray-500 mb-2">
            {t('listings.added')}: {timeAgo || t('listings.justNow')}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            {(listing.contactWhatsApp || listing.contactPhone) && (
              <>
                <button
                  onClick={handleCallClick}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-blue-500 hover:bg-brand-secondary text-white px-3 py-2 rounded-lg font-semibold text-xs transition-all"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{t('listings.call')}</span>
                </button>
                <button
                  onClick={handleWhatsAppClick}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg font-semibold text-xs transition-all"
                  aria-label="WhatsApp"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.372a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  <span>{t('listings.whatsappButton')}</span>
                </button>
              </>
            )}
            {!listing.contactWhatsApp && !listing.contactPhone && (
              <div className="flex-1 text-center text-xs text-gray-500 py-2">
                {t('listings.viewDetails')} →
          </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};
