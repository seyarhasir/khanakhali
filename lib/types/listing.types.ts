export interface Location {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  district?: string; // ناحیه (District)
  latitude?: number;
  longitude?: number;
}

export type PropertyType = 'rent' | 'pledge' | 'sale' | 'bai-wafa' | 'sharik-abad';
export type PropertyCategory = 'house' | 'apartment' | 'land' | 'shop';

// Main Features
export interface MainFeatures {
  builtInYear?: number;
  parkingSpaces?: number;
  doubleGlazedWindows?: boolean;
  centralAirConditioning?: boolean;
  centralHeating?: boolean;
  flooring?: string;
  electricityBackup?: boolean;
  wasteDisposal?: boolean;
  floors?: number;
}

// Rooms
export interface Rooms {
  bedrooms?: number;
  bathrooms?: number;
  servantQuarters?: number;
  drawingRoom?: boolean;
  diningRoom?: boolean;
  kitchens?: number;
  studyRoom?: boolean;
  prayerRoom?: boolean;
  powderRoom?: boolean;
  gym?: boolean;
  storeRooms?: number;
  steamRoom?: boolean;
  lounge?: boolean;
  laundryRoom?: boolean;
}

// Business and Communication
export interface BusinessCommunication {
  broadbandInternet?: boolean;
  satelliteCableTV?: boolean;
  intercom?: boolean;
}

// Community Features
export interface CommunityFeatures {
  communityLawn?: boolean;
  communitySwimmingPool?: boolean;
  communityGym?: boolean;
  medicalCentre?: boolean;
  dayCareCentre?: boolean;
  kidsPlayArea?: boolean;
  barbequeArea?: boolean;
  mosque?: boolean;
  communityCentre?: boolean;
}

// Healthcare and Recreation
export interface HealthcareRecreation {
  lawn?: boolean;
  swimmingPool?: boolean;
  sauna?: boolean;
  jacuzzi?: boolean;
}

// Nearby Locations
export interface NearbyLocations {
  nearbySchools?: string;
  nearbyHospitals?: string;
  nearbyShoppingMalls?: string;
  nearbyRestaurants?: string;
  distanceFromAirport?: number; // in km
  nearbyPublicTransport?: string;
  otherNearbyPlaces?: string;
}

// Other Facilities
export interface OtherFacilities {
  maintenanceStaff?: boolean;
  securityStaff?: boolean;
  facilitiesForDisabled?: boolean;
  otherFacilities?: string;
}

export interface Listing {
  id: string;
  propertyId?: string; // Format: AM1000, AM1001, etc. (supports legacy M format)
  title: string;
  description: string;
  price: number;
  priceInDollar?: number;
  propertyType: PropertyType;
  propertyCategory?: PropertyCategory;
  location: Location;
  imageUrls: string[];
  bedrooms?: number;
  bathrooms?: number;
  area?: number; // Square meters/feet or Marla
  yearBuilt?: number;
  parking?: boolean;
  furnished?: boolean;
  createdBy: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  status: 'active' | 'sold' | 'pending' | 'rented' | 'pledged';
  // Badges
  isHot?: boolean;
  isVerified?: boolean;
  isPremium?: boolean;
  isFeatured?: boolean;
  // Agent approval workflow
  pendingApproval?: boolean; // For new listings or edits by agents awaiting admin approval
  pendingDelete?: boolean; // For delete requests by agents awaiting admin approval
  originalData?: any; // Store original data when agent makes edits
  // Contact information
  contactPhone?: string;
  contactWhatsApp?: string;
  contactEmail?: string;
  // Detailed features
  mainFeatures?: MainFeatures;
  rooms?: Rooms;
  businessCommunication?: BusinessCommunication;
  communityFeatures?: CommunityFeatures;
  healthcareRecreation?: HealthcareRecreation;
  nearbyLocations?: NearbyLocations;
  otherFacilities?: OtherFacilities;
}

export interface CreateListingInput {
  propertyId?: string; // Format: AM1000, AM1001, etc. (supports legacy M format)
  title: string;
  description: string;
  price: number;
  priceInDollar?: number;
  propertyType: PropertyType;
  propertyCategory?: PropertyCategory;
  location: Location;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  yearBuilt?: number;
  parking?: boolean;
  furnished?: boolean;
  status?: 'active' | 'sold' | 'pending' | 'rented' | 'pledged';
  // Badges
  isHot?: boolean;
  isVerified?: boolean;
  isPremium?: boolean;
  isFeatured?: boolean;
  // Agent approval workflow
  pendingApproval?: boolean;
  pendingDelete?: boolean;
  originalData?: any;
  // Contact information
  contactPhone?: string;
  contactWhatsApp?: string;
  contactEmail?: string;
  // Detailed features
  mainFeatures?: MainFeatures;
  rooms?: Rooms;
  businessCommunication?: BusinessCommunication;
  communityFeatures?: CommunityFeatures;
  healthcareRecreation?: HealthcareRecreation;
  nearbyLocations?: NearbyLocations;
  otherFacilities?: OtherFacilities;
}

export interface UpdateListingInput extends Partial<CreateListingInput> {
  id: string;
}
