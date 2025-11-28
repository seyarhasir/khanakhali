import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredFields = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ] as const;

  const missingFields = requiredFields.filter(
    (field) => !firebaseConfig[field]
  );

  if (missingFields.length > 0) {
    console.error(
      '❌ Missing Firebase environment variables:',
      missingFields.join(', ')
    );
    return false;
  }
  return true;
};

// Initialize Firebase app
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

export const initializeFirebase = () => {
  if (typeof window === 'undefined') {
    // Return null on server-side instead of throwing
    return null;
  }

  // Validate configuration before initializing
  if (!validateFirebaseConfig()) {
    console.error('❌ Firebase configuration is invalid. Please check your environment variables.');
    return null;
  }

  try {
    // Check if Firebase is already initialized
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
      console.log('✅ Firebase initialized successfully');
    } else {
      app = getApps()[0];
      console.log('✅ Firebase app already initialized');
    }

    // Initialize services
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);

    return { app, auth, db, storage };
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    // Don't throw in production, return null instead
    if (process.env.NODE_ENV === 'development') {
      throw error;
    }
    return null;
  }
};

// Initialize on import (only on client side)
// Use try-catch to prevent crashes if initialization fails
if (typeof window !== 'undefined') {
  try {
    initializeFirebase();
  } catch (error) {
    console.error('Failed to initialize Firebase on import:', error);
  }
}

// Export Firebase services with getters
export const getAuthInstance = () => {
  if (typeof window === 'undefined') {
    throw new Error('Firebase Auth can only be accessed on the client side');
  }
  if (!auth) {
    const result = initializeFirebase();
    if (!result || !auth) {
      throw new Error('Firebase Auth not initialized. Please check your environment variables.');
    }
  }
  return auth;
};

export const getDbInstance = () => {
  if (typeof window === 'undefined') {
    throw new Error('Firestore can only be accessed on the client side');
  }
  if (!db) {
    const result = initializeFirebase();
    if (!result || !db) {
      throw new Error('Firestore not initialized. Please check your environment variables.');
    }
  }
  return db;
};

export const getStorageInstance = () => {
  if (typeof window === 'undefined') {
    throw new Error('Firebase Storage can only be accessed on the client side');
  }
  if (!storage) {
    const result = initializeFirebase();
    if (!result || !storage) {
      throw new Error('Firebase Storage not initialized. Please check your environment variables.');
    }
  }
  return storage;
};

// Export for backward compatibility
export { auth, db, storage };
export default app;

