import { Business } from "@/src/shared";
import { create } from "zustand";
import { businessRepository } from "../api/business.repository";
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVE_BUSINESS_ID_KEY = 'active_business_id';

interface BusinessState {
  businesses: Business[];
  activeBusinessId: string | null;
  activeBusiness: Business | null;
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
  activeBusiness: null,
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

      const activeBusiness = businesses.find(b => b.id === activeBusinessId) || null;

      set({ 
        businesses, 
        activeBusinessId, 
        activeBusiness,
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
    console.log(`[BusinessStore] Setting active business to: ${id}`);
    await AsyncStorage.setItem(ACTIVE_BUSINESS_ID_KEY, id);
    const { businesses } = get();
    const activeBusiness = businesses.find(b => b.id === id) || null;
    
    set({ activeBusinessId: id, activeBusiness });
    
    console.log(`[BusinessStore] Triggering re-hydration for all stores...`);
    const { useProductStore, useCategoryStore } = await import('@/src/features/inventory');
    const { useCustomerStore, usePaymentStore } = await import('@/src/features/customers');
    const { useSalesStore } = await import('@/src/features/sales');
    const { useExpenseStore } = await import('@/src/features/expenses');
    
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
    const updatedBusinesses = [...get().businesses, newBusiness];
    set({ businesses: updatedBusinesses });
    
    // If it's the first business, set it as active
    if (!get().activeBusinessId) {
      await get().setActiveBusinessId(newBusiness.id);
    }
    
    return newBusiness;
  },

  updateBusiness: async (id, updates) => {
    await businessRepository.update(id, updates);
    const updatedBusinesses = get().businesses.map((b) => (b.id === id ? { ...b, ...updates } : b));
    const activeBusiness = updatedBusinesses.find(b => b.id === get().activeBusinessId) || null;
    
    set({
      businesses: updatedBusinesses,
      activeBusiness
    });
  },

  deleteBusiness: async (id) => {
    await businessRepository.delete(id);
    const updatedBusinesses = get().businesses.filter((b) => b.id !== id);
    let newActiveId = get().activeBusinessId;
    
    if (newActiveId === id) {
      newActiveId = updatedBusinesses.length > 0 ? updatedBusinesses[0].id : null;
    }
    
    const activeBusiness = updatedBusinesses.find(b => b.id === newActiveId) || null;
    
    set({
      businesses: updatedBusinesses,
      activeBusinessId: newActiveId,
      activeBusiness
    });
    
    if (newActiveId) {
      await AsyncStorage.setItem(ACTIVE_BUSINESS_ID_KEY, newActiveId);
      // Refresh other stores using direct imports
      const { useProductStore, useCategoryStore } = await import('@/src/features/inventory');
      const { useCustomerStore, usePaymentStore } = await import('@/src/features/customers');
      const { useSalesStore } = await import('@/src/features/sales');
      const { useExpenseStore } = await import('@/src/features/expenses');

      await Promise.all([
        useProductStore.getState().hydrate(),
        useCategoryStore.getState().hydrate(),
        useCustomerStore.getState().hydrate(),
        useSalesStore.getState().hydrate(),
        usePaymentStore.getState().hydrate(),
        useExpenseStore.getState().hydrate(),
      ]);
    } else {
      await AsyncStorage.removeItem(ACTIVE_BUSINESS_ID_KEY);
    }
  },

  getActiveBusiness: () => {
    const { businesses, activeBusinessId } = get();
    return businesses.find(b => b.id === activeBusinessId) || null;
  }
}));
