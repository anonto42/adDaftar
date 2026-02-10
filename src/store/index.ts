/**
 * Store Index
 *
 * Central export for all Zustand stores redirected to features.
 */

export * from './ui.store';
export { useAppStore } from '@/src/features/settings';
export { useProductStore, useCategoryStore } from '@/src/features/inventory';
export { useCustomerStore, usePaymentStore } from '@/src/features/customers';
export { useSalesStore } from '@/src/features/sales';
export { useExpenseStore } from '@/src/features/expenses';
