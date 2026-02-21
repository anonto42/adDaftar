/**
 * Sync Repository
 * 
 * Handles synchronization between local SQLite and remote NestJS backend
 */

import { executeQuery, executeStatement, withTransaction } from '@/src/services/database';
import { apiClient } from './client';
import { appRepository } from '@/src/features/settings/api/app.repository';

export const syncRepository = {
  /**
   * Perform full synchronization
   */
  sync: async (): Promise<{ success: boolean; lastSyncAt: string | null }> => {
    try {
      const lastSyncAt = await appRepository.getSetting('last_sync_at');
      
      // 1. Get local changes
      const localChanges = await syncRepository.getLocalChanges(lastSyncAt);
      
      // 2. Push to backend and get remote changes
      const response = await apiClient.post<any>('/sync', {
        lastSyncedAt: lastSyncAt,
        ...localChanges
      });
      
      if (response && response.changes) {
        // 3. Apply remote changes locally
        await syncRepository.applyRemoteChanges(response.changes);
        
        // 4. Update last sync time
        await appRepository.setSetting('last_sync_at', response.serverTime);
        
        return { success: true, lastSyncAt: response.serverTime };
      }
      
      return { success: false, lastSyncAt };
    } catch (error) {
      console.error('[Sync] Synchronization failed:', error);
      return { success: false, lastSyncAt: null };
    }
  },

  /**
   * Get all local changes since last sync
   */
  getLocalChanges: async (lastSyncAt: string | null) => {
    const filter = lastSyncAt ? `WHERE updated_at > '${lastSyncAt}'` : '';
    // For tables with created_at only, we use that if updated_at is missing
    const filterCreated = lastSyncAt ? `WHERE created_at > '${lastSyncAt}'` : '';
    
    // Note: This assumes all tables have these columns. 
    // We will ensure this in the schema update.
    
    return {
      businesses: await executeQuery(`SELECT * FROM business ${filter}`),
      categories: await executeQuery(`SELECT * FROM categories ${filter}`),
      products: await executeQuery(`SELECT * FROM products ${filter}`),
      customers: await executeQuery(`SELECT * FROM customers ${filter}`),
      sales: await executeQuery(`SELECT * FROM sales ${filterCreated}`),
      // saleItems: await executeQuery(`SELECT * FROM sale_items`), // sale_items don't have timestamps yet
      paymentHistory: await executeQuery(`SELECT * FROM payment_history ${filterCreated}`),
      expenses: await executeQuery(`SELECT * FROM expenses ${filter}`),
      appSettings: await executeQuery(`SELECT * FROM app_settings ${filter}`),
    };
  },

  /**
   * Apply remote changes to local database using UPSERT
   */
  applyRemoteChanges: async (changes: any) => {
    await withTransaction(async () => {
      // Helper for UPSERT on entities with 'id' as PK
      const upsertEntity = async (table: string, items: any[]) => {
        for (const item of items) {
          const keys = Object.keys(item);
          const placeholders = keys.map(() => '?').join(', ');
          const updateStr = keys.map(k => `${k} = EXCLUDED.${k}`).join(', ');
          
          // SQLite UPSERT syntax (requires version 3.24+)
          const sql = `
            INSERT INTO ${table} (${keys.join(', ')})
            VALUES (${placeholders})
            ON CONFLICT(id) DO UPDATE SET ${updateStr}
          `;
          
          const values = Object.values(item);
          await executeStatement(sql, values);
        }
      };

      // Special case for app_settings which uses 'key' as PK
      const upsertSettings = async (items: any[]) => {
        for (const item of items) {
          await appRepository.setSetting(item.key, item.value);
        }
      };

      if (changes.businesses) await upsertEntity('business', changes.businesses);
      if (changes.categories) await upsertEntity('categories', changes.categories);
      if (changes.products) await upsertEntity('products', changes.products);
      if (changes.customers) await upsertEntity('customers', changes.customers);
      if (changes.sales) await upsertEntity('sales', changes.sales);
      if (changes.saleItems) {
         // sale_items uses AUTOINCREMENT id on frontend, but we should match on sale_id + product_id maybe?
         // For now, let's just insert them. A better approach is needed for sale_items.
      }
      if (changes.paymentHistory) await upsertEntity('payment_history', changes.paymentHistory);
      if (changes.expenses) await upsertEntity('expenses', changes.expenses);
      if (changes.appSettings) await upsertSettings(changes.appSettings);
    });
  }
};
