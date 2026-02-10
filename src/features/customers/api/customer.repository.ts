/**
 * Customer Repository
 *
 * CRUD operations for customers
 */

import { Customer } from '@/src/shared/types/shop.types';
import { executeQuery, executeQuerySingle, executeStatement } from '@/src/services/database';

export const customerRepository = {
  /**
   * Create a new customer
   */
  create: async (customerData: Omit<Customer, 'id'>): Promise<Customer> => {
    const id = Date.now().toString();
    const now = new Date().toISOString();

    const sql = `
      INSERT INTO customers (id, name, phone, address, total_due, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await executeStatement(sql, [
      id,
      customerData.name,
      customerData.phone || null,
      customerData.address || null,
      customerData.totalDue || 0,
      now,
      now,
    ]);

    return {
      id,
      ...customerData,
      totalDue: customerData.totalDue || 0,
    };
  },

  /**
   * Update an existing customer
   */
  update: async (id: string, updates: Partial<Customer>): Promise<void> => {
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }

    if (updates.phone !== undefined) {
      fields.push('phone = ?');
      values.push(updates.phone || null);
    }

    if (updates.address !== undefined) {
      fields.push('address = ?');
      values.push(updates.address || null);
    }

    if (updates.totalDue !== undefined) {
      fields.push('total_due = ?');
      values.push(updates.totalDue);
    }

    if (fields.length === 0) return;

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    const sql = `UPDATE customers SET ${fields.join(', ')} WHERE id = ?`;

    await executeStatement(sql, values);
  },

  /**
   * Delete a customer
   */
  delete: async (id: string): Promise<void> => {
    const sql = 'DELETE FROM customers WHERE id = ?';
    await executeStatement(sql, [id]);
  },

  /**
   * Find customer by ID
   */
  findById: async (id: string): Promise<Customer | null> => {
    const sql = `
      SELECT id, name, phone, address, total_due as totalDue,
             last_purchase_date as lastPurchaseDate, total_purchases as totalPurchases,
             purchase_count as purchaseCount
      FROM customers
      WHERE id = ?
    `;
    const result = await executeQuerySingle<Customer>(sql, [id]);
    return result;
  },

  /**
   * Get all customers
   */
  findAll: async (): Promise<Customer[]> => {
    const sql = `
      SELECT id, name, phone, address, total_due as totalDue,
             last_purchase_date as lastPurchaseDate, total_purchases as totalPurchases,
             purchase_count as purchaseCount
      FROM customers
      ORDER BY name ASC
    `;
    const results = await executeQuery<Customer>(sql);
    return results;
  },

  /**
   * Update customer due amount (increment or decrement)
   */
  updateDue: async (id: string, amount: number): Promise<void> => {
    const now = new Date().toISOString();
    const sql = `
      UPDATE customers
      SET total_due = total_due + ?, updated_at = ?
      WHERE id = ?
    `;

    await executeStatement(sql, [amount, now, id]);
  },

  /**
   * Get customers with outstanding dues
   */
  getCustomersWithDues: async (): Promise<Customer[]> => {
    const sql = `
      SELECT id, name, phone, address, total_due as totalDue,
             last_purchase_date as lastPurchaseDate, total_purchases as totalPurchases,
             purchase_count as purchaseCount
      FROM customers
      WHERE total_due > 0
      ORDER BY total_due DESC, name ASC
    `;
    const results = await executeQuery<Customer>(sql);
    return results;
  },

  /**
   * Search customers by name or phone
   */
  search: async (searchTerm: string): Promise<Customer[]> => {
    const sql = `
      SELECT id, name, phone, address, total_due as totalDue,
             last_purchase_date as lastPurchaseDate, total_purchases as totalPurchases,
             purchase_count as purchaseCount
      FROM customers
      WHERE name LIKE ? OR phone LIKE ?
      ORDER BY name ASC
    `;

    const results = await executeQuery<Customer>(sql, [
      `%${searchTerm}%`,
      `%${searchTerm}%`,
    ]);
    return results;
  },

  /**
   * Update customer purchase stats (called after a sale)
   */
  updatePurchaseStats: async (id: string, amount: number): Promise<void> => {
    const now = new Date().toISOString();
    const sql = `
      UPDATE customers
      SET last_purchase_date = ?,
          total_purchases = total_purchases + ?,
          purchase_count = purchase_count + 1,
          updated_at = ?
      WHERE id = ?
    `;

    await executeStatement(sql, [now, amount, now, id]);
  },

  /**
   * Get total amount of all dues
   */
  getTotalDues: async (): Promise<number> => {
    const sql = 'SELECT SUM(total_due) as total FROM customers';
    const result = await executeQuerySingle<{ total: number }>(sql);
    return result?.total || 0;
  },
};
