// ============ Categories ============
export interface Category {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  icon?: string;  // Ionicons name
  color?: string; // Hex color
}

// ============ Business ============
export interface Business {
  id: string;
  name: string;
  description: string
}

// ============ Products ============
export interface Product {
  id: string;
  businessId: string;
  name: string;
  quantity: number;
  price: number;
  categoryId?: string;
  costPrice?: number;
  lowStockLevel?: number;
  imageUri?: string;
}

// ============ Customers ============
export interface Customer {
  id: string;
  businessId: string;
  name: string;
  phone?: string;
  address?: string;
  totalDue: number;
  lastPurchaseDate?: string;
  totalPurchases?: number;
  purchaseCount?: number;
}

// ============ Sales ============
export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  costPrice?: number;
  profit?: number;
}

export interface Sale {
  id: string;
  businessId: string;
  date: string; // ISO string
  items: SaleItem[];
  totalAmount: number;
  type: 'CASH' | 'DUE';
  customerId?: string;
  customerName?: string;
  discount?: number;
  paymentMethod?: 'CASH' | 'CARD' | 'MOBILE';
  profit?: number;
  notes?: string;
}

// ============ Payments ============
export interface Payment {
  id: string;
  businessId: string;
  customerId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'CASH' | 'CARD' | 'MOBILE' | 'OTHER';
  notes?: string;
}

// ============ Expenses ============
export type ExpenseCategory = 'RENT' | 'UTILITIES' | 'SALARY' | 'WAGES' | 'SUPPLIES' | 'MAINTENANCE' | 'OTHER';

export interface Expense {
  id: string;
  businessId: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  expenseDate: string;
  notes?: string;
}

// ============ Analytics ============
export interface SalesTrend {
  date: string;
  sales: number;
  profit: number;
  count: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  totalSold: number;
  revenue: number;
  profit: number;
}

export interface TopCustomer {
  customerId: string;
  customerName: string;
  totalPurchases: number;
  purchaseCount: number;
}

export interface FinancialSummary {
  totalSales: number;
  totalProfit: number;
  totalExpenses: number;
  netProfit: number;
  salesCount: number;
}
