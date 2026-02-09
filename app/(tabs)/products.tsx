import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/shared/theme';
import { useProductStore } from '@/src/store/product.store';
import { Product } from '@/src/shared/types/shop.types';

export default function ProductsScreen() {
  const { theme } = useTheme();
  const { products, addProduct, updateProduct, deleteProduct } = useProductStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setName(product.name);
      setPrice(product.price.toString());
      setQuantity(product.quantity.toString());
    } else {
      setEditingProduct(null);
      setName('');
      setPrice('');
      setQuantity('');
    }
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!name || !price || !quantity) return; // Basic validation

    const productData = {
      name,
      price: parseFloat(price),
      quantity: parseInt(quantity, 10),
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, productData);
    } else {
      addProduct(productData);
    }
    setModalVisible(false);
  };

  const handleDelete = (id: string) => {
    deleteProduct(id);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.item, { backgroundColor: theme.colors.card }]}>
            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, { color: theme.colors.text }]}>{item.name}</Text>
              <Text style={{ color: theme.colors.textSecondary }}>Qty: {item.quantity} | ${item.price}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => handleOpenModal(item)}>
                <Ionicons name="pencil" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ marginLeft: 10 }}>
                <Ionicons name="trash" size={20} color="red" />
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
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </Text>
            
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="Product Name"
              placeholderTextColor={theme.colors.textSecondary}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="Price"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="Quantity"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 60 },
  item: { padding: 16, borderRadius: 8, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: 'bold' },
  actions: { flexDirection: 'row' },
  fab: { position: 'absolute', bottom: 80, right: 20, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { padding: 20, borderRadius: 12 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  button: { padding: 10, marginLeft: 10, borderRadius: 6 },
});
