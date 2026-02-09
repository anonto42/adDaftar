/**
 * Database Migration Service
 *
 * Handles one-time migration from AsyncStorage to SQLite
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, Customer, Sale } from '@/src/shared/types/shop.types';
import { getDatabase } from './index';
import { appRepository } from './repositories/app.repository';

/**
 * Check if migration is needed and run it
 */
export async function runMigrationIfNeeded(): Promise<void> {
  console.log('[Migration] Checking if migration is needed...');

  try {
    // Check if migration has already been completed
    const isMigrated = await appRepository.isMigrationCompleted();

    if (isMigrated) {
      console.log('[Migration] Already migrated, skipping...');
      return;
    }

    console.log('[Migration] Starting AsyncStorage → SQLite migration...');

    // Run the migration
    await migrateFromAsyncStorage();

    // Mark migration as completed
    await appRepository.setMigrationCompleted();

    console.log('[Migration] ✓ Migration completed successfully');
  } catch (error) {
    console.error('[Migration] ✗ Migration failed:', error);
    throw error;
  }
}

/**
 * Migrate all data from AsyncStorage to SQLite
 */
async function migrateFromAsyncStorage(): Promise<void> {
  const database = getDatabase();

  try {
    await database.withTransactionAsync(async () => {
      // 1. Migrate products
      await migrateProducts(database);

      // 2. Migrate customers
      await migrateCustomers(database);

      // 3. Migrate sales (must be last to maintain referential integrity)
      await migrateSales(database);

      // 4. Migrate app settings
      await migrateAppSettings(database);
    });

    console.log('[Migration] All data migrated successfully');
  } catch (error) {
    console.error('[Migration] Transaction failed, rolling back...', error);
    throw error;
  }
}

/**
 * Migrate products from AsyncStorage
 */
async function migrateProducts(database: any): Promise<void> {
  try {
    const productsJson = await AsyncStorage.getItem('shop-products');

    if (!productsJson) {
      console.log('[Migration] No products to migrate');
      return;
    }

    const data = JSON.parse(productsJson);
    const products: Product[] = data.state?.products || [];

    if (products.length === 0) {
      console.log('[Migration] No products found');
      return;
    }

    console.log(`[Migration] Migrating ${products.length} products...`);

    const now = new Date().toISOString();

    for (const product of products) {
      const sql = `
        INSERT INTO products (id, name, quantity, price, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      await database.runAsync(sql, [
        product.id,
        product.name,
        product.quantity,
        product.price,
        now,
        now,
      ]);
    }

    console.log(`[Migration] ✓ Migrated ${products.length} products`);
  } catch (error) {
    console.error('[Migration] Failed to migrate products:', error);
    throw error;
  }
}

/**
 * Migrate customers from AsyncStorage
 */
async function migrateCustomers(database: any): Promise<void> {
  try {
    const customersJson = await AsyncStorage.getItem('shop-customers');

    if (!customersJson) {
      console.log('[Migration] No customers to migrate');
      return;
    }

    const data = JSON.parse(customersJson);
    const customers: Customer[] = data.state?.customers || [];

    if (customers.length === 0) {
      console.log('[Migration] No customers found');
      return;
    }

    console.log(`[Migration] Migrating ${customers.length} customers...`);

    const now = new Date().toISOString();

    for (const customer of customers) {
      const sql = `
        INSERT INTO customers (id, name, phone, address, total_due, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      await database.runAsync(sql, [
        customer.id,
        customer.name,
        customer.phone || null,
        customer.address || null,
        customer.totalDue || 0,
        now,
        now,
      ]);
    }

    console.log(`[Migration] ✓ Migrated ${customers.length} customers`);
  } catch (error) {
    console.error('[Migration] Failed to migrate customers:', error);
    throw error;
  }
}

/**
 * Migrate sales from AsyncStorage
 */
async function migrateSales(database: any): Promise<void> {
  try {
    const salesJson = await AsyncStorage.getItem('shop-sales');

    if (!salesJson) {
      console.log('[Migration] No sales to migrate');
      return;
    }

    const data = JSON.parse(salesJson);
    const sales: Sale[] = data.state?.sales || [];

    if (sales.length === 0) {
      console.log('[Migration] No sales found');
      return;
    }

    console.log(`[Migration] Migrating ${sales.length} sales...`);

    const now = new Date().toISOString();

    for (const sale of sales) {
      // Insert sale record
      const insertSaleSql = `
        INSERT INTO sales (id, date, total_amount, type, customer_id, customer_name, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      await database.runAsync(insertSaleSql, [
        sale.id,
        sale.date,
        sale.totalAmount,
        sale.type,
        sale.customerId || null,
        sale.customerName || null,
        now,
      ]);

      // Insert sale items
      for (const item of sale.items) {
        const insertItemSql = `
          INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, total)
          VALUES (?, ?, ?, ?, ?, ?)
        `;

        await database.runAsync(insertItemSql, [
          sale.id,
          item.productId,
          item.productName,
          item.quantity,
          item.unitPrice,
          item.total,
        ]);
      }
    }

    console.log(`[Migration] ✓ Migrated ${sales.length} sales`);
  } catch (error) {
    console.error('[Migration] Failed to migrate sales:', error);
    throw error;
  }
}

/**
 * Migrate app settings from AsyncStorage
 */
async function migrateAppSettings(database: any): Promise<void> {
  try {
    const appJson = await AsyncStorage.getItem('app-storage');

    if (!appJson) {
      console.log('[Migration] No app settings to migrate');
      return;
    }

    const data = JSON.parse(appJson);
    const appState = data.state || {};

    console.log('[Migration] Migrating app settings...');

    const now = new Date().toISOString();

    // Migrate onboarding status
    if (appState.hasCompletedOnboarding !== undefined) {
      const sql = `
        INSERT INTO app_settings (key, value, updated_at)
        VALUES (?, ?, ?)
      `;

      await database.runAsync(sql, [
        'onboarding_completed',
        appState.hasCompletedOnboarding.toString(),
        now,
      ]);
    }

    // Migrate recent searches
    if (appState.recentSearches && Array.isArray(appState.recentSearches)) {
      const sql = `
        INSERT INTO app_settings (key, value, updated_at)
        VALUES (?, ?, ?)
      `;

      await database.runAsync(sql, [
        'recent_searches',
        JSON.stringify(appState.recentSearches),
        now,
      ]);
    }

    console.log('[Migration] ✓ Migrated app settings');
  } catch (error) {
    console.error('[Migration] Failed to migrate app settings:', error);
    throw error;
  }
}
