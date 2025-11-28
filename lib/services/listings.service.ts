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
    // CRITICAL: Don't default to 'active' - use actual status or determine from pendingApproval
    // This prevents pending listings from being converted to active
    status: data.status || (data.pendingApproval ? 'pending' : 'active'),
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
        // CRITICAL: Multiple layers of protection to exclude pending listings
        // Only include listings that are:
        // 1. Status MUST be 'active' (query already filters this, but double-check)
        // 2. NOT pending approval (agent submissions)
        // 3. NOT pending deletion
        if (
          listing.status === 'active' && 
          !listing.pendingApproval && 
          !listing.pendingDelete
        ) {
          listings.push(listing);
        } else {
          console.log('🚫 Excluded listing:', listing.id, {
            status: listing.status,
            pendingApproval: listing.pendingApproval,
            pendingDelete: listing.pendingDelete,
          });
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
      // CRITICAL: Normalize userRole and log it
      const normalizedRole = (userRole || '').toLowerCase().trim();
      console.log('🔍 createListing called with:', { userRole, normalizedRole, userId });
      
      // Always generate property ID if not provided (never use random)
      let propertyId = data.propertyId;
      if (!propertyId || !propertyId.match(/^M\d{4,}$/)) {
        // Generate new property ID if not provided or invalid format
        propertyId = await listingsService.generateNextPropertyId();
        console.log(`✅ Using generated property ID: ${propertyId}`);
      }
      
      // CRITICAL: For agents, ALWAYS set status to pending, regardless of data.status
      const isAgent = normalizedRole === 'agent';
      const finalStatus = isAgent ? 'pending' : (data.status || 'active');
      const finalPendingApproval = isAgent ? true : false;
      
      console.log('🔍 Status determination:', {
        isAgent,
        dataStatus: data.status,
        finalStatus,
        finalPendingApproval,
      });
      
      // CRITICAL: Remove status from data if it exists, to prevent override
      const { status: _, ...dataWithoutStatus } = data;
      
      // CRITICAL: Ensure updatedAt is always set (required for orderBy queries)
      const now = serverTimestamp();
      
      const listingData = {
        ...dataWithoutStatus, // Don't include status from data
        propertyId,
        imageUrls: images, // Include images directly in creation
        createdBy: userId,
        createdAt: now,
        updatedAt: now, // CRITICAL: Always set updatedAt for orderBy queries
        // CRITICAL: Explicitly set status AFTER spreading data
        status: finalStatus,
        // CRITICAL: Explicitly set pendingApproval as boolean true (not string)
        pendingApproval: finalPendingApproval === true, // Ensure boolean type
      };
      
      // Remove all undefined values (Firestore doesn't accept undefined)
      const cleanedData = removeUndefined(listingData);
      
      // CRITICAL: Double-check pendingApproval is boolean true, not undefined
      if (isAgent) {
        cleanedData.pendingApproval = true; // Force boolean true
      }
      
      console.log('🔍 Final listing data before save:', {
        status: cleanedData.status,
        pendingApproval: cleanedData.pendingApproval,
        pendingApprovalType: typeof cleanedData.pendingApproval,
        createdBy: cleanedData.createdBy,
        hasUpdatedAt: !!cleanedData.updatedAt,
      });
      
      const db = getDb();
      const docRef = await addDoc(collection(db, 'listings'), cleanedData);
      console.log(`✅ Listing created${isAgent ? ' (pending approval)' : ''}:`, docRef.id, 'Status:', finalStatus);
      
      // CRITICAL: Wait a bit for Firestore to commit (helps with eventual consistency)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Fetch the created listing to return it with timestamps
      const listing = await listingsService.fetchListingById(docRef.id);
      if (!listing) {
        throw new Error('Failed to fetch created listing');
      }
      
      // CRITICAL: Verify the listing was created correctly
      if (isAgent) {
        console.log('🔍 Verification after create:', {
          id: listing.id,
          status: listing.status,
          pendingApproval: listing.pendingApproval,
          pendingApprovalType: typeof listing.pendingApproval,
        });
        
        if (listing.status !== 'pending' || listing.pendingApproval !== true) {
          console.error('❌ CRITICAL: Listing created incorrectly!', listing);
          // Force correction
          const verifyDocRef = doc(db, 'listings', docRef.id);
          await updateDoc(verifyDocRef, {
            status: 'pending',
            pendingApproval: true,
            updatedAt: serverTimestamp(),
          });
          console.log('✅ Forced listing to correct pending state');
          // Re-fetch after correction
          const correctedListing = await listingsService.fetchListingById(docRef.id);
          if (correctedListing) return correctedListing;
        }
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
      
      // CRITICAL: Normalize userRole and log it
      const normalizedRole = (userRole || '').toLowerCase().trim();
      console.log('🔍 updateListing called with:', { userRole, normalizedRole, id });
      
      // If agent is updating, store the changes and mark as pending approval
      if (normalizedRole === 'agent') {
        // First fetch the original listing
        const originalListing = await listingsService.fetchListingById(id);
        
        if (!originalListing) {
          throw new Error('Listing not found');
        }
        
        console.log('🔍 Original listing status:', {
          id,
          status: originalListing.status,
          pendingApproval: originalListing.pendingApproval,
        });
        
        // Clean the original listing data to remove undefined values
        const cleanedOriginalData = removeUndefined(originalListing);
        
        // CRITICAL: Remove status from data if it exists
        const { status: _, ...dataWithoutStatus } = data;
        
        const updateData: any = {
          // CRITICAL: Explicitly set status to 'pending' to prevent it from going active
          status: 'pending',
          pendingApproval: true,
          originalData: cleanedOriginalData, // Store cleaned original data for admin review
          updatedAt: serverTimestamp(),
        };
        
        // Store the pending changes in a separate field (without status)
        const pendingChanges: any = { ...dataWithoutStatus };
        if (images !== undefined) {
          pendingChanges.imageUrls = images;
        }
        // Clean pending changes too
        const cleanedPendingChanges = removeUndefined(pendingChanges);
        updateData.pendingChanges = cleanedPendingChanges;
        
        console.log('🔍 Update data for agent:', {
          status: updateData.status,
          pendingApproval: updateData.pendingApproval,
        });
        
        await updateDoc(docRef, updateData);
        console.log('✅ Listing update pending approval (status: pending):', id);
        
        // CRITICAL: Verify the update worked
        const verifyDoc = await getDoc(docRef);
        if (verifyDoc.exists()) {
          const verifyData = verifyDoc.data();
          console.log('🔍 Verification after update:', {
            id,
            status: verifyData.status,
            pendingApproval: verifyData.pendingApproval,
          });
          
          if (verifyData.status !== 'pending' || !verifyData.pendingApproval) {
            console.error('❌ CRITICAL: Update failed! Status is not pending!', verifyData);
            // Force it back
            await updateDoc(docRef, {
              status: 'pending',
              pendingApproval: true,
            });
            console.log('✅ Forced status back to pending');
          }
        }
        
        return;
      }
      
      // Admin can update directly - but preserve pending status for agent listings
      // First check if this is a pending agent listing
      const currentListing = await listingsService.fetchListingById(id);
      
      if (!currentListing) {
        throw new Error('Listing not found');
      }
      
      const updateData: any = {
        ...data,
        updatedAt: serverTimestamp(),
      };
      
      // CRITICAL: If this is a pending agent listing, preserve pending status
      // Admin should only change status when explicitly approving via approveNewListing
      if (currentListing.pendingApproval && currentListing.status === 'pending') {
        // Preserve pending status - admin is just adding images or minor updates
        // Don't activate until explicitly approved
        updateData.status = 'pending';
        updateData.pendingApproval = true;
        console.log('⚠️ Preserving pending status for agent listing:', id);
      } else {
        // Normal admin update - clear pending flags
        updateData.pendingApproval = false;
        updateData.pendingChanges = null;
        updateData.originalData = null;
      }
      
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
      console.log('✅ Listing updated:', id, 'Status:', updateData.status);
    } catch (error: any) {
      console.error('❌ Update listing error:', error);
      throw new Error(error.message || 'Failed to update listing');
    }
  },

  // Delete listing (admin or agent)
  deleteListing: async (id: string, userRole: string): Promise<void> => {
    try {
      // CRITICAL: Normalize userRole and log it
      const normalizedRole = (userRole || '').toLowerCase().trim();
      console.log('🔍 deleteListing called with:', { userRole, normalizedRole, id });
      
      const db = getDb();
      const docRef = doc(db, 'listings', id);
      
      // If agent is deleting, mark as pending delete and require admin approval
      if (normalizedRole === 'agent') {
        // First fetch the original listing to store it for admin review
        const originalListing = await listingsService.fetchListingById(id);
        
        if (!originalListing) {
          throw new Error('Listing not found');
        }
        
        console.log('🔍 Original listing before delete request:', {
          id,
          status: originalListing.status,
          pendingApproval: originalListing.pendingApproval,
        });
        
        // Clean the original listing data to remove undefined values
        const cleanedOriginalData = removeUndefined(originalListing);
        
        // CRITICAL: Set pendingDelete AND pendingApproval to true
        // This ensures it shows up in the approvals page
        // Also preserve status (don't change it)
        const updateData: any = {
          pendingDelete: true,
          pendingApproval: true, // CRITICAL: Must be true to show in approvals!
          originalData: cleanedOriginalData, // Store original data for admin review
          updatedAt: serverTimestamp(),
        };
        
        // CRITICAL: Preserve the current status (don't change it)
        if (originalListing.status) {
          updateData.status = originalListing.status;
        }
        
        console.log('🔍 Attempting to set pendingDelete:', {
          id,
          pendingDelete: updateData.pendingDelete,
          pendingApproval: updateData.pendingApproval,
          status: updateData.status,
        });
        
        try {
          await updateDoc(docRef, updateData);
          console.log('✅ Listing delete pending approval:', id);
        } catch (updateError: any) {
          console.error('❌ CRITICAL: UpdateDoc failed!', updateError);
          console.error('Error details:', {
            code: updateError.code,
            message: updateError.message,
            updateData,
          });
          throw new Error(`Failed to request deletion: ${updateError.message}`);
        }
        
        // CRITICAL: Wait a bit for Firestore to commit
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // CRITICAL: Verify the update worked
        const verifyDoc = await getDoc(docRef);
        if (!verifyDoc.exists()) {
          console.error('❌ CRITICAL: Listing disappeared after update!');
          throw new Error('Listing was deleted instead of marked for deletion');
        }
        
        const verifyData = verifyDoc.data();
        console.log('🔍 Verification after delete request:', {
          id,
          pendingDelete: verifyData.pendingDelete,
          pendingApproval: verifyData.pendingApproval,
          pendingDeleteType: typeof verifyData.pendingDelete,
          pendingApprovalType: typeof verifyData.pendingApproval,
        });
        
        const pendingDeleteValue = verifyData.pendingDelete === true || verifyData.pendingDelete === 'true';
        const pendingApprovalValue = verifyData.pendingApproval === true || verifyData.pendingApproval === 'true';
        
        if (!pendingDeleteValue || !pendingApprovalValue) {
          console.error('❌ CRITICAL: Delete request failed!', verifyData);
          // Force it back
          try {
            await updateDoc(docRef, {
              pendingDelete: true,
              pendingApproval: true,
              status: originalListing.status || 'pending',
              updatedAt: serverTimestamp(),
            });
            console.log('✅ Forced delete request flags back to true');
          } catch (forceError: any) {
            console.error('❌ CRITICAL: Even force update failed!', forceError);
            throw new Error(`Failed to set pendingDelete: ${forceError.message}`);
          }
        }
        
        return;
      }
      
      // Admin can delete directly
      await deleteDoc(docRef);
      console.log('✅ Listing deleted by admin:', id);
    } catch (error: any) {
      console.error('❌ Delete listing error:', error);
      throw new Error(error.message || 'Failed to delete listing');
    }
  },

  // Fetch listings created by specific user (admin view) - excludes pending deletions
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
        const listing = convertDocToListing(doc);
        // Exclude listings marked for deletion (they're in pending deletes queue)
        if (!listing.pendingDelete) {
          listings.push(listing);
        }
      });
      
      console.log(`✅ Fetched ${listings.length} admin listings`);
      return listings;
    } catch (error: any) {
      console.error('❌ Fetch admin listings error:', error);
      throw new Error(error.message || 'Failed to fetch admin listings');
    }
  },

  // Fetch all listings created by agents (admin view)
  fetchAgentListings: async (): Promise<Listing[]> => {
    try {
      const db = getDb();
      // First, get all users with agent role
      const usersSnapshot = await getDocs(query(
        collection(db, 'users'),
        where('role', '==', 'agent')
      ));
      
      const agentUserIds = usersSnapshot.docs.map(doc => doc.id);
      
      if (agentUserIds.length === 0) {
        console.log('✅ No agents found');
        return [];
      }
      
      // Fetch all listings created by agents
      const listings: Listing[] = [];
      
      // Firestore 'in' query supports up to 10 items, so we need to batch if more agents
      const batchSize = 10;
      for (let i = 0; i < agentUserIds.length; i += batchSize) {
        const batch = agentUserIds.slice(i, i + batchSize);
        const q = query(
          collection(db, 'listings'),
          where('createdBy', 'in', batch),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          const listing = convertDocToListing(doc);
          // Exclude listings marked for deletion
          if (!listing.pendingDelete) {
            listings.push(listing);
          }
        });
      }
      
      // Sort by createdAt descending (most recent first)
      listings.sort((a, b) => {
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return bTime - aTime;
      });
      
      console.log(`✅ Fetched ${listings.length} agent listings from ${agentUserIds.length} agents`);
      return listings;
    } catch (error: any) {
      console.error('❌ Fetch agent listings error:', error);
      throw new Error(error.message || 'Failed to fetch agent listings');
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
      
      // Try composite index query first (pendingApproval + updatedAt)
      let querySnapshot;
      try {
        const q = query(
          collection(db, 'listings'),
          where('pendingApproval', '==', true),
          orderBy('updatedAt', 'desc')
        );
        querySnapshot = await getDocs(q);
        console.log('✅ Used composite index query for pending approvals');
      } catch (indexError: any) {
        // If composite index doesn't exist, fall back to simple query
        console.warn('⚠️ Composite index not found, using fallback query:', indexError.message);
        const fallbackQuery = query(
          collection(db, 'listings'),
          where('pendingApproval', '==', true)
        );
        querySnapshot = await getDocs(fallbackQuery);
        console.log('✅ Used fallback query (no orderBy) for pending approvals');
      }
      
      const listings: Listing[] = [];
      
      querySnapshot.forEach((doc) => {
        const listing = convertDocToListing(doc);
        
        // CRITICAL: Verify pendingApproval is actually true (handle type mismatches)
        const data = doc.data();
        const pendingApproval = data.pendingApproval === true || data.pendingApproval === 'true';
        
        // Only include if:
        // 1. pendingApproval is true (boolean or string 'true')
        // 2. Not marked for deletion (deletion has separate queue)
        if (pendingApproval && !listing.pendingDelete) {
          listings.push(listing);
        } else {
          console.log('🚫 Excluded from pending approvals:', listing.id, {
            pendingApproval: data.pendingApproval,
            pendingApprovalType: typeof data.pendingApproval,
            pendingDelete: listing.pendingDelete,
          });
        }
      });
      
      // Sort manually if we used fallback query (no orderBy)
      if (listings.length > 0 && listings[0].updatedAt) {
        listings.sort((a, b) => {
          const aTime = a.updatedAt?.getTime() || 0;
          const bTime = b.updatedAt?.getTime() || 0;
          return bTime - aTime; // Descending order
        });
      }
      
      console.log(`✅ Fetched ${listings.length} pending approvals (from ${querySnapshot.size} total matches)`);
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

