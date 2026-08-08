# Database Schema

adDaftar uses SQLite (via `expo-sqlite`) as its single source of truth. All data is stored locally on the device — there is no backend server.

## Schema Version

Current schema version: **6**

## Tables

### `business`

Stores business profiles. Each business is isolated from others by `id`.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key (auto-generated) |
| `name` | TEXT | Business name |
| `description` | TEXT | Optional business description |
| `created_at` | TEXT | Creation timestamp |
| `updated_at` | TEXT | Last updated timestamp |

### `products`

Inventory items for each business.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key |
| `business_id` | TEXT | References `business(id)` |
| `name` | TEXT | Product name |
| `quantity` | INTEGER | Current stock quantity |
| `price` | REAL | Selling price |
| `category_id` | TEXT | References `categories(id)` |
| `cost_price` | REAL | Cost price for profit calculation |
| `low_stock_level` | INTEGER | Threshold for low stock alerts |
| `image_uri` | TEXT | Local image path (optional) |
| `created_at` | TEXT | Creation timestamp |
| `updated_at` | TEXT | Last updated timestamp |

### `categories`

Product categories for organization.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key |
| `business_id` | TEXT | References `business(id)` |
| `name` | TEXT | Category name |
| `description` | TEXT | Optional description |
| `icon` | TEXT | Ionicons name |
| `color` | TEXT | Hex color code |
| `created_at` | TEXT | Creation timestamp |
| `updated_at` | TEXT | Last updated timestamp |

### `customers`

Customer records with purchase history and dues.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key |
| `business_id` | TEXT | References `business(id)` |
| `name` | TEXT | Customer name |
| `phone` | TEXT | Phone number (optional) |
| `address` | TEXT | Address (optional) |
| `total_due` | REAL | Total amount owed |
| `last_purchase_date` | TEXT | Last purchase timestamp |
| `total_purchases` | REAL | Cumulative purchase amount |
| `purchase_count` | INTEGER | Number of purchases |
| `created_at` | TEXT | Creation timestamp |
| `updated_at` | TEXT | Last updated timestamp |

### `sales`

Sales transactions (completed checkouts).

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key |
| `business_id` | TEXT | References `business(id)` |
| `date` | TEXT | Sale date (ISO timestamp) |
| `total_amount` | REAL | Total sale amount |
| `received_amount` | REAL | Amount received from customer |
| `type` | TEXT | `'CASH'` or `'DUE'` |
| `customer_id` | TEXT | References `customers(id)` (optional) |
| `customer_name` | TEXT | Denormalized customer name |
| `discount` | REAL | Discount applied |
| `payment_method` | TEXT | `'CASH'`, `'CARD'`, or `'MOBILE'` |
| `profit` | REAL | Profit from this sale |
| `notes` | TEXT | Optional notes |
| `created_at` | TEXT | Creation timestamp |
| `updated_at` | TEXT | Last updated timestamp |

### `sale_items`

Individual items within each sale (line items).

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Auto-increment primary key |
| `sale_id` | TEXT | References `sales(id)` |
| `product_id` | TEXT | References `products(id)` |
| `product_name` | TEXT | Denormalized product name |
| `quantity` | INTEGER | Quantity sold |
| `unit_price` | REAL | Price per unit at time of sale |
| `total` | REAL | Line item total |
| `cost_price` | REAL | Cost price at time of sale |
| `profit` | REAL | Profit for this line item |
| `updated_at` | TEXT | Last updated timestamp |

### `payment_history`

Customer payment records (for tracking dues).

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key |
| `business_id` | TEXT | References `business(id)` |
| `customer_id` | TEXT | References `customers(id)` |
| `amount` | REAL | Payment amount |
| `payment_date` | TEXT | Payment date (ISO timestamp) |
| `payment_method` | TEXT | `'CASH'`, `'CARD'`, `'MOBILE'`, `'OTHER'` |
| `notes` | TEXT | Optional notes |
| `created_at` | TEXT | Creation timestamp |
| `updated_at` | TEXT | Last updated timestamp |

### `expenses`

