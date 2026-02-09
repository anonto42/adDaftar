/**
 * UI Store
 *
 * Global UI state for modals, toasts, loading indicators, etc.
 */

import { create } from 'zustand';

// Toast types
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

// Modal state
export interface ModalState {
  isOpen: boolean;
  type: string | null;
  data: unknown;
}

interface UIState {
  // Toast notifications
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // Modal state
  modal: ModalState;
  openModal: (type: string, data?: unknown) => void;
  closeModal: () => void;

  // Global loading state
  isGlobalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;

  // Bottom sheet
  bottomSheet: {
    isOpen: boolean;
    content: string | null;
    data: unknown;
  };
  openBottomSheet: (content: string, data?: unknown) => void;
  closeBottomSheet: () => void;

  // Refresh control
  isRefreshing: boolean;
  setRefreshing: (refreshing: boolean) => void;

  // Keyboard state
  isKeyboardVisible: boolean;
  setKeyboardVisible: (visible: boolean) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  // Toast state
  toasts: [],

  addToast: (toast) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = { ...toast, id };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto-remove after duration
    const duration = toast.duration || 3000;
    setTimeout(() => {
      get().removeToast(id);
    }, duration);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearToasts: () => set({ toasts: [] }),

  // Modal state
  modal: {
    isOpen: false,
    type: null,
    data: null,
  },

  openModal: (type, data = null) =>
    set({
      modal: { isOpen: true, type, data },
    }),

  closeModal: () =>
    set({
      modal: { isOpen: false, type: null, data: null },
    }),

  // Global loading
  isGlobalLoading: false,
  setGlobalLoading: (isGlobalLoading) => set({ isGlobalLoading }),

  // Bottom sheet
  bottomSheet: {
    isOpen: false,
    content: null,
    data: null,
  },

  openBottomSheet: (content, data = null) =>
    set({
      bottomSheet: { isOpen: true, content, data },
    }),

  closeBottomSheet: () =>
    set({
      bottomSheet: { isOpen: false, content: null, data: null },
    }),

  // Refresh
  isRefreshing: false,
  setRefreshing: (isRefreshing) => set({ isRefreshing }),

  // Keyboard
  isKeyboardVisible: false,
  setKeyboardVisible: (isKeyboardVisible) => set({ isKeyboardVisible }),
}));

// Convenience hooks
export const useToasts = () => useUIStore((state) => state.toasts);
export const useModal = () => useUIStore((state) => state.modal);
export const useBottomSheet = () => useUIStore((state) => state.bottomSheet);
