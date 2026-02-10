import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, Modal, TextInput, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/shared/theme';
import { useProductStore } from '@/src/store/product.store';
import { useCategoryStore } from '@/src/store/category.store';
import { Product, Category } from '@/src/shared/types/shop.types';

export default function ProductsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { products, addProduct, updateProduct, deleteProduct, searchByName } = useProductStore();
  const { categories } = useCategoryStore();

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

  useEffect(() => {
    filterProducts();
  }, [products, selectedCategory, searchQuery]);

  const filterProducts = () => {
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
  };

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
    if (!name || !price || !quantity) return; // Basic validation

    const productData: Omit<Product, 'id'> = {
      name,
      price: parseFloat(price),
      quantity: parseInt(quantity, 10),
      costPrice: costPrice ? parseFloat(costPrice) : 0,
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Search products..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
        <TouchableOpacity
          style={[
            styles.categoryChip,
            { backgroundColor: selectedCategory === 'all' ? theme.colors.primary : theme.colors.card }
          ]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text style={{ color: selectedCategory === 'all' ? 'white' : theme.colors.text }}>
            All ({products.length})
          </Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              { backgroundColor: selectedCategory === cat.id ? theme.colors.primary : theme.colors.card }
            ]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text style={{ color: selectedCategory === cat.id ? 'white' : theme.colors.text }}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 60 + insets.bottom }}
        renderItem={({ item }) => {
          const profitMargin = calculateProfitMargin(item.price, item.costPrice);
          const isLowStock = item.quantity <= (item.lowStockLevel || 5);

          return (
            <View style={[styles.item, { backgroundColor: theme.colors.card }]}>
              <View style={styles.itemInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.itemName, { color: theme.colors.text }]}>{item.name}</Text>
                  {isLowStock && (
                    <View style={[styles.lowStockBadge, { backgroundColor: '#FEE2E2', marginLeft: 8 }]}>
                      <Text style={{ color: '#EF4444', fontSize: 10, fontWeight: 'bold' }}>LOW</Text>
                    </View>
                  )}
                </View>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
                  {getCategoryName(item.categoryId)}
                </Text>
                <View style={{ flexDirection: 'row', marginTop: 4, gap: 12 }}>
                  <Text style={{ color: theme.colors.text }}>
                    Qty: <Text style={{ fontWeight: 'bold' }}>{item.quantity}</Text>
                  </Text>
                  <Text style={{ color: theme.colors.text }}>
                    Price: <Text style={{ fontWeight: 'bold' }}>${item.price.toFixed(2)}</Text>
                  </Text>
                  {profitMargin !== null && (
                    <Text style={{ color: '#10B981' }}>
                      Margin: <Text style={{ fontWeight: 'bold' }}>{profitMargin.toFixed(1)}%</Text>
                    </Text>
                  )}
                </View>
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
          );
        }}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => handleOpenModal()}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

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
  container: { flex: 1, padding: 16, paddingTop: 60 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  categoryFilter: {
    marginBottom: 12,
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
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  actions: { flexDirection: 'row' },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: { padding: 20, borderRadius: 12 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  label: { fontSize: 12, marginBottom: 4, marginTop: 8 },
  categorySelector: {
    marginBottom: 12,
    maxHeight: 40,
  },
  categorySelectorChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 4 },
  profitInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  button: { padding: 10, marginLeft: 10, borderRadius: 6 },
});
