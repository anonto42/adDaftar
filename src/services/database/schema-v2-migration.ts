/**
 * Schema V2 Migration
 *
 * Adds new columns to existing tables for enhanced analytics and features
 */

import { getDatabase, withTransaction } from './index';
import { appRepository } from '@/src/features/settings';

export const SCHEMA_VERSION_2 = 2;

/**
 * Run schema v2 migration if needed
 */
export async function runSchemaV2Migration(): Promise<void> {
  console.log('[Schema V2] Checking if migration is needed...');

  try {
    // Check current schema version
    const currentVersion = await appRepository.getSetting('schema_version');

    if (currentVersion === '2') {
      console.log('[Schema V2] Already on version 2, skipping...');
      return;
    }

    console.log('[Schema V2] Starting migration to version 2...');
    
    await withTransaction(async () => {
      const database = getDatabase();
      
      // Add new columns to products table
      await database.execAsync(`
        ALTER TABLE products ADD COLUMN category_id TEXT;
      `);

      await database.execAsync(`
        ALTER TABLE products ADD COLUMN cost_price REAL DEFAULT 0;
      `);

      await database.execAsync(`
        ALTER TABLE products ADD COLUMN low_stock_level INTEGER DEFAULT 5;
      `);

      await database.execAsync(`
        ALTER TABLE products ADD COLUMN image_uri TEXT;
      `);

      // Create indexes for products
      await database.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
      `);

      await database.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_products_low_stock ON products(quantity);
      `);

      // Add new columns to customers table
      await database.execAsync(`
        ALTER TABLE customers ADD COLUMN last_purchase_date TEXT;
      `);

      await database.execAsync(`
        ALTER TABLE customers ADD COLUMN total_purchases REAL DEFAULT 0;
      `);

      await database.execAsync(`
        ALTER TABLE customers ADD COLUMN purchase_count INTEGER DEFAULT 0;
      `);

      // Create indexes for customers
      await database.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_customers_last_purchase ON customers(last_purchase_date);
      `);

      // Add new columns to sales table
      await database.execAsync(`
        ALTER TABLE sales ADD COLUMN discount REAL DEFAULT 0;
      `);

      await database.execAsync(`
        ALTER TABLE sales ADD COLUMN payment_method TEXT DEFAULT 'CASH';
      `);

      await database.execAsync(`
        ALTER TABLE sales ADD COLUMN profit REAL DEFAULT 0;
      `);

      await database.execAsync(`
        ALTER TABLE sales ADD COLUMN notes TEXT;
      `);

      // Create index for sales
      await database.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_sales_profit ON sales(profit);
      `);

      // Add new columns to sale_items table (for profit tracking)
      await database.execAsync(`
        ALTER TABLE sale_items ADD COLUMN cost_price REAL DEFAULT 0;
      `);

      await database.execAsync(`
        ALTER TABLE sale_items ADD COLUMN profit REAL DEFAULT 0;
      `);

      // Create default "Uncategorized" category
      const now = new Date().toISOString();
      await database.runAsync(
        `INSERT INTO categories (id, name, description, icon, color, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          'default-uncategorized',
          'Uncategorized',
          'Default category for products',
          'albums-outline',
          '#6B7280',
          now,
          now,
        ]
      );

      // Update schema version
      await database.runAsync(
        `INSERT INTO app_settings (key, value, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?`,
        ['schema_version', '2', now, '2', now]
      );

      console.log('[Schema V2] ✓ Migration completed successfully');
    });
  } catch (error) {
    console.error('[Schema V2] Migration failed:', error);
    throw error;
  }
}
