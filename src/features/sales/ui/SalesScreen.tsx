import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, Modal, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useTheme } from '@/src/shared/theme';
import { useProductStore } from '@/src/features/inventory';
import { useCustomerStore } from '@/src/features/customers';
import { useSalesStore } from '../model/sales.store';
import { useAppStore } from '@/src/features/settings';
import { Product, SaleItem } from '@/src/shared/types/shop.types';
import { PressableScale } from '@/src/shared/components/PressableScale';
import { formatCurrency } from '@/src/shared/utils/format';
import { SearchBar, ScreenHeader } from '@/src/shared/components';
import { router } from 'expo-router';

export default function SalesScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { products } = useProductStore();
  const { customers } = useCustomerStore();
  const { createSale } = useSalesStore();
  const { currency } = useAppStore();

  const [cart, setCart] = useState<SaleItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [saleType, setSaleType] = useState<'CASH' | 'DUE'>('CASH');
  const [notes, setNotes] = useState('');

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(customerSearchQuery))
    );
  }, [customers, customerSearchQuery]);

  const addToCart = (product: Product) => {
    setCart(currentCart => {
      const existing = currentCart.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
           Alert.alert("Error", "Not enough stock!");
           return currentCart;
        }
        return currentCart.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
            : item
        );
      } else {
        if (product.quantity <= 0) {
            Alert.alert("Error", "Out of stock!");
            return currentCart;
        }
        return [...currentCart, {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: product.price,
          total: product.price
        }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(currentCart => currentCart.filter(item => item.productId !== productId));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.total, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setCheckoutModalVisible(true);
  };

  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);

  const confirmSale = () => {
    if (saleType === 'DUE' && !selectedCustomer) {
      Alert.alert("Error", "Please select a customer for Due sales.");
      return;
    }

    const saleData = {
      items: cart,
      totalAmount,
      type: saleType,
      customerId: selectedCustomer || undefined,
      customerName: selectedCustomer ? customers.find(c => c.id === selectedCustomer)?.name : undefined,
      notes: notes.trim() || undefined
    };

    createSale(saleData);
    setLastSale({ ...saleData, date: new Date().toISOString(), id: 'TEMP_ID' }); 

    setCart([]);
    setCheckoutModalVisible(false);
    setSaleType('CASH');
    setSelectedCustomer(null);
    setNotes('');
    setReceiptModalVisible(true);
  };

  const generateReceiptHTML = useCallback(() => {
    if (!lastSale) return '';

    const symbol = currency === 'BDT' ? '৳' : '$';
    const locale = currency === 'BDT' ? 'en-IN' : 'en-US';

    const itemsHTML = lastSale.items
      .map(
        (item: any) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.productName}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${symbol}${item.unitPrice.toLocaleString(locale, { minimumFractionDigits: 2 })}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${symbol}${item.total.toLocaleString(locale, { minimumFractionDigits: 2 })}</td>
        </tr>
      `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Receipt</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              font-size: 32px;
              color: #333;
            }
            .header p {
              margin: 5px 0;
              color: #666;
            }
            .info {
              margin-bottom: 20px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th {
              background-color: #f8f9fa;
              padding: 12px 8px;
              text-align: left;
              border-bottom: 2px solid #333;
            }
            th:nth-child(2), th:nth-child(3), th:nth-child(4) {
              text-align: right;
            }
            .total-section {
              margin-top: 20px;
              border-top: 2px solid #333;
              padding-top: 15px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              font-size: 18px;
              font-weight: bold;
              padding: 10px 0;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>RECEIPT</h1>
            <p>Shop Management App</p>
          </div>

          <div class="info">
            <div class="info-row">
              <strong>Date:</strong>
              <span>${new Date(lastSale.date).toLocaleString()}</span>
            </div>
            <div class="info-row">
              <strong>Type:</strong>
              <span>${lastSale.type}</span>
            </div>
            ${
              lastSale.customerName
                ? `
            <div class="info-row">
              <strong>Customer:</strong>
              <span>${lastSale.customerName}</span>
            </div>
            `
                : ''
            }
          </div>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row">
              <span>TOTAL:</span>
              <span>${symbol}${lastSale.totalAmount.toLocaleString(locale, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for your business!</p>
            <p>Generated by Shop Management App</p>
          </div>
        </body>
      </html>
    `;
  }, [lastSale, currency]);

  const downloadReceipt = async () => {
    try {
      const html = generateReceiptHTML();
      const { uri } = await Print.printToFileAsync({ html });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Receipt',
          UTI: 'com.hisab.rakho.pdf',
        });
      } else {
        Alert.alert('Success', 'PDF saved to: ' + uri);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF receipt');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: Math.max(insets.top, 20) + 16, paddingBottom: insets.bottom + 16 }]}>
      <ScreenHeader 
        title="POS" 
        subtitle="Point of Sale" 
        rightElement={
          <TouchableOpacity 
            style={[styles.historyButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={() => router.push('/sales-history')}
          >
            <Ionicons name="time-outline" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        }
      />

      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search products..."
          onClear={() => setSearchQuery('')}
        />
      </View>

      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* Product List */}
        <View style={{ flex: 0.6, paddingRight: 12 }}>
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <PressableScale 
                style={[styles.productItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                onPress={() => addToCart(item)}
              >
                <Text style={[styles.productName, { color: theme.colors.text }]}>{item.name}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 13, fontVariant: ['tabular-nums'] }}>
                    {formatCurrency(item.price, currency)}
                  </Text>
                  <Text style={{ color: item.quantity < 5 ? theme.colors.error : theme.colors.textTertiary, fontSize: 12, fontWeight: '600' }}>
                    Stock: {item.quantity}
                  </Text>
                </View>
              </PressableScale>
            )}
          />
        </View>

        {/* Cart */}
        <View style={[styles.cartContainer, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Cart</Text>
          <FlatList
            data={cart}
            keyExtractor={(item) => item.productId}
            contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={[styles.cartItem, { borderBottomColor: theme.colors.border }]}>
                <View style={{flex: 1}}>
                    <Text style={{ color: theme.colors.text, fontWeight: '600', fontSize: 14 }}>{item.productName}</Text>
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 12, fontVariant: ['tabular-nums'] }}>
                      {item.quantity} x {formatCurrency(item.unitPrice, currency)}
                    </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: theme.colors.text, fontWeight: 'bold', fontSize: 14, fontVariant: ['tabular-nums'] }}>
                    {formatCurrency(item.total, currency)}
                  </Text>
                  <TouchableOpacity onPress={() => removeFromCart(item.productId)} style={{ marginTop: 4 }}>
                      <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyCart}>
                <Ionicons name="cart-outline" size={48} color={theme.colors.textTertiary} />
                <Text style={{ color: theme.colors.textTertiary, fontSize: 12, marginTop: 8 }}>Empty</Text>
              </View>
            }
          />
          <View style={[styles.cartFooter, { borderTopColor: theme.colors.border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: theme.colors.textSecondary, fontWeight: '600' }}>Total</Text>
              <Text style={[styles.totalText, { color: theme.colors.text, fontVariant: ['tabular-nums'] }]}>
                {formatCurrency(totalAmount, currency)}
              </Text>
            </View>
            <TouchableOpacity 
                style={[styles.checkoutButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleCheckout}
                disabled={cart.length === 0}
            >
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Checkout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Checkout Modal */}
      <Modal visible={checkoutModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Confirm Sale</Text>
            
            <View style={[styles.summaryBox, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>Total Amount</Text>
              <Text style={{ color: theme.colors.text, fontSize: 32, fontWeight: 'bold', fontVariant: ['tabular-nums'] }}>
                {formatCurrency(totalAmount, currency)}
              </Text>
            </View>
            
            {/* Customer Selection with Search */}
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Select Customer {saleType === 'DUE' ? '(Required)' : '(Optional)'}</Text>
            <SearchBar
              value={customerSearchQuery}
              onChangeText={setCustomerSearchQuery}
              placeholder="Search customer..."
              onClear={() => setCustomerSearchQuery('')}
            />
            <View style={{ maxHeight: 150, marginBottom: 16 }}>
                <FlatList 
                    data={filteredCustomers}
                    keyExtractor={item => item.id}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <TouchableOpacity 
                            style={[
                                styles.customerItem, 
                                selectedCustomer === item.id && { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary }
                            ]}
                            onPress={() => setSelectedCustomer(selectedCustomer === item.id ? null : item.id)}
                        >
                            <Text style={{ color: selectedCustomer === item.id ? theme.colors.primary : theme.colors.text, fontWeight: selectedCustomer === item.id ? 'bold' : '400' }}>
                              {item.name}
                            </Text>
                            {selectedCustomer === item.id && <Ionicons name="checkmark-circle" size={18} color={theme.colors.primary} />}
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', color: theme.colors.textTertiary, padding: 10 }}>No customers found</Text>}
                />
            </View>

            <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 0 }]}>Payment Method</Text>
            <View style={styles.typeSelector}>
                <TouchableOpacity 
                    style={[styles.typeButton, saleType === 'CASH' && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}
                    onPress={() => setSaleType('CASH')}
                >
                    <Text style={{ color: saleType === 'CASH' ? 'white' : theme.colors.text, fontWeight: '600' }}>CASH</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.typeButton, saleType === 'DUE' && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}
                    onPress={() => setSaleType('DUE')}
                >
                    <Text style={{ color: saleType === 'DUE' ? 'white' : theme.colors.text, fontWeight: '600' }}>DUE</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                onPress={() => {
                  setCheckoutModalVisible(false);
                  setCustomerSearchQuery('');
                }} 
                style={styles.button}
              >
                <Text style={{ color: theme.colors.text, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmSale} style={[styles.button, { backgroundColor: theme.colors.primary }]}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Receipt Modal */}
      <Modal visible={receiptModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: 'white', width: '90%', maxWidth: 400 }]}>
                <Text style={{ fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 4, color: '#0F172A' }}>RECEIPT</Text>
                <Text style={{ textAlign: 'center', marginBottom: 24, color: '#64748B', fontSize: 13 }}>Shop Management App</Text>
                
                {lastSale && (
                    <View style={styles.receiptBody}>
                        <View style={styles.receiptRow}>
                          <Text style={styles.receiptLabel}>Date</Text>
                          <Text style={styles.receiptValue}>{new Date(lastSale.date).toLocaleString()}</Text>
                        </View>
                        <View style={styles.receiptRow}>
                          <Text style={styles.receiptLabel}>Type</Text>
                          <Text style={styles.receiptValue}>{lastSale.type}</Text>
                        </View>
                        {lastSale.customerName && (
                          <View style={styles.receiptRow}>
                            <Text style={styles.receiptLabel}>Customer</Text>
                            <Text style={styles.receiptValue}>{lastSale.customerName}</Text>
                          </View>
                        )}
                        
                        <View style={{ borderBottomWidth: 1, borderBottomColor: '#E2E8F0', marginVertical: 16, borderStyle: 'dashed' }} />
                        
                        {lastSale.items.map((item: any, index: number) => (
                            <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text style={{ color: '#1E293B', flex: 1 }}>{item.productName} (x{item.quantity})</Text>
                                <Text style={{ color: '#1E293B', fontWeight: '600', fontVariant: ['tabular-nums'] }}>
                                  {formatCurrency(item.total, currency)}
                                </Text>
                            </View>
                        ))}
                        
                        <View style={{ borderTopWidth: 2, borderTopColor: '#0F172A', marginTop: 16, paddingTop: 12 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={{ fontWeight: '800', fontSize: 18, color: '#0F172A' }}>TOTAL</Text>
                                <Text style={{ fontWeight: '800', fontSize: 18, color: '#0F172A', fontVariant: ['tabular-nums'] }}>
                                  {formatCurrency(lastSale.totalAmount, currency)}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                <View style={{ marginTop: 32, gap: 12 }}>
                    <TouchableOpacity
                        style={[styles.receiptButton, { backgroundColor: '#10B981' }]}
                        onPress={downloadReceipt}
                    >
                        <Ionicons name="download-outline" size={20} color="white" />
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>Download PDF</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.receiptButton, { backgroundColor: '#F1F5F9' }]}
                        onPress={() => setReceiptModalVisible(false)}
                    >
                        <Text style={{ color: '#475569', fontWeight: 'bold' }}>Close</Text>
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
  historyButton: {
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
  searchContainer: { marginBottom: 16 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
  },
  productItem: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  productName: { fontWeight: 'bold', fontSize: 15 },
  cartContainer: {
    flex: 0.4,
    paddingLeft: 12,
    paddingTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    padding: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  cartFooter: {
    marginTop: 12,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  totalText: { fontSize: 18, fontWeight: 'bold' },
  checkoutButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    padding: 20,
  },
  modalContent: { padding: 24, borderRadius: 20, width: '100%', elevation: 5 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  summaryBox: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
  },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  typeSelector: { flexDirection: 'row', gap: 10 },
  typeButton: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
  },
  customerItem: {
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 24 },
  button: { paddingVertical: 12, paddingHorizontal: 20, marginLeft: 12, borderRadius: 10 },
  receiptBody: { width: '100%' },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  receiptLabel: { color: '#64748B', fontSize: 13 },
  receiptValue: { color: '#1E293B', fontWeight: '600', fontSize: 13 },
  receiptButton: {
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
});
