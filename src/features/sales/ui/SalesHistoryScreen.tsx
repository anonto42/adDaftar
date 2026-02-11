import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/shared/theme';
import { useSalesStore } from '../model/sales.store';
import { useAppStore } from '@/src/features/settings';
import { formatCurrency } from '@/src/shared/utils/format';
import { SearchBar, ScreenHeader } from '@/src/shared/components';
import { Stack, useRouter } from 'expo-router';

export default function SalesHistoryScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { sales, hydrate } = useSalesStore();
  const { currency } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const filteredSales = useMemo(() => {
    return sales.filter(sale => 
      sale.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sale.notes && sale.notes.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [sales, searchQuery]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: Math.max(insets.top, 20) + 16 }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader 
        title="Sales History" 
        subtitle="Past Transactions" 
        icon="list"
        rightElement={
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        }
      />

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search by customer, ID or notes..."
        onClear={() => setSearchQuery('')}
      />

      <FlatList
        data={filteredSales}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.saleItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.saleHeader}>
              <View>
                <Text style={[styles.customerName, { color: theme.colors.text }]}>
                  {item.customerName || 'Walking Customer'}
                </Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
                  {new Date(item.date).toLocaleString()} • {item.type}
                </Text>
              </View>
              <Text style={[styles.saleAmount, { color: theme.colors.text, fontVariant: ['tabular-nums'] }]}>
                {formatCurrency(item.totalAmount, currency)}
              </Text>
            </View>
            
            {item.notes && (
              <View style={styles.middleNoteContainer}>
                <Ionicons name="document-text-outline" size={16} color={theme.colors.textTertiary} />
                <Text style={[styles.noteText, { color: theme.colors.textSecondary }]}>
                  {item.notes}
                </Text>
              </View>
            )}
            
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            
            <View style={styles.saleDetails}>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
                {item.items.length} items • Paid via {item.paymentMethod}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={theme.colors.textTertiary} />
            <Text style={{ color: theme.colors.textTertiary, fontSize: 16, marginTop: 16 }}>
              No sales records found
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saleItem: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  saleAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  middleNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  noteText: {
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
    fontStyle: 'italic',
  },
  saleDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
});
