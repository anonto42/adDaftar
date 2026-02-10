import { create } from 'zustand';
import { Customer } from '@/src/shared/types/shop.types';
import { customerRepository } from '../api/customer.repository';

interface CustomerState {
  customers: Customer[];
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id' | 'totalDue'>) => Promise<void>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  getCustomer: (id: string) => Promise<Customer | null>;
  updateDue: (id: string, amountChange: number) => Promise<void>; // + adds due, - reduces due (payment)
  getCustomersWithDues: () => Promise<Customer[]>;
  searchCustomers: (searchTerm: string) => Promise<Customer[]>;
  getTotalDues: () => Promise<number>;
}

export const useCustomerStore = create<CustomerState>()((set) => ({
  customers: [],
  isHydrated: false,

  // Load customers from SQLite database
  hydrate: async () => {
    try {
      const customers = await customerRepository.findAll();
      set({ customers, isHydrated: true });
    } catch (error) {
      console.error('[CustomerStore] Failed to hydrate:', error);
      set({ isHydrated: true });
    }
  },

  // Add a new customer
  addCustomer: async (customerData) => {
    try {
      const newCustomer = await customerRepository.create({
        ...customerData,
        totalDue: 0,
      });
      set((state) => ({
        customers: [...state.customers, newCustomer],
      }));
    } catch (error) {
      console.error('[CustomerStore] Failed to add customer:', error);
      throw error;
    }
  },

  // Update an existing customer
  updateCustomer: async (id, updates) => {
    try {
      await customerRepository.update(id, updates);
      set((state) => ({
        customers: state.customers.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      }));
    } catch (error) {
      console.error('[CustomerStore] Failed to update customer:', error);
      throw error;
    }
  },

  // Delete a customer
  deleteCustomer: async (id) => {
    try {
      await customerRepository.delete(id);
      set((state) => ({
        customers: state.customers.filter((c) => c.id !== id),
      }));
    } catch (error) {
      console.error('[CustomerStore] Failed to delete customer:', error);
      throw error;
    }
  },

  // Get a customer by ID
  getCustomer: async (id: string) => {
    try {
      return await customerRepository.findById(id);
    } catch (error) {
      console.error('[CustomerStore] Failed to get customer:', error);
      return null;
    }
  },

  // Update customer due amount
  updateDue: async (id, amountChange) => {
    try {
      await customerRepository.updateDue(id, amountChange);
      set((state) => ({
        customers: state.customers.map((c) =>
          c.id === id ? { ...c, totalDue: c.totalDue + amountChange } : c
        ),
      }));
    } catch (error) {
      console.error('[CustomerStore] Failed to update due:', error);
      throw error;
    }
  },

  // Get customers with outstanding dues
  getCustomersWithDues: async () => {
    try {
      return await customerRepository.getCustomersWithDues();
    } catch (error) {
      console.error('[CustomerStore] Failed to get customers with dues:', error);
      return [];
    }
  },

  // Search customers by name or phone
  searchCustomers: async (searchTerm: string) => {
    try {
      return await customerRepository.search(searchTerm);
    } catch (error) {
      console.error('[CustomerStore] Failed to search customers:', error);
      return [];
    }
  },

  // Get total amount of all dues
  getTotalDues: async () => {
    try {
      return await customerRepository.getTotalDues();
    } catch (error) {
      console.error('[CustomerStore] Failed to get total dues:', error);
      return 0;
    }
  },
}));
