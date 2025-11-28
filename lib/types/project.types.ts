import { Location } from './listing.types';

export interface Project {
  id: string;
  projectId?: string; // Format: P1000, P1001, etc.
  name: string;
  description: string;
  developer: string;
  location: Location;
  imageUrls: string[];
  coverImageIndex?: number;
  // Project types available (e.g., apartments, penthouses, offices, commercial, plots)
  projectTypes: {
    type: 'apartment' | 'penthouse' | 'office' | 'commercial' | 'plot' | 'villa';
    bedrooms?: number; // For apartments/penthouses/villas
    bathrooms?: number; // For apartments/penthouses/villas
    priceRange?: {
      min: number;
      max: number;
    };
    priceInDollarRange?: {
      min: number;
      max: number;
    };
  }[];
  // Pricing information
  priceRange?: {
    min: number;
    max: number;
  };
  priceInDollarRange?: {
    min: number;
    max: number;
  };
  // Features
  features: {
    mainFeatures?: string[];
    businessAndCommunication?: string[];
    healthcareAndRecreation?: string[];
    communityFeatures?: string[];
    nearbyFacilities?: string[];
    otherFacilities?: string[];
  };
  // Development updates
  developmentUpdates?: {
    date: Date;
    title: string;
    description: string;
    images?: string[];
  }[];
  // Payment plans
  paymentPlans?: {
    name: string;
    description: string;
    imageUrl?: string;
  }[];
  // Floor plans
  floorPlans?: {
    name: string;
    imageUrl: string;
    description?: string;
  }[];
  // 3D walkthrough
  walkthrough3DUrl?: string;
  // Contact information
  contactPhone?: string;
  contactWhatsApp?: string;
  contactEmail?: string;
  // Marketing information
  marketedBy?: string;
  developedBy: string;
  // Status
  status: 'upcoming' | 'under-construction' | 'completed' | 'sold-out';
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectInput {
  projectId?: string;
  name: string;
  description: string;
  developer: string;
  location: Location;
  projectTypes: {
    type: 'apartment' | 'penthouse' | 'office' | 'commercial' | 'plot' | 'villa';
    bedrooms?: number; // For apartments/penthouses/villas
    bathrooms?: number; // For apartments/penthouses/villas
    priceRange?: {
      min: number;
      max: number;
    };
    priceInDollarRange?: {
      min: number;
      max: number;
    };
  }[];
  priceRange?: {
    min: number;
    max: number;
  };
  priceInDollarRange?: {
    min: number;
    max: number;
  };
  features: {
    mainFeatures?: string[];
    businessAndCommunication?: string[];
    healthcareAndRecreation?: string[];
    communityFeatures?: string[];
    nearbyFacilities?: string[];
    otherFacilities?: string[];
  };
  developmentUpdates?: {
    date: Date;
    title: string;
    description: string;
    images?: string[];
  }[];
  paymentPlans?: {
    name: string;
    description: string;
    imageUrl?: string;
  }[];
  floorPlans?: {
    name: string;
    imageUrl: string;
    description?: string;
  }[];
  walkthrough3DUrl?: string;
  contactPhone?: string;
  contactWhatsApp?: string;
  contactEmail?: string;
  marketedBy?: string;
  developedBy: string;
  status: 'upcoming' | 'under-construction' | 'completed' | 'sold-out';
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {
  id: string;
}

