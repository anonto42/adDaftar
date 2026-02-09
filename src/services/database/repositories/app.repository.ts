/**
 * App Settings Repository
 *
 * Key-value storage for app settings and metadata
 */

import { executeQuerySingle, executeStatement } from '../index';

export const appRepository = {
  /**
   * Set a setting value
   */
  setSetting: async (key: string, value: string): Promise<void> => {
    const now = new Date().toISOString();

    const sql = `
      INSERT INTO app_settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?
    `;

    await executeStatement(sql, [key, value, now, value, now]);
  },

  /**
   * Get a setting value
   */
  getSetting: async (key: string): Promise<string | null> => {
    const sql = 'SELECT value FROM app_settings WHERE key = ?';
    const result = await executeQuerySingle<{ value: string }>(sql, [key]);
    return result?.value || null;
  },

  /**
   * Delete a setting
   */
  deleteSetting: async (key: string): Promise<void> => {
    const sql = 'DELETE FROM app_settings WHERE key = ?';
    await executeStatement(sql, [key]);
  },

  /**
   * Check if migration has been completed
   */
  isMigrationCompleted: async (): Promise<boolean> => {
    const result = await appRepository.getSetting('migration_completed');
    return result === 'true';
  },

  /**
   * Mark migration as completed
   */
  setMigrationCompleted: async (): Promise<void> => {
    await appRepository.setSetting('migration_completed', 'true');
  },

  /**
   * Get onboarding completed status
   */
  hasCompletedOnboarding: async (): Promise<boolean> => {
    const result = await appRepository.getSetting('onboarding_completed');
    return result === 'true';
  },

  /**
   * Set onboarding completed
   */
  setOnboardingCompleted: async (completed: boolean): Promise<void> => {
    await appRepository.setSetting('onboarding_completed', completed.toString());
  },

  /**
   * Get recent searches
   */
  getRecentSearches: async (): Promise<string[]> => {
    const result = await appRepository.getSetting('recent_searches');
    if (!result) return [];

    try {
      return JSON.parse(result);
    } catch {
      return [];
    }
  },

  /**
   * Set recent searches
   */
  setRecentSearches: async (searches: string[]): Promise<void> => {
    await appRepository.setSetting('recent_searches', JSON.stringify(searches));
  },
};
