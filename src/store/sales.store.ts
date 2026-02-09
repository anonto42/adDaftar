import { create } from 'zustand';
import { Sale } from '@/src/shared/types/shop.types';
import { salesRepository } from '@/src/services/database/repositories/sales.repository';
import { useProductStore } from './product.store';
import { useCustomerStore } from './customer.store';

interface SalesState {
  sales: Sale[];
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  createSale: (sale: Omit<Sale, 'id' | 'date'>) => Promise<void>;
}

export const useSalesStore = create<SalesState>()((set) => ({
  sales: [],
  isHydrated: false,

  // Load sales from SQLite database
  hydrate: async () => {
    try {
      const sales = await salesRepository.findAll();
      set({ sales, isHydrated: true });
    } catch (error) {
      console.error('[SalesStore] Failed to hydrate:', error);
      set({ isHydrated: true });
    }
  },

  // Create a new sale with atomic transaction
  createSale: async (saleData) => {
    try {
      // Execute sale creation in SQLite transaction
      // This automatically handles:
      // 1. Inserting sale record
      // 2. Inserting sale items
      // 3. Updating product quantities
      // 4. Updating customer due (if applicable)
      const newSale = await salesRepository.createSaleWithTransaction(saleData);

      // Update local state
      set((state) => ({
        sales: [newSale, ...state.sales],
      }));

      // Refresh product and customer stores to reflect changes
      const productStore = useProductStore.getState();
      await productStore.hydrate();

      if (saleData.type === 'DUE' && saleData.customerId) {
        const customerStore = useCustomerStore.getState();
        await customerStore.hydrate();
      }
    } catch (error) {
      console.error('[SalesStore] Failed to create sale:', error);
      throw error;
    }
  },
}));
