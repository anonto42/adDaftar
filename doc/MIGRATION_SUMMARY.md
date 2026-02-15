# Database Migration & Schema Summary

## ✅ Latest Version: Version 4 (Multi-Business)

Your Shop Management app has been enhanced with a robust multi-business architecture, allowing users to manage multiple independent shops or accounts within a single app.

---

## 🎯 Migration History

### 🏁 Initial: AsyncStorage → SQLite (v1)
- Core database service created.
- Tables: `products`, `customers`, `sales`, `sale_items`, `app_settings`.
- One-time migration of all JSON data to SQLite tables.

### 📈 Phase 2: Analytics & Enhanced Features (v2)
- Added `category_id`, `cost_price`, `low_stock_level`, and `image_uri` to **products**.
- Added `last_purchase_date`, `total_purchases`, and `purchase_count` to **customers**.
- Added `discount`, `payment_method`, `profit`, and `notes` to **sales**.
- Added `cost_price` and `profit` to **sale_items**.
- Created `categories`, `payment_history`, and `expenses` tables.

### 🏢 Phase 4: Multi-Business Support (v4)
- **New Table:** `business` (id, name, description, timestamps).
- **Schema Update:** Added `business_id` to ALL entity tables (products, customers, sales, categories, payments, expenses).
- **Auto-Migration:** Existing data automatically assigned to a "Default Business" to ensure continuity.
- **Repository Filtering:** All queries now automatically scope data to the active business ID.

---

## 📊 Latest Database Schema (v4)

### Core Tables:

**1. business**
- `id` (PK), `name`, `description`, `created_at`, `updated_at`

**2. products**
- `business_id` (FK), `id` (PK), `name`, `quantity`, `price`, `category_id`, `cost_price`, `low_stock_level`, `image_uri`, timestamps

**3. customers**
- `business_id` (FK), `id` (PK), `name`, `phone`, `address`, `total_due`, `last_purchase_date`, `total_purchases`, `purchase_count`, timestamps

**4. sales**
- `business_id` (FK), `id` (PK), `date`, `total_amount`, `type`, `customer_id`, `customer_name`, `discount`, `payment_method`, `profit`, `notes`, timestamps

**5. expenses**
- `business_id` (FK), `id` (PK), `description`, `amount`, `category`, `expense_date`, `notes`, timestamps

---

## 🏢 Multi-Business Architecture

### 1. Data Isolation
Every record in the database is tied to a `business_id`. The app ensures that when you switch businesses, only the data for that specific business is loaded into the UI.

### 2. Global State Management
The `useBusinessStore` manages the currently active business.
- When `activeBusinessId` changes, all other stores (`productStore`, `customerStore`, etc.) automatically re-hydrate their data from SQLite.
- All creation methods in repositories automatically inject the current `activeBusinessId`.

### 3. UI Integration
- **Manage Businesses:** A dedicated screen in Settings to create, edit, and delete businesses.
- **Quick Switcher:** Click the business name in the sidebar menu to instantly switch between accounts.
- **Visual Context:** The active business name is displayed in every screen header.

---

## 🔄 App Initialization Flow

1. **`initializeDatabase()`**: Creates tables if they don't exist. Sets version to 4 on fresh installs.
2. **`runMigrationIfNeeded()`**: Moves data from AsyncStorage (legacy v1 users).
3. **`runSchemaV2Migration()`**: Adds analytics columns (defensive checks prevent duplicate column errors).
4. **`runSchemaV4Migration()`**: Ensures `business_id` exists on all tables and creates default business if missing.
5. **`useBusinessStore.hydrate()`**: Loads available businesses and sets the active one.
6. **Store Hydration**: All other stores load data for the selected business.

---

## 🧪 Testing Multi-Business

### Test 1: Business Creation
1. Go to **Settings** → **Manage Businesses**.
2. Add a new business (e.g., "Grocery Store").
3. **Verify:** The new business appears in the list.

### Test 2: Data Separation
1. Select "Business A".
2. Add a unique product (e.g., "A-Product").
3. Switch to "Business B".
4. **Verify:** "A-Product" is NOT visible in Business B.
5. Add "B-Product" in Business B.
6. Switch back to "Business A".
7. **Verify:** Only "A-Product" is visible.

### Test 3: Quick Switch
1. Open the sidebar.
2. Click on the business name at the top.
3. Select a different business from the modal.
4. **Verify:** The app content refreshes immediately to reflect the new business.

---

**Last Updated:** February 2026
**Schema Version:** 4
**Multi-Business Support:** ✅ ENABLED
