'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { authService } from '@/lib/services/auth.service';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setUser, setLoading } = useAuthStore();
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Set loading to true initially
    setLoading(true);

    // Subscribe to auth state changes
    unsubscribeRef.current = authService.onAuthStateChanged((user) => {
      console.log('🔄 Auth state changed:', user ? `User: ${user.email} (${user.role})` : 'No user');
      setUser(user);
      setLoading(false);
      setIsInitialized(true);
    });

    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [setUser, setLoading]);

  // Don't render children until auth state is initialized
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-brand-gray">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

