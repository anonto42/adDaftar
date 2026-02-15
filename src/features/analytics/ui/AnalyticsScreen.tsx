import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/shared/theme';
import { useAppStore } from '@/src/features/settings';
import { useBusinessStore } from '@/src/features/business';
import { analyticsRepository } from '../api/analytics.repository';
import { expenseRepository } from '@/src/features/expenses';
import { SalesTrend, TopProduct, TopCustomer, FinancialSummary } from '@/src/shared/types/shop.types';
import { PressableScale, ScreenHeader } from '@/src/shared/components';
import { formatCurrency } from '@/src/shared/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currency } = useAppStore();
  const { activeBusinessId, activeBusiness } = useBusinessStore();

  const [salesTrends, setSalesTrends] = useState<SalesTrend[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');
  const [totalExpenses, setTotalExpenses] = useState(0);

  const loadAnalytics = useCallback(async () => {
    if (!activeBusinessId) return;

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
        analyticsRepository.getSalesTrends(activeBusinessId, selectedPeriod === 'week' ? 7 : 30),
        analyticsRepository.getTopProducts(activeBusinessId, 5),
        analyticsRepository.getTopCustomers(activeBusinessId, 5),
        analyticsRepository.getFinancialSummary(
          activeBusinessId,
          startDate.toISOString(),
          endDate.toISOString()
        ),
        expenseRepository.getExpensesByDateRange(
          activeBusinessId,
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
  }, [selectedPeriod, activeBusinessId]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const chartConfig = {
    backgroundColor: theme.colors.card,
    backgroundGradientFrom: theme.colors.card,
    backgroundGradientTo: theme.colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => theme.colors.primary,
    labelColor: (opacity = 1) => theme.colors.textSecondary,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: theme.colors.primary,
    },
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top + 16 }]}
      contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader 
        title="Analytics" 
        subtitle="Performance" 
        topTitle={activeBusiness?.name}
        icon="stats-chart" 
        rightElement={
          <TouchableOpacity 
            style={[styles.reportButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={() => router.push('/reports')}
          >
            <Ionicons name="document-text-outline" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        }
      />

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <PressableScale
          style={[
            styles.periodButton,
            {
              backgroundColor:
                selectedPeriod === 'week' ? theme.colors.primary : theme.colors.card,
              borderColor: selectedPeriod === 'week' ? theme.colors.primary : theme.colors.border,
            },
          ]}
          onPress={() => setSelectedPeriod('week')}
        >
          <Text
            style={{ color: selectedPeriod === 'week' ? 'white' : theme.colors.text, fontWeight: '600' }}
          >
            Last 7 Days
          </Text>
        </PressableScale>
        <PressableScale
          style={[
            styles.periodButton,
            {
              backgroundColor:
                selectedPeriod === 'month' ? theme.colors.primary : theme.colors.card,
              borderColor: selectedPeriod === 'month' ? theme.colors.primary : theme.colors.border,
            },
          ]}
          onPress={() => setSelectedPeriod('month')}
        >
          <Text
            style={{ color: selectedPeriod === 'month' ? 'white' : theme.colors.text, fontWeight: '600' }}
          >
            Last 30 Days
          </Text>
        </PressableScale>
      </View>

      {/* Financial Summary Cards */}
      <View>
        <View style={styles.statsContainer}>
          <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.cardTitle, { color: theme.colors.textSecondary }]}>
              Total Sales
            </Text>
            <Text style={[styles.cardValue, { color: theme.colors.primary, fontVariant: ['tabular-nums'] }]}>
              {formatCurrency(financialSummary?.totalSales || 0, currency)}
            </Text>
            <Text style={[styles.cardSubtext, { color: theme.colors.textTertiary }]}>
              {financialSummary?.salesCount || 0} transactions
            </Text>
          </View>
          <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.cardTitle, { color: theme.colors.textSecondary }]}>
              Gross Profit
            </Text>
            <Text style={[styles.cardValue, { color: theme.colors.success, fontVariant: ['tabular-nums'] }]}>
              {formatCurrency(financialSummary?.totalProfit || 0, currency)}
            </Text>
            <Text style={[styles.cardSubtext, { color: theme.colors.textTertiary }]}>
              {financialSummary && financialSummary.totalSales > 0 
                ? ((financialSummary.totalProfit / financialSummary.totalSales) * 100).toFixed(1) 
                : '0.0'}% margin
            </Text>
          </View>
        </View>

        <View style={[styles.statsContainer, { marginTop: 16 }]}>
          <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.cardTitle, { color: theme.colors.textSecondary }]}>
              Total Expenses
            </Text>
            <Text style={[styles.cardValue, { color: theme.colors.error, fontVariant: ['tabular-nums'] }]}>
              {formatCurrency(totalExpenses, currency)}
            </Text>
          </View>
          <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.cardTitle, { color: theme.colors.textSecondary }]}>
              Net Profit
            </Text>
            <Text
              style={[
                styles.cardValue,
                { color: (financialSummary?.netProfit || 0) >= 0 ? theme.colors.success : theme.colors.error, fontVariant: ['tabular-nums'] },
              ]}
            >
              {formatCurrency(financialSummary?.netProfit || 0, currency)}
            </Text>
          </View>
        </View>
      </View>

      {/* Sales Trend Chart */}
      <View style={[styles.chartCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, marginTop: 24 }]}>
        <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>
          Sales & Profit Trend
        </Text>
        {salesTrends.length > 0 ? (
          <LineChart
            data={{
              labels: salesTrends.map((t) => {
                const date = new Date(t.date);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }),
              datasets: [
                {
                  data: salesTrends.map((t) => t.sales || 0),
                  color: (opacity = 1) => theme.colors.primary,
                  strokeWidth: 2,
                },
                {
                  data: salesTrends.map((t) => t.profit || 0),
                  color: (opacity = 1) => theme.colors.success,
                  strokeWidth: 2,
                },
              ],
              legend: ['Sales', 'Profit'],
            }}
            width={screenWidth - 64}
            height={240}
            chartConfig={chartConfig}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        ) : (
          <View style={{ height: 240, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="trending-up-outline" size={48} color={theme.colors.textTertiary} />
            <Text style={{ color: theme.colors.textSecondary, marginTop: 12 }}>No trend data for this period</Text>
          </View>
        )}
      </View>

      {/* Top Products */}
      <View style={{ marginTop: 24 }}>
        <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>
          🏆 Top Selling Products
        </Text>
        {topProducts.length > 0 ? (
          topProducts.map((product, index) => (
            <PressableScale
              key={product.productId}
              style={[
                styles.listItem,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={[styles.rankBadge, { backgroundColor: theme.colors.primary }]}>
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>#{index + 1}</Text>
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
              <Text style={{ color: theme.colors.success, fontWeight: 'bold', fontSize: 16, fontVariant: ['tabular-nums'] }}>
                {formatCurrency(product.profit, currency)}
              </Text>
            </PressableScale>
          ))
        ) : (
          <View style={[styles.emptySection, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={{ color: theme.colors.textSecondary }}>No sales recorded yet</Text>
          </View>
        )}
      </View>

      {/* Top Customers */}
      <View style={{ marginTop: 24 }}>
        <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>
          ⭐ Top Customers
        </Text>
        {topCustomers.length > 0 ? (
          topCustomers.map((customer, index) => (
            <PressableScale
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
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>#{index + 1}</Text>
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
              <Text style={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: 16, fontVariant: ['tabular-nums'] }}>
                {formatCurrency(customer.totalPurchases, currency)}
              </Text>
            </PressableScale>
          ))
        ) : (
          <View style={[styles.emptySection, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={{ color: theme.colors.textSecondary }}>No customer data for this period</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  reportButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  greeting: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  header: { fontSize: 28, fontWeight: 'bold' },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  periodButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  card: {
    flex: 0.48,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardTitle: { fontSize: 13, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  cardValue: { fontSize: 20, fontWeight: 'bold' },
  cardSubtext: { fontSize: 11, marginTop: 4 },
  chartCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  emptySection: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  listItem: {
    padding: 16,
    borderRadius: 12,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});