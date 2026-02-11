import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useTheme } from '@/src/shared/theme';
import { useCustomerStore, useSalesStore, usePaymentStore, useAppStore } from '@/src/store';
import { formatCurrency } from '@/src/shared/utils/format';
import { SearchBar } from '@/src/shared/components';

export default function CustomerDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const { customers, updateDue } = useCustomerStore();
  const { sales } = useSalesStore();
  const { payments, addPayment } = usePaymentStore();
  const { currency } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const customer = customers.find(c => c.id === id);

  const transactions = useMemo(() => {
    const customerSales = sales
      .filter(s => s.customerId === id)
      .map(s => ({ ...s, transactionType: 'SALE' }));

    const customerPayments = payments
      .filter(p => p.customerId === id)
      .map(p => ({
        id: p.id,
        date: p.paymentDate,
        totalAmount: p.amount,
        type: 'PAYMENT',
        transactionType: 'PAYMENT',
        paymentMethod: p.paymentMethod,
        notes: p.notes,
        items: []
      }));

    return [...customerSales, ...customerPayments]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, payments, id]);

  if (!customer) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.colors.text }}>Customer not found</Text>
      </View>
    );
  }

  const handlePayDue = () => {
    setPaymentAmount('');
    setPaymentNotes('');
    setPaymentModalVisible(true);
  };

  const submitPayment = async () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    try {
      // 1. Record the payment
      await addPayment({
        customerId: customer.id,
        amount: amount,
        paymentDate: new Date().toISOString(),
        paymentMethod: 'CASH',
        notes: paymentNotes || 'Due Payment'
      });

      // 2. Update the customer due
      await updateDue(customer.id, -amount);

      setPaymentModalVisible(false);
      Alert.alert("Success", `Payment of ${formatCurrency(amount, currency)} recorded successfully`);
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert("Error", "Failed to process payment");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ title: customer.name }} />
      
      <View style={[styles.headerCard, { backgroundColor: theme.colors.card }]}>
        <View>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Total Due</Text>
            <Text style={[styles.amount, { color: customer.totalDue > 0 ? 'red' : 'green' }]}>
                {formatCurrency(customer.totalDue, currency)}
            </Text>
        </View>
        <TouchableOpacity 
            style={[styles.payButton, { backgroundColor: theme.colors.primary, opacity: customer.totalDue > 0 ? 1 : 0.5 }]}
            onPress={handlePayDue}
            disabled={customer.totalDue <= 0}
        >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Pay Due</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.infoSection, { backgroundColor: theme.colors.card }]}>
          <Text style={{ color: theme.colors.text }}>Phone: {customer.phone || 'N/A'}</Text>
          <Text style={{ color: theme.colors.text }}>Address: {customer.address || 'N/A'}</Text>
          <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>Total Purchases: {formatCurrency(customer.totalPurchases || 0, currency)}</Text>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>Orders: {customer.purchaseCount || 0}</Text>
          </View>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Transaction History</Text>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search transactions..."
        onClear={() => setSearchQuery('')}
      />

      <FlatList
        data={transactions.filter(t => 
          (t.notes && t.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (t.transactionType.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (new Date(t.date).toLocaleDateString().includes(searchQuery))
        )}
        keyExtractor={item => item.id}
        renderItem={({ item }: { item: any }) => (
            <View style={[styles.saleItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <View>
                    <Text style={{ color: theme.colors.text, fontWeight: 'bold' }}>
                        {new Date(item.date).toLocaleDateString()}
                    </Text>
                    <Text style={{ color: theme.colors.textSecondary }}>
                        {item.transactionType === 'SALE' ? `${item.items.length} items` : `Payment (${item.paymentMethod})`}
                    </Text>
                    {item.notes && <Text style={{ color: theme.colors.textSecondary, fontSize: 11 }}>{item.notes}</Text>}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: item.transactionType === 'SALE' ? theme.colors.text : '#10B981', fontWeight: 'bold' }}>
                        {item.transactionType === 'SALE' ? '' : '+ '}{formatCurrency(item.totalAmount, currency)}
                    </Text>
                    <Text style={{ color: item.type === 'DUE' ? 'red' : '#10B981', fontSize: 12 }}>
                        {item.type}
                    </Text>
                </View>
            </View>
        )}
        ListEmptyComponent={<Text style={{ color: theme.colors.textSecondary, textAlign: 'center', marginTop: 20 }}>No transactions found.</Text>}
      />

      {/* Payment Modal */}
      <Modal visible={paymentModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Record Payment</Text>
            
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Amount</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="0.00"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              autoFocus
            />

            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Notes</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="e.g. Cash payment"
              placeholderTextColor={theme.colors.textSecondary}
              value={paymentNotes}
              onChangeText={setPaymentNotes}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)} style={styles.button}>
                <Text style={{ color: theme.colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitPayment} style={[styles.button, { backgroundColor: theme.colors.primary }]}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { padding: 20, borderRadius: 12 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  button: { padding: 10, marginLeft: 10, borderRadius: 6 },
});