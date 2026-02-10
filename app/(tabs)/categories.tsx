import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  Modal,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/shared/theme';
import { useCategoryStore } from '@/src/store/category.store';
import { useProductStore } from '@/src/store/product.store';
import { Category } from '@/src/shared/types/shop.types';

// Common icons for categories
const CATEGORY_ICONS = [
  'cube', 'cart', 'shirt', 'phone-portrait', 'laptop', 'restaurant',
  'medical', 'football', 'home', 'car', 'book', 'gift'
];

// Common colors for categories
const CATEGORY_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899',
  '#14B8A6', '#F97316', '#06B6D4', '#84CC16', '#6366F1', '#A855F7'
];

export default function CategoriesScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { categories, addCategory, updateCategory, deleteCategory, getProductCount } =
    useCategoryStore();
  const { products } = useProductStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('cube');
  const [selectedColor, setSelectedColor] = useState('#3B82F6');

  React.useEffect(() => {
    loadProductCounts();
  }, [categories, products]);

  const loadProductCounts = async () => {
    const counts: Record<string, number> = {};
    for (const category of categories) {
      const count = await getProductCount(category.id);
      counts[category.id] = count;
    }
    setProductCounts(counts);
  };

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setName(category.name);
      setDescription(category.description || '');
      setSelectedIcon(category.icon || 'cube');
      setSelectedColor(category.color || '#3B82F6');
    } else {
      setEditingCategory(null);
      setName('');
      setDescription('');
      setSelectedIcon('cube');
      setSelectedColor('#3B82F6');
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name) return;

    const categoryData: Omit<Category, 'id'> = {
      name,
      description: description || undefined,
      icon: selectedIcon,
      color: selectedColor,
    };

    if (editingCategory) {
      await updateCategory(editingCategory.id, categoryData);
    } else {
      await addCategory(categoryData);
    }
    setModalVisible(false);
    await loadProductCounts();
  };

  const handleDelete = async (id: string) => {
    await deleteCategory(id);
    await loadProductCounts();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 60 + insets.bottom }}
        ListHeaderComponent={
          <Text style={[styles.header, { color: theme.colors.text }]}>Categories</Text>
        }
        renderItem={({ item }) => (
          <View style={[styles.item, { backgroundColor: theme.colors.card }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: item.color || '#3B82F6' },
                ]}
              >
                <Ionicons
                  name={item.icon as any || 'cube'}
                  size={24}
                  color="white"
                />
              </View>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: theme.colors.text }]}>
                  {item.name}
                </Text>
                {item.description && (
                  <Text
                    style={{ color: theme.colors.textSecondary, fontSize: 12 }}
                    numberOfLines={1}
                  >
                    {item.description}
                  </Text>
                )}
                <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                  {productCounts[item.id] || 0} products
                </Text>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => handleOpenModal(item)}>
                <Ionicons name="pencil" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(item.id)}
                style={{ marginLeft: 10 }}
              >
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
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </Text>

            <TextInput
              style={[
                styles.input,
                { color: theme.colors.text, borderColor: theme.colors.border },
              ]}
              placeholder="Category Name"
              placeholderTextColor={theme.colors.textSecondary}
              value={name}
              onChangeText={setName}
            />

            <TextInput
              style={[
                styles.input,
                { color: theme.colors.text, borderColor: theme.colors.border },
              ]}
              placeholder="Description (optional)"
              placeholderTextColor={theme.colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
            />

            {/* Icon Selector */}
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              Select Icon
            </Text>
            <View style={styles.iconGrid}>
              {CATEGORY_ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconOption,
                    {
                      backgroundColor:
                        selectedIcon === icon ? selectedColor : theme.colors.background,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  onPress={() => setSelectedIcon(icon)}
                >
                  <Ionicons
                    name={icon as any}
                    size={24}
                    color={selectedIcon === icon ? 'white' : theme.colors.text}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Color Selector */}
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              Select Color
            </Text>
            <View style={styles.colorGrid}>
              {CATEGORY_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    {
                      backgroundColor: color,
                      borderWidth: selectedColor === color ? 3 : 1,
                      borderColor: selectedColor === color ? theme.colors.text : '#ccc',
                    },
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.button}
              >
                <Text style={{ color: theme.colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
              >
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
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
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
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: 'bold' },
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
  modalContent: { padding: 20, borderRadius: 12, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  label: { fontSize: 12, marginTop: 12, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12 },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  button: { padding: 10, marginLeft: 10, borderRadius: 6 },
});
