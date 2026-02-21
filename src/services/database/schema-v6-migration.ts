import { getDatabase } from './index';

/**
 * Migration for Schema Version 6
 * Adds updated_at column to sales, sale_items, and payment_history for better synchronization.
 */
export async function runSchemaV6Migration(): Promise<void> {
  const db = getDatabase();

  console.log('[Migration] Checking for schema v6 updates (sync timestamps)...');

  try {
    // 1. Add updated_at to sales
    try {
      await db.execAsync('ALTER TABLE sales ADD COLUMN updated_at TEXT;');
      const now = new Date().toISOString();
      await db.runAsync('UPDATE sales SET updated_at = created_at WHERE updated_at IS NULL;', []);
      console.log('[Migration] Added updated_at to sales');
    } catch (e) {
      // Column might already exist
    }

    // 2. Add updated_at and id_new to sale_items
    try {
      // Check if we already did this or if we need to migrate id
      await db.execAsync('ALTER TABLE sale_items ADD COLUMN updated_at TEXT;');
      await db.execAsync('ALTER TABLE sale_items ADD COLUMN uuid TEXT;');
      const now = new Date().toISOString();
      await db.runAsync('UPDATE sale_items SET updated_at = ?, uuid = id || "_" || sale_id WHERE updated_at IS NULL;', [now]);
      console.log('[Migration] Added updated_at and uuid to sale_items');
    } catch (e) {
      // Column might already exist
    }

    // 3. Add updated_at to payment_history
    try {
      await db.execAsync('ALTER TABLE payment_history ADD COLUMN updated_at TEXT;');
      const now = new Date().toISOString();
      await db.runAsync('UPDATE payment_history SET updated_at = created_at WHERE updated_at IS NULL;', []);
      console.log('[Migration] Added updated_at to payment_history');
    } catch (e) {
      // Column might already exist
    }

    console.log('[Migration] ✓ Schema v6 migration completed');
  } catch (error) {
    console.error('[Migration] ✗ Schema v6 migration failed:', error);
    // Non-critical migration, don't throw to allow app to start
  }
}
