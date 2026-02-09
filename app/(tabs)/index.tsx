import React from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { useTheme } from '@/src/shared/theme';
import { useSalesStore } from '@/src/store/sales.store';
import { useCustomerStore } from '@/src/store/customer.store';
import { useProductStore } from '@/src/store/product.store';

export default function DashboardScreen() {
  const { theme } = useTheme();
  const { sales } = useSalesStore();
  const { customers } = useCustomerStore();
  const { products } = useProductStore();

  const totalSalesToday = sales
    .filter(s => new Date(s.date).toDateString() === new Date().toDateString())
    .reduce((sum, s) => sum + s.totalAmount, 0);

  const totalDue = customers.reduce((sum, c) => sum + c.totalDue, 0);
  const totalProducts = products.reduce((sum, p) => sum + p.quantity, 0);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.header, { color: theme.colors.text }]}>Dashboard</Text>

      <View style={styles.statsContainer}>
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.textSecondary }]}>Sales Today</Text>
          <Text style={[styles.cardValue, { color: theme.colors.primary }]}>${totalSalesToday.toFixed(2)}</Text>
        </View>
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.textSecondary }]}>Total Due</Text>
          <Text style={[styles.cardValue, { color: 'red' }]}>${totalDue.toFixed(2)}</Text>
        </View>
      </View>

        <View style={[styles.card, { backgroundColor: theme.colors.card, marginTop: 10 }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.textSecondary }]}>Inventory Count</Text>
          <Text style={[styles.cardValue, { color: theme.colors.text }]}>{totalProducts} items</Text>
        </View>

      <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>Recent Transactions</Text>
      
      {sales.slice(0, 5).map((sale) => (
        <View key={sale.id} style={[styles.transactionItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View>
             <Text style={{ color: theme.colors.text, fontWeight: 'bold' }}>
                {sale.type === 'DUE' ? `Due: ${sale.customerName}` : 'Cash Sale'}
             </Text>
             <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
                {new Date(sale.date).toLocaleDateString()} {new Date(sale.date).toLocaleTimeString()}
             </Text>
          </View>
          <Text style={{ color: theme.colors.text, fontWeight: 'bold' }}>${sale.totalAmount}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 60 },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  card: { flex: 0.48, padding: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 14, marginBottom: 8 },
  cardValue: { fontSize: 24, fontWeight: 'bold' },
  sectionHeader: { fontSize: 20, fontWeight: 'bold', marginTop: 24, marginBottom: 12 },
  transactionItem: { padding: 16, borderRadius: 8, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1 },
});
