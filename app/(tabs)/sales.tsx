import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/shared/theme';
import { useProductStore } from '@/src/store/product.store';
import { useCustomerStore } from '@/src/store/customer.store';
import { useSalesStore } from '@/src/store/sales.store';
import { Product, SaleItem } from '@/src/shared/types/shop.types';

export default function SalesScreen() {
  const { theme } = useTheme();
  const { products } = useProductStore();
  const { customers } = useCustomerStore();
  const { createSale } = useSalesStore();

  const [cart, setCart] = useState<SaleItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [saleType, setSaleType] = useState<'CASH' | 'DUE'>('CASH');

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

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
      customerName: selectedCustomer ? customers.find(c => c.id === selectedCustomer)?.name : undefined
    };

    createSale(saleData);
    setLastSale({ ...saleData, date: new Date().toISOString(), id: 'TEMP_ID' }); // ID is actually generated in store, but this is for display
    
    setCart([]);
    setCheckoutModalVisible(false);
    setSaleType('CASH');
    setSelectedCustomer(null);
    setReceiptModalVisible(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
          placeholder="Search Products..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* Product List */}
        <View style={{ flex: 0.6, paddingRight: 8 }}>
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.productItem, { backgroundColor: theme.colors.card }]}
                onPress={() => addToCart(item)}
              >
                <Text style={[styles.productName, { color: theme.colors.text }]}>{item.name}</Text>
                <Text style={{ color: theme.colors.textSecondary }}>${item.price} (Qty: {item.quantity})</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Cart */}
        <View style={{ flex: 0.4, borderLeftWidth: 1, borderColor: theme.colors.border, paddingLeft: 8 }}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Cart</Text>
          <FlatList
            data={cart}
            keyExtractor={(item) => item.productId}
            renderItem={({ item }) => (
              <View style={styles.cartItem}>
                <View style={{flex: 1}}>
                    <Text style={{ color: theme.colors.text }}>{item.productName}</Text>
                    <Text style={{ color: theme.colors.textSecondary }}>x{item.quantity} - ${item.total}</Text>
                </View>
                <TouchableOpacity onPress={() => removeFromCart(item.productId)}>
                    <Ionicons name="close-circle" size={20} color="red" />
                </TouchableOpacity>
              </View>
            )}
          />
          <View style={styles.cartFooter}>
            <Text style={[styles.totalText, { color: theme.colors.text }]}>Total: ${totalAmount}</Text>
            <TouchableOpacity 
                style={[styles.checkoutButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleCheckout}
            >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Checkout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Checkout Modal */}
      <Modal visible={checkoutModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Confirm Sale</Text>
            
            <Text style={{ color: theme.colors.text, marginBottom: 10 }}>Total: ${totalAmount}</Text>
            
            <View style={styles.typeSelector}>
                <TouchableOpacity 
                    style={[styles.typeButton, saleType === 'CASH' && { backgroundColor: theme.colors.primary }]}
                    onPress={() => setSaleType('CASH')}
                >
                    <Text style={{ color: saleType === 'CASH' ? 'white' : theme.colors.text }}>CASH</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.typeButton, saleType === 'DUE' && { backgroundColor: theme.colors.primary }]}
                    onPress={() => setSaleType('DUE')}
                >
                    <Text style={{ color: saleType === 'DUE' ? 'white' : theme.colors.text }}>DUE</Text>
                </TouchableOpacity>
            </View>

            {saleType === 'DUE' && (
                <View style={{ maxHeight: 200, marginTop: 10 }}>
                    <Text style={{ color: theme.colors.text, marginBottom: 5 }}>Select Customer:</Text>
                    <FlatList 
                        data={customers}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity 
                                style={[
                                    styles.customerItem, 
                                    selectedCustomer === item.id && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                                ]}
                                onPress={() => setSelectedCustomer(item.id)}
                            >
                                <Text style={{ color: selectedCustomer === item.id ? 'white' : theme.colors.text }}>{item.name}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setCheckoutModalVisible(false)} style={styles.button}>
                <Text style={{ color: theme.colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmSale} style={[styles.button, { backgroundColor: theme.colors.primary }]}>
                <Text style={{ color: 'white' }}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Receipt Modal */}
      <Modal visible={receiptModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: 'white', minWidth: 300 }]}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 }}>RECEIPT</Text>
                <Text style={{ textAlign: 'center', marginBottom: 20 }}>Shop Management App</Text>
                
                {lastSale && (
                    <>
                        <Text>Date: {new Date(lastSale.date).toLocaleString()}</Text>
                        <Text>Type: {lastSale.type}</Text>
                        {lastSale.customerName && <Text>Customer: {lastSale.customerName}</Text>}
                        <View style={{ borderBottomWidth: 1, borderBottomColor: '#ccc', marginVertical: 10 }} />
                        {lastSale.items.map((item: any, index: number) => (
                            <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                                <Text>{item.productName} (x{item.quantity})</Text>
                                <Text>${item.total}</Text>
                            </View>
                        ))}
                        <View style={{ borderTopWidth: 1, borderTopColor: '#ccc', marginVertical: 10, paddingTop: 5 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={{ fontWeight: 'bold' }}>TOTAL</Text>
                                <Text style={{ fontWeight: 'bold' }}>${lastSale.totalAmount}</Text>
                            </View>
                        </View>
                    </>
                )}

                <TouchableOpacity 
                    style={[styles.button, { backgroundColor: theme.colors.primary, marginTop: 20, alignSelf: 'center' }]}
                    onPress={() => setReceiptModalVisible(false)}
                >
                    <Text style={{ color: 'white' }}>Close</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 60 },
  searchContainer: { marginBottom: 10 },
  searchInput: { borderWidth: 1, borderRadius: 8, padding: 10 },
  productItem: { padding: 12, borderRadius: 8, marginBottom: 8 },
  productName: { fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  cartItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cartFooter: { marginTop: 10, borderTopWidth: 1, borderColor: '#ccc', paddingTop: 10 },
  totalText: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  checkoutButton: { padding: 12, borderRadius: 8, alignItems: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { padding: 20, borderRadius: 12 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  typeSelector: { flexDirection: 'row', marginBottom: 10 },
  typeButton: { flex: 1, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#ccc', marginHorizontal: 2, borderRadius: 6 },
  customerItem: { padding: 10, borderWidth: 1, borderColor: '#ccc', marginBottom: 5, borderRadius: 6 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  button: { padding: 10, marginLeft: 10, borderRadius: 6 },
});
