import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/shared/theme';
import { useSalesStore } from '../model/sales.store';
import { useProductStore, useCategoryStore } from '@/src/features/inventory';
import { useAppStore } from '@/src/features/settings';
import { useBusinessStore } from '@/src/features/business';
import { formatCurrency } from '@/src/shared/utils/format';
import { SearchBar, ScreenHeader, EmptyState } from '@/src/shared/components';
import { Stack, useRouter } from 'expo-router';

export default function SalesHistoryScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { sales, hydrate } = useSalesStore();
  const { products } = useProductStore();
  const { categories } = useCategoryStore();
  const { currency } = useAppStore();
  const { activeBusiness } = useBusinessStore();

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
        topTitle={activeBusiness?.name}
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
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.saleAmount, { color: theme.colors.text, fontVariant: ['tabular-nums'] }]}>
                  {formatCurrency(item.totalAmount, currency)}
                </Text>
                {item.type === 'DUE' && (
                  <Text style={{ color: theme.colors.error, fontSize: 11, fontWeight: '600' }}>
                    Due: {formatCurrency(item.totalAmount - (item.receivedAmount || 0), currency)}
                  </Text>
                )}
              </View>
            </View>
            
            {item.notes && (
              <View style={styles.middleNoteContainer}>
                <Ionicons name="document-text-outline" size={16} color={theme.colors.textTertiary} />
                <Text style={[styles.noteText, { color: theme.colors.textSecondary }]}>
                  {item.notes}
                </Text>
              </View>
            )}

            <View style={styles.itemsList}>
              {item.items.map((saleItem: any, index: number) => {
                const product = products.find(p => p.id === saleItem.productId);
                const category = product ? categories.find(c => c.id === product.categoryId) : null;
                
                return (
                  <View key={`${item.id}-item-${index}`} style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemName, { color: theme.colors.text }]} numberOfLines={1}>
                        {saleItem.productName}
                      </Text>
                      {category && (
                        <Text style={[styles.itemCategory, { color: theme.colors.primary }]}>
                          {category.name}
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.itemQty, { color: theme.colors.textSecondary }]}>
                      {saleItem.quantity} x {formatCurrency(saleItem.unitPrice, currency)}
                    </Text>
                  </View>
                );
              })}
            </View>
            
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            
            <View style={styles.saleDetails}>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
                {item.items.length} items • Paid: {formatCurrency(item.receivedAmount || 0, currency)}
              </Text>
              <Text style={{ color: theme.colors.textTertiary, fontSize: 11 }}>
                via {item.paymentMethod}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState 
            icon="receipt-outline" 
            title="No sales records found" 
            description={searchQuery ? "No sales match your search criteria." : "Start making sales in the POS screen to see them here."}
            style={{ marginTop: 40 }}
          />
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
  itemsList: { 
    marginTop: 12, 
  },
  itemRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: { fontSize: 13, fontWeight: '600' },
  itemCategory: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.7 },
  itemQty: { fontSize: 11, fontVariant: ['tabular-nums'] },
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
