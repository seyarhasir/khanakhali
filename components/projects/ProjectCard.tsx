'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Project } from '@/lib/types/project.types';
import { MapPin, Building2, ArrowRight, ImageIcon, CheckCircle2, Clock, XCircle, Calendar } from 'lucide-react';

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
          bg: 'bg-green-500',
          icon: CheckCircle2,
          text: t('home.projectStatus.completed')
        };
      case 'under-construction':
        return {
          bg: 'bg-yellow-500',
          icon: Clock,
          text: t('home.projectStatus.underConstruction')
        };
      case 'sold-out':
        return {
          bg: 'bg-red-500',
          icon: XCircle,
          text: t('home.projectStatus.soldOut')
        };
      default:
        return {
          bg: 'bg-blue-500',
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
      className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-200 h-full flex flex-col hover:-translate-y-1"
    >
      {/* Image Section */}
      {coverImage ? (
        <div className="relative h-64 w-full overflow-hidden bg-gray-100">
          <Image
            src={coverImage}
            alt={project.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700"
            priority
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Status Badge */}
          {project.status && (
            <div className="absolute top-3 right-3 z-10">
              <div className={`${statusConfig.bg} text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-xl backdrop-blur-sm flex items-center gap-1.5`}>
                <StatusIcon className="w-3.5 h-3.5" />
                <span>{statusConfig.text}</span>
              </div>
            </div>
          )}

          {/* Image Count Badge */}
          {imageCount > 0 && (
            <div className="absolute bottom-3 left-3 z-10">
              <div className="bg-black/70 backdrop-blur-sm text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg">
                <ImageIcon className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">{imageCount}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="h-64 bg-gray-100 flex flex-col items-center justify-center relative">
          <ImageIcon className="w-16 h-16 text-gray-400" />
          {project.status && (
            <div className="absolute top-3 right-3">
              <div className={`${statusConfig.bg} text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-xl flex items-center gap-1.5`}>
                <StatusIcon className="w-3.5 h-3.5" />
                <span>{statusConfig.text}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content Section */}
      <div className="p-5 lg:p-6 flex-1 flex flex-col">
        {/* Title */}
        <h3 className="text-xl lg:text-2xl font-bold text-brand-slate mb-2 group-hover:text-brand-primary transition-colors line-clamp-2 leading-tight">
          {project.name}
        </h3>
        
        {/* Developer */}
        <div className="mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <p className="text-sm text-gray-600 font-medium truncate">
            {t('home.by')} {project.developer}
          </p>
        </div>
        
        {/* Price */}
        {project.priceRange && project.priceRange.min !== undefined && project.priceRange.max !== undefined && (
          <div className="mb-4 pb-4 border-b border-gray-100">
            <p className="text-2xl lg:text-3xl font-bold text-brand-primary mb-1">
              {project.priceRange.min.toLocaleString()} - {project.priceRange.max.toLocaleString()} <span className="text-lg lg:text-xl">{t('common.currency')}</span>
            </p>
            {project.priceInDollarRange && project.priceInDollarRange.min !== undefined && project.priceInDollarRange.max !== undefined && (
              <p className="text-sm lg:text-base text-gray-600 font-medium">
                ${project.priceInDollarRange.min.toLocaleString()} - ${project.priceInDollarRange.max.toLocaleString()} USD
              </p>
            )}
          </div>
        )}

        {/* Location */}
        <div className="flex items-start gap-2 text-sm text-gray-600 mb-4">
          <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
          <span className="line-clamp-2">{locationLabel}</span>
        </div>

        {/* Project Types */}
        {project.projectTypes && project.projectTypes.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {project.projectTypes.slice(0, 3).map((pt, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-brand-primary-soft text-brand-primary rounded-lg text-xs font-semibold capitalize border border-brand-primary/20"
              >
                {pt.type}
              </span>
            ))}
            {project.projectTypes.length > 3 && (
              <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold border border-gray-200">
                +{project.projectTypes.length - 3}
              </span>
            )}
          </div>
        )}

        {/* View Details CTA */}
        <div className="mt-auto pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between group/cta">
            <span className="text-sm lg:text-base text-brand-primary font-semibold group-hover/cta:underline transition-all">
              {t('home.viewDetails')}
            </span>
            <div className="w-8 h-8 rounded-full bg-brand-primary-soft flex items-center justify-center group-hover/cta:bg-brand-primary group-hover/cta:scale-110 transition-all duration-300">
              <ArrowRight className="w-4 h-4 text-brand-primary group-hover/cta:text-white transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

