# API Reference

This document describes the internal API structure of adDaftar.

## Database Layer

All database operations are handled through the database service and repository pattern.

### Database Utilities (`src/services/database/index.ts`)

```typescript
// Get the singleton database instance
export function getDatabase(): SQLite.SQLiteDatabase

// Initialize database tables
export async function initializeDatabase(): Promise<void>

// Initialize database indexes (run after migrations)
export async function initializeIndexes(): Promise<void>

// Execute a SELECT query and return all results
export async function executeQuery<T = any>(
  sql: string,
  params: any[] = []
): Promise<T[]>

// Execute a SELECT query and return the first result
export async function executeQuerySingle<T = any>(
  sql: string,
  params: any[] = []
): Promise<T | null>

// Execute an INSERT/UPDATE/DELETE statement
export async function executeStatement(
  sql: string,
  params: any[] = []
): Promise<SQLite.SQLiteRunResult>

// Execute multiple statements in a transaction
export async function executeTransaction(
  statements: { sql: string; params?: any[] }[]
): Promise<void>

// Execute a custom transaction function
export async function withTransaction<T>(
  callback: () => Promise<T>
): Promise<T>

// Close the database connection
export function closeDatabase(): void

// Drop all tables (development/testing only)
export async function dropAllTables(): Promise<void>
```

### Repository Pattern

Each feature module has its own repository that encapsulates all SQL queries for that feature.

#### Example: Product Repository

```typescript
// src/features/inventory/api/product.repository.ts
export const productRepository = {
  create: async (product: Omit<Product, 'id'>, businessId: string): Promise<Product>
  findAll: async (businessId: string): Promise<Product[]>
  findById: async (id: string, businessId: string): Promise<Product | null>
  update: async (id: string, updates: Partial<Product>, businessId: string): Promise<void>
  delete: async (id: string, businessId: string): Promise<void>
  search: async (query: string, businessId: string): Promise<Product[]>
  getLowStock: async (businessId: string): Promise<Product[]>
  adjustStock: async (id: string, quantity: number, businessId: string): Promise<void>
}
```

#### Available Repositories

| Feature | Repository File | Key Methods |
|---------|-----------------|-------------|
| Business | `src/features/business/api/business.repository.ts` | `create`, `findAll`, `findOne`, `update`, `delete` |
| Products | `src/features/inventory/api/product.repository.ts` | `create`, `findAll`, `update`, `delete`, `search`, `adjustStock` |
| Categories | `src/features/inventory/api/category.repository.ts` | `create`, `findAll`, `update`, `delete`, `getProductCount` |
| Customers | `src/features/customers/api/customer.repository.ts` | `create`, `findAll`, `update`, `delete`, `search` |
| Payments | `src/features/customers/api/payment.repository.ts` | `create`, `findAll`, `getByCustomer`, `getByDateRange` |
| Sales | `src/features/sales/api/sales.repository.ts` | `create`, `findAll`, `findByDateRange`, `getTotals` |
| Expenses | `src/features/expenses/api/expense.repository.ts` | `create`, `findAll`, `getByCategory`, `getMonthlyTotal` |
| Analytics | `src/features/analytics/api/analytics.repository.ts` | `getSalesTrends`, `getTopProducts`, `getFinancialSummary` |
| App Settings | `src/features/settings/api/app.repository.ts` | `getSetting`, `setSetting`, `getRecentSearches` |

## State Management (Zustand)

### Store Pattern

Each feature has its own Zustand store with a `hydrate()` method that loads data from SQLite:

```typescript
export const useProductStore = create<ProductState>()((set, get) => ({
  products: [],
  isHydrated: false,
  
  hydrate: async (businessId: string) => {
    const products = await productRepository.findAll(businessId);
    set({ products, isHydrated: true });
  },
  
  addProduct: async (product, businessId) => {
    const newProduct = await productRepository.create(product, businessId);
    set(state => ({
      products: [...state.products, newProduct]
    }));
    return newProduct;
  },
  
  // ... update, delete, search, etc.
}));
```

### Available Stores

