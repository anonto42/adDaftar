/**
 * Sales Repository
 *
 * CRUD operations for sales with transaction support
 */

import { Sale, SaleItem } from '@/src/shared/types/shop.types';
import { executeQuery, executeQuerySingle, getDatabase, withTransaction } from '@/src/services/database';

export const salesRepository = {
  /**
   * Create a new sale with transaction support
   * This handles:
   * 1. Inserting sale record with profit calculation
   * 2. Inserting sale items with individual profits
   * 3. Updating product quantities
   * 4. Updating customer stats and due (if applicable)
   */
  createSaleWithTransaction: async (
    saleData: Omit<Sale, 'id' | 'date'>
  ): Promise<Sale> => {
    const id = Date.now().toString();
    const now = new Date().toISOString();

    let totalProfit = 0;
    let createdSale: Sale;

    await withTransaction(async () => {
      const database = getDatabase();
      // 1. Insert sale record
      const insertSaleSql = `
        INSERT INTO sales (id, date, total_amount, type, customer_id, customer_name, discount, payment_method, profit, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await database.runAsync(insertSaleSql, [
        id,
        now,
        saleData.totalAmount,
        saleData.type,
        saleData.customerId || null,
        saleData.customerName || null,
        saleData.discount || 0,
        saleData.paymentMethod || 'CASH',
        0, // Will update after calculating from items
        saleData.notes || null,
        now,
      ]);

      // 2. Insert sale items and calculate profit
      for (const item of saleData.items) {
        // Get product cost price
        const productSql = 'SELECT cost_price FROM products WHERE id = ?';
        const product = await database.getFirstAsync<{ cost_price: number }>(productSql, [
          item.productId,
        ]);

        const costPrice = product?.cost_price || 0;
        const itemProfit = (item.unitPrice - costPrice) * item.quantity;
        totalProfit += itemProfit;

        const insertItemSql = `
          INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, total, cost_price, profit)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await database.runAsync(insertItemSql, [
          id,
          item.productId,
          item.productName,
          item.quantity,
          item.unitPrice,
          item.total,
          costPrice,
          itemProfit,
        ]);

        // 3. Update product quantity
        const updateProductSql = `
          UPDATE products
          SET quantity = quantity - ?, updated_at = ?
          WHERE id = ?
        `;

        await database.runAsync(updateProductSql, [item.quantity, now, item.productId]);
      }

      // Update sale with calculated profit
      const updateSaleProfitSql = 'UPDATE sales SET profit = ? WHERE id = ?';
      await database.runAsync(updateSaleProfitSql, [totalProfit, id]);

      // 4. Update customer stats
      if (saleData.customerId) {
        if (saleData.type === 'DUE') {
          // For DUE sales, update stats AND due amount
          const updateCustomerSql = `
            UPDATE customers
            SET last_purchase_date = ?,
                total_purchases = total_purchases + ?,
                purchase_count = purchase_count + 1,
                total_due = total_due + ?,
                updated_at = ?
            WHERE id = ?
          `;

          await database.runAsync(updateCustomerSql, [
            now,
            saleData.totalAmount,
            saleData.totalAmount,
            now,
            saleData.customerId,
          ]);
        } else {
          // For CASH sales, just update stats
          const updateCustomerSql = `
            UPDATE customers
            SET last_purchase_date = ?,
                total_purchases = total_purchases + ?,
                purchase_count = purchase_count + 1,
                updated_at = ?
            WHERE id = ?
          `;

          await database.runAsync(updateCustomerSql, [
            now,
            saleData.totalAmount,
            now,
            saleData.customerId,
          ]);
        }
      }
    });

    // Return the created sale with profit
    createdSale = {
      id,
      date: now,
      ...saleData,
      profit: totalProfit,
    };

    return createdSale;
  },

  /**
   * Get all sales
   */
  findAll: async (): Promise<Sale[]> => {
    const sql = `
      SELECT id, date, total_amount as totalAmount, type, customer_id as customerId,
             customer_name as customerName, discount, payment_method as paymentMethod,
             profit, notes
      FROM sales
      ORDER BY date DESC
    `;

    const sales = await executeQuery<Omit<Sale, 'items'>>(sql);

    // Fetch items for each sale
    const salesWithItems = await Promise.all(
      sales.map(async (sale) => {
        const items = await salesRepository.getSaleItems(sale.id);
        return {
          ...sale,
          items,
        };
      })
    );

    return salesWithItems;
  },

  /**
   * Find sale by ID
   */
  findById: async (id: string): Promise<Sale | null> => {
    const sql = `
      SELECT id, date, total_amount as totalAmount, type, customer_id as customerId,
             customer_name as customerName, discount, payment_method as paymentMethod,
             profit, notes
      FROM sales
      WHERE id = ?
    `;

    const sale = await executeQuerySingle<Omit<Sale, 'items'>>(sql, [id]);

    if (!sale) return null;

    const items = await salesRepository.getSaleItems(id);

    return {
      ...sale,
      items,
    };
  },

  /**
   * Get sale items for a specific sale
   */
  getSaleItems: async (saleId: string): Promise<SaleItem[]> => {
    const sql = `
      SELECT
        product_id as productId,
        product_name as productName,
        quantity,
        unit_price as unitPrice,
        total
      FROM sale_items
      WHERE sale_id = ?
      ORDER BY id ASC
    `;

    const items = await executeQuery<SaleItem>(sql, [saleId]);
    return items;
  },

  /**
   * Get sales by customer ID
   */
  getSalesByCustomer: async (customerId: string): Promise<Sale[]> => {
    const sql = `
      SELECT id, date, total_amount as totalAmount, type, customer_id as customerId, customer_name as customerName
      FROM sales
      WHERE customer_id = ?
      ORDER BY date DESC
    `;

    const sales = await executeQuery<Omit<Sale, 'items'>>(sql, [customerId]);

    // Fetch items for each sale
    const salesWithItems = await Promise.all(
      sales.map(async (sale) => {
        const items = await salesRepository.getSaleItems(sale.id);
        return {
          ...sale,
          items,
        };
      })
    );

    return salesWithItems;
  },

  /**
   * Get sales by type (CASH or DUE)
   */
  getSalesByType: async (type: 'CASH' | 'DUE'): Promise<Sale[]> => {
    const sql = `
      SELECT id, date, total_amount as totalAmount, type, customer_id as customerId, customer_name as customerName
      FROM sales
      WHERE type = ?
      ORDER BY date DESC
    `;

    const sales = await executeQuery<Omit<Sale, 'items'>>(sql, [type]);

    const salesWithItems = await Promise.all(
      sales.map(async (sale) => {
        const items = await salesRepository.getSaleItems(sale.id);
        return {
          ...sale,
          items,
        };
      })
    );

    return salesWithItems;
  },

  /**
   * Get sales within a date range
   */
  getSalesByDateRange: async (startDate: string, endDate: string): Promise<Sale[]> => {
    const sql = `
      SELECT id, date, total_amount as totalAmount, type, customer_id as customerId, customer_name as customerName
      FROM sales
      WHERE date >= ? AND date <= ?
      ORDER BY date DESC
    `;

    const sales = await executeQuery<Omit<Sale, 'items'>>(sql, [startDate, endDate]);

    const salesWithItems = await Promise.all(
      sales.map(async (sale) => {
        const items = await salesRepository.getSaleItems(sale.id);
        return {
          ...sale,
          items,
        };
      })
    );

    return salesWithItems;
  },

  /**
   * Get today's sales
   */
  getTodaysSales: async (): Promise<Sale[]> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDay = today.toISOString();

    today.setHours(23, 59, 59, 999);
    const endOfDay = today.toISOString();

    return salesRepository.getSalesByDateRange(startOfDay, endOfDay);
  },

  /**
   * Get total sales amount
   */
  getTotalSalesAmount: async (): Promise<number> => {
    const sql = 'SELECT SUM(total_amount) as total FROM sales';
    const result = await executeQuerySingle<{ total: number }>(sql);
    return result?.total || 0;
  },

  /**
   * Get today's sales total
   */
  getTodaysSalesTotal: async (): Promise<number> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDay = today.toISOString();

    today.setHours(23, 59, 59, 999);
    const endOfDay = today.toISOString();

    const sql = `
      SELECT SUM(total_amount) as total
      FROM sales
      WHERE date >= ? AND date <= ?
    `;

    const result = await executeQuerySingle<{ total: number }>(sql, [
      startOfDay,
      endOfDay,
    ]);
    return result?.total || 0;
  },
};
