/**
 * Schema V5 Migration
 *
 * Adds received_amount column to sales table for partial payments
 */

import { getDatabase, withTransaction } from './index';
import { appRepository } from '@/src/features/settings';

export const SCHEMA_VERSION_5 = 5;

/**
 * Run schema v5 migration if needed
 */
export async function runSchemaV5Migration(): Promise<void> {
  console.log('[Schema V5] Checking if migration is needed...');

  try {
    // Check current schema version
    const currentVersionStr = await appRepository.getSetting('schema_version');
    const currentVersion = currentVersionStr ? parseInt(currentVersionStr, 10) : 1;

    if (currentVersion >= 5) {
      console.log(`[Schema V5] Already on version ${currentVersion}, skipping...`);
      return;
    }

    console.log(`[Schema V5] Starting migration to version 5...`);
    
    await withTransaction(async () => {
      const database = getDatabase();
      const now = new Date().toISOString();

      // Add received_amount to sales table
      try {
        const tableInfo: any[] = await database.getAllAsync(`PRAGMA table_info(sales)`);
        const hasReceivedAmount = tableInfo.some(col => col.name === 'received_amount');

        if (!hasReceivedAmount) {
          console.log(`[Schema V5] Adding received_amount to sales...`);
          await database.execAsync(`ALTER TABLE sales ADD COLUMN received_amount REAL DEFAULT 0;`);
          
          // For existing CASH sales, set received_amount = total_amount
          await database.runAsync(`UPDATE sales SET received_amount = total_amount WHERE type = 'CASH'`);
          // For existing DUE sales, received_amount is already 0 by default, which is correct
        }
      } catch (error) {
        console.error(`[Schema V5] Error migrating sales table:`, error);
      }

      // Update schema version
      await database.runAsync(
        `INSERT INTO app_settings (key, value, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?`,
        ['schema_version', '5', now, '5', now]
      );

      console.log('[Schema V5] ✓ Migration completed successfully');
    });
  } catch (error) {
    console.error('[Schema V5] Migration failed:', error);
    throw error;
  }
}
