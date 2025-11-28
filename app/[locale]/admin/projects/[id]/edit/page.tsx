'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store/authStore';
import { projectsService } from '@/lib/services/projects.service';
import { storageService } from '@/lib/services/storage.service';
import { CreateProjectInput } from '@/lib/types/project.types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { SimpleMapSelector } from '@/components/admin/SimpleMapSelector';
import { kabulDistricts } from '@/lib/utils/districts';
import Image from 'next/image';
import { useToast } from '@/components/ui/Toast';

export default function EditProjectPage() {
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

  const [formData, setFormData] = useState<CreateProjectInput>({
    name: '',
    description: '',
    developer: '',
    location: {
      address: '',
      city: 'Kabul',
      state: 'Kabul',
      zipCode: '',
      district: '',
      latitude: 34.5553,
      longitude: 69.2075,
    },
    projectTypes: [],
    priceRange: undefined,
    priceInDollarRange: undefined,
    features: {},
    status: 'upcoming',
    developedBy: '',
    contactPhone: '',
    contactWhatsApp: '',
    contactEmail: '',
  });

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [coverImageIndex, setCoverImageIndex] = useState<number | null>(null);
  const [newCoverImageIndex, setNewCoverImageIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newProjectType, setNewProjectType] = useState<'apartment' | 'penthouse' | 'office' | 'commercial' | 'plot' | 'villa'>('apartment');
  const [newProjectTypeMinPrice, setNewProjectTypeMinPrice] = useState('');
  const [newProjectTypeMaxPrice, setNewProjectTypeMaxPrice] = useState('');
  const [newProjectTypeMinDollar, setNewProjectTypeMinDollar] = useState('');
  const [newProjectTypeMaxDollar, setNewProjectTypeMaxDollar] = useState('');

  useEffect(() => {
    const fetchProject = async () => {
      if (!params.id || !isAuthenticated || (user?.role !== 'admin' && user?.role !== 'agent')) return;

      try {
        const id = params.id as string;
        const data = await projectsService.fetchProjectById(id);
        if (data) {
          const imageUrls = data.imageUrls || [];
          setExistingImages(imageUrls);
          setCoverImageIndex(imageUrls.length > 0 ? 0 : null);
          setNewCoverImageIndex(null);
          setFormData({
            name: data.name,
            description: data.description,
            developer: data.developer,
            location: data.location || {
              address: '',
              city: 'Kabul',
              state: 'Kabul',
              zipCode: '',
              district: '',
              latitude: 34.5553,
              longitude: 69.2075,
            },
            projectTypes: data.projectTypes || [],
            priceRange: data.priceRange,
            priceInDollarRange: data.priceInDollarRange,
            features: data.features || {},
            status: data.status,
            developedBy: data.developedBy,
            contactPhone: data.contactPhone || '',
            contactWhatsApp: data.contactWhatsApp || '',
            contactEmail: data.contactEmail || '',
            marketedBy: data.marketedBy,
          });
        }
      } catch (error: any) {
        console.error('Error fetching project:', error);
        alert('Failed to load project');
        router.push(`/${locale}/admin`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [params.id, isAuthenticated, user, router, locale]);

  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'agent')) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-brand-gray">Loading project...</p>
        </div>
      </div>
    );
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Project name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.developer.trim()) newErrors.developer = 'Developer name is required';
    if (!formData.developedBy.trim()) newErrors.developedBy = 'Developed by is required';
    if (!formData.location.city.trim()) newErrors.city = 'City is required';
    if (!formData.location.district) newErrors.district = 'District is required';
    if (!formData.location.address.trim()) newErrors.address = 'Address is required';
    if (existingImages.length === 0 && newImages.length === 0) newErrors.images = 'At least one photo is required';
    if (formData.projectTypes.length === 0) newErrors.projectTypes = 'At least one project type is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddProjectType = () => {
    const projectType = {
      type: newProjectType,
      priceRange: newProjectTypeMinPrice && newProjectTypeMaxPrice ? {
        min: parseFloat(newProjectTypeMinPrice),
        max: parseFloat(newProjectTypeMaxPrice),
      } : undefined,
      priceInDollarRange: newProjectTypeMinDollar && newProjectTypeMaxDollar ? {
        min: parseFloat(newProjectTypeMinDollar),
        max: parseFloat(newProjectTypeMaxDollar),
      } : undefined,
    };

    setFormData({
      ...formData,
      projectTypes: [...formData.projectTypes, projectType],
    });

    setNewProjectType('apartment');
    setNewProjectTypeMinPrice('');
    setNewProjectTypeMaxPrice('');
    setNewProjectTypeMinDollar('');
    setNewProjectTypeMaxDollar('');
  };

  const handleRemoveProjectType = (index: number) => {
    setFormData({
      ...formData,
      projectTypes: formData.projectTypes.filter((_, i) => i !== index),
    });
  };

  const handleRemoveExistingImage = (index: number) => {
    const updated = existingImages.filter((_, i) => i !== index);
    setExistingImages(updated);
    if (coverImageIndex === index) {
      setCoverImageIndex(updated.length > 0 ? 0 : null);
    } else if (coverImageIndex !== null && coverImageIndex > index) {
      setCoverImageIndex(coverImageIndex - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !params.id) return;

    setIsSaving(true);
    try {
      const projectId = params.id as string;
      let allImages = [...existingImages];

      // Upload new images
      if (newImages.length > 0) {
        const uploadedUrls = await storageService.uploadListingImages(newImages, projectId);
        allImages = [...allImages, ...uploadedUrls];
      }

      // Reorder images: cover image first
      if (coverImageIndex !== null || newCoverImageIndex !== null) {
        const coverIndex = newCoverImageIndex !== null
          ? existingImages.length + newCoverImageIndex
          : coverImageIndex!;
        
        if (coverIndex >= 0 && coverIndex < allImages.length) {
          const coverImage = allImages[coverIndex];
          allImages.splice(coverIndex, 1);
          allImages.unshift(coverImage);
        }
      }

      // Update project
      await projectsService.updateProject(projectId, { id: projectId, ...formData }, allImages);
      
      router.push(`/${locale}/admin`);
    } catch (error: any) {
      alert(error.message || 'Failed to update project');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-brand-slate mb-2">Edit Project</h1>
          <p className="text-sm sm:text-base text-brand-gray">Update project information</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-brand-slate border-b border-gray-200 pb-2">Existing Photos</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {existingImages.map((url, index) => (
                  <div key={index} className="relative group">
                    <div className="relative h-32 w-full rounded-lg overflow-hidden">
                      <Image src={url} alt={`Existing ${index + 1}`} fill className="object-cover" />
                      {coverImageIndex === index && (
                        <div className="absolute top-2 left-2 bg-brand-primary text-white px-2 py-1 rounded text-xs font-semibold">
                          Cover
                        </div>
                      )}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCoverImageIndex(index)}
                        className="flex-1 text-xs py-1 px-2 bg-gray-100 hover:bg-gray-200 rounded"
                      >
                        Set Cover
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(index)}
                        className="text-xs py-1 px-2 bg-red-100 hover:bg-red-200 text-red-600 rounded"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Photos */}
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-brand-slate border-b border-gray-200 pb-2">
              {existingImages.length > 0 ? 'Add More Photos' : 'Photos *'}
            </h2>
            <ImageUpload
              images={newImages}
              onImagesChange={(newImgs) => {
                setNewImages(newImgs);
                if (newCoverImageIndex !== null && newCoverImageIndex >= newImgs.length) {
                  setNewCoverImageIndex(null);
                }
              }}
              coverImageIndex={newCoverImageIndex || 0}
              onCoverImageChange={(idx) => setNewCoverImageIndex(idx)}
              maxImages={20}
              translations={t}
            />
            {errors.images && <p className="text-red-500 text-sm mt-2">{errors.images}</p>}
          </div>

          {/* Basic Information */}
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-brand-slate border-b border-gray-200 pb-2">Basic Information</h2>
            
            <div>
              <label className="block text-sm font-medium text-brand-slate mb-2">Project Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter project name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-slate mb-2">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter project description"
                rows={6}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-brand-slate mb-2">Developer *</label>
                <Input
                  value={formData.developer}
                  onChange={(e) => setFormData({ ...formData, developer: e.target.value })}
                  placeholder="Developer name"
                  className={errors.developer ? 'border-red-500' : ''}
                />
                {errors.developer && <p className="text-red-500 text-sm mt-1">{errors.developer}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-slate mb-2">Developed By *</label>
                <Input
                  value={formData.developedBy}
                  onChange={(e) => setFormData({ ...formData, developedBy: e.target.value })}
                  placeholder="Company name"
                  className={errors.developedBy ? 'border-red-500' : ''}
                />
                {errors.developedBy && <p className="text-red-500 text-sm mt-1">{errors.developedBy}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-slate mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="upcoming">Upcoming</option>
                <option value="under-construction">Under Construction</option>
                <option value="completed">Completed</option>
                <option value="sold-out">Sold Out</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-brand-slate border-b border-gray-200 pb-2">Location</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-brand-slate mb-2">City *</label>
                <Input
                  value={formData.location.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location: { ...formData.location, city: e.target.value },
                    })
                  }
                  placeholder="City"
                  className={errors.city ? 'border-red-500' : ''}
                />
                {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-slate mb-2">District *</label>
                <select
                  value={formData.location.district || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location: { ...formData.location, district: e.target.value },
                    })
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary ${
                    errors.district ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select District</option>
                  {kabulDistricts.map((district) => (
                    <option key={district.id} value={district.id}>
                      {locale === 'fa' ? district.name : district.nameEn}
                    </option>
                  ))}
                </select>
                {errors.district && <p className="text-red-500 text-sm mt-1">{errors.district}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-slate mb-2">Street Address *</label>
              <Input
                value={formData.location.address}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    location: { ...formData.location, address: e.target.value },
                  })
                }
                placeholder="Street address"
                className={errors.address ? 'border-red-500' : ''}
              />
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
            </div>

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

          {/* Project Types */}
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-brand-slate border-b border-gray-200 pb-2">Project Types *</h2>
            {errors.projectTypes && <p className="text-red-500 text-sm">{errors.projectTypes}</p>}
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-slate mb-2">Type</label>
                  <select
                    value={newProjectType}
                    onChange={(e) => setNewProjectType(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    <option value="apartment">Apartment</option>
                    <option value="penthouse">Penthouse</option>
                    <option value="office">Office</option>
                    <option value="commercial">Commercial</option>
                    <option value="plot">Plot</option>
                    <option value="villa">Villa</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={handleAddProjectType}
                    className="w-full"
                  >
                    Add Type
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-slate mb-2">Min Price ({t('common.currency')})</label>
                  <Input
                    type="number"
                    value={newProjectTypeMinPrice}
                    onChange={(e) => setNewProjectTypeMinPrice(e.target.value)}
                    placeholder="Min price"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-slate mb-2">Max Price ({t('common.currency')})</label>
                  <Input
                    type="number"
                    value={newProjectTypeMaxPrice}
                    onChange={(e) => setNewProjectTypeMaxPrice(e.target.value)}
                    placeholder="Max price"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-slate mb-2">Min Price (USD)</label>
                  <Input
                    type="number"
                    value={newProjectTypeMinDollar}
                    onChange={(e) => setNewProjectTypeMinDollar(e.target.value)}
                    placeholder="Min price USD"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-slate mb-2">Max Price (USD)</label>
                  <Input
                    type="number"
                    value={newProjectTypeMaxDollar}
                    onChange={(e) => setNewProjectTypeMaxDollar(e.target.value)}
                    placeholder="Max price USD"
                  />
                </div>
              </div>
            </div>

            {/* List of added project types */}
            {formData.projectTypes.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-brand-slate">Added Types:</h3>
                {formData.projectTypes.map((pt, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div>
                      <span className="font-medium capitalize">{pt.type}</span>
                      {pt.priceRange && (
                        <span className="ml-2 text-sm text-gray-600">
                          {pt.priceRange.min.toLocaleString()} - {pt.priceRange.max.toLocaleString()} {t('common.currency')}
                        </span>
                      )}
                      {pt.priceInDollarRange && (
                        <span className="ml-2 text-sm text-gray-600">
                          (${pt.priceInDollarRange.min.toLocaleString()} - ${pt.priceInDollarRange.max.toLocaleString()})
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveProjectType(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Overall Price Range */}
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-brand-slate border-b border-gray-200 pb-2">Overall Price Range (Optional)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-brand-slate mb-2">Min Price ({t('common.currency')})</label>
                <Input
                  type="number"
                  value={formData.priceRange?.min || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    priceRange: {
                      ...formData.priceRange,
                      min: e.target.value ? parseFloat(e.target.value) : undefined,
                      max: formData.priceRange?.max,
                    } as any,
                  })}
                  placeholder="Min price"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-slate mb-2">Max Price ({t('common.currency')})</label>
                <Input
                  type="number"
                  value={formData.priceRange?.max || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    priceRange: {
                      ...formData.priceRange,
                      min: formData.priceRange?.min,
                      max: e.target.value ? parseFloat(e.target.value) : undefined,
                    } as any,
                  })}
                  placeholder="Max price"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-slate mb-2">Min Price (USD)</label>
                <Input
                  type="number"
                  value={formData.priceInDollarRange?.min || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    priceInDollarRange: {
                      ...formData.priceInDollarRange,
                      min: e.target.value ? parseFloat(e.target.value) : undefined,
                      max: formData.priceInDollarRange?.max,
                    } as any,
                  })}
                  placeholder="Min price USD"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-slate mb-2">Max Price (USD)</label>
                <Input
                  type="number"
                  value={formData.priceInDollarRange?.max || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    priceInDollarRange: {
                      ...formData.priceInDollarRange,
                      min: formData.priceInDollarRange?.min,
                      max: e.target.value ? parseFloat(e.target.value) : undefined,
                    } as any,
                  })}
                  placeholder="Max price USD"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-brand-slate border-b border-gray-200 pb-2">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-brand-slate mb-2">Phone</label>
                <Input
                  value={formData.contactPhone || ''}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-slate mb-2">WhatsApp</label>
                <Input
                  value={formData.contactWhatsApp || ''}
                  onChange={(e) => setFormData({ ...formData, contactWhatsApp: e.target.value })}
                  placeholder="WhatsApp number"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-brand-slate mb-2">Email</label>
                <Input
                  type="email"
                  value={formData.contactEmail || ''}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="Email address"
                />
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-brand-slate border-b border-gray-200 pb-2">Features (Optional)</h2>
            <div className="space-y-4">
              {['mainFeatures', 'businessAndCommunication', 'healthcareAndRecreation', 'communityFeatures', 'nearbyFacilities', 'otherFacilities'].map((featureKey) => (
                <div key={featureKey}>
                  <label className="block text-sm font-medium text-brand-slate mb-2 capitalize">
                    {featureKey.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <textarea
                    value={(formData.features as any)[featureKey]?.join(', ') || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      features: {
                        ...formData.features,
                        [featureKey]: e.target.value.split(',').map(s => s.trim()).filter(s => s),
                      },
                    })}
                    placeholder="Enter features separated by commas"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200">
            <Button
              type="submit"
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              onClick={() => router.back()}
              variant="outline"
              className="sm:w-auto"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

