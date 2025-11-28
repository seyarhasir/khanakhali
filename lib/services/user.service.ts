import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getDbInstance } from '../firebase/config';
import { getAuthInstance } from '../firebase/config';
import { User } from '../types/user.types';

const getDb = () => getDbInstance();

// Convert Firestore timestamp to Date
const convertTimestamp = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  if (timestamp.toDate) return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  return new Date(timestamp);
};

// Convert Firestore document to User
const convertDocToUser = (doc: any): User => {
  const data = doc.data();
  return {
    uid: doc.id,
    email: data.email || '',
    displayName: data.displayName || '',
    role: data.role || 'user',
    createdAt: convertTimestamp(data.createdAt),
    profileImageUrl: data.profileImageUrl,
    // Detailed profile
    phone: data.phone,
    whatsApp: data.whatsApp,
    bio: data.bio,
    company: data.company,
    experience: data.experience,
    specialties: data.specialties || [],
  };
};

export interface UpdateUserProfileInput {
  displayName?: string;
  phone?: string;
  whatsApp?: string;
  bio?: string;
  company?: string;
  experience?: string;
  specialties?: string[];
  profileImageUrl?: string;
}

export const userService = {
  // Fetch user by ID
  fetchUserById: async (userId: string): Promise<User | null> => {
    try {
      const db = getDb();
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        return convertDocToUser(userDoc);
      }
      
      return null;
    } catch (error: any) {
      console.error('❌ Fetch user error:', error);
      throw new Error(error.message || 'Failed to fetch user');
    }
  },

  // Update user profile
  updateUserProfile: async (userId: string, data: UpdateUserProfileInput): Promise<void> => {
    try {
      const db = getDb();
      const auth = getAuthInstance();
      const userRef = doc(db, 'users', userId);
      
      // Check if user document exists
      const userDoc = await getDoc(userRef);
      
      // Validate displayName
      if (data.displayName !== undefined && (!data.displayName || !data.displayName.trim())) {
        throw new Error('Display name cannot be empty');
      }
      
      // Prepare update data - only include defined values
      const updateData: any = {};
      Object.keys(data).forEach((key) => {
        const value = (data as any)[key];
        if (value !== undefined && value !== null) {
          // For strings, trim whitespace
          if (typeof value === 'string') {
            updateData[key] = value.trim();
          } else {
            updateData[key] = value;
          }
        }
      });
      
      // Ensure we have at least one field to update
      if (Object.keys(updateData).length === 0) {
        console.warn('⚠️ No fields to update');
        return;
      }
      
      if (!userDoc.exists()) {
        // Create user document if it doesn't exist
        console.log('📝 User document does not exist, creating it:', userId);
        const currentUser = auth.currentUser;
        if (!currentUser || currentUser.uid !== userId) {
          throw new Error('Permission denied. You can only update your own profile.');
        }
        
        const newUserData = {
          uid: userId,
          email: currentUser.email || '',
          displayName: data.displayName || currentUser.displayName || '',
          role: 'user',
          createdAt: serverTimestamp(),
          ...updateData,
        };
        
        await setDoc(userRef, newUserData);
        console.log('✅ User document created successfully:', userId);
      } else {
        // Update existing document
        console.log('📝 Updating user profile:', userId, updateData);
        await updateDoc(userRef, updateData);
        console.log('✅ User profile updated successfully:', userId);
      }
    } catch (error: any) {
      console.error('❌ Update user profile error:', error);
      console.error('Error details:', {
        code: error?.code,
        message: error?.message,
        userId,
        dataKeys: Object.keys(data || {}),
      });
      
      // Provide more specific error messages
      if (error?.code === 'permission-denied') {
        throw new Error('Permission denied. You can only update your own profile.');
      } else if (error?.code === 'not-found') {
        throw new Error('User document not found. Please contact support.');
      } else {
        throw new Error(error?.message || 'Failed to update user profile');
      }
    }
  },
};

