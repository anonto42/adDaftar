/**
 * App Store
 *
 * General application state that doesn't fit elsewhere.
 */

import { create } from 'zustand';
import { appRepository } from '@/src/services/database/repositories/app.repository';

interface AppState {
  // App lifecycle
  isAppReady: boolean;
  setAppReady: (ready: boolean) => void;

  // Hydration
  isHydrated: boolean;
  hydrate: () => Promise<void>;

  // First launch
  hasCompletedOnboarding: boolean;
  setOnboardingComplete: (complete: boolean) => Promise<void>;

  // Recent searches
  recentSearches: string[];
  addRecentSearch: (query: string) => Promise<void>;
  removeRecentSearch: (query: string) => void;
  clearRecentSearches: () => Promise<void>;
}

export const useAppStore = create<AppState>()((set, get) => ({
  // App lifecycle
  isAppReady: false,
  setAppReady: (isAppReady) => set({ isAppReady }),

  // Hydration
  isHydrated: false,
  hydrate: async () => {
    try {
      const hasCompletedOnboarding = await appRepository.hasCompletedOnboarding();
      const recentSearches = await appRepository.getRecentSearches();

      set({
        hasCompletedOnboarding,
        recentSearches,
        isHydrated: true,
      });
    } catch (error) {
      console.error('[AppStore] Failed to hydrate:', error);
      set({ isHydrated: true });
    }
  },

  // Onboarding
  hasCompletedOnboarding: false,
  setOnboardingComplete: async (hasCompletedOnboarding) => {
    try {
      await appRepository.setOnboardingCompleted(hasCompletedOnboarding);
      set({ hasCompletedOnboarding });
    } catch (error) {
      console.error('[AppStore] Failed to set onboarding:', error);
      throw error;
    }
  },

  // Recent searches
  recentSearches: [],
  addRecentSearch: async (query) => {
    try {
      const current = get().recentSearches;
      const filtered = current.filter((s) => s !== query);
      const updated = [query, ...filtered].slice(0, 10); // Keep last 10

      await appRepository.setRecentSearches(updated);
      set({ recentSearches: updated });
    } catch (error) {
      console.error('[AppStore] Failed to add recent search:', error);
    }
  },
  removeRecentSearch: (query) =>
    set((state) => ({
      recentSearches: state.recentSearches.filter((s) => s !== query),
    })),
  clearRecentSearches: async () => {
    try {
      await appRepository.setRecentSearches([]);
      set({ recentSearches: [] });
    } catch (error) {
      console.error('[AppStore] Failed to clear recent searches:', error);
    }
  },
}));

// Selectors
export const useIsAppReady = () => useAppStore((state) => state.isAppReady);
export const useRecentSearches = () => useAppStore((state) => state.recentSearches);