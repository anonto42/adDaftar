import { create } from 'zustand';
import { Product } from '@/src/shared/types/shop.types';
import { productRepository } from '@/src/services/database/repositories/product.repository';

interface ProductState {
  products: Product[];
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProduct: (id: string) => Product | undefined;
  searchByName: (searchTerm: string) => Promise<Product[]>;
  getLowStock: () => Promise<Product[]>;
  getByCategory: (categoryId: string) => Promise<Product[]>;
}

export const useProductStore = create<ProductState>()((set, get) => ({
  products: [],
  isHydrated: false,

  // Load products from SQLite database
  hydrate: async () => {
    try {
      const products = await productRepository.findAll();
      set({ products, isHydrated: true });
    } catch (error) {
      console.error('[ProductStore] Failed to hydrate:', error);
      set({ isHydrated: true }); // Mark as hydrated even on error to prevent blocking
    }
  },

  // Add a new product
  addProduct: async (productData) => {
    try {
      const newProduct = await productRepository.create(productData);
      set((state) => ({
        products: [...state.products, newProduct],
      }));
    } catch (error) {
      console.error('[ProductStore] Failed to add product:', error);
      throw error;
    }
  },

  // Update an existing product
  updateProduct: async (id, updates) => {
    try {
      await productRepository.update(id, updates);
      set((state) => ({
        products: state.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      }));
    } catch (error) {
      console.error('[ProductStore] Failed to update product:', error);
      throw error;
    }
  },

  // Delete a product
  deleteProduct: async (id) => {
    try {
      await productRepository.delete(id);
      set((state) => ({
        products: state.products.filter((p) => p.id !== id),
      }));
    } catch (error) {
      console.error('[ProductStore] Failed to delete product:', error);
      throw error;
    }
  },

  // Get a product by ID (from in-memory state)
  getProduct: (id) => get().products.find((p) => p.id === id),

  // Search products by name
  searchByName: async (searchTerm: string) => {
    try {
      return await productRepository.searchByName(searchTerm);
    } catch (error) {
      console.error('[ProductStore] Failed to search products:', error);
      return [];
    }
  },

  // Get products with low stock (using their own lowStockLevel)
  getLowStock: async () => {
    try {
      return await productRepository.getLowStock();
    } catch (error) {
      console.error('[ProductStore] Failed to get low stock products:', error);
      return [];
    }
  },

  // Get products by category
  getByCategory: async (categoryId: string) => {
    try {
      return await productRepository.getByCategory(categoryId);
    } catch (error) {
      console.error('[ProductStore] Failed to get products by category:', error);
      return [];
    }
  },
}));
