/**
 * Schema V4 Migration
 *
 * Adds multi-business support by adding business_id to all relevant tables.
 * Migrates existing data to a default business.
 */

import { getDatabase, withTransaction } from './index';
import { appRepository } from '@/src/features/settings';

export const SCHEMA_VERSION_4 = 4;

/**
 * Run schema v4 migration if needed
 */
export async function runSchemaV4Migration(): Promise<void> {
  console.log('[Schema V4] Checking if migration is needed...');

  try {
    // Check current schema version
    const currentVersionStr = await appRepository.getSetting('schema_version');
    const currentVersion = currentVersionStr ? parseInt(currentVersionStr, 10) : 1;

    if (currentVersion >= 4) {
      console.log(`[Schema V4] Already on version ${currentVersion}, skipping...`);
      return;
    }

    console.log(`[Schema V4] Starting migration from version ${currentVersion} to 4...`);
    
    await withTransaction(async () => {
      const database = getDatabase();
      const now = new Date().toISOString();
      const defaultBusinessId = 'default-business';

      // 1. Ensure business table exists
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS business (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);

      // 2. Create default business
      await database.runAsync(
        `INSERT OR IGNORE INTO business (id, name, description, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [
          defaultBusinessId,
          'My Business',
          'Primary business account',
          now,
          now
        ]
      );

      // List of tables that need business_id
      const tables = [
        'products',
        'customers',
        'sales',
        'categories',
        'payment_history',
        'expenses'
      ];

      for (const table of tables) {
        try {
          // Check if business_id already exists to avoid errors on retry
          const tableInfo: any[] = await database.getAllAsync(`PRAGMA table_info(${table})`);
          const hasBusinessId = tableInfo.some(col => col.name === 'business_id');

          if (!hasBusinessId) {
            console.log(`[Schema V4] Adding business_id to ${table}...`);
            await database.execAsync(`ALTER TABLE ${table} ADD COLUMN business_id TEXT;`);
            
            // Set default business_id for existing records
            await database.runAsync(`UPDATE ${table} SET business_id = ? WHERE business_id IS NULL`, [defaultBusinessId]);
          }
        } catch (error) {
          console.error(`[Schema V4] Error migrating table ${table}:`, error);
        }
      }

      // Update schema version
      await database.runAsync(
        `INSERT INTO app_settings (key, value, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?`,
        ['schema_version', '4', now, '4', now]
      );

      console.log('[Schema V4] ✓ Migration completed successfully');
    });
  } catch (error) {
    console.error('[Schema V4] Migration failed:', error);
    throw error;
  }
}
