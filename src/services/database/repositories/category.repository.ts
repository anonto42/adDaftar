/**
 * Category Repository
 * CRUD operations for product categories
 */

import { Category } from '@/src/shared/types/shop.types';
import { executeQuery, executeQuerySingle, executeStatement } from '../index';

export const categoryRepository = {
  create: async (categoryData: Omit<Category, 'id'>): Promise<Category> => {
    const id = Date.now().toString();
    const now = new Date().toISOString();

    const sql = `
      INSERT INTO categories (id, name, description, icon, color, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await executeStatement(sql, [
      id,
      categoryData.name,
      categoryData.description || null,
      categoryData.icon || null,
      categoryData.color || null,
      now,
      now,
    ]);

    return { id, ...categoryData };
  },

  update: async (id: string, updates: Partial<Category>): Promise<void> => {
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description || null);
    }
    if (updates.icon !== undefined) {
      fields.push('icon = ?');
      values.push(updates.icon || null);
    }
    if (updates.color !== undefined) {
      fields.push('color = ?');
      values.push(updates.color || null);
    }

    if (fields.length === 0) return;

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    const sql = `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`;
    await executeStatement(sql, values);
  },

  delete: async (id: string): Promise<void> => {
    const sql = 'DELETE FROM categories WHERE id = ?';
    await executeStatement(sql, [id]);
  },

  findById: async (id: string): Promise<Category | null> => {
    const sql = 'SELECT id, name, description, icon, color FROM categories WHERE id = ?';
    return await executeQuerySingle<Category>(sql, [id]);
  },

  findAll: async (): Promise<Category[]> => {
    const sql = 'SELECT id, name, description, icon, color FROM categories ORDER BY name ASC';
    return await executeQuery<Category>(sql);
  },

  getProductCount: async (categoryId: string): Promise<number> => {
    const sql = 'SELECT COUNT(*) as count FROM products WHERE category_id = ?';
    const result = await executeQuerySingle<{ count: number }>(sql, [categoryId]);
    return result?.count || 0;
  },
};
