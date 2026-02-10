/**
 * Expense Repository
 * Track business expenses
 */

import { Expense, ExpenseCategory } from '@/src/shared/types/shop.types';
import { executeQuery, executeQuerySingle, executeStatement } from '@/src/services/database';

export const expenseRepository = {
  create: async (expenseData: Omit<Expense, 'id'>): Promise<Expense> => {
    const id = Date.now().toString();
    const now = new Date().toISOString();

    const sql = `
      INSERT INTO expenses (id, description, amount, category, expense_date, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await executeStatement(sql, [
      id,
      expenseData.description,
      expenseData.amount,
      expenseData.category,
      expenseData.expenseDate,
      expenseData.notes || null,
      now,
      now,
    ]);

    return { id, ...expenseData };
  },

  update: async (id: string, updates: Partial<Expense>): Promise<void> => {
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.amount !== undefined) {
      fields.push('amount = ?');
      values.push(updates.amount);
    }
    if (updates.category !== undefined) {
      fields.push('category = ?');
      values.push(updates.category);
    }
    if (updates.expenseDate !== undefined) {
      fields.push('expense_date = ?');
      values.push(updates.expenseDate);
    }
    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(updates.notes || null);
    }

    if (fields.length === 0) return;

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    const sql = `UPDATE expenses SET ${fields.join(', ')} WHERE id = ?`;
    await executeStatement(sql, values);
  },

  delete: async (id: string): Promise<void> => {
    const sql = 'DELETE FROM expenses WHERE id = ?';
    await executeStatement(sql, [id]);
  },

  findById: async (id: string): Promise<Expense | null> => {
    const sql = `
      SELECT id, description, amount, category, expense_date as expenseDate, notes
      FROM expenses WHERE id = ?
    `;
    return await executeQuerySingle<Expense>(sql, [id]);
  },

  findAll: async (): Promise<Expense[]> => {
    const sql = `
      SELECT id, description, amount, category, expense_date as expenseDate, notes
      FROM expenses
      ORDER BY expense_date DESC
    `;
    return await executeQuery<Expense>(sql);
  },

  getExpensesByDateRange: async (startDate: string, endDate: string): Promise<Expense[]> => {
    const sql = `
      SELECT id, description, amount, category, expense_date as expenseDate, notes
      FROM expenses
      WHERE expense_date >= ? AND expense_date <= ?
      ORDER BY expense_date DESC
    `;
    return await executeQuery<Expense>(sql, [startDate, endDate]);
  },

  getExpensesByCategory: async (category: ExpenseCategory): Promise<Expense[]> => {
    const sql = `
      SELECT id, description, amount, category, expense_date as expenseDate, notes
      FROM expenses
      WHERE category = ?
      ORDER BY expense_date DESC
    `;
    return await executeQuery<Expense>(sql, [category]);
  },

  getTotalExpenses: async (): Promise<number> => {
    const sql = 'SELECT SUM(amount) as total FROM expenses';
    const result = await executeQuerySingle<{ total: number }>(sql);
    return result?.total || 0;
  },

  getMonthlyExpenses: async (month: number, year: number): Promise<Expense[]> => {
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();
    return expenseRepository.getExpensesByDateRange(startDate, endDate);
  },

  getMonthlyTotal: async (month: number, year: number): Promise<number> => {
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

    const sql = `
      SELECT SUM(amount) as total
      FROM expenses
      WHERE expense_date >= ? AND expense_date <= ?
    `;
    const result = await executeQuerySingle<{ total: number }>(sql, [startDate, endDate]);
    return result?.total || 0;
  },
};
