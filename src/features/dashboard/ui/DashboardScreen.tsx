import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/shared/theme';
import { useCustomerStore } from '@/src/features/customers';
import { useProductStore } from '@/src/features/inventory';
import { useAppStore } from '@/src/features/settings';
import { useI18n } from '@/src/shared/i18n';
import { useBusinessStore } from '@/src/features/business';
import { analyticsRepository } from '@/src/features/analytics';
import { SalesTrend, Product, Sale } from '@/src/shared/types/shop.types';
import { formatCurrency } from '@/src/shared/utils/format';
import { ScreenHeader } from '@/src/shared/components';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { getTotalDues } = useCustomerStore();
  const { products } = useProductStore();
  const { currency } = useAppStore();
  const { activeBusinessId, activeBusiness } = useBusinessStore();
  const { t } = useI18n();

  const [todaysSales, setTodaysSales] = useState(0);
  const [todaysProfit, setTodaysProfit] = useState(0);
  const [totalDue, setTotalDue] = useState(0);
  const [salesTrends, setSalesTrends] = useState<SalesTrend[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);

  const loadDashboardData = useCallback(async () => {
    if (!activeBusinessId) return;

    try {
      // Get today's summary
      const todaySummary = await analyticsRepository.getTodaysSummary(activeBusinessId);
      setTodaysSales(todaySummary.totalSales);
      setTodaysProfit(todaySummary.totalProfit);

      // Get total dues
      const dues = await getTotalDues();
      setTotalDue(dues);

      // Get 7-day sales trends
      const trends = await analyticsRepository.getSalesTrends(activeBusinessId, 7);
      setSalesTrends(trends);

      // Get low stock products
      const lowStock = await analyticsRepository.getLowStockProducts(activeBusinessId);
      setLowStockProducts(lowStock.slice(0, 5) as Product[]); // Show top 5

      // Get recent sales
      const recent = await analyticsRepository.getRecentSales(activeBusinessId, 5);
      setRecentSales(recent);
    } catch (error) {
      console.error('[Dashboard] Failed to load data:', error);
    }
  }, [activeBusinessId, getTotalDues]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const totalProducts = products.reduce((sum, p) => sum + p.quantity, 0);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top + 16 }]}
      contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader 
        title={t('dashboard')} 
        subtitle="Overview"
        topTitle={activeBusiness?.name}
        icon='home' 
        // rightElement={
        //   <TouchableOpacity 
        //     style={[styles.settingsButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        //     onPress={() => router.push('/settings')}
        //   >
        //     <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
        //   </TouchableOpacity>
        // }
      />

      {/* Top Stats Row */}
      <View style={styles.statsContainer}>
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.textSecondary }]}>Sales Today</Text>
          <Text style={[styles.cardValue, { color: theme.colors.primary, fontVariant: ['tabular-nums'] }]}>
            {formatCurrency(todaysSales, currency)}
          </Text>
        </View>
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.textSecondary }]}>{t('profit')} Today</Text>
          <Text style={[styles.cardValue, { color: theme.colors.success, fontVariant: ['tabular-nums'] }]}>
            {formatCurrency(todaysProfit, currency)}
          </Text>
        </View>
      </View>

      {/* Second Stats Row */}
      <View style={[styles.statsContainer, { marginTop: 16 }]}>
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.textSecondary }]}>Total {t('due')}</Text>
          <Text style={[styles.cardValue, { color: theme.colors.error, fontVariant: ['tabular-nums'] }]}>
            {formatCurrency(totalDue, currency)}
          </Text>
        </View>
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.textSecondary }]}>{t('inventory')}</Text>
          <Text style={[styles.cardValue, { color: theme.colors.text }]}>{totalProducts}</Text>
        </View>
      </View>

      {/* Sales Trend Chart */}
      <View style={[styles.chartCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, marginTop: 24 }]}>
        <Text style={[styles.sectionHeader, { color: theme.colors.text, marginTop: 0, marginBottom: 16 }]}>
          7-Day Sales Trend
        </Text>
        {salesTrends.length > 0 ? (
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
            height={220}
            chartConfig={{
              backgroundColor: theme.colors.card,
              backgroundGradientFrom: theme.colors.card,
              backgroundGradientTo: theme.colors.card,
              decimalPlaces: 0,
              color: (opacity = 1) => theme.colors.primary,
              labelColor: (opacity = 1) => theme.colors.textSecondary,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: theme.colors.primary
              }
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16
            }}
          />
        ) : (
          <View style={{ height: 220, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="bar-chart-outline" size={48} color={theme.colors.textTertiary} />
            <Text style={{ color: theme.colors.textSecondary, marginTop: 12 }}>No sales data for this period</Text>
          </View>
        )}
      </View>

      {/* Recent Sales */}
      <View style={{ marginTop: 24 }}>
        <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>
          Recent Transactions
        </Text>
        {recentSales.length > 0 ? (
          recentSales.map((sale) => (
            <View
              key={sale.id}
              style={[styles.transactionItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: theme.colors.text, fontWeight: 'bold' }}>
                    {sale.customerName || 'Walking Customer'}
                  </Text>
                  <Text style={{ color: theme.colors.text, fontWeight: 'bold', fontVariant: ['tabular-nums'] }}>
                    {formatCurrency(sale.totalAmount, currency)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
                    {new Date(sale.date).toLocaleDateString()} • {sale.type}
                  </Text>
                  {sale.notes && (
                    <View style={styles.noteIndicator}>
                      <Ionicons name="document-text-outline" size={14} color={theme.colors.textTertiary} />
                      <Text style={{ color: theme.colors.textTertiary, fontSize: 11, marginLeft: 4 }} numberOfLines={1}>
                        {sale.notes}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={[styles.emptySection, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={{ color: theme.colors.textSecondary }}>No recent transactions</Text>
          </View>
        )}
      </View>

      {/* Low Stock Alert */}
      <View style={{ marginTop: 24 }}>
        <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>
          ⚠️ Low Stock Alert
        </Text>
        {lowStockProducts.length > 0 ? (
          lowStockProducts.map((product) => (
            <View
              key={product.id}
              style={[styles.alertItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.error }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.text, fontWeight: 'bold' }}>
                  {product.name}
                </Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
                  Only {product.quantity} left (threshold: {product.lowStockLevel || 5})
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: theme.colors.errorLight }]}>
                <Text style={{ color: theme.colors.error, fontSize: 12, fontWeight: 'bold' }}>
                  {product.quantity}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={[styles.emptySection, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={{ color: theme.colors.success }}>All products are in good stock</Text>
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
  greeting: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  header: { fontSize: 28, fontWeight: 'bold' },
  settingsButton: {
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
  avatarText: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  card: {
    flex: 0.48,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardTitle: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  cardValue: { fontSize: 20, fontWeight: 'bold' },
  chartCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
  transactionItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  noteIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0.7,
    justifyContent: 'flex-end',
  },
  alertItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 36,
    alignItems: 'center',
  },
});
