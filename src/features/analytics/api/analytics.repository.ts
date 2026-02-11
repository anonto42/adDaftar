/**
 * Analytics Repository
 * Computed analytics and reports
 */

import {
  SalesTrend,
  TopProduct,
  TopCustomer,
  FinancialSummary,
  Sale,
} from '@/src/shared/types/shop.types';
import { executeQuery, executeQuerySingle } from '@/src/services/database';

export const analyticsRepository = {
  /**
   * Get sales trends for last N days
   */
  getSalesTrends: async (days: number = 7): Promise<SalesTrend[]> => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const sql = `
      SELECT
        DATE(date) as date,
        SUM(total_amount) as sales,
        SUM(profit) as profit,
        COUNT(*) as count
      FROM sales
      WHERE date >= ?
      GROUP BY DATE(date)
      ORDER BY date ASC
    `;

    const results = await executeQuery<SalesTrend>(sql, [startDate.toISOString()]);
    return results;
  },

  /**
   * Get top selling products
   */
  getTopProducts: async (limit: number = 5): Promise<TopProduct[]> => {
    const sql = `
      SELECT
        si.product_id as productId,
        si.product_name as productName,
        SUM(si.quantity) as totalSold,
        SUM(si.total) as revenue,
        SUM(si.profit) as profit
      FROM sale_items si
      GROUP BY si.product_id, si.product_name
      ORDER BY totalSold DESC
      LIMIT ?
    `;

    return await executeQuery<TopProduct>(sql, [limit]);
  },

  /**
   * Get top customers by purchase amount
   */
  getTopCustomers: async (limit: number = 5): Promise<TopCustomer[]> => {
    const sql = `
      SELECT
        c.id as customerId,
        c.name as customerName,
        c.total_purchases as totalPurchases,
        c.purchase_count as purchaseCount
      FROM customers c
      WHERE c.purchase_count > 0
      ORDER BY c.total_purchases DESC
      LIMIT ?
    `;

    return await executeQuery<TopCustomer>(sql, [limit]);
  },

  /**
   * Get products with low stock
   */
  getLowStockProducts: async () => {
    const sql = `
      SELECT id, name, quantity, price, low_stock_level as lowStockLevel
      FROM products
      WHERE quantity <= low_stock_level
      ORDER BY quantity ASC
    `;

    return await executeQuery(sql);
  },

  /**
   * Get total inventory value (quantity × cost_price)
   */
  getInventoryValue: async (): Promise<number> => {
    const sql = `
      SELECT SUM(quantity * cost_price) as total
      FROM products
      WHERE cost_price > 0
    `;

    const result = await executeQuerySingle<{ total: number }>(sql);
    return result?.total || 0;
  },

  /**
   * Get financial summary for date range
   */
  getFinancialSummary: async (
    startDate: string,
    endDate: string
  ): Promise<FinancialSummary> => {
    // Get sales data
    const salesSql = `
      SELECT
        SUM(total_amount) as totalSales,
        SUM(profit) as totalProfit,
        COUNT(*) as salesCount
      FROM sales
      WHERE date >= ? AND date <= ?
    `;

    const salesData = await executeQuerySingle<{
      totalSales: number;
      totalProfit: number;
      salesCount: number;
    }>(salesSql, [startDate, endDate]);

    // Get expenses data
    const expensesSql = `
      SELECT SUM(amount) as totalExpenses
      FROM expenses
      WHERE expense_date >= ? AND expense_date <= ?
    `;

    const expensesData = await executeQuerySingle<{ totalExpenses: number }>(
      expensesSql,
      [startDate, endDate]
    );

    const totalSales = salesData?.totalSales || 0;
    const totalProfit = salesData?.totalProfit || 0;
    const totalExpenses = expensesData?.totalExpenses || 0;
    const salesCount = salesData?.salesCount || 0;

    return {
      totalSales,
      totalProfit,
      totalExpenses,
      netProfit: totalProfit - totalExpenses,
      salesCount,
    };
  },

  /**
   * Get today's summary
   */
  getTodaysSummary: async (): Promise<FinancialSummary> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDay = today.toISOString();

    today.setHours(23, 59, 59, 999);
    const endOfDay = today.toISOString();

    return analyticsRepository.getFinancialSummary(startOfDay, endOfDay);
  },

  /**
   * Get recent sales
   */
  getRecentSales: async (limit: number = 10): Promise<Sale[]> => {
    const sql = `
      SELECT id, date, total_amount as totalAmount, type, customer_name as customerName, notes
      FROM sales
      ORDER BY date DESC
      LIMIT ?
    `;
    return await executeQuery<Sale>(sql, [limit]);
  },
};
