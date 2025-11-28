'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { userService } from '@/lib/services/user.service';
import { listingsService } from '@/lib/services/listings.service';
import { User } from '@/lib/types/user.types';
import { Listing } from '@/lib/types/listing.types';
import { ListingCard } from '@/components/listings/ListingCard';
import { Phone, MessageCircle, Mail, Building, Briefcase, Award } from 'lucide-react';

export default function PublicProfilePage() {
  const t = useTranslations();
  const locale = useLocale();
  const params = useParams();
  const uid = params.uid as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingListings, setIsLoadingListings] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!uid) return;

      try {
        setIsLoading(true);
        const userData = await userService.fetchUserById(uid);
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [uid]);

  useEffect(() => {
    const fetchUserListings = async () => {
      if (!uid) return;

      try {
        setIsLoadingListings(true);
        const userListings = await listingsService.fetchAdminListings(uid);
        // Filter out pending/deleted listings for public view
        const activeListings = userListings.filter(
          (listing) => !listing.pendingApproval && !listing.pendingDelete && listing.status === 'active'
        );
        setListings(activeListings);
      } catch (error) {
        console.error('Error fetching listings:', error);
      } finally {
        setIsLoadingListings(false);
      }
    };

    fetchUserListings();
  }, [uid]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-brand-gray">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-brand-slate mb-2">Profile Not Found</h1>
          <p className="text-brand-gray">This user profile does not exist.</p>
        </div>
      </div>
    );
  }

  const isAgent = user.role === 'admin' || user.role === 'agent';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Profile Header */}
      <div className="relative bg-gradient-to-r from-brand-primary to-brand-darker text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
            {/* Profile Image */}
            <div className="relative">
              {user.profileImageUrl ? (
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-xl">
                  <Image
                    src={user.profileImageUrl}
                    alt={user.displayName}
                    width={160}
                    height={160}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-brand-secondary flex items-center justify-center border-4 border-white shadow-xl">
                  <span className="text-5xl md:text-6xl font-bold text-brand-slate">
                    {user.displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{user.displayName}</h1>
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
                    {user.company}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Contact & Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Information */}
            {(user.phone || user.whatsApp || user.email) && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-brand-slate mb-4">{t('profile.contactInfo')}</h2>
                <div className="space-y-3">
                  {user.phone && (
                    <a href={`tel:${user.phone}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <Phone className="w-5 h-5 text-brand-primary" />
                      <span className="text-brand-slate">{user.phone}</span>
                    </a>
                  )}
                  {user.whatsApp && (
                    <a href={`https://wa.me/${user.whatsApp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                      <MessageCircle className="w-5 h-5 text-green-600" />
                      <span className="text-brand-slate">{user.whatsApp}</span>
                    </a>
                  )}
                  {user.email && (
                    <a href={`mailto:${user.email}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <Mail className="w-5 h-5 text-brand-primary" />
                      <span className="text-brand-slate break-all">{user.email}</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Professional Info */}
            {isAgent && (user.experience || user.bio) && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-brand-slate mb-4">{t('profile.professionalInfo')}</h2>
                <div className="space-y-4">
                  {user.experience && (
                    <div className="flex items-start gap-3">
                      <Briefcase className="w-5 h-5 text-brand-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-brand-gray mb-1">{t('profile.experience')}</p>
                        <p className="text-brand-slate font-medium">{user.experience}</p>
                      </div>
                    </div>
                  )}
                  {user.bio && (
                    <div>
                      <p className="text-sm text-brand-gray mb-2">{t('profile.bio')}</p>
                      <p className="text-brand-slate">{user.bio}</p>
                    </div>
                  )}
                  {user.specialties && user.specialties.length > 0 && (
                    <div>
                      <p className="text-sm text-brand-gray mb-2 flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        {t('profile.specialties')}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {user.specialties.map((specialty, index) => (
                          <span key={index} className="px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-sm">
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Listings */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl md:text-3xl font-bold text-brand-slate mb-6">
              {isAgent ? t('profile.myListings') : 'Listings'} ({listings.length})
            </h2>

            {isLoadingListings ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-brand-gray">Loading listings...</p>
              </div>
            ) : listings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-brand-slate mb-2">{t('profile.noListings')}</h3>
                <p className="text-brand-gray">No active listings at the moment</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

