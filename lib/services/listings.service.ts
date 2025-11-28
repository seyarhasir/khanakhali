import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getDbInstance } from '../firebase/config';
import { Listing, CreateListingInput, UpdateListingInput } from '../types/listing.types';

const getDb = () => getDbInstance();

// Convert Firestore timestamp to Date
const convertTimestamp = (timestamp: any): Date | null => {
  if (!timestamp) {
    return null;
  }
  
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  
  if (timestamp instanceof Date) {
    // Validate the date
    if (isNaN(timestamp.getTime())) {
      return null;
    }
    return timestamp;
  }
  
  // Handle Firestore timestamp object with seconds/nanoseconds
  if (timestamp.seconds !== undefined) {
    const date = new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
    if (!isNaN(date.getTime())) {
      return date;
    }
    return null;
  }
  
  // Try to parse as string or number
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  // Return null if we can't convert (don't default to current date)
  return null;
};

// Remove undefined values from object recursively (Firestore doesn't accept undefined)
const removeUndefined = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  // Don't process Date objects or Firestore Timestamps
  if (obj instanceof Date || obj?.toDate || obj?.seconds) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined).filter(item => item !== undefined);
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (value !== undefined) {
          // Recursively clean nested objects
          if (value !== null && typeof value === 'object' && !(value instanceof Date) && !value?.toDate && !value?.seconds) {
            const cleanedValue = removeUndefined(value);
            // Only add if the cleaned object is not empty
            if (cleanedValue !== null && (Array.isArray(cleanedValue) || Object.keys(cleanedValue).length > 0)) {
              cleaned[key] = cleanedValue;
            } else if (!Array.isArray(cleanedValue) && typeof cleanedValue !== 'object') {
              cleaned[key] = cleanedValue;
            }
          } else {
            cleaned[key] = value;
          }
        }
      }
    }
    return cleaned;
  }
  
  return obj;
};

// Convert Firestore document to Listing
const convertDocToListing = (doc: any): Listing => {
  const data = doc.data();
  return {
    id: doc.id,
    propertyId: data.propertyId,
    title: data.title,
    description: data.description,
    price: data.price,
    priceInDollar: data.priceInDollar,
    propertyType: data.propertyType || 'sale',
    propertyCategory: data.propertyCategory,
    location: data.location,
    imageUrls: data.imageUrls || [],
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    area: data.area,
    yearBuilt: data.yearBuilt,
    parking: data.parking,
    furnished: data.furnished,
    createdBy: data.createdBy,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    status: data.status || 'active',
    // Badges
    isHot: data.isHot || false,
    isVerified: data.isVerified || false,
    isPremium: data.isPremium || false,
    isFeatured: data.isFeatured || false,
    // Agent approval workflow
    pendingApproval: data.pendingApproval,
    pendingDelete: data.pendingDelete,
    originalData: data.originalData,
    // Contact information
    contactPhone: data.contactPhone,
    contactWhatsApp: data.contactWhatsApp,
    contactEmail: data.contactEmail,
    // Detailed features
    mainFeatures: data.mainFeatures,
    rooms: data.rooms,
    businessCommunication: data.businessCommunication,
    communityFeatures: data.communityFeatures,
    healthcareRecreation: data.healthcareRecreation,
    nearbyLocations: data.nearbyLocations,
    otherFacilities: data.otherFacilities,
  };
};

