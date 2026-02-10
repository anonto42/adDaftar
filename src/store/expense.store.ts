import { create } from 'zustand';
import { Expense, ExpenseCategory } from '@/src/shared/types/shop.types';
import { expenseRepository } from '@/src/services/database/repositories/expense.repository';

interface ExpenseState {
  expenses: Expense[];
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
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
    try {
      const expenses = await expenseRepository.findAll();
      set({ expenses, isHydrated: true });
    } catch (error) {
      console.error('[ExpenseStore] Failed to hydrate:', error);
      set({ isHydrated: true }); // Mark as hydrated even on error to prevent blocking
    }
  },

  // Add a new expense
  addExpense: async (expenseData) => {
    try {
      const newExpense = await expenseRepository.create(expenseData);
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
    try {
      return await expenseRepository.getExpensesByCategory(category);
    } catch (error) {
      console.error('[ExpenseStore] Failed to get expenses by category:', error);
      return [];
    }
  },

  // Get expenses by date range
  getExpensesByDateRange: async (startDate: string, endDate: string) => {
    try {
      return await expenseRepository.getExpensesByDateRange(startDate, endDate);
    } catch (error) {
      console.error('[ExpenseStore] Failed to get expenses by date range:', error);
      return [];
    }
  },

  // Get expenses for a specific month
  getMonthlyExpenses: async (month: number, year: number) => {
    try {
      return await expenseRepository.getMonthlyExpenses(month, year);
    } catch (error) {
      console.error('[ExpenseStore] Failed to get monthly expenses:', error);
      return [];
    }
  },

  // Get total expenses for a specific month
  getMonthlyTotal: async (month: number, year: number) => {
    try {
      return await expenseRepository.getMonthlyTotal(month, year);
    } catch (error) {
      console.error('[ExpenseStore] Failed to get monthly total:', error);
      return 0;
    }
  },

  // Get total expenses
  getTotalExpenses: async () => {
    try {
      return await expenseRepository.getTotalExpenses();
    } catch (error) {
      console.error('[ExpenseStore] Failed to get total expenses:', error);
      return 0;
    }
  },
}));
