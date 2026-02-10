import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, Modal, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/shared/theme';
import { useCustomerStore } from '@/src/store/customer.store';
import { usePaymentStore } from '@/src/store/payment.store';
import { Customer } from '@/src/shared/types/shop.types';

export default function CustomersScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { customers, addCustomer, updateCustomer, updateDue } = useCustomerStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [payingCustomer, setPayingCustomer] = useState<Customer | null>(null);

  const { addPayment } = usePaymentStore();
  // Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');

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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={customers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 60 + insets.bottom }}
        renderItem={({ item }) => (
          <View style={[styles.item, { backgroundColor: theme.colors.card }]}>
            <TouchableOpacity onPress={() => router.push(`/customers/${item.id}`)} style={{ flex: 1 }}>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: theme.colors.text }]}>{item.name}</Text>
                <Text style={{ color: theme.colors.textSecondary }}>{item.phone}</Text>
                <Text style={{ color: item.totalDue > 0 ? 'red' : 'green', fontWeight: 'bold' }}>
                  Due: ${item.totalDue.toFixed(2)}
                </Text>
              </View>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {item.totalDue > 0 && (
                <TouchableOpacity
                  onPress={() => handleOpenPaymentModal(item)}
                  style={[styles.payButton, { backgroundColor: '#10B981' }]}
                >
                  <Ionicons name="cash" size={16} color="white" />
                  <Text style={{ color: 'white', marginLeft: 4, fontSize: 12, fontWeight: 'bold' }}>
                    Pay
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => handleOpenModal(item)} style={{ marginLeft: 10 }}>
                <Ionicons name="pencil" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => handleOpenModal()}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

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
              <Text style={{ color: '#EF4444', fontWeight: 'bold', fontSize: 24 }}>
                ${payingCustomer?.totalDue.toFixed(2)}
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
                <Text style={{ color: '#10B981', fontWeight: 'bold', fontSize: 18 }}>
                  ${Math.max(0, (payingCustomer?.totalDue || 0) - parseFloat(paymentAmount)).toFixed(2)}
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
                style={[styles.button, { backgroundColor: '#10B981' }]}
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
  container: { flex: 1, padding: 16, paddingTop: 60 },
  item: { padding: 16, borderRadius: 8, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: 'bold' },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    elevation: 2,
  },
  fab: { position: 'absolute', bottom: 80, right: 20, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { padding: 20, borderRadius: 12 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  label: { fontSize: 12, marginBottom: 4, marginTop: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12 },
  dueInfo: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  button: { padding: 10, marginLeft: 10, borderRadius: 6 },
});
