/**
 * Payment Repository
 * Track customer payment history
 */

import { Payment } from '@/src/shared/types/shop.types';
import { executeQuery, executeQuerySingle, executeStatement } from '../index';

export const paymentRepository = {
  create: async (paymentData: Omit<Payment, 'id'>): Promise<Payment> => {
    const id = Date.now().toString();
    const now = new Date().toISOString();

    const sql = `
      INSERT INTO payment_history (id, customer_id, amount, payment_date, payment_method, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await executeStatement(sql, [
      id,
      paymentData.customerId,
      paymentData.amount,
      paymentData.paymentDate,
      paymentData.paymentMethod,
      paymentData.notes || null,
      now,
    ]);

    return { id, ...paymentData };
  },

  findById: async (id: string): Promise<Payment | null> => {
    const sql = `
      SELECT id, customer_id as customerId, amount, payment_date as paymentDate,
             payment_method as paymentMethod, notes
      FROM payment_history WHERE id = ?
    `;
    return await executeQuerySingle<Payment>(sql, [id]);
  },

  findAll: async (): Promise<Payment[]> => {
    const sql = `
      SELECT id, customer_id as customerId, amount, payment_date as paymentDate,
             payment_method as paymentMethod, notes
      FROM payment_history
      ORDER BY payment_date DESC
    `;
    return await executeQuery<Payment>(sql);
  },

  getPaymentsByCustomer: async (customerId: string): Promise<Payment[]> => {
    const sql = `
      SELECT id, customer_id as customerId, amount, payment_date as paymentDate,
             payment_method as paymentMethod, notes
      FROM payment_history
      WHERE customer_id = ?
      ORDER BY payment_date DESC
    `;
    return await executeQuery<Payment>(sql, [customerId]);
  },

  getPaymentsByDateRange: async (startDate: string, endDate: string): Promise<Payment[]> => {
    const sql = `
      SELECT id, customer_id as customerId, amount, payment_date as paymentDate,
             payment_method as paymentMethod, notes
      FROM payment_history
      WHERE payment_date >= ? AND payment_date <= ?
      ORDER BY payment_date DESC
    `;
    return await executeQuery<Payment>(sql, [startDate, endDate]);
  },

  getTotalPayments: async (): Promise<number> => {
    const sql = 'SELECT SUM(amount) as total FROM payment_history';
    const result = await executeQuerySingle<{ total: number }>(sql);
    return result?.total || 0;
  },

  getRecentPayments: async (limit: number = 10): Promise<Payment[]> => {
    const sql = `
      SELECT id, customer_id as customerId, amount, payment_date as paymentDate,
             payment_method as paymentMethod, notes
      FROM payment_history
      ORDER BY payment_date DESC
      LIMIT ?
    `;
    return await executeQuery<Payment>(sql, [limit]);
  },
};
