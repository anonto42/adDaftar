import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, Modal, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/shared/theme';
import { useCustomerStore } from '../model/customer.store';
import { usePaymentStore } from '../model/payment.store';
import { useAppStore } from '@/src/features/settings';
import { useBusinessStore } from '@/src/features/business';
import { Customer } from '@/src/shared/types/shop.types';
import { formatCurrency } from '@/src/shared/utils/format';
import { PressableScale, SearchBar, ScreenHeader, EmptyState } from '@/src/shared/components';

export default function CustomersScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { customers, addCustomer, updateCustomer, updateDue, deleteCustomer } = useCustomerStore();
  const { addPayment } = usePaymentStore();
  const { currency } = useAppStore();
  const { activeBusiness } = useBusinessStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [payingCustomer, setPayingCustomer] = useState<Customer | null>(null);

  // Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');

  const handleDeleteCustomer = (customer: Customer) => {
    const hasDue = customer.totalDue > 0;
    const message = hasDue 
      ? `This customer has an outstanding due of ${formatCurrency(customer.totalDue, currency)}. Deleting them will remove this amount from all calculations and reports. Are you sure?`
      : `Are you sure you want to delete ${customer.name}? This action cannot be undone.`;

    Alert.alert(
      'Confirm Delete',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCustomer(customer.id);
              Alert.alert('Success', 'Customer deleted successfully');
            } catch (error) {
              console.log(error)
              Alert.alert('Error', 'Failed to delete customer');
            }
          }
        },
      ]
    );
  };

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setName(customer.name);
      setPhone(customer.phone || '');
      setAddress(customer.address || '');
    } else {
      setEditingCustomer(null);
      setName('');
      setPhone('');
      setAddress('');
    }
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!name) return;

    const customerData = { name, phone, address };

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, customerData);
    } else {
      addCustomer(customerData);
    }
    setModalVisible(false);
  };

  const handleOpenPaymentModal = (customer: Customer) => {
    setPayingCustomer(customer);
    setPaymentAmount('');
    setPaymentModalVisible(true);
  };

  const handlePayment = async () => {
    if (!payingCustomer || !paymentAmount) {
      Alert.alert('Error', 'Please enter a payment amount');
      return;
    }

    const amount = parseFloat(paymentAmount);

    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (amount > payingCustomer.totalDue) {
      Alert.alert('Error', `Payment amount cannot exceed due amount of $${payingCustomer.totalDue.toFixed(2)}`);
      return;
    }

    try {
      // 1. Record the payment in history
      await addPayment({
        customerId: payingCustomer.id,
        amount: amount,
        paymentDate: new Date().toISOString(),
        paymentMethod: 'CASH',
        notes: 'Due Payment'
      });

      // 2. Update the customer due amount
      await updateDue(payingCustomer.id, -amount);
      
      Alert.alert('Success', `Payment of $${amount.toFixed(2)} recorded successfully`);
      setPaymentModalVisible(false);
      setPayingCustomer(null);
      setPaymentAmount('');
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Failed to process payment');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: Math.max(insets.top, 20) + 16 }]}>
      <ScreenHeader 
        title="Customers" 
        subtitle="Relationship" 
        topTitle={activeBusiness?.name}
        icon="people" 
      />

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search by name or phone..."
        onClear={() => setSearchQuery('')}
      />

      <FlatList
        data={customers.filter(c => 
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          (c.phone && c.phone.includes(searchQuery))
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <PressableScale 
            style={[styles.item, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={() => router.push(`/customers/${item.id}`)}
          >
            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, { color: theme.colors.text }]}>{item.name}</Text>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 13, marginBottom: 4 }}>{item.phone || 'No phone'}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>Due: </Text>
                <Text style={{ color: item.totalDue > 0 ? theme.colors.error : theme.colors.success, fontWeight: 'bold', fontVariant: ['tabular-nums'] }}>
                  {formatCurrency(item.totalDue, currency)}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {item.totalDue > 0 && (
                <TouchableOpacity
                  onPress={() => handleOpenPaymentModal(item)}
                  style={[styles.payButton, { backgroundColor: theme.colors.success }]}
                >
                  <Ionicons name="cash" size={16} color="white" />
                  <Text style={{ color: 'white', marginLeft: 4, fontSize: 12, fontWeight: 'bold' }}>
                    Pay
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => handleOpenModal(item)} style={styles.actionButton}>
                <Ionicons name="pencil" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteCustomer(item)} style={[styles.actionButton, { backgroundColor: theme.colors.error + '10' }]}>
                <Ionicons name="trash" size={20} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
                      </PressableScale>
                  )}
                  ListEmptyComponent={
                    <EmptyState
                      icon="people-outline"
                      title="No customers yet"
                      description={searchQuery ? "No customers found matching your search." : "Keep track of customer dues and purchase history by adding them here."}
                      actionLabel={!searchQuery ? "Add Customer" : undefined}
                      onAction={!searchQuery ? () => handleOpenModal() : undefined}
                      style={{ marginTop: 40 }}
                    />
                  }
                />
      <PressableScale
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => handleOpenModal()}
      >
        <Ionicons name="add" size={30} color="white" />
      </PressableScale>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {editingCustomer ? 'Edit Customer' : 'Add Customer'}
            </Text>

            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="Name"
              placeholderTextColor={theme.colors.textSecondary}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="Phone"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
             <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="Address"
              placeholderTextColor={theme.colors.textSecondary}
              value={address}
              onChangeText={setAddress}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.button}>
                <Text style={{ color: theme.colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={[styles.button, { backgroundColor: theme.colors.primary }]}>
                <Text style={{ color: 'white' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal visible={paymentModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Payment for {payingCustomer?.name}
            </Text>

            <View style={[styles.dueInfo, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
                Current Due Amount:
              </Text>
              <Text style={{ color: theme.colors.error, fontWeight: 'bold', fontSize: 24 }}>
                {formatCurrency(payingCustomer?.totalDue || 0, currency)}
              </Text>
            </View>

            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              Payment Amount
            </Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="0.00"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
            />

            {paymentAmount && parseFloat(paymentAmount) > 0 && (
              <View style={[styles.dueInfo, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
                  Remaining Due:
                </Text>
                <Text style={{ color: theme.colors.success, fontWeight: 'bold', fontSize: 18 }}>
                  {formatCurrency(Math.max(0, (payingCustomer?.totalDue || 0) - parseFloat(paymentAmount)), currency)}
                </Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setPaymentModalVisible(false);
                  setPayingCustomer(null);
                  setPaymentAmount('');
                }}
                style={styles.button}
              >
                <Text style={{ color: theme.colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePayment}
                style={[styles.button, { backgroundColor: theme.colors.success }]}
              >
                <Text style={{ color: 'white' }}>Record Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  item: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
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
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.02)',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    padding: 20,
  },
  modalContent: { padding: 24, borderRadius: 20, elevation: 5 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12, fontSize: 15 },
  dueInfo: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  button: { paddingVertical: 12, paddingHorizontal: 20, marginLeft: 12, borderRadius: 10 },
});