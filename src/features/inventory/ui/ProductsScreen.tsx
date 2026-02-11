import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, Modal, TextInput, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/shared/theme';
import { useProductStore } from '../model/product.store';
import { useCategoryStore } from '../model/category.store';
import { useAppStore } from '@/src/features/settings';
import { Product } from '@/src/shared/types/shop.types';
import { PressableScale } from '@/src/shared/components/PressableScale';
import { formatCurrency } from '@/src/shared/utils/format';
import { SearchBar, ScreenHeader } from '@/src/shared/components';

export default function ProductsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { products, addProduct, updateProduct, deleteProduct } = useProductStore();
  const { categories } = useCategoryStore();
  const { currency } = useAppStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [lowStockLevel, setLowStockLevel] = useState('5');
  const [categoryId, setCategoryId] = useState<string>('');

  const filterProducts = useCallback(() => {
    let filtered = products;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.categoryId === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [products, selectedCategory, searchQuery]);

  useEffect(() => {
    filterProducts();
  }, [filterProducts]);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setName(product.name);
      setPrice(product.price.toString());
      setCostPrice(product.costPrice?.toString() || '');
      setQuantity(product.quantity.toString());
      setLowStockLevel(product.lowStockLevel?.toString() || '5');
      setCategoryId(product.categoryId || '');
    } else {
      setEditingProduct(null);
      setName('');
      setPrice('');
      setCostPrice('');
      setQuantity('');
      setLowStockLevel('5');
      setCategoryId('');
    }
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a product name');
      return;
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    const parsedQuantity = parseInt(quantity, 10);
    if (isNaN(parsedQuantity) || parsedQuantity < 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    const parsedCostPrice = costPrice ? parseFloat(costPrice) : 0;
    if (costPrice && (isNaN(parsedCostPrice) || parsedCostPrice < 0)) {
      Alert.alert('Error', 'Please enter a valid cost price');
      return;
    }

    const productData: Omit<Product, 'id'> = {
      name: name.trim(),
      price: parsedPrice,
      quantity: parsedQuantity,
      costPrice: parsedCostPrice,
      lowStockLevel: lowStockLevel ? parseInt(lowStockLevel, 10) : 5,
      categoryId: categoryId || undefined,
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

  const getCategoryName = (catId?: string) => {
    if (!catId) return 'Uncategorized';
    const category = categories.find(c => c.id === catId);
    return category?.name || 'Uncategorized';
  };

  const calculateProfitMargin = (price: number, cost?: number) => {
    if (!cost || cost === 0) return null;
    return ((price - cost) / price) * 100;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: Math.max(insets.top, 20) + 16 }]}>
      <ScreenHeader 
        title="Products" 
        subtitle="Inventory" 
        icon="cube" 
      />

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search products..."
        onClear={() => setSearchQuery('')}
      />

      {/* Category Filter */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
          <PressableScale
            style={[
              styles.categoryChip,
              { backgroundColor: selectedCategory === 'all' ? theme.colors.primary : theme.colors.card, borderColor: selectedCategory === 'all' ? theme.colors.primary : theme.colors.border, borderWidth: 1 }
            ]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={{ color: selectedCategory === 'all' ? 'white' : theme.colors.text, fontWeight: '600', fontSize: 13 }}>
              All ({products.length})
            </Text>
          </PressableScale>
          {categories.map((cat) => (
            <PressableScale
              key={cat.id}
              style={[
                styles.categoryChip,
                { backgroundColor: selectedCategory === cat.id ? theme.colors.primary : theme.colors.card, borderColor: selectedCategory === cat.id ? theme.colors.primary : theme.colors.border, borderWidth: 1 }
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={{ color: selectedCategory === cat.id ? 'white' : theme.colors.text, fontWeight: '600', fontSize: 13 }}>
                {cat.name}
              </Text>
            </PressableScale>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const profitMargin = calculateProfitMargin(item.price, item.costPrice);
          const isLowStock = item.quantity <= (item.lowStockLevel || 5);

          return (
            <PressableScale 
              style={[styles.item, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
              onPress={() => handleOpenModal(item)}
            >
              <View style={styles.itemInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={[styles.itemName, { color: theme.colors.text }]}>{item.name}</Text>
                  {isLowStock && (
                    <View style={[styles.lowStockBadge, { backgroundColor: theme.colors.errorLight, marginLeft: 8 }]}>
                      <Text style={{ color: theme.colors.error, fontSize: 10, fontWeight: 'bold' }}>LOW</Text>
                    </View>
                  )}
                </View>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginBottom: 8 }}>
                  {getCategoryName(item.categoryId)}
                </Text>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <View>
                    <Text style={styles.statLabel}>STOCK</Text>
                    <Text style={[styles.statValue, { color: theme.colors.text }]}>{item.quantity}</Text>
                  </View>
                  <View>
                    <Text style={styles.statLabel}>PRICE</Text>
                    <Text style={[styles.statValue, { color: theme.colors.text, fontVariant: ['tabular-nums'] }]}>
                      {formatCurrency(item.price, currency)}
                    </Text>
                  </View>
                  {profitMargin !== null && (
                    <View>
                      <Text style={styles.statLabel}>MARGIN</Text>
                      <Text style={[styles.statValue, { color: theme.colors.success, fontVariant: ['tabular-nums'] }]}>{profitMargin.toFixed(1)}%</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.actionButton, { backgroundColor: theme.colors.error + '10' }]}>
                  <Ionicons name="trash" size={20} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            </PressableScale>
          );
        }}
      />

      <PressableScale
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => handleOpenModal()}
      >
        <Ionicons name="add" size={30} color="white" />
      </PressableScale>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView>
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

              {/* Category Selector */}
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySelector}>
                <TouchableOpacity
                  style={[
                    styles.categorySelectorChip,
                    {
                      backgroundColor: !categoryId ? theme.colors.primary : theme.colors.background,
                      borderColor: theme.colors.border,
                      borderWidth: 1
                    }
                  ]}
                  onPress={() => setCategoryId('')}
                >
                  <Text style={{ color: !categoryId ? 'white' : theme.colors.text, fontSize: 12 }}>
                    None
                  </Text>
                </TouchableOpacity>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categorySelectorChip,
                      {
                        backgroundColor: categoryId === cat.id ? theme.colors.primary : theme.colors.background,
                        borderColor: theme.colors.border,
                        borderWidth: 1
                      }
                    ]}
                    onPress={() => setCategoryId(cat.id)}
                  >
                    <Text style={{ color: categoryId === cat.id ? 'white' : theme.colors.text, fontSize: 12 }}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Selling Price</Text>
                  <TextInput
                    style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                    placeholder="0.00"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="numeric"
                    value={price}
                    onChangeText={setPrice}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Cost Price</Text>
                  <TextInput
                    style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                    placeholder="0.00"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="numeric"
                    value={costPrice}
                    onChangeText={setCostPrice}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Quantity</Text>
                  <TextInput
                    style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                    placeholder="0"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="numeric"
                    value={quantity}
                    onChangeText={setQuantity}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Low Stock Level</Text>
                  <TextInput
                    style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
                    placeholder="5"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="numeric"
                    value={lowStockLevel}
                    onChangeText={setLowStockLevel}
                  />
                </View>
              </View>

              {costPrice && price && parseFloat(costPrice) > 0 && (
                <View style={[styles.profitInfo, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>Profit Margin:</Text>
                  <Text style={{ color: '#10B981', fontWeight: 'bold', fontSize: 16 }}>
                    {calculateProfitMargin(parseFloat(price), parseFloat(costPrice))?.toFixed(1)}%
                  </Text>
                </View>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.button}>
                  <Text style={{ color: theme.colors.text }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} style={[styles.button, { backgroundColor: theme.colors.primary }]}>
                  <Text style={{ color: 'white' }}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '500',
  },
  categoryFilter: {
    marginBottom: 16,
    maxHeight: 40,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
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
  itemName: { fontSize: 16, fontWeight: 'bold' },
  lowStockBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  actions: { flexDirection: 'row' },
  actionButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.02)',
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
  categorySelector: {
    marginBottom: 12,
    maxHeight: 40,
  },
  categorySelectorChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 4, fontSize: 15 },
  profitInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 },
  button: { paddingVertical: 12, paddingHorizontal: 20, marginLeft: 12, borderRadius: 10 },
});
