'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';
import { listingsService } from '@/lib/services/listings.service';
import { projectsService } from '@/lib/services/projects.service';
import { Listing } from '@/lib/types/listing.types';
import { Project } from '@/lib/types/project.types';
import { ListingCard } from '@/components/listings/ListingCard';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';

export default function AdminPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [listings, setListings] = useState<Listing[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'listings' | 'projects'>('listings');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
      return;
    }

    if (user?.role !== 'admin' && user?.role !== 'agent') {
      router.push(`/${locale}`);
      return;
    }

    const fetchData = async () => {
      try {
        if (user) {
          const [listingsData, projectsData] = await Promise.all([
            listingsService.fetchAdminListings(user.uid).catch((err) => {
              console.error('Error fetching listings:', err);
              return [];
            }),
            projectsService.fetchAdminProjects(user.uid).catch((err) => {
              console.error('Error fetching projects:', err);
              return [];
            }),
          ]);
          setListings(listingsData);
          setProjects(projectsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, isAuthenticated, router, locale]);

  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'agent')) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-slate mb-2">{t('admin.adminDashboard')}</h1>
          <p className="text-sm sm:text-base text-brand-gray">{t('admin.manageListings')}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {user?.role === 'admin' && (
            <Link href={`/${locale}/admin/approvals`} className="flex-1 sm:flex-none">
              <Button variant="outline" className="w-full sm:w-auto text-sm sm:text-base border-yellow-400 text-yellow-700 hover:bg-yellow-50 whitespace-nowrap">
                {t('admin.pendingApprovals')}
              </Button>
            </Link>
          )}
          {activeTab === 'listings' ? (
            <Link href={`/${locale}/admin/listings/new`} className="flex-1 sm:flex-none">
              <Button className="w-full sm:w-auto text-sm sm:text-base">{t('admin.addNewListing')}</Button>
            </Link>
          ) : (
            <Link href={`/${locale}/admin/projects/new`} className="flex-1 sm:flex-none">
              <Button className="w-full sm:w-auto text-sm sm:text-base">{t('admin.addNewProject')}</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('listings')}
          className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
            activeTab === 'listings'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-gray-500 hover:text-brand-slate'
          }`}
        >
          {t('admin.listings')} ({listings.length})
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
            activeTab === 'projects'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-gray-500 hover:text-brand-slate'
          }`}
        >
          {t('admin.projects')} ({projects.length})
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-brand-soft animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : activeTab === 'listings' ? (
        listings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <p className="text-brand-gray text-lg mb-4">{t('admin.noListingsYet')}</p>
            <Link href={`/${locale}/admin/listings/new`}>
              <Button>{t('admin.createFirstListing')}</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <div key={listing.id} className="relative">
                <ListingCard listing={listing} />
                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <Link href={`/${locale}/admin/listings/${listing.id}/edit`} className="flex-1">
                    <Button variant="outline" fullWidth className="text-sm sm:text-base py-2 sm:py-3">{t('common.edit')}</Button>
                  </Link>
                  <Button
                    variant="danger"
                    fullWidth
                    className="text-sm sm:text-base py-2 sm:py-3"
                    onClick={async () => {
                      const confirmed = await confirm({
                        title: 'Delete Listing',
                        message: 'Are you sure you want to delete this listing? This action cannot be undone.',
                        confirmText: 'Delete',
                        type: 'danger',
                      });
                      
                      if (confirmed) {
                        try {
                          await listingsService.deleteListing(listing.id, user?.role || 'user');
                          setListings(listings.filter((l) => l.id !== listing.id));
                          toast.success('Listing deleted successfully');
                        } catch (error) {
                          console.error('Error deleting listing:', error);
                          toast.error('Failed to delete listing');
                        }
                      }
                    }}
                  >
                    {t('common.delete')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        projects.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <p className="text-brand-gray text-lg mb-4">{t('admin.noProjectsYet')}</p>
            <Link href={`/${locale}/admin/projects/new`}>
              <Button>Create First Project</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all border border-gray-200">
                {project.imageUrls && project.imageUrls.length > 0 && (
                  <div className="relative h-48 w-full">
                    <Image
                      src={project.imageUrls[0]}
                      alt={project.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-brand-slate mb-2">{project.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">Developer: {project.developer}</p>
                  {project.priceRange && project.priceRange.min !== undefined && project.priceRange.max !== undefined && (
                    <p className="text-base font-semibold text-brand-primary mb-2">
                      {project.priceRange.min.toLocaleString()} - {project.priceRange.max.toLocaleString()} {t('common.currency')}
                    </p>
                  )}
                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    <Link href={`/${locale}/admin/projects/${project.id}/edit`} className="flex-1">
                      <Button variant="outline" fullWidth className="text-sm py-2">{t('common.edit')}</Button>
                    </Link>
                    <Button
                      variant="danger"
                      fullWidth
                      className="text-sm py-2"
                      onClick={async () => {
                        const confirmed = await confirm({
                          title: 'Delete Project',
                          message: 'Are you sure you want to delete this project? This action cannot be undone.',
                          confirmText: 'Delete',
                          type: 'danger',
                        });
                        
                        if (confirmed) {
                          try {
                            await projectsService.deleteProject(project.id);
                            setProjects(projects.filter((p) => p.id !== project.id));
                            toast.success('Project deleted successfully');
                          } catch (error) {
                            console.error('Error deleting project:', error);
                            toast.error('Failed to delete project');
                          }
                        }
                      }}
                    >
                      {t('common.delete')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
