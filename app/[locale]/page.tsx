'use client';

import React, { useEffect, useState, useMemo, useRef, Suspense } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { listingsService } from '@/lib/services/listings.service';
import { projectsService } from '@/lib/services/projects.service';
import type { Listing, PropertyType } from '@/lib/types/listing.types';
import { Project } from '@/lib/types/project.types';
import { ListingCard } from '@/components/listings/ListingCard';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { Button } from '@/components/ui/Button';
import { kabulDistricts } from '@/lib/utils/districts';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Featured Projects Slider Component
function FeaturedProjectsSlider({ projects }: { projects: Project[] }) {
  const t = useTranslations();
  const locale = useLocale();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      const threshold = 5; // Small threshold to account for rounding
      setCanScrollLeft(scrollLeft > threshold);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - threshold);
    }
  };

  useEffect(() => {
    // Initial check after render
    const timer = setTimeout(() => {
      checkScrollButtons();
    }, 100);

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);
      return () => {
        clearTimeout(timer);
        container.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
  }, [projects]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth = container.querySelector('.project-card')?.clientWidth || 400;
      const gap = 24; // gap-6 = 24px
      const scrollAmount = cardWidth + gap;
      
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="bg-brand-secondary-soft py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-brand-slate mb-4">
            {t('home.featuredProjects')}
          </h2>
          <p className="text-lg md:text-xl text-brand-gray max-w-2xl mx-auto">
            {t('home.featuredProjectsSubtitle')}
          </p>
        </div>

        {/* Slider Container */}
        <div className="relative">
          {/* Navigation Buttons */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all hover:scale-110 border border-gray-200 hidden md:flex items-center justify-center"
              aria-label="Previous projects"
            >
              <ChevronLeft className="w-6 h-6 text-brand-slate" />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all hover:scale-110 border border-gray-200 hidden md:flex items-center justify-center"
              aria-label="Next projects"
            >
              <ChevronRight className="w-6 h-6 text-brand-slate" />
            </button>
          )}

          {/* Scrollable Container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto pb-4 scroll-smooth hide-scrollbar"
            style={{
              WebkitOverflowScrolling: 'touch',
            }}
            onScroll={checkScrollButtons}
          >
            {projects.map((project) => (
              <div
                key={project.id}
                className="project-card flex-shrink-0 w-[90vw] sm:w-[400px] md:w-[420px] lg:w-[380px]"
              >
                <ProjectCard project={project} />
              </div>
            ))}
          </div>
        </div>

        {/* View All Button */}
        {projects.length > 0 && (
          <div className="text-center mt-8">
            <Link href={`/${locale}/projects`}>
              <Button className="px-8 py-3 text-base font-semibold">
                {t('home.viewAllProjects')} ({projects.length})
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function HomePageContent() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchId, setSearchId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // Filter states - initialize from URL query params
  const [selectedPropertyType, setSelectedPropertyType] = useState<'rent' | 'sale' | 'bai-wafa' | 'sharik-abad' | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'house' | 'apartment' | 'land' | 'shop'>('all');
  
  // Use refs to prevent infinite loops
  const isRestoringRef = useRef(false);
  const isUpdatingUrlRef = useRef(false);
  
  // Hero slider state
  const [currentSlide, setCurrentSlide] = useState(0);
  const heroImages = ['/home/IMG_8816.png', '/home/IMG_8817.png', '/home/PHOTO-2025-11-24-21-11-03.jpg'];

  // Initialize filters from URL or sessionStorage (only on mount)
  useEffect(() => {
    // Check if we have stored filters from a listing detail page
    const storedFilters = typeof window !== 'undefined' 
      ? sessionStorage.getItem('listingBackFilters')
      : null;
    
    if (storedFilters) {
      isRestoringRef.current = true;
      
      // Parse stored filters and apply them
      const params = new URLSearchParams(storedFilters);
      const propertyType = params.get('propertyType') as 'rent' | 'sale' | 'pledge' | null;
      const district = params.get('district');
      const category = params.get('category') as 'all' | 'house' | 'apartment' | 'land' | 'shop' | null;
      
      // Update state (map legacy 'pledge' to 'bai-wafa')
      if (propertyType) {
        if (propertyType === 'pledge') {
          setSelectedPropertyType('bai-wafa');
        } else if (['rent', 'sale', 'bai-wafa', 'sharik-abad'].includes(propertyType)) {
          setSelectedPropertyType(propertyType as 'rent' | 'sale' | 'bai-wafa' | 'sharik-abad');
        }
      }
      if (district) {
        setSelectedDistrict(district);
      }
      if (category && ['all', 'house', 'apartment', 'land', 'shop'].includes(category)) {
        setSelectedCategory(category);
      }
      
      // Clear stored filters
      sessionStorage.removeItem('listingBackFilters');
      
      // Update URL synchronously without triggering navigation
      const newParams = new URLSearchParams();
      if (propertyType) newParams.set('propertyType', propertyType);
      if (district) newParams.set('district', district);
      if (category && category !== 'all') newParams.set('category', category);
      const newQuery = newParams.toString();
      const newUrl = newQuery ? `/${locale}?${newQuery}` : `/${locale}`;
      
      // Use replaceState to update URL without triggering React navigation
      window.history.replaceState({}, '', newUrl);
      
      // Reset flag after a short delay
      setTimeout(() => {
        isRestoringRef.current = false;
      }, 100);
      return;
    }
    
    // Otherwise, read from URL query params
    const propertyType = searchParams.get('propertyType');
    const district = searchParams.get('district');
    const category = searchParams.get('category') as 'all' | 'house' | 'apartment' | 'land' | 'shop' | null;
    
    // Map legacy 'pledge' to 'bai-wafa' and validate property type
    if (propertyType) {
      if (propertyType === 'pledge') {
        setSelectedPropertyType('bai-wafa');
      } else if (['rent', 'sale', 'bai-wafa', 'sharik-abad'].includes(propertyType)) {
        setSelectedPropertyType(propertyType as 'rent' | 'sale' | 'bai-wafa' | 'sharik-abad');
      }
    }
    if (district) {
      setSelectedDistrict(district);
    }
    if (category && ['all', 'house', 'apartment', 'land', 'shop'].includes(category)) {
      setSelectedCategory(category);
    }
  }, []); // Only run once on mount

  // Sync filters with URL query params when URL changes (but skip if we're restoring)
  useEffect(() => {
    if (isRestoringRef.current) return; // Skip during restoration
    if (isUpdatingUrlRef.current) return; // Skip if we're updating URL ourselves
    
    const propertyType = searchParams.get('propertyType') as 'rent' | 'sale' | 'pledge' | null;
    const district = searchParams.get('district');
    const category = searchParams.get('category') as 'all' | 'house' | 'apartment' | 'land' | 'shop' | null;
    
    // Only update if different to prevent loops (map legacy 'pledge' to 'bai-wafa')
    if (propertyType) {
      const mappedType = propertyType === 'pledge' ? 'bai-wafa' : propertyType;
      if (['rent', 'sale', 'bai-wafa', 'sharik-abad'].includes(mappedType)) {
        if (selectedPropertyType !== mappedType) {
          setSelectedPropertyType(mappedType as 'rent' | 'sale' | 'bai-wafa' | 'sharik-abad');
        }
      }
    } else if (!propertyType && selectedPropertyType !== null) {
      setSelectedPropertyType(null);
    }
    
    if (district && selectedDistrict !== district) {
      setSelectedDistrict(district);
    } else if (!district && selectedDistrict !== null) {
      setSelectedDistrict(null);
    }
    
    if (category && ['all', 'house', 'apartment', 'land', 'shop'].includes(category)) {
      if (selectedCategory !== category) {
        setSelectedCategory(category);
      }
    } else if (!category && selectedCategory !== 'all') {
      setSelectedCategory('all');
    }
  }, [searchParams]); // Run when searchParams change

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [listingsData, projectsData] = await Promise.all([
          listingsService.fetchListings().catch(() => []),
          projectsService.fetchProjects().catch(() => []),
        ]);
        setListings(listingsData);
        setProjects(projectsData);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update URL when filters change (write to URL) - but skip if restoring or if URL already matches
  useEffect(() => {
    if (isRestoringRef.current) return; // Skip during restoration
    if (isUpdatingUrlRef.current) return; // Skip if already updating
    
    const params = new URLSearchParams();
    
    if (selectedPropertyType) {
      params.set('propertyType', selectedPropertyType);
    }
    if (selectedDistrict) {
      params.set('district', selectedDistrict);
    }
    if (selectedCategory && selectedCategory !== 'all') {
      params.set('category', selectedCategory);
    }
    
    const newQuery = params.toString();
    const currentQuery = searchParams.toString();
    
    // Only update URL if query string is different
    if (newQuery !== currentQuery) {
      isUpdatingUrlRef.current = true;
      const newUrl = newQuery ? `/${locale}?${newQuery}` : `/${locale}`;
      
      // Use push() instead of replace() to create proper history entries
      // This allows back button to work correctly
      router.push(newUrl, { scroll: false });
      
      // Reset flag after navigation completes
      setTimeout(() => {
        isUpdatingUrlRef.current = false;
      }, 50);
    }
  }, [selectedPropertyType, selectedDistrict, selectedCategory, locale, router, searchParams]);

  // Auto-slide hero images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [heroImages.length]);

  // Count listings by district & property type
  const districtListingCounts = useMemo(() => {
    const counts: Record<string, Record<PropertyType, number>> = {};

    listings.forEach((listing) => {
      const districtId = listing.location?.district;
      if (!districtId) return;

      if (!counts[districtId]) {
        counts[districtId] = { rent: 0, sale: 0, pledge: 0, 'bai-wafa': 0, 'sharik-abad': 0 };
      }

      // Map 'pledge' to 'bai-wafa' for counting
      const propertyType = listing.propertyType === 'pledge' ? 'bai-wafa' : listing.propertyType;
      counts[districtId][propertyType] =
        (counts[districtId][propertyType] ?? 0) + 1;
    });

    return counts;
  }, [listings]);

  // Filter listings based on selected property type, district, and category
  const filteredListings = useMemo(() => {
    if (!selectedPropertyType || !selectedDistrict) {
      return [];
    }
    
    return listings.filter((listing) => {
      // Map 'pledge' to 'bai-wafa' for filtering
      const listingPropertyType = listing.propertyType === 'pledge' ? 'bai-wafa' : listing.propertyType;
      const matchesPropertyType = listingPropertyType === selectedPropertyType;
      const matchesDistrict = selectedDistrict === 'all' || listing.location?.district === selectedDistrict;
      const matchesCategory = selectedCategory === 'all' || listing.propertyCategory === selectedCategory;
      return matchesPropertyType && matchesDistrict && matchesCategory && listing.status === 'active';
    });
  }, [listings, selectedPropertyType, selectedDistrict, selectedCategory]);

  // Get featured listings (6 max: prioritize admin-selected, then latest)
  const featuredListings = useMemo(() => {
    const featured = listings.filter(listing => listing.status === 'active' && listing.isFeatured);
    
    // If we have 6 or more featured listings, return latest 6
    if (featured.length >= 6) {
      return featured
        .sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 6);
    }
    
    // If less than 6, fill with random active listings
    if (featured.length < 6) {
      const nonFeatured = listings.filter(
        listing => listing.status === 'active' && !listing.isFeatured
      );
      const shuffled = [...nonFeatured].sort(() => Math.random() - 0.5);
      const needed = 6 - featured.length;
      return [...featured, ...shuffled.slice(0, needed)];
    }
    
    return featured;
  }, [listings]);

  const handleSearchById = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    const searchTerm = searchId.trim();

    try {
      let listing = null;
      
      // Check if search term looks like a propertyId (M1000 or AM1000 format)
      if (searchTerm.match(/^(?:M|AM)\d+$/i)) {
        listing = await listingsService.fetchListingByPropertyId(searchTerm.toUpperCase());
      }
      
      // If not found by propertyId, try Firestore document ID
      if (!listing) {
        listing = await listingsService.fetchListingById(searchTerm);
      }
      
      if (listing) {
        router.push(`/${locale}/listings/${listing.id}`);
      } else {
        setSearchError(t('home.listingNotFound'));
      }
    } catch (err: any) {
      setSearchError(t('home.listingNotFound'));
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section - Hide when district is selected */}
      {!selectedDistrict && (
      <div className="relative h-[60vh] sm:h-[65vh] md:h-[75vh] lg:h-[85vh] overflow-hidden">
        {/* Background Images Slider */}
        <div className="absolute inset-0">
          {heroImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Image
                src={image}
                alt={`Hero Image ${index + 1}`}
                fill
                className="object-cover"
                priority={index === 0}
                quality={90}
              />
            </div>
          ))}
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/60"></div>
        </div>
        
        {/* Hero Content - Centered Search Interface */}
        <div className="relative h-full flex items-center justify-center py-4 sm:py-8 md:py-12">
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
            {/* Title - Only show when no property type selected */}
            {!selectedPropertyType && (
              <div className="text-center mb-4 sm:mb-6 md:mb-8">
                <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-2 sm:mb-3 md:mb-4 drop-shadow-lg leading-tight">
                  {t('home.title')}
                </h1>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 drop-shadow-md px-2">
                  {t('home.subtitle')}
                </p>
              </div>
            )}

            {/* Search Interface Card */}
            <div className={`bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-2xl mx-auto w-[85%] max-w-[300px] sm:w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl ${selectedPropertyType ? 'p-3 sm:p-4 md:p-6 lg:p-8' : 'p-4 sm:p-6 md:p-8'}`}>
              {/* Property Type Selection - Step 1 */}
              {!selectedPropertyType && (
                <div>
                  <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-4 sm:mb-6 text-center">
                    {t('home.selectPropertyType')}
                  </h2>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 justify-center flex-wrap">
                    <button
                      onClick={() => setSelectedPropertyType('sale')}
                      className="px-4 sm:px-6 md:px-8 h-10 w-full sm:w-auto max-w-[200px] sm:max-w-none mx-auto sm:mx-0 bg-brand-secondary border-2 border-brand-secondary text-brand-slate rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base md:text-lg hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all shadow-md hover:shadow-lg flex items-center justify-center"
                    >
                      {t('admin.sale')}
                    </button>
                    <button
                      onClick={() => setSelectedPropertyType('rent')}
                      className="px-4 sm:px-6 md:px-8 h-10 w-full sm:w-auto max-w-[200px] sm:max-w-none mx-auto sm:mx-0 bg-brand-secondary border-2 border-brand-secondary text-brand-slate rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base md:text-lg hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all shadow-md hover:shadow-lg flex items-center justify-center"
                    >
                      {t('admin.rent')}
                    </button>
                    <button
                      onClick={() => setSelectedPropertyType('bai-wafa')}
                      className="px-4 sm:px-6 md:px-8 h-10 w-full sm:w-auto max-w-[200px] sm:max-w-none mx-auto sm:mx-0 bg-brand-secondary border-2 border-brand-secondary text-brand-slate rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base md:text-lg hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all shadow-md hover:shadow-lg flex items-center justify-center"
                    >
                      {t('admin.bai-wafa')}
                    </button>
                    <button
                      onClick={() => setSelectedPropertyType('sharik-abad')}
                      className="px-4 sm:px-6 md:px-8 h-10 w-full sm:w-auto max-w-[200px] sm:max-w-none mx-auto sm:mx-0 bg-brand-secondary border-2 border-brand-secondary text-brand-slate rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base md:text-lg hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all shadow-md hover:shadow-lg flex items-center justify-center"
                    >
                      {t('admin.sharik-abad')}
                    </button>
                  </div>
                </div>
              )}

              {/* District Selection - Step 2 */}
              {selectedPropertyType && !selectedDistrict && (
                <div className="w-full">
                  {/* Back Button - Prominent */}
                  <button
                    onClick={() => {
                      // Clear district and update URL
                      setSelectedPropertyType(null);
                      setSelectedDistrict(null);
                      router.replace(`/${locale}`, { scroll: false });
                    }}
                    className="mb-4 sm:mb-6 text-brand-primary hover:text-brand-navy font-semibold flex items-center gap-2 text-sm sm:text-base transition-colors group w-full sm:w-auto"
                  >
                    <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>{t('common.back')}</span>
                  </button>
                  
                  <div className="mb-3 sm:mb-4 md:mb-6">
                    <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-brand-slate text-center">
                      {t('home.selectDistrict')}
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2 sm:gap-3 max-h-[45vh] sm:max-h-[400px] overflow-y-auto overflow-x-hidden pr-1 -mr-1 sm:mr-0">
                    {/* All Districts Option */}
                    {(() => {
                      const allDistrictsCount = selectedPropertyType
                        ? Object.values(districtListingCounts).reduce(
                            (sum, counts) => sum + (counts[selectedPropertyType] ?? 0),
                            0
                          )
                        : 0;
                      
                      return (
                        <button
                          onClick={() => {
                            setSelectedDistrict('all');
                            setSelectedCategory('all');
                          }}
                          disabled={allDistrictsCount === 0}
                          className="p-2.5 sm:p-3 md:p-4 bg-brand-primary text-white rounded-lg sm:rounded-xl border-2 border-brand-primary hover:bg-brand-primary hover:opacity-90 active:bg-brand-primary transition-all shadow-sm hover:shadow-md min-h-[56px] sm:min-h-[60px] flex items-center justify-between touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed w-full"
                        >
                          <div className="font-semibold text-white text-xs sm:text-sm leading-tight break-words text-left flex-1">
                            {t('common.all')}
                          </div>
                          <span className="text-[10px] sm:text-xs text-white/90 ml-2 flex-shrink-0">
                            ({allDistrictsCount})
                          </span>
                        </button>
                      );
                    })()}
                    
                    {kabulDistricts.map((district) => {
                      const districtListingCount =
                        selectedPropertyType
                          ? districtListingCounts[district.id]?.[
                              selectedPropertyType
                            ] ?? 0
                          : 0;

                      const isSelected = selectedDistrict === district.id;
                      const hasListings = districtListingCount > 0;
                      
                      return (
                        <button
                          key={district.id}
                          onClick={() => {
                            setSelectedDistrict(district.id);
                            setSelectedCategory('all');
                          }}
                          disabled={districtListingCount === 0}
                          className={`p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border-2 transition-all shadow-sm hover:shadow-md min-h-[56px] sm:min-h-[60px] flex items-center gap-2 touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed w-full whitespace-nowrap ${
                            isSelected
                              ? 'bg-brand-secondary border-brand-secondary text-brand-slate'
                              : hasListings
                              ? 'bg-brand-secondary border-brand-secondary text-brand-slate hover:opacity-90'
                              : 'bg-white border-gray-200 hover:border-brand-primary active:border-brand-primary active:bg-brand-primary-soft'
                          }`}
                        >
                          <div className={`font-semibold text-xs sm:text-sm leading-tight text-left flex-1 truncate ${
                            isSelected || hasListings ? 'text-brand-slate' : 'text-brand-slate'
                          }`}>
                            {locale === 'fa' ? district.name : district.nameEn}
                          </div>
                          <span className={`text-[10px] sm:text-xs flex-shrink-0 ${
                            isSelected || hasListings ? 'text-brand-slate' : 'text-brand-gray'
                          }`}>
                            ({districtListingCount})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
      )}

      {/* Featured Listings - When no filters selected */}
      {!selectedPropertyType && featuredListings.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-brand-slate mb-4">
              {t('home.featuredProperties')}
            </h2>
            <p className="text-lg md:text-xl text-brand-gray max-w-2xl mx-auto">
              {t('home.featuredSubtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      )}

      {/* Featured Projects Section */}
      {!selectedPropertyType && projects.length > 0 && (
        <FeaturedProjectsSlider projects={projects} />
      )}

      {/* Listings Section */}
      {selectedPropertyType && selectedDistrict && (
        <>
          {/* Fixed Filters Section - Stays at top while scrolling */}
          <div className="fixed top-14 sm:top-16 md:top-20 left-0 right-0 z-40 bg-white w-full border-b border-gray-200 shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3">
              {/* Selected Filters Display */}
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-secondary rounded-lg">
                  <span className="text-xs font-medium text-brand-slate">
                    {t('admin.propertyType')}:
                  </span>
                  <span className="text-xs font-bold text-brand-slate">
                    {selectedPropertyType === 'rent' ? t('admin.rent') : 
                     selectedPropertyType === 'sale' ? t('admin.sale') : 
                     selectedPropertyType === 'bai-wafa' ? t('admin.bai-wafa') :
                     t('admin.sharik-abad')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-secondary rounded-lg">
                  <span className="text-xs font-medium text-brand-slate">
                    {t('admin.district')}:
                  </span>
                  <span className="text-xs font-bold text-brand-slate">
                    {selectedDistrict === 'all' 
                      ? t('common.all')
                      : locale === 'fa' 
                        ? kabulDistricts.find(d => d.id === selectedDistrict)?.name 
                        : kabulDistricts.find(d => d.id === selectedDistrict)?.nameEn || selectedDistrict}
                  </span>
                </div>
              </div>
              
              {/* Category Filters */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {(['all', 'house', 'apartment', 'land', 'shop'] as const).map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs transition-all shadow-sm hover:shadow-md ${
                      selectedCategory === category
                        ? 'bg-brand-primary text-white border-2 border-brand-primary'
                        : 'bg-white border-2 border-gray-200 text-brand-slate hover:border-brand-primary hover:text-brand-primary'
                    }`}
                  >
                    {category === 'all' ? t('common.all') : t(`admin.${category}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Spacer to prevent content from going under fixed filters */}
          <div className="h-[120px] sm:h-[130px]"></div>

          <div id="listings" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-24">
            {/* Back Button */}
            <button
              onClick={() => {
                // Clear district but keep property type - update URL
                setSelectedDistrict(null);
                router.replace(`/${locale}?propertyType=${selectedPropertyType}`, { scroll: false });
              }}
              className="mb-6 sm:mb-8 text-brand-primary hover:text-brand-navy font-semibold flex items-center gap-2 text-sm sm:text-base transition-colors group"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>{t('common.back')}</span>
            </button>

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
        ) : listings.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border-2 border-brand-soft">
            <div className="w-20 h-20 bg-brand-primary-soft rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-brand-slate mb-3">{t('home.noListings')}</h3>
            <p className="text-brand-gray text-lg">{t('home.checkBack')}</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border-2 border-brand-soft">
            <div className="w-20 h-20 bg-brand-primary-soft rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-brand-slate mb-3">{t('home.noListingsForFilters')}</h3>
            <p className="text-brand-gray text-lg mb-6">{t('home.tryDifferentFilters')}</p>
            <button
              onClick={() => {
                setSelectedPropertyType(null);
                setSelectedDistrict(null);
              }}
              className="px-6 py-3 bg-brand-primary text-white rounded-xl font-medium hover:bg-brand-navy transition-colors"
            >
              {t('home.changeFilters')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
          </div>
        </>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-brand-gray">Loading...</p>
        </div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}
