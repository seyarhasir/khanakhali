'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { projectsService } from '@/lib/services/projects.service';
import { Project } from '@/lib/types/project.types';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { Building2, Sparkles } from 'lucide-react';

export default function ProjectsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        const data = await projectsService.fetchProjects();
        setProjects(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch projects');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-brand-primary-soft rounded-full">
              <Building2 className="w-8 h-8 text-brand-primary" />
            </div>
            <Sparkles className="w-6 h-6 text-brand-primary hidden sm:block" />
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-brand-slate mb-4">
            {t('projects.pageTitle')}
          </h1>
          <p className="text-lg md:text-xl text-brand-gray max-w-2xl mx-auto">
            {t('projects.pageSubtitle')}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-96 bg-brand-soft animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 font-semibold text-lg">{error}</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border-2 border-brand-soft">
            <div className="w-20 h-20 bg-brand-primary-soft rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-brand-slate mb-3">{t('projects.noProjectsAvailable')}</h3>
            <p className="text-brand-gray text-lg">{t('projects.checkBackSoon')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

