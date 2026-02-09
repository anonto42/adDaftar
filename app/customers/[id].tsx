import React, { useMemo } from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useTheme } from '@/src/shared/theme';
import { useCustomerStore } from '@/src/store/customer.store';
import { useSalesStore } from '@/src/store/sales.store';

export default function CustomerDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const { customers, updateDue } = useCustomerStore();
  const { sales } = useSalesStore();

  const customer = customers.find(c => c.id === id);

  const customerSales = useMemo(() => {
    return sales
        .filter(s => s.customerId === id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, id]);

  if (!customer) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.colors.text }}>Customer not found</Text>
      </View>
    );
  }

  const handlePayDue = () => {
      Alert.prompt(
          "Pay Due",
          `Current Due: $${customer.totalDue}`,
          [
              {
                  text: "Cancel",
                  style: "cancel"
              },
              {
                  text: "Pay",
                  onPress: (amount?: string) => {
                      const val = parseFloat(amount || '0');
                      if (val > 0) {
                          updateDue(customer.id, -val);
                          Alert.alert("Success", `Paid $${val}`);
                      }
                  }
              }
          ],
          "plain-text",
          ""
      );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ title: customer.name }} />
      
      <View style={[styles.headerCard, { backgroundColor: theme.colors.card }]}>
        <View>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Total Due</Text>
            <Text style={[styles.amount, { color: customer.totalDue > 0 ? 'red' : 'green' }]}>
                ${customer.totalDue}
            </Text>
        </View>
        <TouchableOpacity 
            style={[styles.payButton, { backgroundColor: theme.colors.primary }]}
            onPress={handlePayDue}
        >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Pay Due</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.infoSection, { backgroundColor: theme.colors.card }]}>
          <Text style={{ color: theme.colors.text }}>Phone: {customer.phone || 'N/A'}</Text>
          <Text style={{ color: theme.colors.text }}>Address: {customer.address || 'N/A'}</Text>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Transaction History</Text>

      <FlatList
        data={customerSales}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
            <View style={[styles.saleItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <View>
                    <Text style={{ color: theme.colors.text, fontWeight: 'bold' }}>
                        {new Date(item.date).toLocaleDateString()}
                    </Text>
                    <Text style={{ color: theme.colors.textSecondary }}>
                        {item.items.length} items
                    </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: theme.colors.text, fontWeight: 'bold' }}>${item.totalAmount}</Text>
                    <Text style={{ color: item.type === 'DUE' ? 'red' : 'green', fontSize: 12 }}>{item.type}</Text>
                </View>
            </View>
        )}
        ListEmptyComponent={<Text style={{ color: theme.colors.textSecondary, textAlign: 'center', marginTop: 20 }}>No transactions found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  headerCard: { padding: 20, borderRadius: 12, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 14 },
  amount: { fontSize: 24, fontWeight: 'bold' },
  payButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  infoSection: { padding: 16, borderRadius: 12, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  saleItem: { padding: 16, borderRadius: 8, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1 },
});
