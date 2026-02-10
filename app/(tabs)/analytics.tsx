import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/shared/theme';
import { analyticsRepository } from '@/src/services/database/repositories/analytics.repository';
import { expenseRepository } from '@/src/services/database/repositories/expense.repository';
import { SalesTrend, TopProduct, TopCustomer, FinancialSummary } from '@/src/shared/types/shop.types';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [salesTrends, setSalesTrends] = useState<SalesTrend[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');
  const [totalExpenses, setTotalExpenses] = useState(0);

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      // Get date range based on selected period
      const endDate = new Date();
      const startDate = new Date();

      if (selectedPeriod === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else {
        startDate.setDate(startDate.getDate() - 30);
      }

      // Load all analytics data
      const [trends, products, customers, summary, expenses] = await Promise.all([
        analyticsRepository.getSalesTrends(selectedPeriod === 'week' ? 7 : 30),
        analyticsRepository.getTopProducts(5),
        analyticsRepository.getTopCustomers(5),
        analyticsRepository.getFinancialSummary(
          startDate.toISOString(),
          endDate.toISOString()
        ),
        expenseRepository.getExpensesByDateRange(
          startDate.toISOString(),
          endDate.toISOString()
        ),
      ]);

      setSalesTrends(trends);
      setTopProducts(products);
      setTopCustomers(customers);
      setFinancialSummary(summary);

      const expensesTotal = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      setTotalExpenses(expensesTotal);
    } catch (error) {
      console.error('[Analytics] Failed to load data:', error);
    }
  };

  const chartConfig = {
    backgroundColor: theme.colors.card,
    backgroundGradientFrom: theme.colors.card,
    backgroundGradientTo: theme.colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) =>
      theme.isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#3B82F6',
    },
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{ paddingBottom: 60 + insets.bottom }}
    >
      <Text style={[styles.header, { color: theme.colors.text }]}>Analytics</Text>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={[
            styles.periodButton,
            {
              backgroundColor:
                selectedPeriod === 'week' ? theme.colors.primary : theme.colors.card,
            },
          ]}
          onPress={() => setSelectedPeriod('week')}
        >
          <Text
            style={{ color: selectedPeriod === 'week' ? 'white' : theme.colors.text }}
          >
            Last 7 Days
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.periodButton,
            {
              backgroundColor:
                selectedPeriod === 'month' ? theme.colors.primary : theme.colors.card,
            },
          ]}
          onPress={() => setSelectedPeriod('month')}
        >
          <Text
            style={{ color: selectedPeriod === 'month' ? 'white' : theme.colors.text }}
          >
            Last 30 Days
          </Text>
        </TouchableOpacity>
      </View>

      {/* Financial Summary Cards */}
      {financialSummary && (
        <View>
          <View style={styles.statsContainer}>
            <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.cardTitle, { color: theme.colors.textSecondary }]}>
                Total Sales
              </Text>
              <Text style={[styles.cardValue, { color: '#3B82F6' }]}>
                ${financialSummary.totalSales.toFixed(2)}
              </Text>
              <Text style={[styles.cardSubtext, { color: theme.colors.textSecondary }]}>
                {financialSummary.salesCount} transactions
              </Text>
            </View>
            <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.cardTitle, { color: theme.colors.textSecondary }]}>
                Gross Profit
              </Text>
              <Text style={[styles.cardValue, { color: '#10B981' }]}>
                ${financialSummary.totalProfit.toFixed(2)}
              </Text>
              <Text style={[styles.cardSubtext, { color: theme.colors.textSecondary }]}>
                {((financialSummary.totalProfit / financialSummary.totalSales) * 100).toFixed(1)}% margin
              </Text>
            </View>
          </View>

          <View style={[styles.statsContainer, { marginTop: 10 }]}>
            <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.cardTitle, { color: theme.colors.textSecondary }]}>
                Total Expenses
              </Text>
              <Text style={[styles.cardValue, { color: '#EF4444' }]}>
                ${totalExpenses.toFixed(2)}
              </Text>
            </View>
            <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.cardTitle, { color: theme.colors.textSecondary }]}>
                Net Profit
              </Text>
              <Text
                style={[
                  styles.cardValue,
                  { color: financialSummary.netProfit >= 0 ? '#10B981' : '#EF4444' },
                ]}
              >
                ${financialSummary.netProfit.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Sales Trend Chart */}
      {salesTrends.length > 0 && (
        <View style={[styles.chartCard, { backgroundColor: theme.colors.card, marginTop: 20 }]}>
          <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>
            Sales & Profit Trend
          </Text>
          <LineChart
            data={{
              labels: salesTrends.map((t) => {
                const date = new Date(t.date);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }),
              datasets: [
                {
                  data: salesTrends.map((t) => t.sales || 0),
                  color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                  strokeWidth: 2,
                },
                {
                  data: salesTrends.map((t) => t.profit || 0),
                  color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                  strokeWidth: 2,
                },
              ],
              legend: ['Sales', 'Profit'],
            }}
            width={screenWidth - 64}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </View>
      )}

      {/* Top Products */}
      {topProducts.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>
            🏆 Top Selling Products
          </Text>
          {topProducts.map((product, index) => (
            <View
              key={product.productId}
              style={[
                styles.listItem,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={[styles.rankBadge, { backgroundColor: theme.colors.primary }]}>
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>#{index + 1}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: theme.colors.text, fontWeight: 'bold', fontSize: 16 }}>
                    {product.productName}
                  </Text>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
                    Sold: {product.totalSold} units
                  </Text>
                </View>
              </View>
              <Text style={{ color: '#10B981', fontWeight: 'bold', fontSize: 16 }}>
                ${(product.totalSold * product.profit).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Top Customers */}
      {topCustomers.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>
            ⭐ Top Customers
          </Text>
          {topCustomers.map((customer, index) => (
            <View
              key={customer.customerId}
              style={[
                styles.listItem,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View
                  style={[styles.rankBadge, { backgroundColor: theme.colors.primary }]}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>#{index + 1}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: theme.colors.text, fontWeight: 'bold', fontSize: 16 }}>
                    {customer.customerName}
                  </Text>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
                    Purchases: {customer.purchaseCount}
                  </Text>
                </View>
              </View>
              <Text style={{ color: '#3B82F6', fontWeight: 'bold', fontSize: 16 }}>
                ${customer.totalPurchases.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 60 },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  periodButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
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
  cardTitle: { fontSize: 14, marginBottom: 8, textAlign: 'center' },
  cardValue: { fontSize: 24, fontWeight: 'bold' },
  cardSubtext: { fontSize: 11, marginTop: 4 },
  chartCard: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  listItem: {
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
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
