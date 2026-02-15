import { create } from 'zustand';
import { Sale } from '@/src/shared/types/shop.types';
import { salesRepository } from '../api/sales.repository';
import { useProductStore } from '@/src/features/inventory';
import { useCustomerStore } from '@/src/features/customers';
import { useBusinessStore } from '../../business/model/business.store';

interface SalesState {
  sales: Sale[];
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  createSale: (sale: Omit<Sale, 'id' | 'date' | 'businessId'>) => Promise<void>;
  getSale: (id: string) => Promise<Sale | null>;
  getSalesByCustomer: (customerId: string) => Promise<Sale[]>;
  getSalesByType: (type: 'CASH' | 'DUE') => Promise<Sale[]>;
  getSalesByDateRange: (startDate: string, endDate: string) => Promise<Sale[]>;
  getTodaysSales: () => Promise<Sale[]>;
  getTotalSalesAmount: () => Promise<number>;
  getTodaysSalesTotal: () => Promise<number>;
}

export const useSalesStore = create<SalesState>()((set) => ({
  sales: [],
  isHydrated: false,

  // Load sales from SQLite database
  hydrate: async () => {
    const businessId = useBusinessStore.getState().activeBusinessId;
    if (!businessId) {
      set({ sales: [], isHydrated: true });
      return;
    }

    try {
      const sales = await salesRepository.findAll(businessId);
      set({ sales, isHydrated: true });
    } catch (error) {
      console.error('[SalesStore] Failed to hydrate:', error);
      set({ isHydrated: true });
    }
  },

  // Create a new sale with atomic transaction
  createSale: async (saleData) => {
    const businessId = useBusinessStore.getState().activeBusinessId;
    if (!businessId) throw new Error('No active business');

    try {
      const newSale = await salesRepository.createSaleWithTransaction({
        ...saleData,
        businessId,
      });

      // Update local state
      set((state) => ({
        sales: [newSale, ...state.sales],
      }));

      // Refresh product and customer stores to reflect changes
      const productStore = useProductStore.getState();
      await productStore.hydrate();

      if (saleData.customerId) {
        const customerStore = useCustomerStore.getState();
        await customerStore.hydrate();
      }
    } catch (error) {
      console.error('[SalesStore] Failed to create sale:', error);
      throw error;
    }
  },

  // Get a sale by ID
  getSale: async (id: string) => {
    try {
      return await salesRepository.findById(id);
    } catch (error) {
      console.error('[SalesStore] Failed to get sale:', error);
      return null;
    }
  },

  // Get sales by customer
  getSalesByCustomer: async (customerId: string) => {
    try {
      return await salesRepository.getSalesByCustomer(customerId);
    } catch (error) {
      console.error('[SalesStore] Failed to get sales by customer:', error);
      return [];
    }
  },

  // Get sales by type (CASH or DUE)
  getSalesByType: async (type: 'CASH' | 'DUE') => {
    const businessId = useBusinessStore.getState().activeBusinessId;
    if (!businessId) return [];

    try {
      return await salesRepository.getSalesByType(businessId, type);
    } catch (error) {
      console.error('[SalesStore] Failed to get sales by type:', error);
      return [];
    }
  },

  // Get sales within a date range
  getSalesByDateRange: async (startDate: string, endDate: string) => {
    const businessId = useBusinessStore.getState().activeBusinessId;
    if (!businessId) return [];

    try {
      return await salesRepository.getSalesByDateRange(businessId, startDate, endDate);
    } catch (error) {
      console.error('[SalesStore] Failed to get sales by date range:', error);
      return [];
    }
  },

  // Get today's sales
  getTodaysSales: async () => {
    const businessId = useBusinessStore.getState().activeBusinessId;
    if (!businessId) return [];

    try {
      return await salesRepository.getTodaysSales(businessId);
    } catch (error) {
      console.error('[SalesStore] Failed to get todays sales:', error);
      return [];
    }
  },

  // Get total sales amount
  getTotalSalesAmount: async () => {
    const businessId = useBusinessStore.getState().activeBusinessId;
    if (!businessId) return 0;

    try {
      return await salesRepository.getTotalSalesAmount(businessId);
    } catch (error) {
      console.error('[SalesStore] Failed to get total sales amount:', error);
      return 0;
    }
  },

  // Get today's sales total
  getTodaysSalesTotal: async () => {
    const businessId = useBusinessStore.getState().activeBusinessId;
    if (!businessId) return 0;

    try {
      return await salesRepository.getTodaysSalesTotal(businessId);
    } catch (error) {
      console.error('[SalesStore] Failed to get todays sales total:', error);
      return 0;
    }
  },
}));
