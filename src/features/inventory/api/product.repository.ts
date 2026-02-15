/**
 * Product Repository
 *
 * CRUD operations for products
 */

import { Product } from '@/src/shared/types/shop.types';
import { executeQuery, executeQuerySingle, executeStatement } from '@/src/services/database';

export const productRepository = {
  /**
   * Create a new product
   */
  create: async (productData: Omit<Product, 'id'>): Promise<Product> => {
    const id = Date.now().toString();
    const now = new Date().toISOString();

    const sql = `
      INSERT INTO products (id, business_id, name, quantity, price, category_id, cost_price, low_stock_level, image_uri, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await executeStatement(sql, [
      id,
      productData.businessId,
      productData.name,
      productData.quantity,
      productData.price,
      productData.categoryId || null,
      productData.costPrice || 0,
      productData.lowStockLevel || 5,
      productData.imageUri || null,
      now,
      now,
    ]);

    return {
      id,
      ...productData,
    };
  },

  /**
   * Update an existing product
   */
  update: async (id: string, updates: Partial<Product>): Promise<void> => {
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }

    if (updates.quantity !== undefined) {
      fields.push('quantity = ?');
      values.push(updates.quantity);
    }

    if (updates.price !== undefined) {
      fields.push('price = ?');
      values.push(updates.price);
    }

    if (updates.categoryId !== undefined) {
      fields.push('category_id = ?');
      values.push(updates.categoryId || null);
    }

    if (updates.costPrice !== undefined) {
      fields.push('cost_price = ?');
      values.push(updates.costPrice);
    }

    if (updates.lowStockLevel !== undefined) {
      fields.push('low_stock_level = ?');
      values.push(updates.lowStockLevel);
    }

    if (updates.imageUri !== undefined) {
      fields.push('image_uri = ?');
      values.push(updates.imageUri || null);
    }

    if (fields.length === 0) return;

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    const sql = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;

    await executeStatement(sql, values);
  },

  /**
   * Delete a product
   */
  delete: async (id: string): Promise<void> => {
    const sql = 'DELETE FROM products WHERE id = ?';
    await executeStatement(sql, [id]);
  },

  /**
   * Find product by ID
   */
  findById: async (id: string): Promise<Product | null> => {
    const sql = `
      SELECT id, business_id as businessId, name, quantity, price, category_id as categoryId,
             cost_price as costPrice, low_stock_level as lowStockLevel, image_uri as imageUri
      FROM products WHERE id = ?
    `;
    const result = await executeQuerySingle<Product>(sql, [id]);
    return result;
  },

  /**
   * Get all products for a business
   */
  findAll: async (businessId: string): Promise<Product[]> => {
    const sql = `
      SELECT id, business_id as businessId, name, quantity, price, category_id as categoryId,
             cost_price as costPrice, low_stock_level as lowStockLevel, image_uri as imageUri
      FROM products WHERE business_id = ? ORDER BY name ASC
    `;
    const results = await executeQuery<Product>(sql, [businessId]);
    return results;
  },

  /**
   * Decrement product quantity (for sales)
   */
  decrementQuantity: async (id: string, amount: number): Promise<void> => {
    const now = new Date().toISOString();
    const sql = `
      UPDATE products
      SET quantity = quantity - ?, updated_at = ?
      WHERE id = ?
    `;

    await executeStatement(sql, [amount, now, id]);
  },

  /**
   * Search products by name within a business
   */
  searchByName: async (businessId: string, searchTerm: string): Promise<Product[]> => {
    const sql = `
      SELECT id, business_id as businessId, name, quantity, price, category_id as categoryId,
             cost_price as costPrice, low_stock_level as lowStockLevel, image_uri as imageUri
      FROM products
      WHERE business_id = ? AND name LIKE ?
      ORDER BY name ASC
    `;

    const results = await executeQuery<Product>(sql, [businessId, `%${searchTerm}%`]);
    return results;
  },

  /**
   * Get products with low stock for a business
   */
  getLowStock: async (businessId: string): Promise<Product[]> => {
    const sql = `
      SELECT id, business_id as businessId, name, quantity, price, category_id as categoryId,
             cost_price as costPrice, low_stock_level as lowStockLevel, image_uri as imageUri
      FROM products
      WHERE business_id = ? AND quantity <= low_stock_level
      ORDER BY quantity ASC, name ASC
    `;

    const results = await executeQuery<Product>(sql, [businessId]);
    return results;
  },

  /**
   * Get products by category within a business
   */
  getByCategory: async (businessId: string, categoryId: string): Promise<Product[]> => {
    const sql = `
      SELECT id, business_id as businessId, name, quantity, price, category_id as categoryId,
             cost_price as costPrice, low_stock_level as lowStockLevel, image_uri as imageUri
      FROM products
      WHERE business_id = ? AND category_id = ?
      ORDER BY name ASC
    `;

    const results = await executeQuery<Product>(sql, [businessId, categoryId]);
    return results;
  },
};
