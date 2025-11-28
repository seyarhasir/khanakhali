'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useAuthStore } from '@/lib/store/authStore';
import { listingsService } from '@/lib/services/listings.service';
import { Listing } from '@/lib/types/listing.types';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, XCircle, AlertCircle, Trash2, Edit3 } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/components/ui/Toast';

export default function ApprovalsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const toast = useToast();
  const [pendingListings, setPendingListings] = useState<Listing[]>([]);
  const [pendingDeletes, setPendingDeletes] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to finish loading before checking
    if (authLoading) return;

    if (!isAuthenticated || user?.role !== 'admin') {
      router.push(`/${locale}/login`);
      return;
    }

    const fetchPendingActions = async () => {
      try {
        setIsLoading(true);
        const [approvals, deletes] = await Promise.all([
          listingsService.fetchPendingApprovals(),
          listingsService.fetchPendingDeletes(),
        ]);
        setPendingListings(approvals);
        setPendingDeletes(deletes);
      } catch (error) {
        console.error('Error fetching pending actions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingActions();
  }, [user, isAuthenticated, router, locale]);

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  const handleApproveNew = async (id: string) => {
    try {
      await listingsService.approveNewListing(id);
      setPendingListings(pendingListings.filter(l => l.id !== id));
      toast.success('Listing approved successfully!');
    } catch (error) {
      console.error('Error approving listing:', error);
      toast.error('Failed to approve listing');
    }
  };

  const handleRejectNew = async (id: string) => {
    try {
      await listingsService.rejectNewListing(id);
      setPendingListings(pendingListings.filter(l => l.id !== id));
      toast.success('Listing rejected and deleted');
    } catch (error) {
      console.error('Error rejecting listing:', error);
      toast.error('Failed to reject listing');
    }
  };

  const handleApproveEdit = async (id: string) => {
    try {
      await listingsService.approveEdit(id);
      setPendingListings(pendingListings.filter(l => l.id !== id));
      toast.success('Edit approved successfully!');
    } catch (error) {
      console.error('Error approving edit:', error);
      toast.error('Failed to approve edit');
    }
  };

  const handleRejectEdit = async (id: string) => {
    try {
      await listingsService.rejectEdit(id);
      setPendingListings(pendingListings.filter(l => l.id !== id));
      toast.success('Edit rejected');
    } catch (error) {
      console.error('Error rejecting edit:', error);
      toast.error('Failed to reject edit');
    }
  };

  const handleApproveDelete = async (id: string) => {
    try {
      await listingsService.approveDelete(id);
      setPendingDeletes(pendingDeletes.filter(l => l.id !== id));
      toast.success('Delete approved successfully!');
    } catch (error) {
      console.error('Error approving delete:', error);
      toast.error('Failed to approve delete');
    }
  };

  const handleRejectDelete = async (id: string) => {
    try {
      await listingsService.rejectDelete(id);
      setPendingDeletes(pendingDeletes.filter(l => l.id !== id));
      toast.success('Delete request rejected');
    } catch (error) {
      console.error('Error rejecting delete:', error);
      toast.error('Failed to reject delete');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-brand-gray">Loading pending approvals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-brand-slate mb-2">{t('admin.pendingApprovals')}</h1>
        <p className="text-brand-gray">{t('admin.reviewAgentActions')}</p>
      </div>

      {/* Pending New Listings & Edits */}
      {pendingListings.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-brand-slate mb-6 flex items-center gap-2">
            <Edit3 className="w-6 h-6 text-blue-600" />
            {t('admin.newListingsEdits')} ({pendingListings.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingListings.map((listing) => (
              <div key={listing.id} className="bg-white rounded-xl shadow-lg border-2 border-yellow-300 overflow-hidden">
                <div className="bg-yellow-50 p-3 border-b border-yellow-200 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <span className="font-semibold text-yellow-800">
                    {listing.originalData ? t('admin.editPending') : t('admin.newListingPending')}
                  </span>
                </div>
                <div className="p-4">
                  {listing.imageUrls && listing.imageUrls.length > 0 && (
                    <div className="relative h-48 mb-4 rounded-lg overflow-hidden">
                      <Image
                        src={listing.imageUrls[0]}
                        alt={listing.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-brand-slate mb-2">{listing.title}</h3>
                  <p className="text-brand-gray text-sm mb-3 line-clamp-2">{listing.description}</p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-bold text-brand-primary">
                      {listing.price.toLocaleString()} {t('common.currency')}
                    </span>
                    <span className="text-sm text-brand-gray">
                      ID: {listing.propertyId || listing.id}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => listing.originalData ? handleApproveEdit(listing.id) : handleApproveNew(listing.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {t('admin.approve')}
                    </Button>
                    <Button
                      onClick={() => listing.originalData ? handleRejectEdit(listing.id) : handleRejectNew(listing.id)}
                      variant="outline"
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      {t('admin.reject')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Deletes */}
      {pendingDeletes.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-brand-slate mb-6 flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-red-600" />
            {t('admin.deleteRequests')} ({pendingDeletes.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingDeletes.map((listing) => (
              <div key={listing.id} className="bg-white rounded-xl shadow-lg border-2 border-red-300 overflow-hidden">
                <div className="bg-red-50 p-3 border-b border-red-200 flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-600" />
                  <span className="font-semibold text-red-800">{t('admin.deleteRequest')}</span>
                </div>
                <div className="p-4">
                  {listing.imageUrls && listing.imageUrls.length > 0 && (
                    <div className="relative h-48 mb-4 rounded-lg overflow-hidden">
                      <Image
                        src={listing.imageUrls[0]}
                        alt={listing.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-brand-slate mb-2">{listing.title}</h3>
                  <p className="text-brand-gray text-sm mb-3 line-clamp-2">{listing.description}</p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-bold text-brand-primary">
                      {listing.price.toLocaleString()} {t('common.currency')}
                    </span>
                    <span className="text-sm text-brand-gray">
                      ID: {listing.propertyId || listing.id}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApproveDelete(listing.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {t('admin.approveDelete')}
                    </Button>
                    <Button
                      onClick={() => handleRejectDelete(listing.id)}
                      variant="outline"
                      className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      {t('admin.keepListing')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {pendingListings.length === 0 && pendingDeletes.length === 0 && (
        <div className="bg-white rounded-2xl p-16 text-center border-2 border-gray-200">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-brand-slate mb-3">{t('admin.allCaughtUp')}</h3>
          <p className="text-brand-gray text-lg">{t('admin.noPendingApprovals')}</p>
        </div>
      )}
    </div>
  );
}

