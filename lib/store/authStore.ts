'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types/user.types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  favorites: string[]; // Array of listing IDs
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  toggleFavorite: (listingId: string) => void;
  isFavorite: (listingId: string) => boolean;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      favorites: [],
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        }),
      setLoading: (loading) => set({ isLoading: loading }),
      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          favorites: [],
        }),
      toggleFavorite: (listingId: string) => {
        const { favorites, isAuthenticated } = get();
        if (!isAuthenticated) {
          // Could redirect to login here
          return;
        }
        set({
          favorites: favorites.includes(listingId)
            ? favorites.filter((id) => id !== listingId)
            : [...favorites, listingId],
        });
      },
      isFavorite: (listingId: string) => {
        return get().favorites.includes(listingId);
      },
      refreshUser: async () => {
        try {
          const { authService } = await import('../services/auth.service');
          const freshUser = await authService.refreshUserData();
          if (freshUser) {
            set({ user: freshUser });
            console.log('✅ User data refreshed successfully');
          }
        } catch (error) {
          console.error('❌ Failed to refresh user:', error);
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ favorites: state.favorites }),
    }
  )
);