| Store | File | Purpose |
|-------|------|---------|
| `useBusinessStore` | `src/features/business/model/business.store.ts` | Business management, active business switching |
| `useProductStore` | `src/features/inventory/model/product.store.ts` | Product inventory state |
| `useCategoryStore` | `src/features/inventory/model/category.store.ts` | Product categories state |
| `useCustomerStore` | `src/features/customers/model/customer.store.ts` | Customer records state |
| `usePaymentStore` | `src/features/customers/model/payment.store.ts` | Payment history state |
| `useSalesStore` | `src/features/sales/model/sales.store.ts` | Sales transactions state |
| `useExpenseStore` | `src/features/expenses/model/expense.store.ts` | Expense tracking state |
| `useAppStore` | `src/features/settings/model/app.store.ts` | App settings, theme, language |
| `useUIStore` | `src/store/ui.store.ts` | UI state (toasts, modals, loading) |

## Data Types

All TypeScript types are defined in `src/shared/types/shop.types.ts`:

### Core Types

- `Business` — Business profile
- `Product` — Inventory item
- `Category` — Product category
- `Customer` — Customer record
- `Sale` — Sales transaction
- `SaleItem` — Line item in a sale
- `Payment` — Customer payment record
- `Expense` — Business expense
- `SalesTrend` — Analytics data
- `TopProduct` — Top-selling products analytics
- `TopCustomer` — Top customers analytics
- `FinancialSummary` — Financial summary analytics

## UI Components

Reusable components are in `src/shared/components/`:

| Component | Props | Description |
|-----------|-------|-------------|
| `Button` | `variant`, `size`, `onPress`, `title` | Themed button with variants |
| `Input` | `placeholder`, `value`, `onChangeText`, `error` | Text input with validation |
| `Avatar` | `size`, `source`, `name` | User avatar |
| `IconButton` | `icon`, `onPress`, `size` | Icon-only button |
| `Card` (`GlassCard`) | `children`, `style` | Glass-morphism card |
| `Skeleton` | `width`, `height` | Loading placeholder |
| `EmptyState` | `title`, `description`, `icon` | Empty list state |
| `ErrorState` | `title`, `message` | Error display |
| `SearchBar` | `value`, `onChangeText`, `placeholder` | Search input |
| `ScreenHeader` | `title`, `subtitle` | Standardized header |
| `SideTabBar` | (props from Tabs) | Custom side tab navigation |

## Theme System

Theme tokens are in `src/shared/theme/`:

| Module | Exports |
|--------|---------|
| `colors.ts` | `lightColors`, `darkColors`, `brandColors`, `gradients`, `ThemeColors` |
| `typography.ts` | `fontSize`, `fontWeight`, `lineHeight`, `textStyles` |
| `spacing.ts` | `spacing`, `layoutSpacing` |
| `radius.ts` | `radius`, `componentRadius` |
| `shadows.ts` | `shadows`, `glows` |
| `motion.ts` | `duration`, `easing`, `spring`, `animations` |

### Usage

```typescript
import { useTheme } from '@/src/shared/theme';

function MyComponent() {
  const { theme } = useTheme();
  return <View style={{ backgroundColor: theme.colors.card }} />;
}
```

## Internationalization

i18n is handled in `src/shared/i18n/`:

| Function | Purpose |
|----------|---------|
| `useI18n()` | Hook that returns `{ t, locale }` |
| `t(key)` | Translate a key to the current language |
| `setLanguage(code)` | Change the active language |

### Supported Languages

| Code | Language | Status |
|------|----------|--------|
| `en` | English | Complete |
| `bn` | Bengali | Complete |
| `ar` | Arabic | Complete |
| `hi` | Hindi | Complete |
| `es` | Spanish | Complete |
| `fr` | French | Complete |

## Navigation

Expo Router handles navigation via file-based routing in `app/`.

### Route Structure

| Route | Type | Description |
|-------|------|-------------|
| `/` (Onboarding) | Stack | First-run setup |
| `/(tabs)/` | Tabs | Main app (requires onboarding) |
| `/(tabs)/index` | Tab | Dashboard |
| `/(tabs)/sales` | Tab | POS/Sales screen |
| `/(tabs)/products` | Tab | Product management |
| `/(tabs)/analytics` | Tab | Analytics dashboard |
| `/settings` | Stack | Settings screen |
| `/reports` | Modal | Report generation |
| `/customers/[id]` | Stack | Customer detail |
