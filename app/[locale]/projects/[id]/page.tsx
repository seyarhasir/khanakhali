'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { projectsService } from '@/lib/services/projects.service';
import { Project } from '@/lib/types/project.types';
import { MapPin, Phone, Mail, Share2, ChevronLeft, ChevronRight, Bed, Bath, Home, Building2, Ruler, Building, Store, Landmark, Warehouse } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useToast } from '@/components/ui/Toast';

// Using iframe-based map instead of Leaflet for better reliability

export default function ProjectDetailPage() {
  const t = useTranslations();
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const toast = useToast();

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const id = params.id as string;
        const data = await projectsService.fetchProjectById(id);
        if (data) {
          setProject(data);
        } else {
          router.push(`/${locale}/projects`);
        }
      } catch (error: any) {
        console.error('Error fetching project:', error);
        router.push(`/${locale}/projects`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [params.id, router, locale]);

  // No map initialization needed - using iframe-based maps

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-brand-gray">{t('projects.loadingProject')}</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const images = project.imageUrls || [];
  const locationLabel = project.location?.district
    ? `${t(`districts.${project.location.district}`)}, ${project.location.city || 'Kabul'}`
    : project.location?.city || 'Kabul';

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleShare = async () => {
    const currentUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}${window.location.pathname}`
      : '';

    try {
      if (navigator.share) {
        await navigator.share({
          title: project.name,
          text: project.description,
          url: currentUrl,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(currentUrl);
        alert(t('projects.linkCopied'));
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-brand-primary hover:text-brand-navy font-semibold mb-4"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>{t('projects.back')}</span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Image Gallery */}
        {images.length > 0 && (
          <div className="relative mb-8 rounded-2xl overflow-hidden bg-gray-100">
            <div className="relative h-[400px] sm:h-[500px] md:h-[600px] w-full">
              <Image
                src={images[currentImageIndex]}
                alt={`${project.name} - Image ${currentImageIndex + 1}`}
                fill
                className="object-cover"
                priority
              />
              
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePreviousImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                  
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`h-2 rounded-full transition-all ${
                          index === currentImageIndex ? 'w-8 bg-white' : 'w-2 bg-white/50'
                        }`}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-brand-slate mb-2">{project.name}</h1>
                  <p className="text-lg text-gray-600">{t('projects.developerLabel')} {project.developer}</p>
                </div>
                {project.status && (
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    project.status === 'completed' ? 'bg-green-100 text-green-800' :
                    project.status === 'under-construction' ? 'bg-yellow-100 text-yellow-800' :
                    project.status === 'sold-out' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {t(`home.projectStatus.${project.status === 'completed' ? 'completed' :
                     project.status === 'under-construction' ? 'underConstruction' :
                     project.status === 'sold-out' ? 'soldOut' :
                     'upcoming'}`)}
                  </span>
                )}
              </div>

              {project.priceRange && project.priceRange.min !== undefined && project.priceRange.max !== undefined && (
                <div className="mt-4 p-4 bg-brand-primary-soft rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">{t('projects.priceRange')}</p>
                  <p className="text-2xl font-bold text-brand-primary">
                    {project.priceRange.min.toLocaleString()} - {project.priceRange.max.toLocaleString()} {t('common.currency')}
                  </p>
                  {project.priceInDollarRange && project.priceInDollarRange.min !== undefined && project.priceInDollarRange.max !== undefined && (
                    <p className="text-lg text-gray-700 mt-1">
                      ${project.priceInDollarRange.min.toLocaleString()} - ${project.priceInDollarRange.max.toLocaleString()} USD
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h2 className="text-2xl font-bold text-brand-slate mb-4">{t('projects.aboutProject')}</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{project.description}</p>
            </div>

            {/* Project Types */}
            {project.projectTypes && project.projectTypes.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-brand-slate mb-4 flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-brand-primary" />
                  {t('projects.availableTypes')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {project.projectTypes.map((pt, index) => {
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
                      <div key={index} className="p-5 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-3">
                          <PropertyIcon className="w-5 h-5 text-brand-primary" />
                          <h3 className="font-semibold text-lg">
                            {t(`projects.projectTypes.${pt.type}`) || pt.type}
                          </h3>
                        </div>
                        {showBedBathArea && (
                          <div className="flex items-center gap-4 mb-3 pb-3 border-b border-gray-100">
                            {pt.bedrooms !== undefined && (
                              <div className="flex items-center gap-2 text-gray-700">
                                <Bed className="w-4 h-4 text-brand-primary" />
                                <span className="text-sm font-medium">{pt.bedrooms} {t('projects.bedrooms')}</span>
                              </div>
                            )}
                            {pt.bathrooms !== undefined && (
                              <div className="flex items-center gap-2 text-gray-700">
                                <Bath className="w-4 h-4 text-brand-primary" />
                                <span className="text-sm font-medium">{pt.bathrooms} {t('projects.bathrooms')}</span>
                              </div>
                            )}
                            {pt.area !== undefined && (
                              <div className="flex items-center gap-2 text-gray-700">
                                <Ruler className="w-4 h-4 text-brand-primary" />
                                <span className="text-sm font-medium">{pt.area} m²</span>
                              </div>
                            )}
                          </div>
                        )}
                        {pt.priceRange && pt.priceRange.min !== undefined && pt.priceRange.max !== undefined && (
                          <p className="text-brand-primary font-semibold text-lg">
                            {pt.priceRange.min.toLocaleString()} - {pt.priceRange.max.toLocaleString()} {t('common.currency')}
                          </p>
                        )}
                        {pt.priceInDollarRange && pt.priceInDollarRange.min !== undefined && pt.priceInDollarRange.max !== undefined && (
                          <p className="text-sm text-gray-600 mt-1">
                            ${pt.priceInDollarRange.min.toLocaleString()} - ${pt.priceInDollarRange.max.toLocaleString()} USD
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Features */}
            {project.features && Object.keys(project.features).length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-brand-slate mb-4">{t('projects.features')}</h2>
                <div className="space-y-6">
                  {Object.entries(project.features).map(([key, value]) => {
                    if (!value || value.length === 0) return null;
                    // Map feature keys to translation keys
                    const translationKey = `projects.featureSections.${key}`;
                    const translatedLabel = t(translationKey);
                    const displayLabel = translatedLabel !== translationKey ? translatedLabel : key.replace(/([A-Z])/g, ' $1').trim();
                    return (
                      <div key={key}>
                        <h3 className="font-semibold text-lg mb-2">
                          {displayLabel}
                        </h3>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {value.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2 text-gray-700">
                              <span className="w-2 h-2 bg-brand-primary rounded-full"></span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Location */}
            <div>
              <h2 className="text-2xl font-bold text-brand-slate mb-4">{t('projects.location')}</h2>
              <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                <div className="flex items-center gap-2 text-gray-700 mb-2">
                  <MapPin className="w-5 h-5 text-brand-primary" />
                  <span>{locationLabel}</span>
                </div>
                {project.location.address && (
                  <p className="text-gray-600 ml-7">{project.location.address}</p>
                )}
              </div>
              
              {project.location.latitude && project.location.longitude && (
                <div 
                  className="relative w-full h-[400px] sm:h-[500px] rounded-lg overflow-hidden border border-gray-200" 
                >
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${project.location.longitude - 0.01},${project.location.latitude - 0.01},${project.location.longitude + 0.01},${project.location.latitude + 0.01}&layer=mapnik&marker=${project.location.latitude},${project.location.longitude}`}
                    title="Location Map"
                  />
                  <div className="absolute bottom-2 right-2 bg-white px-2 py-1 rounded text-xs shadow-md z-10">
                    <a 
                      href={`https://www.openstreetmap.org/?mlat=${project.location.latitude}&mlon=${project.location.longitude}&zoom=15`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {t('listings.viewLargerMap') || 'View Larger Map'}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Floor Plans */}
            {project.floorPlans && project.floorPlans.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-brand-slate mb-4">{t('projects.floorPlans')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {project.floorPlans.map((plan, index) => (
                    <div key={index} className="bg-white rounded-lg overflow-hidden border border-gray-200">
                      <div className="relative h-64 w-full">
                        <Image
                          src={plan.imageUrl}
                          alt={plan.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold mb-1">{plan.name}</h3>
                        {plan.description && (
                          <p className="text-sm text-gray-600">{plan.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Plans */}
            {project.paymentPlans && project.paymentPlans.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-brand-slate mb-4">{t('projects.paymentPlans')}</h2>
                <div className="space-y-4">
                  {project.paymentPlans.map((plan, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                      <h3 className="font-semibold mb-2">{plan.name}</h3>
                      {plan.description && (
                        <p className="text-gray-700 mb-2">{plan.description}</p>
                      )}
                      {plan.imageUrl && (
                        <div className="relative h-48 w-full mt-4 rounded overflow-hidden">
                          <Image
                            src={plan.imageUrl}
                            alt={plan.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
              <h3 className="text-xl font-bold text-brand-slate mb-4">{t('projects.contactInformation')}</h3>
              
              {project.contactPhone && (
                <a
                  href={`tel:${project.contactPhone}`}
                  className="flex items-center gap-3 p-3 bg-brand-secondary-soft hover:bg-brand-secondary rounded-lg mb-3 transition-colors"
                >
                  <Phone className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-600 font-medium">{project.contactPhone}</span>
                </a>
              )}

              {project.contactWhatsApp && (
                <a
                  href={`https://wa.me/${project.contactWhatsApp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg mb-3 transition-colors"
                >
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.372a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  <span className="text-green-600 font-medium">WhatsApp</span>
                </a>
              )}

              {project.contactEmail && (
                <a
                  href={`mailto:${project.contactEmail}`}
                  className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg mb-3 transition-colors"
                >
                  <Mail className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">{project.contactEmail}</span>
                </a>
              )}

              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 p-3 bg-brand-primary hover:bg-brand-navy text-white rounded-lg font-semibold transition-colors mt-4"
              >
                <Share2 className="w-5 h-5" />
                {t('projects.shareProject')}
              </button>
            </div>

            {/* Developer Info */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
              <h3 className="text-xl font-bold text-brand-slate mb-4">{t('projects.developer')}</h3>
              <p className="text-gray-700 mb-2">{project.developer}</p>
              {project.developedBy && (
                <p className="text-sm text-gray-600">{t('projects.developedBy')} {project.developedBy}</p>
              )}
              {project.marketedBy && (
                <p className="text-sm text-gray-600 mt-2">{t('projects.marketedBy')} {project.marketedBy}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

