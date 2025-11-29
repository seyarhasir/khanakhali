'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Project } from '@/lib/types/project.types';
import { MapPin, Building2, ArrowRight, ImageIcon, CheckCircle2, Clock, XCircle, Calendar, Bed, Bath, Home, Ruler, Sparkles, Building, Store, Landmark, Warehouse } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const t = useTranslations();
  const locale = useLocale();
  
  const coverImage = project.imageUrls && project.imageUrls.length > 0 ? project.imageUrls[0] : null;
  const imageCount = project.imageUrls?.length || 0;
  const locationLabel = project.location?.district
    ? `${t(`districts.${project.location.district}`)}, ${project.location.city || t('home.city')}`
    : project.location?.city || t('home.city');

  const getStatusConfig = () => {
    switch (project.status) {
      case 'completed':
        return {
          bg: 'bg-emerald-500',
          textColor: 'text-emerald-700',
          bgLight: 'bg-emerald-50',
          icon: CheckCircle2,
          text: t('home.projectStatus.completed')
        };
      case 'under-construction':
        return {
          bg: 'bg-amber-500',
          textColor: 'text-amber-700',
          bgLight: 'bg-amber-50',
          icon: Clock,
          text: t('home.projectStatus.underConstruction')
        };
      case 'sold-out':
        return {
          bg: 'bg-red-500',
          textColor: 'text-red-700',
          bgLight: 'bg-red-50',
          icon: XCircle,
          text: t('home.projectStatus.soldOut')
        };
      default:
        return {
          bg: 'bg-blue-500',
          textColor: 'text-blue-700',
          bgLight: 'bg-blue-50',
          icon: Calendar,
          text: t('home.projectStatus.upcoming')
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <Link
      href={`/${locale}/projects/${project.id}`}
      className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer border border-gray-100 h-full flex flex-col hover:-translate-y-3 hover:scale-[1.02]"
    >
      {/* Image Section */}
      {coverImage ? (
        <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100">
          <Image
            src={coverImage}
            alt={project.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
            priority
            quality={95}
          />
          
          {/* Multi-layer gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Status Badge - Enhanced */}
          {project.status && (
            <div className="absolute top-3 right-3 z-20">
              <div className={`${statusConfig.bg} text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-xl backdrop-blur-md flex items-center gap-1.5 border border-white/20 transform group-hover:scale-105 transition-transform duration-300`}>
                <StatusIcon className="w-3.5 h-3.5" />
                <span>{statusConfig.text}</span>
              </div>
            </div>
          )}

          {/* Image Count Badge - Enhanced */}
          {imageCount > 0 && (
            <div className="absolute bottom-3 left-3 z-20">
              <div className="bg-black/80 backdrop-blur-md text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xl border border-white/10 transform group-hover:scale-105 transition-transform duration-300">
                <ImageIcon className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">{imageCount}</span>
              </div>
            </div>
          )}
          
          {/* Shine effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1500 ease-in-out pointer-events-none" />
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 flex flex-col items-center justify-center relative">
          <div className="flex flex-col items-center gap-4">
            <div className="p-5 bg-white/60 rounded-2xl backdrop-blur-md shadow-lg border border-white/50">
              <ImageIcon className="w-14 h-14 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 font-semibold">{t('listings.noImages')}</p>
          </div>
          {project.status && (
            <div className="absolute top-5 right-5">
              <div className={`${statusConfig.bg} text-white px-4 py-2.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-2`}>
                <StatusIcon className="w-4 h-4" />
                <span>{statusConfig.text}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content Section */}
      <div className="p-4 lg:p-5 flex-1 flex flex-col bg-gradient-to-b from-white to-gray-50/50">
        {/* Title */}
        <h3 className="text-lg lg:text-xl font-bold text-brand-slate mb-2 group-hover:text-brand-primary transition-colors duration-300 line-clamp-2 leading-tight">
          {project.name}
        </h3>
        
        {/* Developer - Enhanced */}
        <div className="mb-2 flex items-center gap-2">
          <div className="p-1.5 bg-brand-primary-soft rounded-lg">
            <Building2 className="w-4 h-4 text-brand-primary" />
          </div>
          <p className="text-sm text-gray-700 font-semibold truncate">
            {t('home.by')} <span className="text-brand-primary">{project.developer}</span>
          </p>
        </div>
        
        {/* Price - Enhanced */}
        {project.priceRange && project.priceRange.min !== undefined && project.priceRange.max !== undefined && (
          <div className="mb-3 pb-3 border-b border-gray-100">
            <div className="flex items-baseline gap-2 mb-1">
              <p className="text-xl lg:text-xl font-bold text-brand-primary">
                {project.priceRange.min.toLocaleString()} - {project.priceRange.max.toLocaleString()}
              </p>
              <span className="text-sm font-semibold text-gray-600">{t('common.currency')}</span>
            </div>
            {project.priceInDollarRange && project.priceInDollarRange.min !== undefined && project.priceInDollarRange.max !== undefined && (
              <p className="text-xs text-gray-600 font-medium">
                ${project.priceInDollarRange.min.toLocaleString()} - ${project.priceInDollarRange.max.toLocaleString()} USD
              </p>
            )}
          </div>
        )}

        {/* Location - Enhanced */}
        <div className="flex items-start gap-2 text-sm text-gray-700 mb-3">
          <div className="p-1.5 bg-gray-100 rounded-lg mt-0.5">
            <MapPin className="w-4 h-4 text-gray-600" />
          </div>
          <span className="line-clamp-2 font-medium leading-relaxed">{locationLabel}</span>
        </div>

        {/* Project Types - Enhanced */}
        {project.projectTypes && project.projectTypes.length > 0 && (
          <div className={`flex flex-wrap gap-2 mb-0 ${project.projectTypes.length <= 2 ? 'justify-start' : ''}`}>
            {project.projectTypes.slice(0, 3).map((pt, index) => {
              const showBedBathArea = (pt.type === 'apartment' || pt.type === 'penthouse' || pt.type === 'villa') && 
                                      (pt.bedrooms !== undefined || pt.bathrooms !== undefined || pt.area !== undefined);
              
              // Get icon for each property type
              const getPropertyTypeIcon = () => {
                switch (pt.type) {
                  case 'apartment':
                    return Building;
                  case 'penthouse':
                    return Landmark;
                  case 'villa':
                    return Home;
                  case 'office':
                    return Building2;
                  case 'commercial':
                    return Store;
                  case 'plot':
                    return Warehouse;
                  default:
                    return Home;
                }
              };
              
              const PropertyIcon = getPropertyTypeIcon();
              
              return (
                <div
                  key={index}
                  className={`px-3 py-1.5 rounded-lg border border-brand-primary/30 shadow-sm hover:shadow-md transition-shadow duration-300 ${
                    showBedBathArea 
                      ? 'bg-gradient-to-r from-brand-primary-soft to-brand-primary-soft/50 flex items-center justify-between gap-2 min-w-full' 
                      : 'bg-brand-primary-soft/50 inline-flex items-center gap-2'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-brand-primary/10 rounded-md">
                      <PropertyIcon className="w-3.5 h-3.5 text-brand-primary" />
                    </div>
                    <span className="text-xs font-bold text-brand-primary whitespace-nowrap">
                      {t(`projects.projectTypes.${pt.type}`) || pt.type}
                    </span>
                  </div>
                  {showBedBathArea && (
                    <div className="flex items-center gap-2 text-xs text-gray-700 flex-wrap">
                      {pt.bedrooms !== undefined && (
                        <div className="flex items-center gap-1 bg-white/60 px-1.5 py-0.5 rounded-md">
                          <Bed className="w-3 h-3 text-brand-primary" />
                          <span className="font-semibold">{pt.bedrooms} {t('projects.bed')}</span>
                        </div>
                      )}
                      {pt.bathrooms !== undefined && (
                        <div className="flex items-center gap-1 bg-white/60 px-1.5 py-0.5 rounded-md">
                          <Bath className="w-3 h-3 text-brand-primary" />
                          <span className="font-semibold">{pt.bathrooms} {t('projects.bath')}</span>
                        </div>
                      )}
                      {pt.area !== undefined && (
                        <div className="flex items-center gap-1 bg-white/60 px-1.5 py-0.5 rounded-md">
                          <Ruler className="w-3 h-3 text-brand-primary" />
                          <span className="font-semibold">{pt.area} m²</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {project.projectTypes.length > 3 && (
              <div className="px-3 py-1.5 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
                  +{project.projectTypes.length - 3} {t('common.more') || 'more'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};
