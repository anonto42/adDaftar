/**
 * Schema V2 Migration
 *
 * Adds new columns to existing tables for enhanced analytics and features.
 * Defensive implementation to prevent "duplicate column" errors.
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
    const currentVersionStr = await appRepository.getSetting('schema_version');
    const currentVersion = currentVersionStr ? parseInt(currentVersionStr, 10) : 1;

    if (currentVersion >= 2) {
      console.log(`[Schema V2] Already on version ${currentVersion}, skipping...`);
      return;
    }

    console.log('[Schema V2] Starting migration to version 2...');
    
    await withTransaction(async () => {
      const database = getDatabase();
      
      // Helper function to add column if it doesn't exist
      const addColumnIfNeeded = async (table: string, column: string, definition: string) => {
        const tableInfo: any[] = await database.getAllAsync(`PRAGMA table_info(${table})`);
        const exists = tableInfo.some(col => col.name === column);
        if (!exists) {
          await database.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
        }
      };

      // Add columns to products table
      await addColumnIfNeeded('products', 'category_id', 'TEXT');
      await addColumnIfNeeded('products', 'cost_price', 'REAL DEFAULT 0');
      await addColumnIfNeeded('products', 'low_stock_level', 'INTEGER DEFAULT 5');
      await addColumnIfNeeded('products', 'image_uri', 'TEXT');

      // Create indexes for products
      await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);`);
      await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_products_low_stock ON products(quantity);`);

      // Add columns to customers table
      await addColumnIfNeeded('customers', 'last_purchase_date', 'TEXT');
      await addColumnIfNeeded('customers', 'total_purchases', 'REAL DEFAULT 0');
      await addColumnIfNeeded('customers', 'purchase_count', 'INTEGER DEFAULT 0');

      // Create indexes for customers
      await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_customers_last_purchase ON customers(last_purchase_date);`);

      // Add columns to sales table
      await addColumnIfNeeded('sales', 'discount', 'REAL DEFAULT 0');
      await addColumnIfNeeded('sales', 'payment_method', "TEXT DEFAULT 'CASH'");
      await addColumnIfNeeded('sales', 'profit', 'REAL DEFAULT 0');
      await addColumnIfNeeded('sales', 'notes', 'TEXT');

      // Create index for sales
      await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_sales_profit ON sales(profit);`);

      // Add columns to sale_items table
      await addColumnIfNeeded('sale_items', 'cost_price', 'REAL DEFAULT 0');
      await addColumnIfNeeded('sale_items', 'profit', 'REAL DEFAULT 0');

      // Create default "Uncategorized" category if it doesn't exist
      const now = new Date().toISOString();
      const existingCategory = await database.getFirstAsync('SELECT id FROM categories WHERE id = ?', ['default-uncategorized']);
      
      if (!existingCategory) {
        await database.runAsync(
          `INSERT INTO categories (id, business_id, name, description, icon, color, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            'default-uncategorized',
            'default-business',
            'Uncategorized',
            'Default category for products',
            'albums-outline',
            '#6B7280',
            now,
            now,
          ]
        );
      }

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
