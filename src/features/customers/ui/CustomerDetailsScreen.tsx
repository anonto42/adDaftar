import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity, Alert, Modal, TextInput, Linking } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/src/shared/theme';
import { useCustomerStore, useSalesStore, usePaymentStore, useAppStore, useBusinessStore, useProductStore, useCategoryStore } from '@/src/store';
import { formatCurrency } from '@/src/shared/utils/format';
import { SearchBar, ScreenHeader, EmptyState, GlassCard } from '@/src/shared/components';
import { LinearGradient } from 'expo-linear-gradient';

export default function CustomerDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { customers, updateCustomer, updateDue } = useCustomerStore();
  const { sales } = useSalesStore();
  const { payments, addPayment } = usePaymentStore();
  const { products } = useProductStore();
  const { categories } = useCategoryStore();
  const { currency } = useAppStore();
  const { activeBusiness } = useBusinessStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Edit Form State
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');

  const customer = customers.find(c => c.id === id);

  const handleOpenEdit = () => {
    if (customer) {
      setEditName(customer.name);
      setEditPhone(customer.phone || '');
      setEditAddress(customer.address || '');
      setEditModalVisible(true);
    }
  };

  const handleUpdateCustomer = async () => {
    if (!editName.trim()) {
      Alert.alert("Error", "Name is required");
      return;
    }

    try {
      await updateCustomer(customer!.id, {
        name: editName.trim(),
        phone: editPhone.trim() || undefined,
        address: editAddress.trim() || undefined,
      });
      setEditModalVisible(false);
      Alert.alert("Success", "Customer updated successfully");
    } catch {
      Alert.alert("Error", "Failed to update customer");
    }
  };

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
        <EmptyState
          icon="person-remove-outline"
          title="Customer not found"
          description="The customer you are looking for does not exist or has been removed."
        />
      </View>
    );
  }

  const handlePayDue = () => {
    setPaymentAmount('');
    setPaymentNotes('');
    setPaymentModalVisible(true);
  };

  const handleCall = () => {
    if (customer.phone) {
      Linking.openURL(`tel:${customer.phone}`);
    } else {
      Alert.alert("Error", "No phone number available for this customer.");
    }
  };

  const handleWhatsApp = () => {
    if (customer.phone) {
      const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
      Linking.openURL(`whatsapp://send?phone=${cleanPhone}`);
    } else {
      Alert.alert("Error", "No phone number available for this customer.");
    }
  };

  const submitPayment = async () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    try {
      await addPayment({
        customerId: customer.id,
        amount: amount,
        paymentDate: new Date().toISOString(),
        paymentMethod: 'CASH',
        notes: paymentNotes || 'Due Payment'
      });

      await updateDue(customer.id, -amount);
      setPaymentModalVisible(false);
      Alert.alert("Success", `Payment of ${formatCurrency(amount, currency)} recorded successfully`);
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert("Error", "Failed to process payment");
    }
  };

  const filteredTransactions = transactions.filter(t => 
    (t.notes && t.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (t.transactionType.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (new Date(t.date).toLocaleDateString().includes(searchQuery))
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top + 16 }]}>
      <Stack.Screen options={{ title: customer.name, headerShown: false }} />
      
      <View style={{ paddingHorizontal: 16 }}>
        <ScreenHeader 
          title="Profile"
          subtitle="Customer Insights"
          topTitle={activeBusiness?.name}
          rightElement={
            <TouchableOpacity 
              onPress={handleOpenEdit}
              style={[styles.editButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            >
              <Ionicons name="pencil" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          }
        />
      </View>

      <FlatList
        data={filteredTransactions}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 16 }}>
            {/* Hero Section */}
            <GlassCard style={styles.heroCard}>
              <LinearGradient
                colors={theme.gradients.primary as any}
                style={styles.avatarCircle}
              >
                <Text style={styles.avatarText}>
                  {customer.name.charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
              
              <Text style={[styles.heroName, { color: theme.colors.text }]}>{customer.name}</Text>
              <Text style={[styles.heroSub, { color: theme.colors.textSecondary }]}>
                {customer.address || 'No address provided'}
              </Text>

              <View style={styles.actionRow}>
                <TouchableOpacity onPress={handleCall} style={[styles.actionBtn, { backgroundColor: theme.colors.backgroundSecondary }]}>
                  <Ionicons name="call" size={20} color={theme.colors.primary} />
                  <Text style={[styles.actionBtnText, { color: theme.colors.text }]}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleWhatsApp} style={[styles.actionBtn, { backgroundColor: theme.colors.backgroundSecondary }]}>
                  <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                  <Text style={[styles.actionBtnText, { color: theme.colors.text }]}>WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <GlassCard style={styles.statCard}>
                <Text style={[styles.statLabel, { color: theme.colors.textTertiary }]}>OUTSTANDING DUE</Text>
                <Text style={[styles.statValue, { color: customer.totalDue > 0 ? theme.colors.error : theme.colors.success }]}>
                  {formatCurrency(customer.totalDue, currency)}
                </Text>
                {customer.totalDue > 0 && (
                  <TouchableOpacity onPress={handlePayDue} style={[styles.inlinePayBtn, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.inlinePayBtnText}>Clear Due</Text>
                  </TouchableOpacity>
                )}
              </GlassCard>
              
              <GlassCard style={styles.statCard}>
                <Text style={[styles.statLabel, { color: theme.colors.textTertiary }]}>LIFETIME VALUE</Text>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  {formatCurrency(customer.totalPurchases || 0, currency)}
                </Text>
                <Text style={[styles.statSub, { color: theme.colors.textSecondary }]}>
                  {customer.purchaseCount || 0} Total Orders
                </Text>
              </GlassCard>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Timeline</Text>
              <View style={[styles.badge, { backgroundColor: theme.colors.primary + '15' }]}>
                <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: 'bold' }}>{transactions.length}</Text>
              </View>
            </View>

            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search history..."
              onClear={() => setSearchQuery('')}
            />
          </View>
        }
        renderItem={({ item }: { item: any }) => {
          const isSale = item.transactionType === 'SALE';
          return (
            <View style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineDot, { backgroundColor: isSale ? theme.colors.primary : theme.colors.success }]} />
                <View style={[styles.timelineLine, { backgroundColor: theme.colors.border }]} />
              </View>
              
              <GlassCard style={styles.transactionCard}>
                <View style={styles.transHeader}>
                  <View>
                    <Text style={[styles.transTitle, { color: theme.colors.text }]}>
                      {isSale ? 'Product Purchase' : 'Payment Received'}
                    </Text>
                    <Text style={{ color: theme.colors.textTertiary, fontSize: 12 }}>
                      {new Date(item.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                  <Text style={[styles.transAmount, { color: isSale ? theme.colors.text : theme.colors.success }]}>
                    {isSale ? '' : '+ '}{formatCurrency(item.totalAmount, currency)}
                  </Text>
                </View>

                <View style={styles.transBody}>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 4 }}>
                    {isSale 
                      ? `${item.items.length} items • Received ${formatCurrency(item.receivedAmount || 0, currency)}` 
                      : `via ${item.paymentMethod}`}
                  </Text>
                  
                  {isSale && item.items && item.items.length > 0 && (
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
                  )}
                  
                  {isSale && item.type === 'DUE' && (
                    <View style={styles.dueAddedBadge}>
                      <Ionicons name="warning-outline" size={12} color={theme.colors.error} />
                      <Text style={{ color: theme.colors.error, fontSize: 11, fontWeight: '600', marginLeft: 4 }}>
                        Due: {formatCurrency(item.totalAmount - (item.receivedAmount || 0), currency)}
                      </Text>
                    </View>
                  )}
                  
                  {item.notes && (
                    <Text style={[styles.transNotes, { color: theme.colors.textTertiary }]}>
                      &quot;{item.notes}&quot;
                    </Text>
                  )}
                </View>
              </GlassCard>
            </View>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title="Clean Slate"
            description={searchQuery ? "No matching history." : "This customer hasn't had any activity yet."}
            style={{ marginTop: 20 }}
          />
        }
      />

      {/* Payment Modal */}
      <Modal visible={paymentModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <GlassCard 
            intensity="strong"
            style={StyleSheet.flatten([
              styles.modalContent, 
              { 
                borderColor: theme.colors.primary, 
                borderWidth: 1.5,
                backgroundColor: theme.isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)'
              }
            ])}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Record Payment</Text>
            
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Amount</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="0.00"
              placeholderTextColor={theme.colors.textTertiary}
              keyboardType="numeric"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              autoFocus
            />

            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Notes</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="e.g. Cash payment"
              placeholderTextColor={theme.colors.textTertiary}
              value={paymentNotes}
              onChangeText={setPaymentNotes}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)} style={styles.button}>
                <Text style={{ color: theme.colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitPayment} style={[styles.button, { backgroundColor: theme.colors.primary }]}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Submit Payment</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <GlassCard 
            intensity="strong"
            style={StyleSheet.flatten([
              styles.modalContent, 
              { 
                borderColor: theme.colors.primary, 
                borderWidth: 1.5,
                backgroundColor: theme.isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)'
              }
            ])}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Edit Details</Text>
            
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Name</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="Full Name"
              placeholderTextColor={theme.colors.textTertiary}
              value={editName}
              onChangeText={setEditName}
            />

            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Phone Number</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="e.g. +1234567890"
              placeholderTextColor={theme.colors.textTertiary}
              keyboardType="phone-pad"
              value={editPhone}
              onChangeText={setEditPhone}
            />

            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Address</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="Street, City, Zip"
              placeholderTextColor={theme.colors.textTertiary}
              value={editAddress}
              onChangeText={setEditAddress}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.button}>
                <Text style={{ color: theme.colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleUpdateCustomer} style={[styles.button, { backgroundColor: theme.colors.primary }]}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  editButton: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  
  // Hero Section
  heroCard: { alignItems: 'center', paddingVertical: 24, marginBottom: 16 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16, elevation: 4 },
  avatarText: { color: 'white', fontSize: 32, fontWeight: 'bold' },
  heroName: { fontSize: 24, fontWeight: 'bold' },
  heroSub: { fontSize: 14, marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 8 },
  actionBtnText: { fontWeight: '600', fontSize: 14 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, padding: 16, justifyContent: 'space-between' },
  statLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  statValue: { fontSize: 18, fontWeight: 'bold' },
  statSub: { fontSize: 11, marginTop: 4 },
  inlinePayBtn: { marginTop: 12, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  inlinePayBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },

  // Timeline
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  timelineItem: { flexDirection: 'row', paddingHorizontal: 16 },
  timelineLeft: { alignItems: 'center', width: 20, marginRight: 12 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 24, zIndex: 2 },
  timelineLine: { flex: 1, width: 2, opacity: 0.5 },
  transactionCard: { flex: 1, marginBottom: 16, padding: 16 },
  transHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  transTitle: { fontSize: 15, fontWeight: '700' },
  transAmount: { fontSize: 16, fontWeight: 'bold', fontVariant: ['tabular-nums'] },
  transBody: { gap: 6 },
  itemsList: { 
    marginTop: 8, 
    marginBottom: 4, 
    paddingTop: 8, 
    borderTopWidth: 1, 
    borderTopColor: 'rgba(0,0,0,0.05)' 
  },
  itemRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 6,
  },
  itemName: { fontSize: 13, fontWeight: '600' },
  itemCategory: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.7 },
  itemQty: { fontSize: 11, fontVariant: ['tabular-nums'] },
  dueAddedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  transNotes: { fontSize: 12, fontStyle: 'italic', marginTop: 4 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { padding: 24, borderRadius: 24 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 24, gap: 12 },
  button: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
});
