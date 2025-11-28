import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getAuthInstance, getDbInstance } from '../firebase/config';
import { User } from '../types/user.types';

const getAuth = () => getAuthInstance();
const getDb = () => getDbInstance();

// Convert Firebase User to our User type
const convertFirebaseUser = async (firebaseUser: FirebaseUser): Promise<User> => {
  const db = getDb();
  const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
  
  if (userDoc.exists()) {
    const data = userDoc.data();
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: data.displayName || firebaseUser.displayName || '',
      role: data.role || 'user',
      createdAt: data.createdAt?.toDate() || new Date(),
      profileImageUrl: data.profileImageUrl,
      // Detailed profile
      phone: data.phone,
      whatsApp: data.whatsApp,
      bio: data.bio,
      company: data.company,
      experience: data.experience,
      specialties: data.specialties || [],
    };
  }

  // Fallback if user doc doesn't exist
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || '',
    role: 'user',
    createdAt: new Date(),
  };
};

export const authService = {
  // Sign up new user
  signUp: async (email: string, password: string, displayName: string): Promise<User> => {
    try {
      // Create auth user
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Create user document in Firestore
      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName,
        role: 'user', // Default role
        createdAt: serverTimestamp(),
        profileImageUrl: null,
      };

      const db = getDb();
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);

      console.log('✅ User created successfully:', email);

      return convertFirebaseUser(firebaseUser);
    } catch (error: any) {
      console.error('❌ Sign up error:', error);
      throw new Error(error.message || 'Failed to create account');
    }
  },

  // Sign in existing user
  signIn: async (email: string, password: string): Promise<User> => {
    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      console.log('✅ User signed in successfully:', email);

      return convertFirebaseUser(firebaseUser);
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      
      // Provide user-friendly error messages
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      } else if (error.code === 'auth/user-disabled') {
        throw new Error('This account has been disabled');
      } else {
        throw new Error(error.message || 'Failed to sign in');
      }
    }
  },

  // Sign out current user
  signOut: async (): Promise<void> => {
    try {
      const auth = getAuth();
      await firebaseSignOut(auth);
      console.log('✅ User signed out successfully');
    } catch (error: any) {
      console.error('❌ Sign out error:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  },

  // Get current user
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const auth = getAuth();
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        return convertFirebaseUser(firebaseUser);
      }
      return null;
    } catch (error) {
      console.error('❌ Get current user error:', error);
      return null;
    }
  },

  // Listen to auth state changes
  onAuthStateChanged: (callback: (user: User | null) => void) => {
    const auth = getAuth();
    return firebaseOnAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const user = await convertFirebaseUser(firebaseUser);
          callback(user);
        } catch (error) {
          console.error('❌ Error converting user:', error);
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  },

  // Send password reset email
  sendPasswordReset: async (email: string): Promise<void> => {
    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);
      console.log('✅ Password reset email sent successfully');
    } catch (error: any) {
      console.error('❌ Password reset error:', error);
      
      // Provide user-friendly error messages
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      } else {
        throw new Error(error.message || 'Failed to send password reset email');
      }
    }
  },

  // Refresh current user data from Firestore (useful after role changes)
  refreshUserData: async (): Promise<User | null> => {
    try {
      const auth = getAuth();
      const firebaseUser = auth.currentUser;
      
      if (!firebaseUser) {
        console.log('⚠️ No user is currently logged in');
        return null;
      }

      console.log('🔄 Refreshing user data from Firestore...');
      const db = getDb();
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log('✅ Fresh user data from Firebase:', {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role: data.role,
          displayName: data.displayName,
        });
        
        const user: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: data.displayName || firebaseUser.displayName || '',
          role: data.role || 'user',
          createdAt: data.createdAt?.toDate() || new Date(),
          profileImageUrl: data.profileImageUrl,
          phone: data.phone,
          whatsApp: data.whatsApp,
          bio: data.bio,
          company: data.company,
          experience: data.experience,
          specialties: data.specialties || [],
        };
        
        return user;
      }
      
      console.warn('⚠️ User document not found in Firestore');
      return null;
    } catch (error: any) {
      console.error('❌ Refresh user data error:', error);
      throw new Error(error.message || 'Failed to refresh user data');
    }
  },
};

