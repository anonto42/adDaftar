/**
 * Database Schema Definitions
 *
 * Contains all SQL DDL statements for creating tables and indexes
 */

export const SCHEMA_VERSION = 5;

export const createBusinessTable = `
CREATE TABLE IF NOT EXISTS business (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

export const createBusinessIndexes = `
CREATE INDEX IF NOT EXISTS idx_business_name ON business(name);
`;

export const createProductsTable = `
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  price REAL NOT NULL,
  category_id TEXT,
  cost_price REAL DEFAULT 0,
  low_stock_level INTEGER DEFAULT 5,
  image_uri TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES business(id) ON DELETE CASCADE
);
`;

export const createProductsIndexes = `
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_business ON products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
`;

export const createCustomersTable = `
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  total_due REAL NOT NULL DEFAULT 0,
  last_purchase_date TEXT,
  total_purchases REAL DEFAULT 0,
  purchase_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES business(id) ON DELETE CASCADE
);
`;

export const createCustomersIndexes = `
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_business ON customers(business_id);
CREATE INDEX IF NOT EXISTS idx_customers_due ON customers(total_due);
`;

export const createSalesTable = `
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  date TEXT NOT NULL,
  total_amount REAL NOT NULL,
  received_amount REAL NOT NULL DEFAULT 0,
  type TEXT NOT NULL CHECK(type IN ('CASH', 'DUE')),
  customer_id TEXT,
  customer_name TEXT,
  discount REAL DEFAULT 0,
  payment_method TEXT DEFAULT 'CASH',
  profit REAL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES business(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);
`;

export const createSalesIndexes = `
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
CREATE INDEX IF NOT EXISTS idx_sales_business ON sales(business_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_type ON sales(type);
`;

export const createSaleItemsTable = `
CREATE TABLE IF NOT EXISTS sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  total REAL NOT NULL,
  cost_price REAL DEFAULT 0,
  profit REAL DEFAULT 0,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);
`;

export const createSaleItemsIndexes = `
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);
`;

export const createAppSettingsTable = `
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

export const createCategoriesTable = `
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES business(id) ON DELETE CASCADE
);
`;

export const createCategoriesIndexes = `
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_business ON categories(business_id);
`;

export const createPaymentHistoryTable = `
CREATE TABLE IF NOT EXISTS payment_history (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_date TEXT NOT NULL,
  payment_method TEXT DEFAULT 'CASH',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES business(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);
`;

export const createPaymentHistoryIndexes = `
CREATE INDEX IF NOT EXISTS idx_payment_business ON payment_history(business_id);
CREATE INDEX IF NOT EXISTS idx_payment_customer ON payment_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_date ON payment_history(payment_date);
`;

export const createExpensesTable = `
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  expense_date TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES business(id) ON DELETE CASCADE
);
`;

export const createExpensesIndexes = `
CREATE INDEX IF NOT EXISTS idx_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expense_business ON expenses(business_id);
CREATE INDEX IF NOT EXISTS idx_expense_category ON expenses(category);
`;

/**
 * All schema creation statements in order
 */
export const SCHEMA_STATEMENTS = [
  // Tables
  createBusinessTable,
  createProductsTable,
  createCustomersTable,
  createSalesTable,
  createSaleItemsTable,
  createAppSettingsTable,
  createCategoriesTable,
  createPaymentHistoryTable,
  createExpensesTable,

  // Indexes
  createBusinessIndexes,
  createProductsIndexes,
  createCustomersIndexes,
  createSalesIndexes,
  createSaleItemsIndexes,
  createCategoriesIndexes,
  createPaymentHistoryIndexes,
  createExpensesIndexes,
];

/**
 * Drop all tables (for testing/development only)
 */
export const DROP_ALL_TABLES = [
  'DROP TABLE IF EXISTS payment_history;',
  'DROP TABLE IF EXISTS expenses;',
  'DROP TABLE IF EXISTS sale_items;',
  'DROP TABLE IF EXISTS sales;',
  'DROP TABLE IF EXISTS customers;',
  'DROP TABLE IF EXISTS products;',
  'DROP TABLE IF EXISTS categories;',
  'DROP TABLE IF EXISTS business;',
  'DROP TABLE IF EXISTS app_settings;',
];
