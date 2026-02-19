import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/shared/theme';
import { useAppStore } from '@/src/features/settings';
import { useBusinessStore } from '@/src/features/business';
import { analyticsRepository } from '../api/analytics.repository';
import { formatCurrency } from '@/src/shared/utils/format';
import { ScreenHeader, Button, GlassCard } from '@/src/shared/components';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function ReportsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currency } = useAppStore();
  const { activeBusinessId, activeBusiness } = useBusinessStore();

  const [loading, setLoading] = useState(false);
  const [selectedRange, setSelectedRange] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Report Options State
  const [options, setOptions] = useState({
    includeSales: true,
    includeProfit: true,
    includeExpenses: true,
    includeNetProfit: true,
    includeDueDetails: true,
    includeTopProducts: true,
    includeTopCustomers: true,
  });

  const activeOptionsCount = useMemo(() => 
    Object.values(options).filter(Boolean).length, 
  [options]);

  const toggleOption = (key: keyof typeof options) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const generatePDF = async () => {
    if (!activeBusinessId || !activeBusiness) return;
    if (activeOptionsCount === 0) {
      Alert.alert("Selection Required", "Please select at least one section to include in the report.");
      return;
    }

    setLoading(true);
    try {
      // 1. Gather Data
      let reportStartDate = new Date();
      let reportEndDate = new Date();

      if (selectedRange === 'custom') {
        reportStartDate = new Date(startDate);
        reportStartDate.setHours(0, 0, 0, 0);
        reportEndDate = new Date(endDate);
        reportEndDate.setHours(23, 59, 59, 999);
      } else {
        const days = selectedRange === '7d' ? 7 : selectedRange === '30d' ? 30 : 90;
        reportStartDate.setDate(reportStartDate.getDate() - days);
        reportStartDate.setHours(0, 0, 0, 0);
        reportEndDate.setHours(23, 59, 59, 999);
      }

      const [summary, topProducts, topCustomers] = await Promise.all([
        analyticsRepository.getFinancialSummary(activeBusinessId, reportStartDate.toISOString(), reportEndDate.toISOString()),
        analyticsRepository.getTopProducts(activeBusinessId, 10),
        analyticsRepository.getTopCustomers(activeBusinessId, 10),
      ]);

      let totalDues = 0;
      if (options.includeDueDetails) {
        const { customerRepository } = await import('@/src/features/customers');
        totalDues = await customerRepository.getTotalDues(activeBusinessId);
      }

      // 2. Prepare HTML Template
      const formattedSales = formatCurrency(summary.totalSales, currency);
      const formattedProfit = formatCurrency(summary.totalProfit, currency);
      const formattedExpenses = formatCurrency(summary.totalExpenses, currency);
      const formattedNet = formatCurrency(summary.netProfit, currency);
      const formattedDues = formatCurrency(totalDues, currency);

      const productsHtml = options.includeTopProducts ? `
        <h2 class="section-title">Top Selling Products</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Product Name</th>
              <th>Units Sold</th>
              <th>Revenue</th>
              <th>Profit</th>
            </tr>
          </thead>
          <tbody>
            ${topProducts.map((p, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${p.productName}</td>
                <td>${p.totalSold}</td>
                <td>${formatCurrency(p.revenue, currency)}</td>
                <td style="color: #10B981;">${formatCurrency(p.profit, currency)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '';

      const customersHtml = options.includeTopCustomers ? `
        <h2 class="section-title">Top Customers</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Customer Name</th>
              <th>Orders</th>
              <th>Total Spent</th>
            </tr>
          </thead>
          <tbody>
            ${topCustomers.map((c, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${c.customerName}</td>
                <td>${c.purchaseCount}</td>
                <td>${formatCurrency(c.totalPurchases, currency)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '';

      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; }
              .header { border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
              .business-name { font-size: 28px; font-weight: bold; color: #4f46e5; margin: 0; }
              .report-title { font-size: 18px; color: #64748b; margin: 5px 0 0 0; }
              .date-range { font-size: 14px; color: #94a3b8; }
              
              .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 40px; }
              .summary-card { padding: 20px; border-radius: 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; }
              .card-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
              .card-value { font-size: 22px; font-weight: bold; }
              
              .section-title { font-size: 20px; font-weight: bold; margin-bottom: 15px; padding-left: 10px; border-left: 4px solid #4f46e5; margin-top: 30px; }
              
              table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
              th { text-align: left; padding: 12px; background-color: #f1f5f9; color: #475569; font-size: 13px; }
              td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
              
              .footer { margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #94a3b8; font-size: 12px; }
              .software-credit { font-weight: bold; color: #4f46e5; }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <h1 class="business-name">${activeBusiness.name}</h1>
                <p class="report-title">Business Summary Report</p>
              </div>
              <div class="date-range">
                Period: ${reportStartDate.toLocaleDateString()} - ${reportEndDate.toLocaleDateString()}
              </div>
            </div>

            <div class="summary-grid">
              ${options.includeSales ? `
                <div class="summary-card">
                  <div class="card-label">Total Sales</div>
                  <div class="card-value">${formattedSales}</div>
                  <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">${summary.salesCount} Transactions</div>
                </div>
              ` : ''}
              ${options.includeProfit ? `
                <div class="summary-card">
                  <div class="card-label">Gross Profit</div>
                  <div class="card-value" style="color: #10B981;">${formattedProfit}</div>
                </div>
              ` : ''}
              ${options.includeExpenses ? `
                <div class="summary-card">
                  <div class="card-label">Total Expenses</div>
                  <div class="card-value" style="color: #ef4444;">${formattedExpenses}</div>
                </div>
              ` : ''}
              ${options.includeNetProfit ? `
                <div class="summary-card" style="background-color: #eef2ff;">
                  <div class="card-label">Net Profit</div>
                  <div class="card-value" style="color: #4f46e5;">${formattedNet}</div>
                </div>
              ` : ''}
              ${options.includeDueDetails ? `
                <div class="summary-card">
                  <div class="card-label">Total Outstanding Dues</div>
                  <div class="card-value" style="color: #ef4444;">${formattedDues}</div>
                </div>
              ` : ''}
            </div>

            ${productsHtml}
            ${customersHtml}

            <div class="footer">
              <p>This report was generated automatically by <span class="software-credit">Ad-Daftar</span></p>
              <p>Professional Shop Management Software | ${new Date().toLocaleString()}</p>
            </div>
          </body>
        </html>
      `;

      // 3. Generate and Share
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      
    } catch (error) {
      console.error('[Reports] Failed to generate PDF:', error);
      Alert.alert('Error', 'Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const RangeChip = ({ id, label }: { id: typeof selectedRange, label: string }) => (
    <TouchableOpacity
      style={[
        styles.rangeChip,
        selectedRange === id ? { backgroundColor: theme.colors.primary } : { backgroundColor: theme.colors.card, borderColor: theme.colors.border, borderWidth: 1 }
      ]}
      onPress={() => setSelectedRange(id)}
    >
      <Text style={{ color: selectedRange === id ? 'white' : theme.colors.text, fontWeight: 'bold' }}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const SelectionCard = ({ 
    label, 
    value, 
    onToggle, 
    icon 
  }: { 
    label: string, 
    value: boolean, 
    onToggle: () => void,
    icon: string
  }) => (
    <TouchableOpacity 
      style={[
        styles.selectionCard, 
        { backgroundColor: theme.colors.card, borderColor: value ? theme.colors.primary : theme.colors.border }
      ]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <View style={[styles.optionIconBox, { backgroundColor: value ? theme.colors.primary + '15' : theme.colors.backgroundSecondary }]}>
          <Ionicons name={icon as any} size={18} color={value ? theme.colors.primary : theme.colors.textSecondary} />
        </View>
        <Text style={[styles.optionLabel, { color: theme.colors.text }]}>{label}</Text>
      </View>
      <View style={[styles.checkbox, { borderColor: value ? theme.colors.primary : theme.colors.textTertiary, backgroundColor: value ? theme.colors.primary : 'transparent' }]}>
        {value && <Ionicons name="checkmark" size={14} color="white" />}
      </View>
    </TouchableOpacity>
  );

  const onStartChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const onEndChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top + 16 }]}>
      <ScreenHeader 
        title="Business Reports" 
        subtitle="PDF Generation" 
        topTitle={activeBusiness?.name}
        rightElement={
          <TouchableOpacity 
            style={[styles.closeButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={{ paddingVertical: 16 }} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Select Time Period</Text>
          <View style={[styles.badge, { backgroundColor: theme.colors.primary + '15' }]}>
            <Text style={{ color: theme.colors.primary, fontSize: 10, fontWeight: 'bold' }}>{selectedRange.toUpperCase()}</Text>
          </View>
        </View>
        
        <View style={styles.rangeContainer}>
          <RangeChip id="7d" label="7 Days" />
          <RangeChip id="30d" label="30 Days" />
          <RangeChip id="90d" label="90 Days" />
          <RangeChip id="custom" label="Custom" />
        </View>

        {selectedRange === 'custom' && (
          <View style={styles.customDateContainer}>
            <TouchableOpacity 
              style={[styles.datePickerButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
              onPress={() => setShowStartPicker(true)}
            >
              <Text style={{ color: theme.colors.textTertiary, fontSize: 10, fontWeight: 'bold' }}>START DATE</Text>
              <Text style={{ color: theme.colors.text, fontWeight: 'bold', fontSize: 15 }}>{startDate.toLocaleDateString()}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.datePickerButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
              onPress={() => setShowEndPicker(true)}
            >
              <Text style={{ color: theme.colors.textTertiary, fontSize: 10, fontWeight: 'bold' }}>END DATE</Text>
              <Text style={{ color: theme.colors.text, fontWeight: 'bold', fontSize: 15 }}>{endDate.toLocaleDateString()}</Text>
            </TouchableOpacity>

            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onStartChange}
                maximumDate={endDate}
              />
            )}

            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onEndChange}
                minimumDate={startDate}
                maximumDate={new Date()}
              />
            )}
          </View>
        )}

        <View style={styles.optionsHeader}>
          <Text style={[styles.label, { color: theme.colors.textSecondary, marginBottom: 0 }]}>Report Content</Text>
          <TouchableOpacity 
            style={styles.selectBtn}
            onPress={() => {
              const allOn = Object.values(options).every(v => v);
              setOptions({
                includeSales: !allOn,
                includeProfit: !allOn,
                includeExpenses: !allOn,
                includeNetProfit: !allOn,
                includeDueDetails: !allOn,
                includeTopProducts: !allOn,
                includeTopCustomers: !allOn,
              });
            }}
          >
            <Ionicons 
              name={Object.values(options).every(v => v) ? "checkbox" : "square-outline"} 
              size={16} 
              color={theme.colors.primary} 
            />
            <Text style={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: 12, marginLeft: 6 }}>
              {Object.values(options).every(v => v) ? 'DESELECT ALL' : 'SELECT ALL'}
            </Text>
          </TouchableOpacity>
        </View>

        <GlassCard style={styles.optionsGridContainer}>
          <View style={styles.optionsGrid}>
            <View style={styles.optionGroup}>
              <Text style={styles.groupLabel}>Financial Summary</Text>
              <SelectionCard 
                label="Total Sales" 
                icon="cart-outline"
                value={options.includeSales} 
                onToggle={() => toggleOption('includeSales')} 
              />
              <SelectionCard 
                label="Gross Profit" 
                icon="trending-up-outline"
                value={options.includeProfit} 
                onToggle={() => toggleOption('includeProfit')} 
              />
              <SelectionCard 
                label="Total Expenses" 
                icon="receipt-outline"
                value={options.includeExpenses} 
                onToggle={() => toggleOption('includeExpenses')} 
              />
              <SelectionCard 
                label="Net Profit" 
                icon="wallet-outline"
                value={options.includeNetProfit} 
                onToggle={() => toggleOption('includeNetProfit')} 
              />
            </View>

            <View style={[styles.optionGroup, { marginTop: 16 }]}>
              <Text style={styles.groupLabel}>Details & Ranking</Text>
              <SelectionCard 
                label="Outstanding Dues" 
                icon="alert-circle-outline"
                value={options.includeDueDetails} 
                onToggle={() => toggleOption('includeDueDetails')} 
              />
              <SelectionCard 
                label="Top 10 Products" 
                icon="cube-outline"
                value={options.includeTopProducts} 
                onToggle={() => toggleOption('includeTopProducts')} 
              />
              <SelectionCard 
                label="Top 10 Customers" 
                icon="people-outline"
                value={options.includeTopCustomers} 
                onToggle={() => toggleOption('includeTopCustomers')} 
              />
            </View>
          </View>
        </GlassCard>

        <View style={styles.footerActions}>
          <GlassCard intensity="subtle" style={styles.summaryInfo}>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
              Selected Sections: <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>{activeOptionsCount}</Text>
            </Text>
          </GlassCard>
          
          <Button
            title={loading ? "Generating Report..." : "Generate PDF Report"}
            onPress={generatePDF}
            disabled={loading || activeOptionsCount === 0}
            variant="primary"
            size="lg"
            fullWidth
            leftIcon={loading ? <ActivityIndicator color="white" /> : <Ionicons name="document-text" size={24} color="white" />}
            style={{ marginTop: 12 }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rangeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  rangeChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  customDateContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  datePickerButton: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  optionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  optionsGridContainer: {
    padding: 16,
    marginBottom: 20,
  },
  optionsGrid: {
    gap: 4,
  },
  optionGroup: {
    gap: 8,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  selectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  optionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerActions: {
    marginTop: 10,
    marginBottom: 40,
  },
  summaryInfo: {
    padding: 12,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
});
