import { Business } from "@/src/shared";
import { create } from "zustand";
import { businessRepository } from "../api/business.repository";
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVE_BUSINESS_ID_KEY = 'active_business_id';

interface BusinessState {
  businesses: Business[];
  activeBusinessId: string | null;
  isHydrated: boolean;
  
  // Actions
  hydrate: () => Promise<void>;
  setActiveBusinessId: (id: string) => Promise<void>;
  addBusiness: (business: Omit<Business, 'id'>) => Promise<Business>;
  updateBusiness: (id: string, updates: Partial<Omit<Business, 'id'>>) => Promise<void>;
  deleteBusiness: (id: string) => Promise<void>;
  getActiveBusiness: () => Business | null;
}

export const useBusinessStore = create<BusinessState>()((set, get) => ({
  businesses: [],
  activeBusinessId: null,
  isHydrated: false,

  hydrate: async () => {
    try {
      const businesses = await businessRepository.findAll();
      const savedActiveId = await AsyncStorage.getItem(ACTIVE_BUSINESS_ID_KEY);
      
      let activeBusinessId = savedActiveId;
      
      // If no saved ID or saved ID doesn't exist anymore, use the first business
      if (!activeBusinessId || !businesses.find(b => b.id === activeBusinessId)) {
        activeBusinessId = businesses.length > 0 ? businesses[0].id : null;
      }

      set({ 
        businesses, 
        activeBusinessId, 
        isHydrated: true 
      });

      if (activeBusinessId) {
        await AsyncStorage.setItem(ACTIVE_BUSINESS_ID_KEY, activeBusinessId);
      }
    } catch (error) {
      console.error('[BusinessStore] Failed to hydrate:', error);
      set({ isHydrated: true });
    }
  },

  setActiveBusinessId: async (id: string) => {
    await AsyncStorage.setItem(ACTIVE_BUSINESS_ID_KEY, id);
    set({ activeBusinessId: id });
    
    // Trigger re-hydration of all other stores
    const { useProductStore, useCategoryStore, useCustomerStore, useSalesStore, usePaymentStore, useExpenseStore } = await import('@/src/store');
    
    await Promise.all([
      useProductStore.getState().hydrate(),
      useCategoryStore.getState().hydrate(),
      useCustomerStore.getState().hydrate(),
      useSalesStore.getState().hydrate(),
      usePaymentStore.getState().hydrate(),
      useExpenseStore.getState().hydrate(),
    ]);
  },

  addBusiness: async (businessData) => {
    const newBusiness = await businessRepository.create(businessData);
    set((state) => ({ 
      businesses: [...state.businesses, newBusiness] 
    }));
    
    // If it's the first business, set it as active
    if (!get().activeBusinessId) {
      await get().setActiveBusinessId(newBusiness.id);
    }
    
    return newBusiness;
  },

  updateBusiness: async (id, updates) => {
    await businessRepository.update(id, updates);
    set((state) => ({
      businesses: state.businesses.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    }));
  },

  deleteBusiness: async (id) => {
    await businessRepository.delete(id);
    set((state) => {
      const newBusinesses = state.businesses.filter((b) => b.id !== id);
      let newActiveId = state.activeBusinessId;
      
      if (newActiveId === id) {
        newActiveId = newBusinesses.length > 0 ? newBusinesses[0].id : null;
      }
      
      return {
        businesses: newBusinesses,
        activeBusinessId: newActiveId
      };
    });
    
    const activeId = get().activeBusinessId;
    if (activeId) {
      await AsyncStorage.setItem(ACTIVE_BUSINESS_ID_KEY, activeId);
      await get().setActiveBusinessId(activeId);
    } else {
      await AsyncStorage.removeItem(ACTIVE_BUSINESS_ID_KEY);
    }
  },

  getActiveBusiness: () => {
    const { businesses, activeBusinessId } = get();
    return businesses.find(b => b.id === activeBusinessId) || null;
  }
}));
