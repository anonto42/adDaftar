/**
 * Payment Repository
 * Track customer payment history
 */

import { Payment } from '@/src/shared/types/shop.types';
import { executeQuery, executeQuerySingle, executeStatement } from '@/src/services/database';

export const paymentRepository = {
  create: async (paymentData: Omit<Payment, 'id'>): Promise<Payment> => {
    const id = Date.now().toString();
    const now = new Date().toISOString();

    const sql = `
      INSERT INTO payment_history (id, business_id, customer_id, amount, payment_date, payment_method, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await executeStatement(sql, [
      id,
      paymentData.businessId,
      paymentData.customerId,
      paymentData.amount,
      paymentData.paymentDate,
      paymentData.paymentMethod,
      paymentData.notes || null,
      now,
      now,
    ]);

    return { id, ...paymentData };
  },

  findById: async (id: string): Promise<Payment | null> => {
    const sql = `
      SELECT id, business_id as businessId, customer_id as customerId, amount, payment_date as paymentDate,
             payment_method as paymentMethod, notes
      FROM payment_history WHERE id = ?
    `;
    return await executeQuerySingle<Payment>(sql, [id]);
  },

  findAll: async (businessId: string): Promise<Payment[]> => {
    const sql = `
      SELECT id, business_id as businessId, customer_id as customerId, amount, payment_date as paymentDate,
             payment_method as paymentMethod, notes
      FROM payment_history
      WHERE business_id = ?
      ORDER BY payment_date DESC
    `;
    return await executeQuery<Payment>(sql, [businessId]);
  },

  getPaymentsByCustomer: async (customerId: string): Promise<Payment[]> => {
    const sql = `
      SELECT id, business_id as businessId, customer_id as customerId, amount, payment_date as paymentDate,
             payment_method as paymentMethod, notes
      FROM payment_history
      WHERE customer_id = ?
      ORDER BY payment_date DESC
    `;
    return await executeQuery<Payment>(sql, [customerId]);
  },

  getPaymentsByDateRange: async (businessId: string, startDate: string, endDate: string): Promise<Payment[]> => {
    const sql = `
      SELECT id, business_id as businessId, customer_id as customerId, amount, payment_date as paymentDate,
             payment_method as paymentMethod, notes
      FROM payment_history
      WHERE business_id = ? AND payment_date >= ? AND payment_date <= ?
      ORDER BY payment_date DESC
    `;
    return await executeQuery<Payment>(sql, [businessId, startDate, endDate]);
  },

  getTotalPayments: async (businessId: string): Promise<number> => {
    const sql = 'SELECT SUM(amount) as total FROM payment_history WHERE business_id = ?';
    const result = await executeQuerySingle<{ total: number }>(sql, [businessId]);
    return result?.total || 0;
  },

  getRecentPayments: async (businessId: string, limit: number = 10): Promise<Payment[]> => {
    const sql = `
      SELECT id, business_id as businessId, customer_id as customerId, amount, payment_date as paymentDate,
             payment_method as paymentMethod, notes
      FROM payment_history
      WHERE business_id = ?
      ORDER BY payment_date DESC
      LIMIT ?
    `;
    return await executeQuery<Payment>(sql, [businessId, limit]);
  },
};