Business expense tracking.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key |
| `business_id` | TEXT | References `business(id)` |
| `description` | TEXT | Expense description |
| `amount` | REAL | Expense amount |
| `category` | TEXT | `'RENT'`, `'UTILITIES'`, `'SALARY'`, `'WAGES'`, `'SUPPLIES'`, `'MAINTENANCE'`, `'OTHER'` |
| `expense_date` | TEXT | Expense date (ISO timestamp) |
| `notes` | TEXT | Optional notes |
| `created_at` | TEXT | Creation timestamp |
| `updated_at` | TEXT | Last updated timestamp |

### `app_settings`

Key-value pairs for app configuration.

| Column | Type | Description |
|--------|------|-------------|
| `key` | TEXT | Setting key (primary key) |
| `value` | TEXT | Setting value |
| `updated_at` | TEXT | Last updated timestamp |

**Common keys:**
- `schema_version` — Current database schema version
- `theme` — `'light'`, `'dark'`, or `'system'`
- `currency` — Currency code
- `language` — Language code
- `recent_searches` — JSON array of recent search queries
- `onboarding_completed` — `'true'` or `'false'`

## Indexes

### Business Indexes

| Table | Columns | Purpose |
|-------|---------|---------|
| `business` | `name` | Fast name lookups |
| `products` | `name`, `business_id`, `category_id` | Fast product search |
| `customers` | `name`, `business_id`, `total_due` | Fast customer search |
| `sales` | `date`, `business_id`, `customer_id`, `type` | Fast sales queries |
| `sale_items` | `sale_id`, `product_id` | Fast line item lookups |
| `categories` | `name`, `business_id` | Fast category search |
| `payment_history` | `business_id`, `customer_id`, `payment_date` | Fast payment lookups |
| `expenses` | `expense_date`, `business_id`, `category` | Fast expense queries |

## Migrations

| Version | File | Description |
|---------|------|-------------|
| v1→v2 | `schema-v2-migration.ts` | AsyncStorage → SQLite migration; schema version tracking |
| v2→v3 | `schema-v3-migration.ts` | (Internal) |
| v3→v4 | `schema-v4-migration.ts` | Multi-business support; added `business_id` to all tables |
| v4→v5 | `schema-v5-migration.ts` | Partial payments; added `received_amount` column |
| v5→v6 | `schema-v6-migration.ts` | Sync timestamps; added `updated_at` indexes |

### Migration Process

Migrations are run automatically during app initialization in `app/_layout.tsx`:

1. Check current schema version from `app_settings` table
2. Run any pending migrations sequentially
3. Update schema version in `app_settings`
4. Initialize indexes (after migrations ensure columns exist)

### Custom Migration Example

```typescript
// schema-v7-migration.ts
export async function runSchemaV7Migration(): Promise<void> {
  const currentVersion = await getCurrentSchemaVersion();
  if (currentVersion >= 7) return;

  const db = getDatabase();
  console.log('[Migration] Running schema v7 migration...');

  await db.execAsync(`
    ALTER TABLE products ADD COLUMN barcode TEXT;
    CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
  `);

  await updateSchemaVersion(7);
  console.log('[Migration] Schema v7 migration complete');
}
```

## Database Utility Functions

Located in `src/services/database/index.ts`:

| Function | Purpose |
|----------|---------|
| `getDatabase()` | Get singleton SQLite database instance |
| `initializeDatabase()` | Create tables on app start |
| `initializeIndexes()` | Create indexes after migrations |
| `executeQuery<T>(sql, params)` | Run SELECT query, return array of results |
| `executeQuerySingle<T>(sql, params)` | Run SELECT query, return single result |
| `executeStatement(sql, params)` | Run INSERT/UPDATE/DELETE (queued) |
| `executeTransaction(statements)` | Run multiple statements atomically |
| `withTransaction<T>(callback)` | Execute callback within a transaction |
| `dropAllTables()` | Drop all tables (dev/testing only) |
| `closeDatabase()` | Close database connection |
| `resetDatabaseState()` | Reset internal state (for testing) |

## Transaction Safety

- All write operations are queued to prevent "database is locked" errors
- WAL mode is enabled for concurrent read/write support
- Foreign key constraints are enforced
- POS checkout uses atomic transactions to ensure stock validation and sale recording happen together
