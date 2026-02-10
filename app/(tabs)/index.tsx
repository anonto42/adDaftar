import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/shared/theme';
import { useSalesStore } from '@/src/store/sales.store';
import { useCustomerStore } from '@/src/store/customer.store';
import { useProductStore } from '@/src/store/product.store';
import { analyticsRepository } from '@/src/services/database/repositories/analytics.repository';
import { expenseRepository } from '@/src/services/database/repositories/expense.repository';
import { SalesTrend, Product } from '@/src/shared/types/shop.types';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { sales, getTodaysSalesTotal } = useSalesStore();
  const { customers, getTotalDues } = useCustomerStore();
  const { products } = useProductStore();

  const [todaysSales, setTodaysSales] = useState(0);
  const [todaysProfit, setTodaysProfit] = useState(0);
  const [totalDue, setTotalDue] = useState(0);
  const [salesTrends, setSalesTrends] = useState<SalesTrend[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Get today's summary
      const todaySummary = await analyticsRepository.getTodaysSummary();
      setTodaysSales(todaySummary.totalSales);
      setTodaysProfit(todaySummary.totalProfit);

      // Get total dues
      const dues = await getTotalDues();
      setTotalDue(dues);

      // Get 7-day sales trends
      const trends = await analyticsRepository.getSalesTrends(7);
      setSalesTrends(trends);

      // Get low stock products
      const lowStock = await analyticsRepository.getLowStockProducts();
      setLowStockProducts(lowStock.slice(0, 5)); // Show top 5

      // Get current month expenses
      const now = new Date();
      const expenses = await expenseRepository.getMonthlyTotal(
        now.getMonth() + 1,
        now.getFullYear()
      );
      setMonthlyExpenses(expenses);
    } catch (error) {
      console.error('[Dashboard] Failed to load data:', error);
    }
  };

  const totalProducts = products.reduce((sum, p) => sum + p.quantity, 0);
  const netProfit = todaysProfit - (monthlyExpenses / 30); 

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{ paddingBottom: 60 + insets.bottom }}
    >
      <Text style={[styles.header, { color: theme.colors.text }]}>Dashboard</Text>

      {/* Top Stats Row */}
      <View style={styles.statsContainer}>
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.textSecondary }]}>Sales Today</Text>
          <Text style={[styles.cardValue, { color: theme.colors.primary }]}>${todaysSales.toFixed(2)}</Text>
        </View>
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.textSecondary }]}>Profit Today</Text>
          <Text style={[styles.cardValue, { color: '#10B981' }]}>${todaysProfit.toFixed(2)}</Text>
        </View>
      </View>

      {/* Second Stats Row */}
      <View style={[styles.statsContainer, { marginTop: 10 }]}>
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.textSecondary }]}>Total Due</Text>
          <Text style={[styles.cardValue, { color: '#EF4444' }]}>${totalDue.toFixed(2)}</Text>
        </View>
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.textSecondary }]}>Inventory</Text>
          <Text style={[styles.cardValue, { color: theme.colors.text }]}>{totalProducts}</Text>
        </View>
      </View>

      {/* Sales Trend Chart */}
      {salesTrends.length > 0 && (
        <View style={[styles.chartCard, { backgroundColor: theme.colors.card, marginTop: 20 }]}>
          <Text style={[styles.sectionHeader, { color: theme.colors.text, marginTop: 0, marginBottom: 16 }]}>
            7-Day Sales Trend
          </Text>
          <LineChart
            data={{
              labels: salesTrends.map(t => {
                const date = new Date(t.date);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }),
              datasets: [{
                data: salesTrends.map(t => t.sales || 0)
              }]
            }}
            width={screenWidth - 64}
            height={200}
            chartConfig={{
              backgroundColor: theme.colors.card,
              backgroundGradientFrom: theme.colors.card,
              backgroundGradientTo: theme.colors.card,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
              labelColor: (opacity = 1) => theme.isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#3B82F6'
              }
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16
            }}
          />
        </View>
      )}

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>
            ⚠️ Low Stock Alert
          </Text>
          {lowStockProducts.map((product) => (
            <View
              key={product.id}
              style={[styles.alertItem, { backgroundColor: theme.colors.card, borderColor: '#EF4444' }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.text, fontWeight: 'bold' }}>
                  {product.name}
                </Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
                  Only {product.quantity} left (threshold: {product.lowStockLevel || 5})
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: '#FEE2E2' }]}>
                <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: 'bold' }}>
                  {product.quantity}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Recent Transactions */}
      <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>Recent Transactions</Text>
      {sales.slice(0, 5).map((sale) => (
        <View
          key={sale.id}
          style={[styles.transactionItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.colors.text, fontWeight: 'bold' }}>
              {sale.type === 'DUE' ? `Due: ${sale.customerName}` : 'Cash Sale'}
            </Text>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
              {new Date(sale.date).toLocaleDateString()} {new Date(sale.date).toLocaleTimeString()}
            </Text>
            {sale.profit !== undefined && (
              <Text style={{ color: '#10B981', fontSize: 12, marginTop: 2 }}>
                Profit: ${sale.profit.toFixed(2)}
              </Text>
            )}
          </View>
          <Text style={{ color: theme.colors.text, fontWeight: 'bold' }}>
            ${sale.totalAmount.toFixed(2)}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 60 },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  card: {
    flex: 0.48,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: { fontSize: 14, marginBottom: 8 },
  cardValue: { fontSize: 24, fontWeight: 'bold' },
  chartCard: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: { fontSize: 20, fontWeight: 'bold', marginTop: 24, marginBottom: 12 },
  transactionItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  alertItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderLeftWidth: 4,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 40,
    alignItems: 'center',
  },
});