export const listingsService = {
  // Fetch all active listings (excludes pending approvals and deletes for public view)
  fetchListings: async (): Promise<Listing[]> => {
    try {
      const db = getDb();
      const q = query(
        collection(db, 'listings'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const listings: Listing[] = [];
      
      querySnapshot.forEach((doc) => {
        const listing = convertDocToListing(doc);
        // Only include listings that are:
        // 1. Status is 'active'
        // 2. NOT pending approval (agent submissions)
        // 3. NOT pending deletion
        if (!listing.pendingApproval && !listing.pendingDelete) {
          listings.push(listing);
        }
      });
      
      console.log(`✅ Fetched ${listings.length} active listings (excluded ${querySnapshot.size - listings.length} pending)`);
      return listings;
    } catch (error: any) {
      console.error('❌ Fetch listings error:', error);
      throw new Error(error.message || 'Failed to fetch listings');
    }
  },

  // Fetch single listing by ID (Firestore document ID)
  fetchListingById: async (id: string): Promise<Listing | null> => {
    try {
      const db = getDb();
      const docRef = doc(db, 'listings', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        console.log('✅ Fetched listing:', id);
        return convertDocToListing(docSnap);
      }
      
      console.log('⚠️ Listing not found:', id);
      return null;
    } catch (error: any) {
      console.error('❌ Fetch listing error:', error);
      throw new Error(error.message || 'Failed to fetch listing');
    }
  },

  // Fetch single listing by propertyId (M1000, M1001, etc.)
  fetchListingByPropertyId: async (propertyId: string): Promise<Listing | null> => {
    try {
      const db = getDb();
      const listingsRef = collection(db, 'listings');
      const q = query(listingsRef, where('propertyId', '==', propertyId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        console.log('✅ Fetched listing by propertyId:', propertyId);
        return convertDocToListing(docSnap);
      }
      
      console.log('⚠️ Listing not found by propertyId:', propertyId);
      return null;
    } catch (error: any) {
      console.error('❌ Fetch listing by propertyId error:', error);
      throw new Error(error.message || 'Failed to fetch listing by propertyId');
    }
  },

  // Generate next property ID (AM1000, AM1001, etc.)
  generateNextPropertyId: async (): Promise<string> => {
    try {
      const db = getDb();
      const listingsRef = collection(db, 'listings');
      const snapshot = await getDocs(listingsRef);
      
      let maxNumber = 999; // Start from 1000, so base is 999
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.propertyId && typeof data.propertyId === 'string') {
          // Extract number from propertyId (e.g., "M1000" or "AM1000" -> 1000)
          // Support both old "M" format and new "AM" format for backward compatibility
          const match = data.propertyId.match(/^(?:M|AM)(\d+)$/i);
          if (match) {
            const num = parseInt(match[1], 10);
            // Only consider numbers >= 1000
            if (num >= 1000 && num > maxNumber) {
              maxNumber = num;
            }
          }
        }
      });
      
      // Always ensure we start from at least 1000
      const nextNumber = Math.max(maxNumber + 1, 1000);
      const propertyId = `AM${nextNumber}`;
      console.log(`✅ Generated property ID: ${propertyId}`);
      return propertyId;
    } catch (error: any) {
      console.error('❌ Generate property ID error:', error);
      // Fallback to AM1000 if there's an error
      return 'AM1000';
    }
  },

  // Create new listing (admin or agent)
  createListing: async (data: CreateListingInput, userId: string, userRole: string, images: string[] = []): Promise<Listing> => {
    try {
      // Always generate property ID if not provided (never use random)
      let propertyId = data.propertyId;
      if (!propertyId || !propertyId.match(/^M\d{4,}$/)) {
        // Generate new property ID if not provided or invalid format
        propertyId = await listingsService.generateNextPropertyId();
        console.log(`✅ Using generated property ID: ${propertyId}`);
      }
      
      const listingData = {
        ...data,
        propertyId,
        imageUrls: images,
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // If agent creates, set status to pending; admin creates go active
        status: userRole === 'agent' ? 'pending' : (data.status || 'active'),
        // If agent creates, mark as pending approval
        pendingApproval: userRole === 'agent' ? true : false,
      };
      
      // Remove all undefined values (Firestore doesn't accept undefined)
      const cleanedData = removeUndefined(listingData);
      
      const db = getDb();
      const docRef = await addDoc(collection(db, 'listings'), cleanedData);
      console.log(`✅ Listing created${userRole === 'agent' ? ' (pending approval)' : ''}:`, docRef.id);
      
      // Fetch the created listing to return it with timestamps
      const listing = await listingsService.fetchListingById(docRef.id);
      if (!listing) {
        throw new Error('Failed to fetch created listing');
      }
      
      return listing;
    } catch (error: any) {
      console.error('❌ Create listing error:', error);
      throw new Error(error.message || 'Failed to create listing');
    }
  },

  // Update existing listing (admin or agent)
  updateListing: async (id: string, data: UpdateListingInput, userRole: string, images?: string[]): Promise<void> => {
    try {
      const db = getDb();
      const docRef = doc(db, 'listings', id);
      
      // If agent is updating, store the changes and mark as pending approval
      if (userRole === 'agent') {
        // First fetch the original listing
        const originalListing = await listingsService.fetchListingById(id);
        
        // Clean the original listing data to remove undefined values
        const cleanedOriginalData = removeUndefined(originalListing);
        
        const updateData: any = {
          pendingApproval: true,
          originalData: cleanedOriginalData, // Store cleaned original data for admin review
          updatedAt: serverTimestamp(),
        };
        
        // Store the pending changes in a separate field
        const pendingChanges: any = { ...data };
        if (images !== undefined) {
          pendingChanges.imageUrls = images;
        }
        // Clean pending changes too
        const cleanedPendingChanges = removeUndefined(pendingChanges);
        updateData.pendingChanges = cleanedPendingChanges;
        
        await updateDoc(docRef, updateData);
        console.log('✅ Listing update pending approval:', id);
        return;
      }
      
      // Admin can update directly
      const updateData: any = {
        ...data,
        updatedAt: serverTimestamp(),
        pendingApproval: false,
        pendingChanges: null,
        originalData: null,
      };
      
      // Only update images if provided
      if (images !== undefined) {
        updateData.imageUrls = images;
      }
      
      // Remove id, createdAt, createdBy from update data (these should never be updated)
      delete updateData.id;
      delete updateData.createdAt;
      delete updateData.createdBy;
      
      // Remove all undefined values (Firestore doesn't accept undefined)
      const cleanedData = removeUndefined(updateData);
      
      await updateDoc(docRef, cleanedData);
      console.log('✅ Listing updated:', id);
    } catch (error: any) {
      console.error('❌ Update listing error:', error);
      throw new Error(error.message || 'Failed to update listing');
    }
  },

  // Delete listing (admin or agent)
  deleteListing: async (id: string, userRole: string): Promise<void> => {
    try {
      const db = getDb();
      const docRef = doc(db, 'listings', id);
      
      // If agent is deleting, mark as pending delete instead of actually deleting
      if (userRole === 'agent') {
        await updateDoc(docRef, {
          pendingDelete: true,
          updatedAt: serverTimestamp(),
        });
        console.log('✅ Listing delete pending approval:', id);
        return;
      }
      
      // Admin can delete directly
      await deleteDoc(docRef);
      console.log('✅ Listing deleted:', id);
    } catch (error: any) {
      console.error('❌ Delete listing error:', error);
      throw new Error(error.message || 'Failed to delete listing');
    }
  },

  // Fetch listings created by specific user (admin view)
  fetchAdminListings: async (userId: string): Promise<Listing[]> => {
    try {
      const db = getDb();
      const q = query(
        collection(db, 'listings'),
        where('createdBy', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const listings: Listing[] = [];
      
      querySnapshot.forEach((doc) => {
        listings.push(convertDocToListing(doc));
      });
      
      console.log(`✅ Fetched ${listings.length} admin listings`);
      return listings;
    } catch (error: any) {
      console.error('❌ Fetch admin listings error:', error);
      throw new Error(error.message || 'Failed to fetch admin listings');
    }
  },

  // Approve agent's new listing (admin only)
  approveNewListing: async (id: string): Promise<void> => {
    try {
      const db = getDb();
      const docRef = doc(db, 'listings', id);
      await updateDoc(docRef, {
        pendingApproval: false,
        status: 'active',
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Listing approved and activated:', id);
    } catch (error: any) {
      console.error('❌ Approve listing error:', error);
      throw new Error(error.message || 'Failed to approve listing');
    }
  },

  // Reject agent's new listing (admin only)
  rejectNewListing: async (id: string): Promise<void> => {
    try {
      const db = getDb();
      await deleteDoc(doc(db, 'listings', id));
      console.log('✅ Listing rejected and deleted:', id);
    } catch (error: any) {
      console.error('❌ Reject listing error:', error);
      throw new Error(error.message || 'Failed to reject listing');
    }
  },

  // Approve agent's edit to listing (admin only)
  approveEdit: async (id: string): Promise<void> => {
    try {
      const db = getDb();
      const docRef = doc(db, 'listings', id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Listing not found');
      }
      
      const data = docSnap.data();
      const pendingChanges = data.pendingChanges || {};
      
      // Apply the pending changes
      const updateData: any = {
        ...pendingChanges,
        pendingApproval: false,
        pendingChanges: null,
        originalData: null,
        updatedAt: serverTimestamp(),
      };
      
      await updateDoc(docRef, updateData);
      console.log('✅ Edit approved:', id);
    } catch (error: any) {
      console.error('❌ Approve edit error:', error);
      throw new Error(error.message || 'Failed to approve edit');
    }
  },

  // Reject agent's edit to listing (admin only)
  rejectEdit: async (id: string): Promise<void> => {
    try {
      const db = getDb();
      const docRef = doc(db, 'listings', id);
      await updateDoc(docRef, {
        pendingApproval: false,
        pendingChanges: null,
        originalData: null,
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Edit rejected:', id);
    } catch (error: any) {
      console.error('❌ Reject edit error:', error);
      throw new Error(error.message || 'Failed to reject edit');
    }
  },

  // Approve agent's delete request (admin only)
  approveDelete: async (id: string): Promise<void> => {
    try {
      const db = getDb();
      await deleteDoc(doc(db, 'listings', id));
      console.log('✅ Delete approved:', id);
    } catch (error: any) {
      console.error('❌ Approve delete error:', error);
      throw new Error(error.message || 'Failed to approve delete');
    }
  },

  // Reject agent's delete request (admin only)
  rejectDelete: async (id: string): Promise<void> => {
    try {
      const db = getDb();
      const docRef = doc(db, 'listings', id);
      await updateDoc(docRef, {
        pendingDelete: false,
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Delete rejected:', id);
    } catch (error: any) {
      console.error('❌ Reject delete error:', error);
      throw new Error(error.message || 'Failed to reject delete');
    }
  },

  // Fetch all pending approvals (admin only) - includes both 'active' and 'pending' status
  fetchPendingApprovals: async (): Promise<Listing[]> => {
    try {
      const db = getDb();
      const q = query(
        collection(db, 'listings'),
        where('pendingApproval', '==', true),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const listings: Listing[] = [];
      
      querySnapshot.forEach((doc) => {
        const listing = convertDocToListing(doc);
        // Only include if not marked for deletion (deletion has separate queue)
        if (!listing.pendingDelete) {
          listings.push(listing);
        }
      });
      
      console.log(`✅ Fetched ${listings.length} pending approvals (excluded ${querySnapshot.size - listings.length} pending deletes)`);
      return listings;
    } catch (error: any) {
      console.error('❌ Fetch pending approvals error:', error);
      throw new Error(error.message || 'Failed to fetch pending approvals');
    }
  },

  // Fetch all pending deletes (admin only)
  fetchPendingDeletes: async (): Promise<Listing[]> => {
    try {
      const db = getDb();
      const q = query(
        collection(db, 'listings'),
        where('pendingDelete', '==', true),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const listings: Listing[] = [];
      
      querySnapshot.forEach((doc) => {
        listings.push(convertDocToListing(doc));
      });
      
      console.log(`✅ Fetched ${listings.length} pending deletes`);
      return listings;
    } catch (error: any) {
      console.error('❌ Fetch pending deletes error:', error);
      throw new Error(error.message || 'Failed to fetch pending deletes');
    }
  },
};

