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
   * Get sales trends for last N days for a business
   * Ensures every day in the range has a data point (zero-filled if no sales)
   * Can optionally group results by week
   */
  getSalesTrends: async (
    businessId: string, 
    days: number = 7, 
    groupBy: 'day' | 'week' = 'day'
  ): Promise<SalesTrend[]> => {
    // Use local time boundaries for more intuitive "Today" reporting
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const endDateISO = end.toISOString();
    
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);
    const startDateISO = start.toISOString();

    // Group by the date part of the ISO string (YYYY-MM-DD)
    const sql = `
      SELECT
        substr(date, 1, 10) as trend_date,
        SUM(total_amount) as sales,
        SUM(profit) as profit,
        COUNT(*) as count
      FROM sales
      WHERE business_id = ? AND date >= ? AND date <= ?
      GROUP BY trend_date
      ORDER BY trend_date ASC
    `;

    const dbResults = await executeQuery<any>(sql, [
      businessId, 
      startDateISO,
      endDateISO
    ]);

    const resultsMap = new Map<string, SalesTrend>();
    dbResults.forEach(row => {
      resultsMap.set(row.trend_date, {
        date: row.trend_date,
        sales: Number(row.sales || 0),
        profit: Number(row.profit || 0),
        count: Number(row.count || 0)
      });
    });

    const dailyTrends: SalesTrend[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      if (resultsMap.has(dateKey)) {
        dailyTrends.push(resultsMap.get(dateKey)!);
      } else {
        dailyTrends.push({
          date: dateKey,
          sales: 0,
          profit: 0,
          count: 0
        });
      }
    }

    if (groupBy === 'day') {
      return dailyTrends;
    }

    // Group by week (7-day chunks)
    const weeklyTrends: SalesTrend[] = [];
    for (let i = 0; i < dailyTrends.length; i += 7) {
      const weekChunk = dailyTrends.slice(i, Math.min(i + 7, dailyTrends.length));
      if (weekChunk.length === 0) continue;

      const weekSales = weekChunk.reduce((sum, d) => sum + d.sales, 0);
      const weekProfit = weekChunk.reduce((sum, d) => sum + d.profit, 0);
      const weekCount = weekChunk.reduce((sum, d) => sum + d.count, 0);
      
      weeklyTrends.push({
        date: weekChunk[weekChunk.length - 1].date,
        sales: weekSales,
        profit: weekProfit,
        count: weekCount
      });
    }

    return weeklyTrends;
  },

  /**
   * Get top selling products for a business
   */
  getTopProducts: async (businessId: string, limit: number = 5): Promise<TopProduct[]> => {
    const sql = `
      SELECT
        si.product_id as productId,
        si.product_name as productName,
        SUM(si.quantity) as totalSold,
        SUM(si.total) as revenue,
        SUM(si.profit) as profit
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.business_id = ?
      GROUP BY si.product_id, si.product_name
      ORDER BY totalSold DESC
      LIMIT ?
    `;

    return await executeQuery<TopProduct>(sql, [businessId, limit]);
  },

  /**
   * Get top customers by purchase amount for a business
   */
  getTopCustomers: async (businessId: string, limit: number = 5): Promise<TopCustomer[]> => {
    const sql = `
      SELECT
        c.id as customerId,
        c.name as customerName,
        c.total_purchases as totalPurchases,
        c.purchase_count as purchaseCount
      FROM customers c
      WHERE c.business_id = ? AND c.purchase_count > 0
      ORDER BY c.total_purchases DESC
      LIMIT ?
    `;

    return await executeQuery<TopCustomer>(sql, [businessId, limit]);
  },

  /**
   * Get products with low stock for a business
   */
  getLowStockProducts: async (businessId: string) => {
    const sql = `
      SELECT id, name, quantity, price, low_stock_level as lowStockLevel
      FROM products
      WHERE business_id = ? AND quantity <= low_stock_level
      ORDER BY quantity ASC
    `;

    return await executeQuery(sql, [businessId]);
  },

  /**
   * Get total inventory value for a business (quantity × cost_price)
   */
  getInventoryValue: async (businessId: string): Promise<number> => {
    const sql = `
      SELECT SUM(quantity * cost_price) as total
      FROM products
      WHERE business_id = ? AND cost_price > 0
    `;

    const result = await executeQuerySingle<{ total: number }>(sql, [businessId]);
    return result?.total || 0;
  },

  /**
   * Get financial summary for date range and business
   */
  getFinancialSummary: async (
    businessId: string,
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
      WHERE business_id = ? AND date >= ? AND date <= ?
    `;

    const salesData = await executeQuerySingle<{
      totalSales: number;
      totalProfit: number;
      salesCount: number;
    }>(salesSql, [businessId, startDate, endDate]);

    // Get expenses data
    const expensesSql = `
      SELECT SUM(amount) as totalExpenses
      FROM expenses
      WHERE business_id = ? AND expense_date >= ? AND expense_date <= ?
    `;

    const expensesData = await executeQuerySingle<{ totalExpenses: number }>(
      expensesSql,
      [businessId, startDate, endDate]
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
   * Get today's summary for a business
   */
  getTodaysSummary: async (businessId: string): Promise<FinancialSummary> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDay = today.toISOString();

    today.setHours(23, 59, 59, 999);
    const endOfDay = today.toISOString();

    return analyticsRepository.getFinancialSummary(businessId, startOfDay, endOfDay);
  },

  /**
   * Get recent sales for a business
   */
  getRecentSales: async (businessId: string, limit: number = 10): Promise<Sale[]> => {
    const sql = `
      SELECT id, date, total_amount as totalAmount, type, customer_name as customerName, notes
      FROM sales
      WHERE business_id = ?
      ORDER BY date DESC
      LIMIT ?
    `;
    return await executeQuery<Sale>(sql, [businessId, limit]);
  },
};
