'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';
import { authService } from '@/lib/services/auth.service';
import { userService } from '@/lib/services/user.service';
import { listingsService } from '@/lib/services/listings.service';
import { storageService } from '@/lib/services/storage.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ListingCard } from '@/components/listings/ListingCard';
import { Listing } from '@/lib/types/listing.types';
import { User } from '@/lib/types/user.types';
import { Camera, Edit2, Save, X, Phone, MessageCircle, Mail, Building, Briefcase, Award, Star, Heart } from 'lucide-react';

export default function ProfilePage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { user: currentUser, isAuthenticated, logout, favorites, setUser: setAuthUser, refreshUser } = useAuthStore();
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    displayName: '',
    phone: '',
    whatsApp: '',
    bio: '',
    company: '',
    experience: '',
    specialties: [] as string[],
  });

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      router.push(`/${locale}/login`);
      return;
    }

    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const userData = await userService.fetchUserById(currentUser.uid);
        if (userData) {
          setUser(userData);
          setFormData({
            displayName: userData.displayName || '',
            phone: userData.phone || '',
            whatsApp: userData.whatsApp || '',
            bio: userData.bio || '',
            company: userData.company || '',
            experience: userData.experience || '',
            specialties: userData.specialties || [],
          });
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [isAuthenticated, currentUser, locale, router]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      const fetchListings = async () => {
        try {
          setIsLoadingListings(true);
          const userListings = await listingsService.fetchAdminListings(user.uid);
          setListings(userListings);
        } catch (error) {
          console.error('Error fetching listings:', error);
        } finally {
          setIsLoadingListings(false);
        }
      };
      fetchListings();
    }
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      let profileImageUrl = user.profileImageUrl;

      // Validate display name
      if (!formData.displayName || !formData.displayName.trim()) {
        setIsSaving(false);
        alert(t('profile.nameRequired') || 'Name is required');
        return;
      }

      // Upload profile image if changed
      if (profileImageFile) {
        try {
          profileImageUrl = await storageService.uploadProfileImage(profileImageFile, user.uid);
        } catch (imageError: any) {
          console.error('Error uploading image:', imageError);
          throw new Error(imageError?.message || 'Failed to upload profile image');
        }
      }

      // Prepare update data - only include fields that have values or are being cleared
      const updateData: any = {
        displayName: formData.displayName.trim(),
      };

      // Add optional fields only if they have values
      if (formData.phone) updateData.phone = formData.phone.trim();
      if (formData.whatsApp) updateData.whatsApp = formData.whatsApp.trim();
      if (formData.bio) updateData.bio = formData.bio.trim();
      if (formData.company) updateData.company = formData.company.trim();
      if (formData.experience) updateData.experience = formData.experience.trim();
      if (formData.specialties && formData.specialties.length > 0) {
        updateData.specialties = formData.specialties;
      }
      if (profileImageUrl) updateData.profileImageUrl = profileImageUrl;

      // Update user profile
      await userService.updateUserProfile(user.uid, updateData);

      // Refresh user data
      const updatedUser = await userService.fetchUserById(user.uid);
      if (updatedUser) {
        setUser(updatedUser);
        // Update auth store
        setAuthUser(updatedUser);
      }

      setIsEditing(false);
      setProfileImageFile(null);
      setProfileImagePreview(null);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      
      // Better error logging
      let errorDetails: any = {};
      if (error) {
        if (typeof error === 'object') {
          errorDetails = {
            code: error.code,
            message: error.message,
            name: error.name,
            stack: error.stack,
          };
        } else {
          errorDetails = { error };
        }
      }
      console.error('Error details:', errorDetails);
      
      // Get user-friendly error message
      let errorMessage = 'Failed to save profile. Please try again.';
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        phone: user.phone || '',
        whatsApp: user.whatsApp || '',
        bio: user.bio || '',
        company: user.company || '',
        experience: user.experience || '',
        specialties: user.specialties || [],
      });
    }
    setIsEditing(false);
    setProfileImageFile(null);
    setProfileImagePreview(null);
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      logout();
      router.push(`/${locale}`);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!isAuthenticated || !user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-brand-gray">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  const isAgent = user.role === 'admin' || user.role === 'agent';
  const favoriteListings: Listing[] = []; // Would need to fetch favorite listings

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-brand-navy to-brand-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
            {/* Profile Picture */}
            <div className="relative">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-xl bg-white">
                {isEditing && profileImagePreview ? (
                  <Image src={profileImagePreview} alt={user.displayName} width={160} height={160} className="w-full h-full object-cover" />
                ) : user.profileImageUrl ? (
                  <Image src={user.profileImageUrl} alt={user.displayName} width={160} height={160} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-brand-primary flex items-center justify-center text-white text-4xl md:text-5xl font-bold">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-brand-primary p-3 rounded-full cursor-pointer hover:bg-brand-navy transition-colors shadow-lg">
                  <Camera className="w-5 h-5 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              {isEditing ? (
                <Input
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="text-3xl md:text-4xl font-bold mb-2 bg-white/95 border-white text-brand-slate placeholder:text-gray-400"
                  placeholder={t('profile.name')}
                />
              ) : (
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{user.displayName}</h1>
              )}
              <p className="text-white/90 mb-4">{user.email}</p>
              <div className="flex items-center justify-center md:justify-start gap-4 flex-wrap">
                <span className={`inline-block px-4 py-2 backdrop-blur-sm rounded-full text-sm font-semibold ${
                  user.role === 'admin' ? 'bg-brand-primary/40' : 
                  user.role === 'agent' ? 'bg-yellow-600/40' : 
                  'bg-white/20'
                }`}>
                  {user.role === 'admin' ? t('profile.admin') : 
                   user.role === 'agent' ? 'Agent' : 
                   t('profile.user')}
                </span>
                {isAgent && user.company && (
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm">
                    <Building className="w-4 h-4" />
                    {isEditing ? (
                      <Input
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="bg-white/95 border-white text-brand-slate placeholder:text-gray-400 w-32"
                        placeholder={t('profile.company')}
                      />
                    ) : (
                      user.company
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-white text-brand-navy hover:bg-gray-50 font-semibold shadow-lg disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? t('common.loading') : t('profile.save')}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="border-2 border-white/80 bg-white/20 text-white hover:bg-white/30 hover:border-white backdrop-blur-sm"
                  >
                    <X className="w-4 h-4 mr-2" />
                    {t('profile.cancel')}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-white text-brand-navy hover:bg-gray-50 font-semibold shadow-lg"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  {t('profile.edit')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Details */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-brand-slate mb-4">{t('profile.contactInfo')}</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-brand-primary flex-shrink-0" />
                  {isEditing ? (
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder={t('profile.phone')}
                      className="flex-1"
                    />
                  ) : (
                    <span className="text-brand-gray">{user.phone || t('profile.notProvided')}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  {isEditing ? (
                    <Input
                      value={formData.whatsApp}
                      onChange={(e) => setFormData({ ...formData, whatsApp: e.target.value })}
                      placeholder={t('profile.whatsapp')}
                      className="flex-1"
                    />
                  ) : (
                    <span className="text-brand-gray">{user.whatsApp || t('profile.notProvided')}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-brand-primary flex-shrink-0" />
                  <span className="text-brand-gray">{user.email}</span>
                </div>
              </div>
            </div>

            {/* Agent Specific Info */}
            {isAgent && (
              <>
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-brand-slate mb-4">{t('profile.professionalInfo')}</h2>
                  <div className="space-y-4">
                    {isEditing ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-brand-slate mb-2">{t('profile.bio')}</label>
                          <textarea
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            placeholder={t('profile.bioPlaceholder')}
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary-soft focus:outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-brand-slate mb-2">{t('profile.experience')}</label>
                          <Input
                            value={formData.experience}
                            onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                            placeholder={t('profile.experiencePlaceholder')}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        {user.bio && (
                          <div>
                            <p className="text-brand-gray text-sm leading-relaxed">{user.bio}</p>
                          </div>
                        )}
                        {user.experience && (
                          <div className="flex items-center gap-2">
                            <Award className="w-5 h-5 text-brand-primary" />
                            <span className="text-brand-gray">{user.experience}</span>
                          </div>
                        )}
                        {user.specialties && user.specialties.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-brand-slate mb-2">{t('profile.specialties')}</p>
                            <div className="flex flex-wrap gap-2">
                              {user.specialties.map((specialty, index) => (
                                <span key={index} className="px-3 py-1 bg-brand-primary-soft text-brand-primary rounded-full text-xs font-medium">
                                  {specialty}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Account Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <Button variant="danger" onClick={handleLogout} fullWidth>
                {t('profile.logout')}
              </Button>
            </div>
          </div>

          {/* Right Column - Listings */}
          <div className="lg:col-span-2">
            {isAgent ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-brand-slate">
                    {t('profile.myListings')}
                  </h2>
                  <Link href={`/${locale}/admin/listings/new`}>
                    <Button>
                      {t('admin.addNewListing')}
                    </Button>
                  </Link>
                </div>
                {isLoadingListings ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-96 bg-gray-200 animate-pulse rounded-2xl" />
                    ))}
                  </div>
                ) : listings.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                    <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-brand-slate mb-2">{t('profile.noListings')}</h3>
                    <p className="text-brand-gray mb-6">{t('profile.createFirstListing')}</p>
                    <Link href={`/${locale}/admin/listings/new`}>
                      <Button>{t('admin.addNewListing')}</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {listings.map((listing) => (
                      <ListingCard key={listing.id} listing={listing} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-brand-slate mb-6 flex items-center gap-2">
                  <Heart className="w-6 h-6 text-red-500" />
                  {t('profile.favorites')}
                </h2>
                {favorites.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                    <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-brand-slate mb-2">{t('profile.noFavorites')}</h3>
                    <p className="text-brand-gray mb-6">{t('profile.startExploring')}</p>
                    <Link href={`/${locale}`}>
                      <Button>{t('profile.browseProperties')}</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Would need to fetch favorite listings */}
                    <p className="text-brand-gray">{t('profile.favoritesComingSoon')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
