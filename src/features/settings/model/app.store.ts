/**
 * App Store
 *
 * General application state that doesn't fit elsewhere.
 */

import { create } from 'zustand';
import { appRepository } from '../api/app.repository';

interface AppState {
  // App lifecycle
  isAppReady: boolean;
  setAppReady: (ready: boolean) => void;

  // Hydration
  isHydrated: boolean;
  hydrate: () => Promise<void>;

  // Settings
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>;
  currency: 'USD' | 'BDT' | 'EUR' | 'GBP' | 'INR' | 'JPY' | 'SAR' | 'AED';
  setCurrency: (currency: 'USD' | 'BDT' | 'EUR' | 'GBP' | 'INR' | 'JPY' | 'SAR' | 'AED') => Promise<void>;
  language: 'en' | 'bn' | 'ar' | 'es' | 'fr' | 'hi';
  setLanguage: (language: 'en' | 'bn' | 'ar' | 'es' | 'fr' | 'hi') => Promise<void>;

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
      const theme = await appRepository.getSetting('theme') as any || 'system';
      const currency = await appRepository.getSetting('currency') as any || 'USD';
      const language = await appRepository.getSetting('language') as any || 'en';

      set({
        hasCompletedOnboarding,
        recentSearches,
        theme,
        currency,
        language,
        isHydrated: true,
      });
    } catch (error) {
      console.error('[AppStore] Failed to hydrate:', error);
      set({ isHydrated: true });
    }
  },

  // Settings
  theme: 'system',
  setTheme: async (theme) => {
    if (get().theme === theme) return;
    set({ theme });
    try {
      await appRepository.setSetting('theme', theme);
    } catch (error) {
      console.error('[AppStore] Failed to set theme:', error);
    }
  },
  currency: 'USD',
  setCurrency: async (currency) => {
    if (get().currency === currency) return;
    set({ currency });
    try {
      await appRepository.setSetting('currency', currency);
    } catch (error) {
      console.error('[AppStore] Failed to set currency:', error);
    }
  },
  language: 'en',
  setLanguage: async (language) => {
    if (get().language === language) return;
    set({ language });
    try {
      await appRepository.setSetting('language', language);
    } catch (error) {
      console.error('[AppStore] Failed to set language:', error);
    }
  },

  // Onboarding
  hasCompletedOnboarding: false,
  setOnboardingComplete: async (hasCompletedOnboarding) => {
    if (get().hasCompletedOnboarding === hasCompletedOnboarding) return;
    set({ hasCompletedOnboarding });
    try {
      await appRepository.setOnboardingCompleted(hasCompletedOnboarding);
    } catch (error) {
      console.error('[AppStore] Failed to set onboarding:', error);
      // Rollback on error if necessary, but for onboarding usually better to stay true
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