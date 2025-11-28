'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { useToast } from '@/components/ui/Toast';

export default function NewListingPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const toast = useToast();

  useEffect(() => {
    // Wait for auth to finish loading before checking
    const { isLoading } = useAuthStore.getState();
    if (isLoading) return;

    if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'agent')) {
      router.push(`/${locale}/login`);
    }
  }, [user, isAuthenticated, router, locale]);

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
    isFeatured: false,
    contactPhone: '',
    contactWhatsApp: '',
    contactEmail: '',
  });

  const [images, setImages] = useState<File[]>([]);
  const [coverImageIndex, setCoverImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    if (images.length === 0) newErrors.images = t('admin.errors.photoRequired');
    if (formData.bedrooms && formData.bedrooms < 0) newErrors.bedrooms = t('admin.errors.bedroomsInvalid');
    if (formData.bathrooms && formData.bathrooms < 0) newErrors.bathrooms = t('admin.errors.bathroomsInvalid');
    if (formData.area && formData.area <= 0) newErrors.area = t('admin.errors.areaInvalid');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Critical: Prevent double submission
    if (!validateForm() || !user) return;
    if (isLoading) {
      console.log('⚠️ Already submitting, ignoring duplicate submission');
      return;
    }

    setIsLoading(true);
    console.log('✅ Starting submission for user role:', user.role);
    
    try {
      // Create listing first
      const listing = await listingsService.createListing(formData, user.uid, user.role || 'user', []);
      console.log('✅ Listing created:', listing.id, 'Status:', listing.status);
      
      // Upload images (reorder so cover image is first)
      if (images.length > 0) {
        // Reorder images: move cover image to first position
        const reorderedImages = [...images];
        if (coverImageIndex > 0 && coverImageIndex < reorderedImages.length) {
          const coverImage = reorderedImages[coverImageIndex];
          reorderedImages.splice(coverImageIndex, 1);
          reorderedImages.unshift(coverImage);
        }
        
        const imageUrls = await storageService.uploadListingImages(reorderedImages, listing.id);
        console.log('✅ Images uploaded:', imageUrls.length);
        // Update listing with image URLs (use admin role to avoid creating second approval)
        await listingsService.updateListing(listing.id, { id: listing.id }, 'admin', imageUrls);
      }
      
      // Show success message for agents
      if (user.role === 'agent') {
        toast.success('Listing submitted successfully! Waiting for admin approval.');
      } else {
        toast.success('Listing created successfully!');
      }
      
      // Small delay before navigation to prevent double-click issues
      await new Promise(resolve => setTimeout(resolve, 300));
      router.push(`/${locale}/admin`);
    } catch (error: any) {
      console.error('❌ Submission error:', error);
      toast.error(error.message || t('admin.errors.createFailed'));
      setIsLoading(false); // Re-enable button only on error
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-brand-slate mb-2">{t('admin.createListing')}</h1>
          <p className="text-sm sm:text-base text-brand-gray">{t('admin.createListingSubtitle')}</p>
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
            <ImageUpload
              images={images}
              onImagesChange={(newImages) => {
                setImages(newImages);
                // Reset cover index if images were removed
                if (coverImageIndex >= newImages.length) {
                  setCoverImageIndex(0);
                }
              }}
              coverImageIndex={coverImageIndex}
              onCoverImageChange={setCoverImageIndex}
              maxImages={10}
              translations={t}
            />
            {errors.images && (
              <p className="text-sm text-brand-danger">{errors.images}</p>
            )}
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
            <Button type="submit" disabled={isLoading} fullWidth className="text-sm sm:text-base py-3 sm:py-4">
              {isLoading ? t('admin.creating') : t('admin.createListing')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
