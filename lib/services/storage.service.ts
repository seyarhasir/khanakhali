import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getStorageInstance } from '../firebase/config';

const getStorage = () => getStorageInstance();

// Upload file to Firebase Storage
const uploadFileToStorage = async (file: File, path: string): Promise<string> => {
  try {
    const storage = getStorage();
    const storageRef = ref(storage, path);
    
    // Upload the file
    await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    console.log('✅ File uploaded:', path);
    return downloadURL;
  } catch (error: any) {
    console.error('❌ Upload file error:', error);
    throw new Error(error.message || 'Failed to upload file');
  }
};

// Delete file from Firebase Storage using URL
const deleteFileFromStorage = async (url: string): Promise<void> => {
  try {
    // Extract path from URL
    const path = extractPathFromURL(url);
    if (!path) {
      throw new Error('Invalid storage URL');
    }

    const storage = getStorage();
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    
    console.log('✅ File deleted:', path);
  } catch (error: any) {
    // Don't throw error if file doesn't exist
    if (error.code === 'storage/object-not-found') {
      console.log('⚠️ File not found, already deleted:', url);
      return;
    }
    console.error('❌ Delete file error:', error);
    throw new Error(error.message || 'Failed to delete file');
  }
};

// Extract storage path from download URL
const extractPathFromURL = (url: string): string | null => {
  try {
    // Firebase Storage URL format:
    // https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={token}
    const regex = /\/o\/(.+?)\?alt=media/;
    const match = url.match(regex);
    if (match && match[1]) {
      // Decode URL encoding
      return decodeURIComponent(match[1]);
    }
    return null;
  } catch (error) {
    console.error('❌ Extract path error:', error);
    return null;
  }
};

export const storageService = {
  // Upload single image
  uploadImage: async (file: File, listingId: string, index: number): Promise<string> => {
    const path = `listings/${listingId}/image_${index}_${Date.now()}.jpg`;
    return uploadFileToStorage(file, path);
  },

  // Upload profile image
  uploadProfileImage: async (file: File, userId: string): Promise<string> => {
    const path = `profiles/${userId}/profile_${Date.now()}.jpg`;
    return uploadFileToStorage(file, path);
  },

  // Delete single image
  deleteImage: async (url: string): Promise<void> => {
    return deleteFileFromStorage(url);
  },

  // Delete multiple images
  deleteImages: async (urls: string[]): Promise<void> => {
    try {
      const deletePromises = urls.map((url) => deleteFileFromStorage(url));
      await Promise.all(deletePromises);
      console.log(`✅ Deleted ${urls.length} images`);
    } catch (error: any) {
      console.error('❌ Delete images error:', error);
      throw new Error(error.message || 'Failed to delete images');
    }
  },

  // Upload multiple images for a listing
  uploadListingImages: async (files: File[], listingId: string): Promise<string[]> => {
    try {
      const uploadPromises = files.map((file, index) => 
        uploadFileToStorage(file, `listings/${listingId}/image_${index}_${Date.now()}.jpg`)
      );
      const downloadURLs = await Promise.all(uploadPromises);
      console.log(`✅ Uploaded ${downloadURLs.length} images`);
      return downloadURLs;
    } catch (error: any) {
      console.error('❌ Upload images error:', error);
      throw new Error(error.message || 'Failed to upload images');
    }
  },
};

