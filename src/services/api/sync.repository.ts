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
    const filter = lastSyncAt ? `WHERE updated_at > ?` : '';
    const filterCreated = lastSyncAt ? `WHERE created_at > ?` : '';
    const params = lastSyncAt ? [lastSyncAt] : [];

    return {
      businesses: await executeQuery(`SELECT * FROM business ${filter}`, params),
      categories: await executeQuery(`SELECT * FROM categories ${filter}`, params),
      products: await executeQuery(`SELECT * FROM products ${filter}`, params),
      customers: await executeQuery(`SELECT * FROM customers ${filter}`, params),
      sales: await executeQuery(`SELECT * FROM sales ${filterCreated}`, params),
      saleItems: await executeQuery(`SELECT * FROM sale_items ${filter}`, params),
      paymentHistory: await executeQuery(`SELECT * FROM payment_history ${filterCreated}`, params),
      expenses: await executeQuery(`SELECT * FROM expenses ${filter}`, params),
      appSettings: await executeQuery(`SELECT * FROM app_settings ${filter}`, params),
    };
  },

  /**
   * Export full local database snapshot for offline backup
   */
  exportAllData: async () => {
    const data = await syncRepository.getLocalChanges(null);
    return {
      exportedAt: new Date().toISOString(),
      ...data,
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
      if (changes.saleItems && Array.isArray(changes.saleItems)) {
        const syncedSaleIds = Array.from(
          new Set(changes.saleItems.map((item: any) => item.sale_id).filter(Boolean))
        ) as string[];
        for (const saleId of syncedSaleIds) {
          await executeStatement('DELETE FROM sale_items WHERE sale_id = ?', [saleId]);
        }
        for (const item of changes.saleItems) {
          await executeStatement(
            `INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, total, cost_price, profit, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              item.sale_id,
              item.product_id,
              item.product_name,
              item.quantity,
              item.unit_price,
              item.total,
              item.cost_price ?? 0,
              item.profit ?? 0,
              item.updated_at || new Date().toISOString(),
            ]
          );
        }
      }
      if (changes.paymentHistory) await upsertEntity('payment_history', changes.paymentHistory);
      if (changes.expenses) await upsertEntity('expenses', changes.expenses);
      if (changes.appSettings) await upsertSettings(changes.appSettings);
    });
  }
};
