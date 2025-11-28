'use client';

import React, { useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { authService } from '@/lib/services/auth.service';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setUser, setLoading } = useAuthStore();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Set loading to true initially
    setLoading(true);

    // Subscribe to auth state changes
    unsubscribeRef.current = authService.onAuthStateChanged((user) => {
      console.log('🔄 Auth state changed:', user ? `User: ${user.email}` : 'No user');
      setUser(user);
      setLoading(false);
    });

    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [setUser, setLoading]);

  return <>{children}</>;
};

