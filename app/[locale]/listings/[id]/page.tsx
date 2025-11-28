'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { listingsService } from '@/lib/services/listings.service';
import { userService } from '@/lib/services/user.service';
import { Listing } from '@/lib/types/listing.types';
import { User } from '@/lib/types/user.types';
import { useAuthStore } from '@/lib/store/authStore';
import { ContactAgentModal } from '@/components/ContactAgentModal';
import { Home, Bath, Ruler } from 'lucide-react';
import dynamic from 'next/dynamic';

// Using iframe-based map instead of Leaflet for better reliability

export default function ListingDetailPage() {
  const t = useTranslations();
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, toggleFavorite, isFavorite } = useAuthStore();
  const [listing, setListing] = useState<Listing | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'location' | 'finance'>('overview');
  
  const favorited = listing ? isFavorite(listing.id) : false;

  const handleCopyId = async () => {
    if (!listing) return;
    try {
      const idToCopy = listing.propertyId || listing.id;
      await navigator.clipboard.writeText(idToCopy);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch (error) {
      console.error('Failed to copy ID:', error);
    }
  };

  const handleShare = async () => {
    if (!listing || isSharing) return;
    
    setIsSharing(true);
    
    // Get clean URL without any query parameters or fragments
    const currentUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}${window.location.pathname}`
      : '';

    try {
      // Check if Web Share API is available
      if (typeof navigator !== 'undefined' && navigator.share) {
        // Try sharing with just URL first (cleanest option)
        const urlOnlyData: ShareData = { url: currentUrl };
        if (navigator.canShare && navigator.canShare(urlOnlyData)) {
          try {
            await navigator.share(urlOnlyData);
            setCopiedId(true);
            setTimeout(() => setCopiedId(false), 2000);
            return;
          } catch (shareError: any) {
            // If user cancels, just return
            if (shareError.name === 'AbortError' || shareError.name === 'NotAllowedError') {
              return;
            }
            // Otherwise fall through to clipboard
          }
        }
        
        // If URL-only share didn't work, try with title and text
        const shareText = `${listing.title} - ${listing.price.toLocaleString()} ${t('common.currency')}`;
        const shareData: ShareData = {
          title: listing.title,
          text: shareText,
          url: currentUrl,
        };
        
        if (navigator.canShare && navigator.canShare(shareData)) {
          try {
            await navigator.share(shareData);
            // Even if share succeeds, copy URL to clipboard for easy access
            if (navigator.clipboard && navigator.clipboard.writeText) {
              await navigator.clipboard.writeText(currentUrl);
            }
            setCopiedId(true);
            setTimeout(() => setCopiedId(false), 2000);
            return;
          } catch (shareError: any) {
            // If user cancels, just return
            if (shareError.name === 'AbortError' || shareError.name === 'NotAllowedError') {
              return;
            }
            // Otherwise fall through to clipboard
          }
        }
      }
      
      // Fallback: Always copy only the clean URL to clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(currentUrl);
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
      } else {
        // Last resort: show URL in alert
        alert(`${t('listings.shareUrl')}: ${currentUrl}`);
      }
    } catch (error: any) {
      // Any other error - try clipboard fallback with clean URL only
      console.error('Error sharing:', error);
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(currentUrl);
          setCopiedId(true);
          setTimeout(() => setCopiedId(false), 2000);
        } else {
          alert(`${t('listings.shareUrl')}: ${currentUrl}`);
        }
      } catch (clipboardError) {
        console.error('Failed to copy link:', clipboardError);
        alert(`${t('listings.shareUrl')}: ${currentUrl}`);
      }
    } finally {
      // Reset sharing state after a short delay to prevent rapid clicks
      setTimeout(() => {
        setIsSharing(false);
      }, 500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveListing = () => {
    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
      return;
    }
    if (listing) {
      toggleFavorite(listing.id);
    }
  };

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const id = params.id as string;
        const data = await listingsService.fetchListingById(id);
        if (data) {
          setListing(data);
          // Fetch user profile (optional - public read access)
          if (data.createdBy) {
            try {
              const user = await userService.fetchUserById(data.createdBy);
              if (user) {
                setUserProfile(user);
              }
            } catch (error: any) {
              // Silently handle errors - user profile is optional
              // Only log non-permission errors
              if (error?.code !== 'permission-denied' && error?.code !== 'permissions-denied') {
                console.error('Error fetching user profile:', error);
              }
            }
          }
        } else {
          router.push(`/${locale}`);
        }
      } catch (error: any) {
        console.error('Error fetching listing:', error);
        // Only redirect if it's a real error, not just a permission issue for optional data
        if (error?.code !== 'permission-denied' && error?.code !== 'permissions-denied') {
          router.push(`/${locale}`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchListing();
    }
  }, [params.id, router, locale]);

  // Initialize Leaflet icons
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        delete (L.default.Icon.Default.prototype as any)._getIconUrl;
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });
      });
    }
  }, []);

  // No map initialization needed - using iframe-based maps

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-96 bg-brand-soft animate-pulse rounded-3xl" />
      </div>
    );
  }

  if (!listing) {
    return null;
  }

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

  // Helper component to render feature badges (compact version)
  const FeatureBadge = ({ label, value }: { label: string; value: boolean | string | number | undefined }) => {
    if (!value) return null;
    if (typeof value === 'boolean' && !value) return null;
    
    return (
      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium border border-blue-100">
        {label}
      </span>
    );
  };

  // Helper component to render info card (compact version)
  const InfoCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number | undefined }) => {
    if (value === undefined || value === null || value === '') return null;
    return (
      <div className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-lg border border-gray-200">
        <div className="w-8 h-8 bg-brand-primary-soft rounded-md flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-brand-gray font-medium truncate">{label}</p>
          <p className="text-sm text-brand-slate font-semibold truncate">{value}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-4 sm:mb-6 text-brand-primary hover:text-blue-600 flex items-center gap-2 font-medium transition-colors group text-sm sm:text-base no-print"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('listings.backToListings')}
        </button>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Images and Map */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Title and Address */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-brand-slate leading-tight mb-2">
                    {listing.title}
                  </h1>
                  <p className="text-sm sm:text-base text-brand-gray">{locationLabel}</p>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0 no-print">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleShare}
                      disabled={isSharing}
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-brand-gray hover:text-brand-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title={t('listings.share')}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </button>
                    <button
                      onClick={handlePrint}
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-brand-gray hover:text-brand-primary transition-all"
                      title={t('listings.print')}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                    </button>
                  </div>
                  {/* Property ID - Under Share and Print */}
                  <button
                    onClick={handleCopyId}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-navy transition-all font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg group relative"
                    title={copiedId ? t('listings.idCopied') : t('listings.clickToCopyId')}
                  >
                    <span className="font-medium">ID</span>
                    <span className="font-mono tracking-wide">{listing.propertyId || listing.id}</span>
                    <svg className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {copiedId && (
                      <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-brand-slate text-white text-xs px-3 py-1.5 rounded whitespace-nowrap shadow-lg z-10">
                        {t('listings.copied')}!
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Images Section */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden">
              {listing.imageUrls && listing.imageUrls.length > 0 ? (
                <div className="relative">
                  <div className="relative h-[400px] sm:h-[500px] md:h-[600px]">
                    <Image
                      src={listing.imageUrls[currentImageIndex]}
                      alt={listing.title}
                      fill
                      className="object-cover"
                      priority
                    />
                    {listing.imageUrls.length > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : listing.imageUrls.length - 1))}
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all z-10"
                        >
                          <svg className="w-5 h-5 text-brand-slate" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setCurrentImageIndex((prev) => (prev < listing.imageUrls.length - 1 ? prev + 1 : 0))}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all z-10"
                        >
                          <svg className="w-5 h-5 text-brand-slate" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                  {/* Key Property Metrics Bar */}
                  {(listing.bedrooms || listing.bathrooms || listing.area) && (
                    <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center gap-6 sm:gap-8">
                      {listing.bedrooms && (
                        <div className="flex items-center gap-2">
                          <Home className="w-5 h-5 text-brand-primary" />
                          <span className="text-sm sm:text-base font-semibold text-brand-slate">{listing.bedrooms} {t('listings.bedrooms')}</span>
                        </div>
                      )}
                      {listing.bathrooms && (
                        <div className="flex items-center gap-2">
                          <Bath className="w-5 h-5 text-brand-primary" />
                          <span className="text-sm sm:text-base font-semibold text-brand-slate">{listing.bathrooms} {t('listings.bathrooms')}</span>
                        </div>
                      )}
                      {listing.area && (
                        <div className="flex items-center gap-2">
                          <Ruler className="w-5 h-5 text-brand-primary" />
                          <span className="text-sm sm:text-base font-semibold text-brand-slate">{listing.area} m²</span>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Thumbnails */}
                  {listing.imageUrls.length > 1 && (
                    <div className="px-4 pb-4 pt-2">
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                        {listing.imageUrls.map((url, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`relative h-16 sm:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                              currentImageIndex === index 
                                ? 'border-brand-primary ring-2 ring-brand-primary ring-offset-2' 
                                : 'border-gray-200 opacity-70 hover:opacity-100 hover:border-brand-primary'
                            }`}
                          >
                            <Image src={url} alt={`${listing.title} ${index + 1}`} fill className="object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-[400px] sm:h-[500px] md:h-[600px] bg-gradient-to-br from-brand-soft to-blue-50 flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-20 h-20 text-brand-primary opacity-50 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-brand-gray font-medium">{t('listings.noImages')}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Property Overview with Tabs */}
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden">
              {/* Tabs */}
              <div className="border-b border-gray-200">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-6 py-4 font-semibold text-sm sm:text-base transition-colors ${
                      activeTab === 'overview'
                        ? 'text-brand-primary border-b-2 border-brand-primary'
                        : 'text-brand-gray hover:text-brand-slate'
                    }`}
                  >
                    {t('listings.aboutProperty')}
                  </button>
                  {listing.location?.latitude && listing.location?.longitude && (
                    <button
                      onClick={() => setActiveTab('location')}
                      className={`px-6 py-4 font-semibold text-sm sm:text-base transition-colors ${
                        activeTab === 'location'
                          ? 'text-brand-primary border-b-2 border-brand-primary'
                          : 'text-brand-gray hover:text-brand-slate'
                      }`}
                    >
                      {t('listings.location')} & {t('listings.nearbyLocations')}
                    </button>
                  )}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-4 sm:p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Details Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <tbody className="divide-y divide-gray-200">
                          <tr>
                            <td className="py-3 px-4 text-sm font-medium text-brand-gray w-1/3">{t('admin.propertyType')}</td>
                            <td className="py-3 px-4 text-sm text-brand-slate font-semibold">{getPropertyTypeLabel(listing.propertyType || 'sale')}</td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 text-sm font-medium text-brand-gray">{t('admin.price')}</td>
                            <td className="py-3 px-4 text-sm text-brand-slate font-semibold">{listing.price.toLocaleString()} {t('common.currency')}</td>
                          </tr>
                          {listing.area && (
                            <tr>
                              <td className="py-3 px-4 text-sm font-medium text-brand-gray">{t('listings.area')}</td>
                              <td className="py-3 px-4 text-sm text-brand-slate font-semibold">{listing.area} m²</td>
                            </tr>
                          )}
                          <tr>
                            <td className="py-3 px-4 text-sm font-medium text-brand-gray">{t('admin.propertyCategory')}</td>
                            <td className="py-3 px-4 text-sm text-brand-slate font-semibold">{getPropertyCategoryLabel(listing.propertyCategory) || '-'}</td>
                          </tr>
                          {listing.bedrooms && (
                            <tr>
                              <td className="py-3 px-4 text-sm font-medium text-brand-gray">{t('listings.bedrooms')}</td>
                              <td className="py-3 px-4 text-sm text-brand-slate font-semibold">{listing.bedrooms}</td>
                            </tr>
                          )}
                          {listing.bathrooms && (
                            <tr>
                              <td className="py-3 px-4 text-sm font-medium text-brand-gray">{t('listings.bathrooms')}</td>
                              <td className="py-3 px-4 text-sm text-brand-slate font-semibold">{listing.bathrooms}</td>
                            </tr>
                          )}
                          <tr>
                            <td className="py-3 px-4 text-sm font-medium text-brand-gray">{t('listings.location')}</td>
                            <td className="py-3 px-4 text-sm text-brand-slate font-semibold">{locationLabel}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Description */}
                    <div>
                      <h3 className="text-lg font-bold text-brand-slate mb-3">{t('listings.aboutProperty')}</h3>
                      <p className="text-sm sm:text-base text-brand-gray leading-relaxed whitespace-pre-line">
                        {listing.description}
                      </p>
                    </div>

                    {/* Detailed Features - Compact Integrated Layout */}
                    {(listing.mainFeatures || listing.rooms || listing.businessCommunication || listing.communityFeatures || listing.healthcareRecreation || listing.nearbyLocations || listing.otherFacilities) && (
                      <div className="pt-6 border-t border-gray-200">
                        <h3 className="text-lg font-bold text-brand-slate mb-4">{t('listings.propertySpecifications')}</h3>
                        
                        <div className="space-y-5">
                          {/* Main Features & Rooms Combined */}
                          {(listing.mainFeatures || listing.rooms) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Main Features */}
                              {listing.mainFeatures && (
                                <div>
                                  <h4 className="text-base font-semibold text-brand-slate mb-3">{t('listings.mainFeatures')}</h4>
                                  <div className="grid grid-cols-2 gap-2.5 mb-3">
                                    {listing.mainFeatures.builtInYear && (
                                      <InfoCard
                                        icon={<svg className="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                                        label={t('admin.detailedFeatures.builtInYear')}
                                        value={listing.mainFeatures.builtInYear.toString()}
                                      />
                                    )}
                                    {listing.mainFeatures.parkingSpaces && (
                                      <InfoCard
                                        icon={<svg className="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                        label={t('admin.detailedFeatures.parkingSpaces')}
                                        value={listing.mainFeatures.parkingSpaces.toString()}
                                      />
                                    )}
                                    {listing.mainFeatures.floors && (
                                      <InfoCard
                                        icon={<svg className="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
                                        label={t('admin.detailedFeatures.floors')}
                                        value={listing.mainFeatures.floors.toString()}
                                      />
                                    )}
                                    {listing.mainFeatures.flooring && (
                                      <InfoCard
                                        icon={<svg className="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>}
                                        label={t('admin.detailedFeatures.flooringType')}
                                        value={listing.mainFeatures.flooring}
                                      />
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {listing.mainFeatures.doubleGlazedWindows && <FeatureBadge label={t('admin.detailedFeatures.doubleGlazedWindows')} value={true} />}
                                    {listing.mainFeatures.centralAirConditioning && <FeatureBadge label={t('admin.detailedFeatures.centralAirConditioning')} value={true} />}
                                    {listing.mainFeatures.centralHeating && <FeatureBadge label={t('admin.detailedFeatures.centralHeating')} value={true} />}
                                    {listing.mainFeatures.electricityBackup && <FeatureBadge label={t('admin.detailedFeatures.electricityBackup')} value={true} />}
                                    {listing.mainFeatures.wasteDisposal && <FeatureBadge label={t('admin.detailedFeatures.wasteDisposal')} value={true} />}
                                  </div>
                                </div>
                              )}

                              {/* Rooms & Spaces */}
                              {listing.rooms && (
                                <div>
                                  <h4 className="text-base font-semibold text-brand-slate mb-3">{t('listings.roomsAndSpaces')}</h4>
                                  <div className="grid grid-cols-2 gap-2.5 mb-3">
                                    {listing.rooms.servantQuarters && (
                                      <InfoCard
                                        icon={<svg className="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
                                        label={t('admin.detailedFeatures.servantQuarters')}
                                        value={listing.rooms.servantQuarters.toString()}
                                      />
                                    )}
                                    {listing.rooms.kitchens && (
                                      <InfoCard
                                        icon={<svg className="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>}
                                        label={t('admin.detailedFeatures.kitchens')}
                                        value={listing.rooms.kitchens.toString()}
                                      />
                                    )}
                                    {listing.rooms.storeRooms && (
                                      <InfoCard
                                        icon={<svg className="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
                                        label={t('admin.detailedFeatures.storeRooms')}
                                        value={listing.rooms.storeRooms.toString()}
                                      />
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {listing.rooms.drawingRoom && <FeatureBadge label={t('admin.detailedFeatures.drawingRoom')} value={true} />}
                                    {listing.rooms.diningRoom && <FeatureBadge label={t('admin.detailedFeatures.diningRoom')} value={true} />}
                                    {listing.rooms.studyRoom && <FeatureBadge label={t('admin.detailedFeatures.studyRoom')} value={true} />}
                                    {listing.rooms.prayerRoom && <FeatureBadge label={t('admin.detailedFeatures.prayerRoom')} value={true} />}
                                    {listing.rooms.powderRoom && <FeatureBadge label={t('admin.detailedFeatures.powderRoom')} value={true} />}
                                    {listing.rooms.gym && <FeatureBadge label={t('admin.detailedFeatures.gym')} value={true} />}
                                    {listing.rooms.steamRoom && <FeatureBadge label={t('admin.detailedFeatures.steamRoom')} value={true} />}
                                    {listing.rooms.lounge && <FeatureBadge label={t('admin.detailedFeatures.lounge')} value={true} />}
                                    {listing.rooms.laundryRoom && <FeatureBadge label={t('admin.detailedFeatures.laundryRoom')} value={true} />}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Business, Community, Healthcare Combined */}
                          {(listing.businessCommunication || listing.communityFeatures || listing.healthcareRecreation) && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-gray-100">
                              {listing.businessCommunication && (
                                <div>
                                  <h4 className="text-sm font-semibold text-brand-slate mb-2">{t('listings.businessAndCommunication')}</h4>
                                  <div className="flex flex-wrap gap-1.5">
                                    {listing.businessCommunication.broadbandInternet && <FeatureBadge label={t('admin.detailedFeatures.broadbandInternet')} value={true} />}
                                    {listing.businessCommunication.satelliteCableTV && <FeatureBadge label={t('admin.detailedFeatures.satelliteCableTV')} value={true} />}
                                    {listing.businessCommunication.intercom && <FeatureBadge label={t('admin.detailedFeatures.intercom')} value={true} />}
                                  </div>
                                </div>
                              )}
                              {listing.communityFeatures && (
                                <div>
                                  <h4 className="text-sm font-semibold text-brand-slate mb-2">{t('listings.communityFeatures')}</h4>
                                  <div className="flex flex-wrap gap-1.5">
                                    {listing.communityFeatures.communityLawn && <FeatureBadge label={t('admin.detailedFeatures.communityLawn')} value={true} />}
                                    {listing.communityFeatures.communitySwimmingPool && <FeatureBadge label={t('admin.detailedFeatures.communitySwimmingPool')} value={true} />}
                                    {listing.communityFeatures.communityGym && <FeatureBadge label={t('admin.detailedFeatures.communityGym')} value={true} />}
                                    {listing.communityFeatures.medicalCentre && <FeatureBadge label={t('admin.detailedFeatures.medicalCentre')} value={true} />}
                                    {listing.communityFeatures.dayCareCentre && <FeatureBadge label={t('admin.detailedFeatures.dayCareCentre')} value={true} />}
                                    {listing.communityFeatures.kidsPlayArea && <FeatureBadge label={t('admin.detailedFeatures.kidsPlayArea')} value={true} />}
                                    {listing.communityFeatures.barbequeArea && <FeatureBadge label={t('admin.detailedFeatures.barbequeArea')} value={true} />}
                                    {listing.communityFeatures.mosque && <FeatureBadge label={t('admin.detailedFeatures.mosque')} value={true} />}
                                    {listing.communityFeatures.communityCentre && <FeatureBadge label={t('admin.detailedFeatures.communityCentre')} value={true} />}
                                  </div>
                                </div>
                              )}
                              {listing.healthcareRecreation && (
                                <div>
                                  <h4 className="text-sm font-semibold text-brand-slate mb-2">{t('listings.healthcareAndRecreation')}</h4>
                                  <div className="flex flex-wrap gap-1.5">
                                    {listing.healthcareRecreation.lawn && <FeatureBadge label={t('admin.detailedFeatures.lawn')} value={true} />}
                                    {listing.healthcareRecreation.swimmingPool && <FeatureBadge label={t('admin.detailedFeatures.swimmingPool')} value={true} />}
                                    {listing.healthcareRecreation.sauna && <FeatureBadge label={t('admin.detailedFeatures.sauna')} value={true} />}
                                    {listing.healthcareRecreation.jacuzzi && <FeatureBadge label={t('admin.detailedFeatures.jacuzzi')} value={true} />}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Nearby Locations - Compact Grid */}
                          {listing.nearbyLocations && (
                            <div className="pt-3 border-t border-gray-100">
                              <h4 className="text-base font-semibold text-brand-slate mb-3">{t('listings.nearbyLocations')}</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                {listing.nearbyLocations.nearbySchools && (
                                  <InfoCard
                                    icon={<svg className="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                                    label={t('admin.detailedFeatures.nearbySchools')}
                                    value={listing.nearbyLocations.nearbySchools}
                                  />
                                )}
                                {listing.nearbyLocations.nearbyHospitals && (
                                  <InfoCard
                                    icon={<svg className="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                                    label={t('admin.detailedFeatures.nearbyHospitals')}
                                    value={listing.nearbyLocations.nearbyHospitals}
                                  />
                                )}
                                {listing.nearbyLocations.nearbyShoppingMalls && (
                                  <InfoCard
                                    icon={<svg className="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
                                    label={t('admin.detailedFeatures.nearbyShoppingMalls')}
                                    value={listing.nearbyLocations.nearbyShoppingMalls}
                                  />
                                )}
                                {listing.nearbyLocations.nearbyRestaurants && (
                                  <InfoCard
                                    icon={<svg className="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>}
                                    label={t('admin.detailedFeatures.nearbyRestaurants')}
                                    value={listing.nearbyLocations.nearbyRestaurants}
                                  />
                                )}
                                {listing.nearbyLocations.distanceFromAirport && (
                                  <InfoCard
                                    icon={<svg className="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}
                                    label={t('admin.detailedFeatures.distanceFromAirport')}
                                    value={`${listing.nearbyLocations.distanceFromAirport} km`}
                                  />
                                )}
                                {listing.nearbyLocations.nearbyPublicTransport && (
                                  <InfoCard
                                    icon={<svg className="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>}
                                    label={t('admin.detailedFeatures.nearbyPublicTransport')}
                                    value={listing.nearbyLocations.nearbyPublicTransport}
                                  />
                                )}
                                {listing.nearbyLocations.otherNearbyPlaces && (
                                  <div className="sm:col-span-2 lg:col-span-3">
                                    <InfoCard
                                      icon={<svg className="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>}
                                      label={t('admin.detailedFeatures.otherNearbyPlaces')}
                                      value={listing.nearbyLocations.otherNearbyPlaces}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Other Facilities */}
                          {listing.otherFacilities && (
                            <div className="pt-3 border-t border-gray-100">
                              <h4 className="text-base font-semibold text-brand-slate mb-3">{t('listings.otherFacilities')}</h4>
                              <div className="flex flex-wrap gap-1.5 mb-3">
                                {listing.otherFacilities.maintenanceStaff && <FeatureBadge label={t('admin.detailedFeatures.maintenanceStaff')} value={true} />}
                                {listing.otherFacilities.securityStaff && <FeatureBadge label={t('admin.detailedFeatures.securityStaff')} value={true} />}
                                {listing.otherFacilities.facilitiesForDisabled && <FeatureBadge label={t('admin.detailedFeatures.facilitiesForDisabled')} value={true} />}
                              </div>
                              {listing.otherFacilities.otherFacilities && (
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                  <p className="text-xs text-brand-gray font-medium mb-1">{t('admin.detailedFeatures.otherFacilitiesInput')}</p>
                                  <p className="text-sm text-brand-slate">{listing.otherFacilities.otherFacilities}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'location' && listing.location?.latitude && listing.location?.longitude && (
                  <div>
                    <div 
                      className="relative w-full h-[400px] sm:h-[500px] rounded-lg overflow-hidden border border-gray-200" 
                    >
                      <iframe
                        className="absolute inset-0 w-full h-full"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${listing.location.longitude - 0.01},${listing.location.latitude - 0.01},${listing.location.longitude + 0.01},${listing.location.latitude + 0.01}&layer=mapnik&marker=${listing.location.latitude},${listing.location.longitude}`}
                        title="Location Map"
                      />
                      <div className="absolute bottom-2 right-2 bg-white px-2 py-1 rounded text-xs shadow-md z-10">
                        <a 
                          href={`https://www.openstreetmap.org/?mlat=${listing.location.latitude}&mlon=${listing.location.longitude}&zoom=15`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {t('listings.viewLargerMap') || 'View Larger Map'}
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
          </div>

            {/* Map Section - Remove this as it's now in tabs */}

          </div>

          {/* Right Column - Price and Contact */}
          <div className="space-y-6 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto">
            {/* Price and Contact Card */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6">
              <div className="text-center mb-6">
                <div className="text-3xl sm:text-4xl font-bold text-brand-primary mb-2">
                  {listing.price.toLocaleString()} {t('common.currency')}
                </div>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <span className="inline-block px-3 py-1 bg-brand-primary-soft text-brand-primary rounded-full text-xs font-semibold">
                      {getPropertyTypeLabel(listing.propertyType || 'sale')}
                    </span>
                    {listing.propertyCategory && (
                    <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold">
                        {getPropertyCategoryLabel(listing.propertyCategory)}
                      </span>
                    )}
                  </div>
                </div>

              {/* WhatsApp and Call Buttons */}
              <div className="flex flex-col gap-3 mb-6 no-print">
                {(listing.contactWhatsApp || userProfile?.whatsApp) && (
                  <a
                    href={`https://wa.me/${(listing.contactWhatsApp || userProfile?.whatsApp)?.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-all hover:shadow-lg text-base flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                    WhatsApp
                  </a>
                )}
                {(listing.contactPhone || userProfile?.phone) && (
                  <a
                    href={`tel:${(listing.contactPhone || userProfile?.phone)?.replace(/[^0-9+]/g, '')}`}
                    className="w-full px-6 py-3 bg-brand-primary text-white rounded-xl font-semibold hover:bg-blue-600 transition-all hover:shadow-lg text-base flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    {t('listings.call')}
                  </a>
                )}
                <button 
                  onClick={() => setIsContactModalOpen(true)}
                  className="w-full px-6 py-3 bg-gray-100 text-brand-slate rounded-xl font-semibold hover:bg-gray-200 transition-all text-base"
                >
                  {t('listings.contactAgent')}
                </button>
              </div>

              {/* Save Listing Button */}
                <button
                  onClick={handleSaveListing}
                className={`w-full px-6 py-3 border-2 rounded-xl font-semibold transition-all text-base flex items-center justify-center gap-2 mb-4 ${
                    favorited
                      ? 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100'
                      : 'border-brand-primary text-brand-primary hover:bg-brand-primary-soft'
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill={favorited ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  {favorited ? t('listings.saved') : t('listings.saveListing')}
                </button>

            </div>

            {/* Agent Profile Card */}
            {userProfile && (
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-brand-slate mb-4">{t('listings.agentProfile')}</h2>
                <div className="flex items-start gap-4">
                  {userProfile.profileImageUrl ? (
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={userProfile.profileImageUrl}
                        alt={userProfile.displayName}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-brand-primary-soft flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl sm:text-3xl font-bold text-brand-primary">
                        {userProfile.displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-brand-slate mb-1">{userProfile.displayName}</h3>
                    {userProfile.company && (
                      <p className="text-sm text-brand-gray mb-2">{userProfile.company}</p>
                    )}
                    {userProfile.bio && (
                      <p className="text-sm text-brand-gray mb-3 leading-relaxed">{userProfile.bio}</p>
                    )}
                    {userProfile.experience && (
                      <p className="text-sm text-brand-gray mb-2">
                        <span className="font-medium">{t('listings.experience')}:</span> {userProfile.experience}
                      </p>
                    )}
                    {userProfile.specialties && userProfile.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {userProfile.specialties.map((specialty, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-brand-primary-soft text-brand-primary rounded-lg text-xs font-medium"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-50 lg:hidden no-print">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Price */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-brand-gray mb-0.5">Price</p>
              <p className="text-lg font-bold text-brand-primary truncate">
                {listing.price.toLocaleString()} {t('common.currency')}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {(listing.contactWhatsApp || userProfile?.whatsApp) && (
                <a
                  href={`https://wa.me/${(listing.contactWhatsApp || userProfile?.whatsApp)?.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-12 h-12 bg-green-500 text-white rounded-full hover:bg-green-600 transition-all shadow-lg"
                  aria-label="WhatsApp"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </a>
              )}
              {(listing.contactPhone || userProfile?.phone) && (
                <a
                  href={`tel:${(listing.contactPhone || userProfile?.phone)?.replace(/[^0-9+]/g, '')}`}
                  className="flex items-center justify-center w-12 h-12 bg-brand-primary text-white rounded-full hover:bg-blue-600 transition-all shadow-lg"
                  aria-label="Call"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Agent Modal */}
      <ContactAgentModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        phone={listing.contactPhone || userProfile?.phone}
        whatsApp={listing.contactWhatsApp || userProfile?.whatsApp}
        email={listing.contactEmail || userProfile?.email}
      />
    </div>
  );
}
