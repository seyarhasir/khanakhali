'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store/authStore';
import { listingsService } from '@/lib/services/listings.service';
import { storageService } from '@/lib/services/storage.service';
import { CreateListingInput, PropertyType, PropertyCategory } from '@/lib/types/listing.types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { SimpleMapSelector } from '@/components/admin/SimpleMapSelector';
import { DetailedListingForm } from '@/components/admin/DetailedListingForm';
import { kabulDistricts } from '@/lib/utils/districts';
import Image from 'next/image';
import { useToast } from '@/components/ui/Toast';

export default function EditListingPage() {
  const t = useTranslations();
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const toast = useToast();

  useEffect(() => {
    // Wait for auth to finish loading before checking
    if (authLoading) return;

    if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'agent')) {
      router.push(`/${locale}/login`);
    }
  }, [user, isAuthenticated, authLoading, router, locale]);

  const [formData, setFormData] = useState<CreateListingInput>({
    title: '',
    description: '',
    price: 0,
    priceInDollar: undefined,
    propertyType: 'sale',
    propertyCategory: undefined,
    location: {
      address: '',
      city: 'Kabul',
      state: 'Kabul',
      zipCode: '',
      district: '',
      latitude: 34.5553,
      longitude: 69.2075,
    },
    bedrooms: 0,
    bathrooms: 0,
    area: 0,
    yearBuilt: undefined,
    parking: false,
    furnished: false,
    status: 'active',
    isHot: false,
    isVerified: false,
    isPremium: false,
    contactPhone: '',
    contactWhatsApp: '',
    contactEmail: '',
  });

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [coverImageIndex, setCoverImageIndex] = useState<number | null>(null); // null = from existing, number = index in existing
  const [newCoverImageIndex, setNewCoverImageIndex] = useState<number | null>(null); // null = not set, number = index in new images
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchListing = async () => {
      if (!params.id || !isAuthenticated || (user?.role !== 'admin' && user?.role !== 'agent')) return;

      try {
        const id = params.id as string;
        const data = await listingsService.fetchListingById(id);
        if (data) {
          const imageUrls = data.imageUrls || [];
          setExistingImages(imageUrls);
          // First image is the cover by default
          setCoverImageIndex(imageUrls.length > 0 ? 0 : null);
          setNewCoverImageIndex(null);
          setFormData({
            title: data.title,
            description: data.description,
            price: data.price,
            priceInDollar: data.priceInDollar,
            propertyType: data.propertyType === 'pledge' ? 'bai-wafa' : data.propertyType,
            propertyCategory: data.propertyCategory,
            location: data.location || {
              address: '',
              city: 'Kabul',
              state: 'Kabul',
              zipCode: '',
              district: '',
              latitude: 34.5553,
              longitude: 69.2075,
            },
            bedrooms: data.bedrooms || 0,
            bathrooms: data.bathrooms || 0,
            area: data.area || 0,
            yearBuilt: data.yearBuilt,
            parking: data.parking || false,
            furnished: data.furnished || false,
            status: data.status || 'active',
            isHot: data.isHot || false,
            isVerified: data.isVerified || false,
            isPremium: data.isPremium || false,
            isFeatured: data.isFeatured || false,
            contactPhone: data.contactPhone || '',
            contactWhatsApp: data.contactWhatsApp || '',
            contactEmail: data.contactEmail || '',
            mainFeatures: data.mainFeatures,
            rooms: data.rooms,
            businessCommunication: data.businessCommunication,
            communityFeatures: data.communityFeatures,
            healthcareRecreation: data.healthcareRecreation,
            nearbyLocations: data.nearbyLocations,
            otherFacilities: data.otherFacilities,
          });
        } else {
          router.push(`/${locale}/admin`);
        }
      } catch (error) {
        console.error('Error fetching listing:', error);
        router.push(`/${locale}/admin`);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchListing();
    }
  }, [params.id, router, locale, isAuthenticated, user]);

  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'agent')) {
    return null;
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = t('admin.errors.titleRequired');
    if (!formData.description.trim()) newErrors.description = t('admin.errors.descriptionRequired');
    if (formData.price <= 0) newErrors.price = t('admin.errors.priceRequired');
    if (!formData.location.city.trim()) newErrors.city = t('admin.errors.cityRequired');
    if (!formData.location.district) newErrors.district = t('admin.errors.districtRequired');
    if (!formData.location.address.trim()) newErrors.address = t('admin.errors.addressRequired');
    if (existingImages.length === 0 && newImages.length === 0) newErrors.images = t('admin.errors.photoRequired');
    if (formData.bedrooms && formData.bedrooms < 0) newErrors.bedrooms = t('admin.errors.bedroomsInvalid');
    if (formData.bathrooms && formData.bathrooms < 0) newErrors.bathrooms = t('admin.errors.bathroomsInvalid');
    if (formData.area && formData.area <= 0) newErrors.area = t('admin.errors.areaInvalid');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !user || !params.id) return;

    setIsSaving(true);
    try {
      const listingId = params.id as string;
      
      // Upload new images
      let newImageUrls: string[] = [];
      if (newImages.length > 0) {
        newImageUrls = await storageService.uploadListingImages(newImages, listingId);
      }

      // Reorder images so cover image is first
      let allImageUrls = [...existingImages, ...newImageUrls];
      
      // Determine cover image index
      let coverIndex = 0;
      if (newCoverImageIndex !== null && newCoverImageIndex < newImageUrls.length) {
        // Cover is from new images
        coverIndex = existingImages.length + newCoverImageIndex;
      } else if (coverImageIndex !== null && coverImageIndex < existingImages.length) {
        // Cover is from existing images
        coverIndex = coverImageIndex;
      }
      
      // Move cover image to first position
      if (coverIndex > 0 && coverIndex < allImageUrls.length) {
        const coverImage = allImageUrls[coverIndex];
        allImageUrls.splice(coverIndex, 1);
        allImageUrls.unshift(coverImage);
      }

      // Update listing
      await listingsService.updateListing(listingId, { id: listingId, ...formData }, user?.role || 'user', allImageUrls);
      
      router.push(`/${locale}/admin`);
      toast.success('Listing updated successfully!');
    } catch (error: any) {
      toast.error(error.message || t('admin.errors.updateFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
    // Adjust cover index if needed
    if (coverImageIndex === index) {
      setCoverImageIndex(null);
    } else if (coverImageIndex !== null && coverImageIndex > index) {
      setCoverImageIndex(coverImageIndex - 1);
    }
  };

  const setExistingAsCover = (index: number) => {
    setCoverImageIndex(index);
    setNewCoverImageIndex(null); // Clear new cover selection
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-96 bg-brand-soft animate-pulse rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-brand-slate mb-2">{t('admin.editListing')}</h1>
          <p className="text-sm sm:text-base text-brand-gray">{t('admin.editListingSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
          {/* Photos - First Section */}
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-brand-slate border-b border-gray-200 pb-2 mb-3 sm:mb-4">
                {t('admin.photos')} *
              </h2>
              <p className="text-xs sm:text-sm text-brand-gray mb-3 sm:mb-4">
                {t('admin.photosDescription')}
              </p>
            </div>

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="mb-4">
                <label className="block text-xs sm:text-sm font-medium text-brand-slate mb-2 sm:mb-3">
                  {t('admin.existingPhotos')} ({existingImages.length})
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  {existingImages.map((url, index) => {
                    const isCover = coverImageIndex === index;
                    return (
                      <div key={index} className="relative group">
                        <div className={`aspect-square rounded-xl overflow-hidden border-2 relative ${
                          isCover ? 'border-brand-primary border-4' : 'border-gray-200'
                        }`}>
                          <Image
                            src={url}
                            alt={`Existing ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          {isCover && (
                            <div className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-brand-primary text-white px-2 py-1 rounded text-[10px] sm:text-xs font-bold">
                              {t('admin.cover')}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="absolute top-1 right-1 sm:top-2 sm:right-2 w-6 h-6 sm:w-8 sm:h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-75 sm:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                        >
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        {!isCover && (
                          <button
                            type="button"
                            onClick={() => setExistingAsCover(index)}
                            className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-[10px] sm:text-xs font-semibold opacity-75 sm:opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          >
                            {t('admin.setAsCover')}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* New Images Upload */}
            <ImageUpload
              images={newImages}
              onImagesChange={(newImgs) => {
                setNewImages(newImgs);
                // Reset new cover index if images were removed
                if (newCoverImageIndex !== null && newCoverImageIndex >= newImgs.length) {
                  setNewCoverImageIndex(null);
                }
              }}
              coverImageIndex={newCoverImageIndex !== null ? newCoverImageIndex : -1}
              onCoverImageChange={(index) => {
                setNewCoverImageIndex(index);
                setCoverImageIndex(null); // Clear existing cover selection
              }}
              maxImages={10 - existingImages.length}
              translations={t}
            />
            {errors.images && (
              <p className="text-sm text-brand-danger">{errors.images}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-slate mb-2 sm:mb-3">
                {t('admin.status')}
              </label>
              <p className="text-xs sm:text-sm text-brand-gray mb-3 sm:mb-4">
                {t('admin.statusDescription')}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
              {(['active', 'sold', 'pending', 'rented', 'pledged'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFormData({ ...formData, status })}
                  className={`px-4 sm:px-6 py-3 sm:py-4 rounded-xl border-2 font-semibold transition-all text-sm sm:text-base ${
                    formData.status === status
                      ? 'border-brand-primary bg-brand-primary-soft text-brand-primary'
                      : 'border-gray-200 text-brand-gray hover:border-brand-primary hover:text-brand-primary'
                  }`}
                >
                  {t(`admin.statusOptions.${status}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Property Type */}
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-slate mb-2 sm:mb-3">
                {t('admin.propertyType')} *
              </label>
              <p className="text-xs sm:text-sm text-brand-gray mb-3 sm:mb-4">
                {t('admin.propertyTypeDescription')}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {(['rent', 'sale', 'bai-wafa', 'sharik-abad'] as PropertyType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, propertyType: type })}
                  className={`px-4 sm:px-6 py-3 sm:py-4 rounded-xl border-2 font-semibold transition-all text-sm sm:text-base ${
                    formData.propertyType === type
                      ? 'border-brand-primary bg-brand-primary-soft text-brand-primary'
                      : 'border-gray-200 text-brand-gray hover:border-brand-primary hover:text-brand-primary'
                  }`}
                >
                  {t(`admin.${type}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Property Category */}
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-slate mb-2 sm:mb-3">
                {t('admin.propertyCategory')}
              </label>
              <p className="text-xs sm:text-sm text-brand-gray mb-3 sm:mb-4">
                {t('admin.propertyCategoryDescription')}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {(['house', 'apartment', 'land', 'shop'] as PropertyCategory[]).map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setFormData({ ...formData, propertyCategory: category })}
                  className={`px-4 sm:px-6 py-3 sm:py-4 rounded-xl border-2 font-semibold transition-all text-sm sm:text-base ${
                    formData.propertyCategory === category
                      ? 'border-brand-primary bg-brand-primary-soft text-brand-primary'
                      : 'border-gray-200 text-brand-gray hover:border-brand-primary hover:text-brand-primary'
                  }`}
                >
                  {t(`admin.${category}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-brand-slate border-b border-gray-200 pb-2">
              {t('admin.basicInformation')}
            </h2>
            <p className="text-xs sm:text-sm text-brand-gray -mt-3 sm:-mt-4 mb-3 sm:mb-4">
              {t('admin.basicInformationDescription')}
            </p>

            <Input
              label={`${t('admin.title')} *`}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              error={errors.title}
              placeholder={t('admin.titlePlaceholder')}
            />

            <div>
              <label className="block text-sm font-medium text-brand-slate mb-2">
                {t('admin.description')} *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary-soft focus:outline-none transition-all"
                rows={6}
                placeholder={t('admin.descriptionPlaceholder')}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-brand-danger">{errors.description}</p>
              )}
            </div>

            <Input
              label={`${t('admin.price')} *`}
              type="number"
              value={formData.price || ''}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              error={errors.price}
              placeholder="0"
            />

            <Input
              label={t('admin.priceInDollar')}
              type="number"
              value={formData.priceInDollar || ''}
              onChange={(e) => setFormData({ ...formData, priceInDollar: e.target.value ? parseFloat(e.target.value) : undefined })}
              placeholder={t('admin.priceInDollarPlaceholder')}
            />

            {/* Badges */}
            <div>
              <label className="block text-sm font-medium text-brand-slate mb-3">
                {t('admin.badges')}
              </label>
              <p className="text-xs sm:text-sm text-brand-gray mb-3">
                {t('admin.badgesDescription')}
              </p>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isHot || false}
                    onChange={(e) => setFormData({ ...formData, isHot: e.target.checked })}
                    className="w-5 h-5 border-gray-300 rounded text-brand-primary focus:ring-brand-primary"
                  />
                  <span className="text-sm font-medium text-brand-slate flex items-center gap-1">
                    <span className="text-orange-600">🔥</span>
                    {t('listings.hot')}
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isVerified || false}
                    onChange={(e) => setFormData({ ...formData, isVerified: e.target.checked })}
                    className="w-5 h-5 border-gray-300 rounded text-brand-primary focus:ring-brand-primary"
                  />
                  <span className="text-sm font-medium text-brand-slate flex items-center gap-1">
                    <span className="text-green-600">✓</span>
                    {t('listings.verified')}
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPremium || false}
                    onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
                    className="w-5 h-5 border-gray-300 rounded text-brand-primary focus:ring-brand-primary"
                  />
                  <span className="text-sm font-medium text-brand-slate flex items-center gap-1">
                    <span className="text-blue-600">⭐</span>
                    {t('listings.premium')}
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured || false}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-5 h-5 border-gray-300 rounded text-brand-primary focus:ring-brand-primary"
                  />
                  <span className="text-sm font-medium text-brand-slate flex items-center gap-1">
                    <span className="text-blue-600">⭐</span>
                    Featured
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-brand-slate border-b border-gray-200 pb-2">
              {t('admin.propertyDetails')}
            </h2>
            <p className="text-xs sm:text-sm text-brand-gray -mt-3 sm:-mt-4 mb-3 sm:mb-4">
              {t('admin.propertyDetailsDescription')}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <Input
                label={t('admin.bedrooms')}
                type="number"
                value={formData.bedrooms || ''}
                onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) || 0 })}
                error={errors.bedrooms}
                placeholder="0"
              />

              <Input
                label={t('admin.bathrooms')}
                type="number"
                value={formData.bathrooms || ''}
                onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) || 0 })}
                error={errors.bathrooms}
                placeholder="0"
              />

              <Input
                label={t('admin.area')}
                type="number"
                value={formData.area || ''}
                onChange={(e) => setFormData({ ...formData, area: parseFloat(e.target.value) || 0 })}
                error={errors.area}
                placeholder="0"
              />

              <Input
                label={t('admin.yearBuilt')}
                type="number"
                value={formData.yearBuilt || ''}
                onChange={(e) => setFormData({ ...formData, yearBuilt: parseInt(e.target.value) || undefined })}
                placeholder="2024"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-brand-primary transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.parking || false}
                    onChange={(e) => setFormData({ ...formData, parking: e.target.checked })}
                    className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary rounded focus:ring-brand-primary flex-shrink-0"
                  />
                  <span className="text-sm sm:text-base font-medium text-brand-slate">{t('admin.parkingAvailable')}</span>
                </label>
              </div>

              <div>
                <label className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-brand-primary transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.furnished || false}
                    onChange={(e) => setFormData({ ...formData, furnished: e.target.checked })}
                    className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary rounded focus:ring-brand-primary flex-shrink-0"
                  />
                  <span className="text-sm sm:text-base font-medium text-brand-slate">{t('admin.furnished')}</span>
                </label>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-brand-slate border-b border-gray-200 pb-2">
              {t('admin.location')}
            </h2>
            <p className="text-xs sm:text-sm text-brand-gray -mt-3 sm:-mt-4 mb-3 sm:mb-4">
              {t('admin.locationDescription')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input
                label={`${t('admin.city')} *`}
                value={formData.location.city}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    location: { ...formData.location, city: e.target.value },
                  })
                }
                error={errors.city}
                placeholder={t('admin.cityPlaceholder')}
              />

              <div>
                <label className="block text-sm font-medium text-brand-slate mb-2">
                  {t('admin.district')} *
                </label>
                <select
                  value={formData.location.district || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location: { ...formData.location, district: e.target.value },
                    })
                  }
                  className={`w-full px-4 py-3.5 rounded-xl border-2 ${
                    errors.district
                      ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                      : 'border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary-soft'
                  } focus:outline-none transition-all bg-white text-brand-slate`}
                >
                  <option value="">{t('admin.selectDistrict')}</option>
                  {kabulDistricts.map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.name} - {district.nameEn}
                    </option>
                  ))}
                </select>
                {errors.district && (
                  <p className="mt-1 text-sm text-brand-danger">{errors.district}</p>
                )}
              </div>
            </div>

            <Input
              label={`${t('admin.streetAddress')} *`}
              value={formData.location.address}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  location: { ...formData.location, address: e.target.value },
                })
              }
              error={errors.address}
              placeholder={t('admin.streetAddressPlaceholder')}
            />

            <SimpleMapSelector
              latitude={formData.location.latitude}
              longitude={formData.location.longitude}
              onLocationSelect={(lat, lng) =>
                setFormData({
                  ...formData,
                  location: { ...formData.location, latitude: lat, longitude: lng },
                })
              }
              translations={t}
            />
          </div>

          {/* Contact Information */}
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-brand-slate border-b border-gray-200 pb-2">
              {t('admin.contactInformation')}
            </h2>
            <p className="text-xs sm:text-sm text-brand-gray -mt-3 sm:-mt-4 mb-3 sm:mb-4">
              {t('admin.contactInformationDescription')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input
                label={t('admin.phone')}
                type="tel"
                value={formData.contactPhone || ''}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder={t('admin.phonePlaceholder')}
              />

              <Input
                label={t('admin.whatsapp')}
                type="tel"
                value={formData.contactWhatsApp || ''}
                onChange={(e) => setFormData({ ...formData, contactWhatsApp: e.target.value })}
                placeholder={t('admin.whatsappPlaceholder')}
              />
            </div>

            <Input
              label={t('admin.email')}
              type="email"
              value={formData.contactEmail || ''}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              placeholder={t('admin.emailPlaceholder')}
            />
          </div>

          {/* Detailed Features */}
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-brand-slate border-b border-gray-200 pb-2 mb-3 sm:mb-4">
                {t('admin.additionalFeatures')}
              </h2>
              <p className="text-xs sm:text-sm text-brand-gray mb-3 sm:mb-4">
                {t('admin.additionalFeaturesDescription')}
              </p>
            </div>
            <DetailedListingForm
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              translations={t}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={() => router.back()} fullWidth className="text-sm sm:text-base py-3 sm:py-4">
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSaving} fullWidth className="text-sm sm:text-base py-3 sm:py-4">
              {isSaving ? t('admin.saving') : t('admin.saveChanges')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
