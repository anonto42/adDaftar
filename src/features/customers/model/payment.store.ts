import { create } from 'zustand';
import { Payment } from '@/src/shared/types/shop.types';
import { paymentRepository } from '../api/payment.repository';
import { useBusinessStore } from '../../business/model/business.store';

interface PaymentState {
  payments: Payment[];
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  addPayment: (payment: Omit<Payment, 'id' | 'businessId'>) => Promise<void>;
  getPaymentsByCustomer: (customerId: string) => Promise<Payment[]>;
  getRecentPayments: (limit?: number) => Promise<Payment[]>;
  getTotalPayments: () => Promise<number>;
}

export const usePaymentStore = create<PaymentState>()((set, get) => ({
  payments: [],
  isHydrated: false,

  // Load payments from SQLite database
  hydrate: async () => {
    const businessId = useBusinessStore.getState().activeBusinessId;
    if (!businessId) {
      set({ payments: [], isHydrated: true });
      return;
    }

    try {
      const payments = await paymentRepository.findAll(businessId);
      set({ payments, isHydrated: true });
    } catch (error) {
      console.error('[PaymentStore] Failed to hydrate:', error);
      set({ isHydrated: true });
    }
  },

  // Add a new payment
  addPayment: async (paymentData) => {
    const businessId = useBusinessStore.getState().activeBusinessId;
    if (!businessId) throw new Error('No active business');

    try {
      const newPayment = await paymentRepository.create({
        ...paymentData,
        businessId,
      });
      set((state) => ({
        payments: [newPayment, ...state.payments], // Add to beginning for chronological order
      }));
    } catch (error) {
      console.error('[PaymentStore] Failed to add payment:', error);
      throw error;
    }
  },

  // Get payments for a specific customer
  getPaymentsByCustomer: async (customerId: string) => {
    try {
      return await paymentRepository.getPaymentsByCustomer(customerId);
    } catch (error) {
      console.error('[PaymentStore] Failed to get customer payments:', error);
      return [];
    }
  },

  // Get recent payments
  getRecentPayments: async (limit: number = 10) => {
    const businessId = useBusinessStore.getState().activeBusinessId;
    if (!businessId) return [];

    try {
      return await paymentRepository.getRecentPayments(businessId, limit);
    } catch (error) {
      console.error('[PaymentStore] Failed to get recent payments:', error);
      return [];
    }
  },

  // Get total payments amount
  getTotalPayments: async () => {
    const businessId = useBusinessStore.getState().activeBusinessId;
    if (!businessId) return 0;

    try {
      return await paymentRepository.getTotalPayments(businessId);
    } catch (error) {
      console.error('[PaymentStore] Failed to get total payments:', error);
      return 0;
    }
  },
}));
