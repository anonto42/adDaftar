/**
 * Business Repository
 *
 * Handles database operations for businesses
 */

import { executeQuery, executeQuerySingle, executeStatement } from "@/src/services/database";
import { Business } from "@/src/shared";

export const businessRepository = {

  /**
   * Create business
  */
  create: async(business: Omit<Business, 'id'>): Promise<Business> => {
    const id = Date.now().toString();
    const now = new Date().toISOString();

    const sql = `
      INSERT INTO business (id, name, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `;

    await executeStatement(sql, [
      id,
      business.name,
      business.description || null,
      now,
      now
    ]);

    return {
        id,
        ...business
    };
  },

  /**
   * Find all businesses
   */
  findAll: async(): Promise<Business[]> => {
    const sql = 'SELECT * FROM business ORDER BY name ASC';
    return await executeQuery<Business>(sql);
  },

  /**
   * Find one business
   */
  findOne: async(id: string): Promise<Business | null> => {
    const sql = 'SELECT * FROM business WHERE id = ?';
    return await executeQuerySingle<Business>(sql, [id]);
  },

  /**
   * Update business details
   */
  update: async(id: string, updates: Partial<Omit<Business, 'id'>>): Promise<void> => {
    const now = new Date().toISOString();
    const fields = Object.keys(updates);
    if (fields.length === 0) return;

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const params = [...Object.values(updates), now, id];

    const sql = `UPDATE business SET ${setClause}, updated_at = ? WHERE id = ?`;
    await executeStatement(sql, params);
  },

  /**
   * Delete business
   */
  delete: async(id: string): Promise<void> => {
    const sql = 'DELETE FROM business WHERE id = ?';
    await executeStatement(sql, [id]);
  }
}
