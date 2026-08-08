# Architecture

adDaftar uses a **feature-sliced design** with a layered architecture that cleanly separates concerns: **UI → State → Data Access → Database**.

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                   Presentation                  │
│              (app/ + src/features/*/ui/)          │
└───────────┬───────────────────────────────────────┘
            │ Expo Router / React Navigation
┌───────────▼───────────────────────────────────────┐
│                State Management                    │
│          (src/features/*/model/ + src/store/)      │
└───────────┬───────────────────────────────────────┘
            │ Repository Pattern
┌───────────▼───────────────────────────────────────┐
│              Data Access Layer                     │
│    (src/features/*/api/ + src/services/database/)  │
└───────────┬──────────────────┬────────────────────┘
            │                  │
┌───────────▼──┐             ┌─▼──────────────────┐
│   SQLite     │             │   AsyncStorage      │
│  (local DB)  │             │  (settings/state)   │
└──────────────┘             └─────────────────────┘
```

## Directory Structure

```
src/
├── features/                    # Feature modules (feature-sliced design)
│   ├── business/                # Multi-business management
│   │   ├── api/                 # Repository: business.repository.ts
│   │   ├── model/               # Store: business.store.ts
│   │   ├── ui/                  # Screens: BusinessProfileScreen.tsx
│   │   └── index.ts             # Feature barrel export
│   ├── sales/                   # POS, sales history
│   │   ├── api/                 # Repository: sales.repository.ts
│   │   ├── model/               # Store: sales.store.ts
│   │   ├── ui/                  # SalesScreen.tsx, SalesHistoryScreen.tsx
│   │   └── index.ts
│   ├── inventory/               # Products, categories
│   │   ├── api/                 # product.repository.ts, category.repository.ts
│   │   ├── model/               # product.store.ts, category.store.ts
│   │   ├── ui/                  # ProductsScreen.tsx, CategoriesScreen.tsx
│   │   └── index.ts
│   ├── customers/               # Customer management, payments
│   ├── expenses/                # Expense tracking
│   ├── analytics/               # Charts, reports, dashboards
│   ├── settings/                # App settings, preferences
│   ├── onboarding/              # First-run setup
│   ├── dashboard/               # Overview/dashboard
├── services/                    # Shared services
│   ├── database/                # SQLite database layer
│   │   ├── schema.ts            # Table & index definitions
│   │   ├── migrations.ts        # Migration orchestration
│   │   ├── schema-v*-migration.ts # Versioned migrations
│   │   ├── index.ts             # Database utility functions
│   │   └── repositories/        # Shared repositories
│   └── api/                     # API client (future, optional sync)
├── shared/                      # Shared modules
│   ├── components/              # Reusable UI components
│   ├── theme/                   # Light/dark theme system
│   ├── types/                   # TypeScript type definitions
│   ├── utils/                   # Utility functions
│   └── i18n/                    # Localization
└── store/                       # Global Zustand stores
    ├── ui.store.ts              # Global UI state
    └── index.ts
```

## Design Patterns

### 1. Feature-Sliced Design

Each feature is a self-contained module with its own:
- **`api/`** — Data access layer (repository pattern)
- **`model/`** — State management (Zustand store)
- **`ui/`** — Presentation layer (React screens)
- **`index.ts`** — Barrel exports

### 2. Repository Pattern

All database queries are encapsulated in repository objects:

```typescript
// Example: product.repository.ts
export const productRepository = {
  create: async (product: Product): Promise<Product> => { ... },
  findAll: async (businessId: string): Promise<Product[]> => { ... },
  update: async (id: string, updates: Partial<Product>): Promise<void> => { ... },
  delete: async (id: string): Promise<void> => { ... },
};
```

**Key rule:** All queries must be scoped by `business_id` to ensure multi-business isolation.

### 3. Zustand Store Pattern

Each feature manages its state with a dedicated Zustand store:

```typescript
// Store re-hydrates from the database
hydrate: async (businessId: string) => {
  const items = await repository.findAll(businessId);
  set({ items });
}

// Store re-hydrates on business switch (triggered by BusinessStore)
```

### 4. Multi-Business Isolation

Each database query is scoped by `business_id`, ensuring complete data separation:

```
business: id, name, description
products: id, business_id → references business(id)
customers: id, business_id → references business(id)
sales: id, business_id → references business(id)
expenses: id, business_id → references business(id)
```

## Data Flow

1. **App Init** (`app/_layout.tsx`):
   - Initialize SQLite database
   - Run migrations (v1→v6)
   - Initialize indexes
   - Hydrate all stores sequentially

2. **Business Switch** (`business.store.ts`):
   - User switches business via SideTabBar
   - `setActiveBusinessId()` updates active business
   - All feature stores re-hydrate from SQLite with new `business_id`

3. **User Action** (e.g., creating a sale):
   - UI component calls Zustand store action
   - Store calls repository method
   - Repository executes SQL in SQLite
   - UI re-renders from updated store state

## Database Design

### Schema

The database uses SQLite with the following tables:

- **`business`** — Business profiles (multi-tenant root)
- **`products`** — Inventory items with categories, pricing, stock levels
- **`categories`** — Product categories with icons and colors
- **`customers`** — Customer records with purchase history and dues
- **`sales`** — Sales transactions with totals, payment types, customer links
- **`sale_items`** — Individual items within each sale (line items)
- **`payment_history`** — Customer payment records
- **`expenses`** — Business expense tracking
- **`app_settings`** — Key-value app configuration

### Migrations

The database uses versioned migrations for schema evolution:

| Version | Migration | Description |
|---------|-----------|-------------|
| v1→v2 | `migrations.ts` | AsyncStorage → SQLite migration |
| v2→v3 | `schema-v2-migration.ts` | Schema version tracking |
| v3→v4 | `schema-v4-migration.ts` | Multi-business support |
| v4→v5 | `schema-v5-migration.ts` | Partial payments |
| v5→v6 | `schema-v6-migration.ts` | Sync timestamps |

### Transaction Safety

- Write operations use a **write queue** to prevent "database is locked" errors
- Checkout uses **atomic transactions** to validate stock and update inventory
- WAL mode enabled for concurrent read/write support

## Theming System

```
src/shared/theme/
├── colors.ts           # Light/dark color palettes, gradients, brand colors
├── typography.ts       # Font sizes, weights, text styles
├── spacing.ts          # Spacing tokens (margins, padding)
├── radius.ts           # Border radius tokens
├── shadows.ts          # Shadow and glow styles
├── motion.ts           # Animation durations, easing, spring configs
├── ThemeContext.tsx    # Theme provider with system preference detection
└── index.ts            # Exports
```

The theme supports:
- **System preference detection** (follow OS theme)
- **Persisted user preference** (light/dark/system)
- **Responsive design** (mobile/tablet support)

## Internationalization

```
src/shared/i18n/
├── index.ts            # i18n initialization and hook
├── translations.ts     # All translation strings
└── ...
```

Supported languages: English, Bengali, Arabic, Hindi, Spanish, French

## Navigation

The app uses **Expo Router v6** with file-based routing:

```
app/
├── _layout.tsx         # Root layout (app initialization, navigation)
├── onboarding.tsx      # Onboarding flow
├── privacy-policy.tsx
├── settings.tsx
├── sales-history.tsx
├── reports.tsx
├── business.tsx
├── customers/
│   └── [id].tsx        # Customer detail
└── (tabs)/             # Tab navigation with custom SideTabBar
    ├── _layout.tsx     # Tab configuration
    ├── index.tsx       # Dashboard
    ├── analytics.tsx
    ├── sales.tsx
    ├── expenses.tsx
    ├── products.tsx
    ├── categories.tsx
    ├── customers.tsx
```
