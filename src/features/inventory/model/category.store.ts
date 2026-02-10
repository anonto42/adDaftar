import { create } from 'zustand';
import { Category } from '@/src/shared/types/shop.types';
import { categoryRepository } from '../api/category.repository';

interface CategoryState {
  categories: Category[];
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getCategory: (id: string) => Category | undefined;
  getProductCount: (categoryId: string) => Promise<number>;
}

export const useCategoryStore = create<CategoryState>()((set, get) => ({
  categories: [],
  isHydrated: false,

  // Load categories from SQLite database
  hydrate: async () => {
    try {
      const categories = await categoryRepository.findAll();
      set({ categories, isHydrated: true });
    } catch (error) {
      console.error('[CategoryStore] Failed to hydrate:', error);
      set({ isHydrated: true }); // Mark as hydrated even on error to prevent blocking
    }
  },

  // Add a new category
  addCategory: async (categoryData) => {
    try {
      const newCategory = await categoryRepository.create(categoryData);
      set((state) => ({
        categories: [...state.categories, newCategory],
      }));
    } catch (error) {
      console.error('[CategoryStore] Failed to add category:', error);
      throw error;
    }
  },

  // Update an existing category
  updateCategory: async (id, updates) => {
    try {
      await categoryRepository.update(id, updates);
      set((state) => ({
        categories: state.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      }));
    } catch (error) {
      console.error('[CategoryStore] Failed to update category:', error);
      throw error;
    }
  },

  // Delete a category
  deleteCategory: async (id) => {
    try {
      await categoryRepository.delete(id);
      set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
      }));
    } catch (error) {
      console.error('[CategoryStore] Failed to delete category:', error);
      throw error;
    }
  },

  // Get a category by ID (from in-memory state)
  getCategory: (id) => get().categories.find((c) => c.id === id),

  // Get product count for a category
  getProductCount: async (categoryId: string) => {
    try {
      return await categoryRepository.getProductCount(categoryId);
    } catch (error) {
      console.error('[CategoryStore] Failed to get product count:', error);
      return 0;
    }
  },
}));
