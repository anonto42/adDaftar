import { create } from 'zustand';
import { Expense, ExpenseCategory } from '@/src/shared/types/shop.types';
import { expenseRepository } from '../api/expense.repository';
import { useBusinessStore } from '../../business/model/business.store';

interface ExpenseState {
  expenses: Expense[];
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'businessId'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  getExpense: (id: string) => Expense | undefined;
  getExpensesByCategory: (category: ExpenseCategory) => Promise<Expense[]>;
  getExpensesByDateRange: (startDate: string, endDate: string) => Promise<Expense[]>;
  getMonthlyExpenses: (month: number, year: number) => Promise<Expense[]>;
  getMonthlyTotal: (month: number, year: number) => Promise<number>;
  getTotalExpenses: () => Promise<number>;
}

export const useExpenseStore = create<ExpenseState>()((set, get) => ({
  expenses: [],
  isHydrated: false,

  // Load expenses from SQLite database
  hydrate: async () => {
    const businessId = useBusinessStore.getState().activeBusinessId;
    if (!businessId) {
      set({ expenses: [], isHydrated: true });
      return;
    }

    try {
      const expenses = await expenseRepository.findAll(businessId);
      set({ expenses, isHydrated: true });
    } catch (error) {
      console.error('[ExpenseStore] Failed to hydrate:', error);
      set({ isHydrated: true }); // Mark as hydrated even on error to prevent blocking
    }
  },

  // Add a new expense
  addExpense: async (expenseData) => {
    const businessId = useBusinessStore.getState().activeBusinessId;
    if (!businessId) throw new Error('No active business');

    try {
      const newExpense = await expenseRepository.create({
        ...expenseData,
        businessId,
      });
      set((state) => ({
        expenses: [newExpense, ...state.expenses], // Add to beginning for chronological order
      }));
    } catch (error) {
      console.error('[ExpenseStore] Failed to add expense:', error);
      throw error;
    }
  },

  // Update an existing expense
  updateExpense: async (id, updates) => {
    try {
      await expenseRepository.update(id, updates);
      set((state) => ({
        expenses: state.expenses.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      }));
    } catch (error) {
      console.error('[ExpenseStore] Failed to update expense:', error);
      throw error;
    }
  },

  // Delete an expense
  deleteExpense: async (id) => {
    try {
      await expenseRepository.delete(id);
      set((state) => ({
        expenses: state.expenses.filter((e) => e.id !== id),
      }));
    } catch (error) {
      console.error('[ExpenseStore] Failed to delete expense:', error);
      throw error;
    }
  },

  // Get an expense by ID (from in-memory state)
  getExpense: (id) => get().expenses.find((e) => e.id === id),

  // Get expenses by category
  getExpensesByCategory: async (category: ExpenseCategory) => {
    const businessId = useBusinessStore.getState().activeBusinessId;
    if (!businessId) return [];

    try {
      return await expenseRepository.getExpensesByCategory(businessId, category);
    } catch (error) {
      console.error('[ExpenseStore] Failed to get expenses by category:', error);
      return [];
    }
  },

  // Get expenses by date range
  getExpensesByDateRange: async (startDate: string, endDate: string) => {
    const businessId = useBusinessStore.getState().activeBusinessId;
    if (!businessId) return [];

    try {
      return await expenseRepository.getExpensesByDateRange(businessId, startDate, endDate);
    } catch (error) {
      console.error('[ExpenseStore] Failed to get expenses by date range:', error);
      return [];
    }
  },

  // Get expenses for a specific month
  getMonthlyExpenses: async (month: number, year: number) => {
    const businessId = useBusinessStore.getState().activeBusinessId;
    if (!businessId) return [];

    try {
      return await expenseRepository.getMonthlyExpenses(businessId, month, year);
    } catch (error) {
      console.error('[ExpenseStore] Failed to get monthly expenses:', error);
      return [];
    }
  },

  // Get total expenses for a specific month
  getMonthlyTotal: async (month: number, year: number) => {
    const businessId = useBusinessStore.getState().activeBusinessId;
    if (!businessId) return 0;

    try {
      return await expenseRepository.getMonthlyTotal(businessId, month, year);
    } catch (error) {
      console.error('[ExpenseStore] Failed to get monthly total:', error);
      return 0;
    }
  },

  // Get total expenses
  getTotalExpenses: async () => {
    const businessId = useBusinessStore.getState().activeBusinessId;
    if (!businessId) return 0;

    try {
      return await expenseRepository.getTotalExpenses(businessId);
    } catch (error) {
      console.error('[ExpenseStore] Failed to get total expenses:', error);
      return 0;
    }
  },
}));
