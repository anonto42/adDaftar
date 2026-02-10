import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/shared/theme';
import { useExpenseStore } from '@/src/store/expense.store';
import { Expense, ExpenseCategory } from '@/src/shared/types/shop.types';

const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; icon: string }[] = [
  { value: 'RENT', label: 'Rent', icon: 'home' },
  { value: 'UTILITIES', label: 'Utilities', icon: 'flash' },
  { value: 'SALARY', label: 'Salary', icon: 'people' },
  { value: 'SUPPLIES', label: 'Supplies', icon: 'cube' },
  { value: 'MAINTENANCE', label: 'Maintenance', icon: 'construct' },
  { value: 'OTHER', label: 'Other', icon: 'ellipsis-horizontal' },
];

export default function ExpensesScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    getMonthlyTotal,
  } = useExpenseStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>(expenses);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | 'all'>('all');

  // Form State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('OTHER');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadMonthlyTotal();
  }, [expenses]);

  useEffect(() => {
    filterExpenses();
  }, [expenses, selectedCategory]);

  const loadMonthlyTotal = async () => {
    const now = new Date();
    const total = await getMonthlyTotal(now.getMonth() + 1, now.getFullYear());
    setMonthlyTotal(total);
  };

  const filterExpenses = () => {
    if (selectedCategory === 'all') {
      setFilteredExpenses(expenses);
    } else {
      setFilteredExpenses(expenses.filter((e) => e.category === selectedCategory));
    }
  };

  const handleOpenModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setDescription(expense.description);
      setAmount(expense.amount.toString());
      setCategory(expense.category);
      setNotes(expense.notes || '');
    } else {
      setEditingExpense(null);
      setDescription('');
      setAmount('');
      setCategory('OTHER');
      setNotes('');
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!description || !amount) return;

    const expenseData: Omit<Expense, 'id'> = {
      description,
      amount: parseFloat(amount),
      category,
      expenseDate: new Date().toISOString(),
      notes: notes || undefined,
    };

    if (editingExpense) {
      await updateExpense(editingExpense.id, expenseData);
    } else {
      await addExpense(expenseData);
    }
    setModalVisible(false);
    await loadMonthlyTotal();
  };

  const handleDelete = async (id: string) => {
    await deleteExpense(id);
    await loadMonthlyTotal();
  };

  const getCategoryInfo = (cat: ExpenseCategory) => {
    return EXPENSE_CATEGORIES.find((c) => c.value === cat) || EXPENSE_CATEGORIES[5];
  };

  const getTotalForCategory = (cat: ExpenseCategory) => {
    return expenses
      .filter((e) => e.category === cat)
      .reduce((sum, e) => sum + e.amount, 0);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Monthly Total Card */}
      <View style={[styles.totalCard, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.totalLabel, { color: theme.colors.textSecondary }]}>
          This Month's Expenses
        </Text>
        <Text style={[styles.totalValue, { color: '#EF4444' }]}>
          ${monthlyTotal.toFixed(2)}
        </Text>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryFilter}
      >
        <TouchableOpacity
          style={[
            styles.categoryChip,
            {
              backgroundColor:
                selectedCategory === 'all' ? theme.colors.primary : theme.colors.card,
            },
          ]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text style={{ color: selectedCategory === 'all' ? 'white' : theme.colors.text }}>
            All
          </Text>
        </TouchableOpacity>
        {EXPENSE_CATEGORIES.map((cat) => {
          const total = getTotalForCategory(cat.value);
          return (
            <TouchableOpacity
              key={cat.value}
              style={[
                styles.categoryChip,
                {
                  backgroundColor:
                    selectedCategory === cat.value ? theme.colors.primary : theme.colors.card,
                },
              ]}
              onPress={() => setSelectedCategory(cat.value)}
            >
              <Ionicons
                name={cat.icon as any}
                size={16}
                color={selectedCategory === cat.value ? 'white' : theme.colors.text}
              />
              <Text
                style={{
                  color: selectedCategory === cat.value ? 'white' : theme.colors.text,
                  marginLeft: 4,
                  fontSize: 12,
                }}
              >
                {cat.label}
              </Text>
              <Text
                style={{
                  color: selectedCategory === cat.value ? 'white' : theme.colors.textSecondary,
                  marginLeft: 4,
                  fontSize: 10,
                }}
              >
                ${total.toFixed(0)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 60 + insets.bottom }}
        renderItem={({ item }) => {
          const catInfo = getCategoryInfo(item.category);
          return (
            <View
              style={[
                styles.item,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary }]}>
                  <Ionicons name={catInfo.icon as any} size={20} color="white" />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: theme.colors.text }]}>
                    {item.description}
                  </Text>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
                    {catInfo.label} • {new Date(item.expenseDate).toLocaleDateString()}
                  </Text>
                  {item.notes && (
                    <Text
                      style={{ color: theme.colors.textSecondary, fontSize: 11, marginTop: 2 }}
                      numberOfLines={1}
                    >
                      {item.notes}
                    </Text>
                  )}
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.amount, { color: '#EF4444', marginRight: 12 }]}>
                  ${item.amount.toFixed(2)}
                </Text>
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
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No expenses recorded yet
            </Text>
          </View>
        }
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
              {editingExpense ? 'Edit Expense' : 'Add Expense'}
            </Text>

            <TextInput
              style={[
                styles.input,
                { color: theme.colors.text, borderColor: theme.colors.border },
              ]}
              placeholder="Description"
              placeholderTextColor={theme.colors.textSecondary}
              value={description}
              onChangeText={setDescription}
            />

            <TextInput
              style={[
                styles.input,
                { color: theme.colors.text, borderColor: theme.colors.border },
              ]}
              placeholder="Amount"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySelector}>
              {EXPENSE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.categorySelectorChip,
                    {
                      backgroundColor:
                        category === cat.value ? theme.colors.primary : theme.colors.background,
                      borderColor: theme.colors.border,
                      borderWidth: 1,
                    },
                  ]}
                  onPress={() => setCategory(cat.value)}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={16}
                    color={category === cat.value ? 'white' : theme.colors.text}
                  />
                  <Text
                    style={{
                      color: category === cat.value ? 'white' : theme.colors.text,
                      fontSize: 12,
                      marginLeft: 4,
                    }}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={[
                styles.input,
                { color: theme.colors.text, borderColor: theme.colors.border, height: 80 },
              ]}
              placeholder="Notes (optional)"
              placeholderTextColor={theme.colors.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />

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
  totalCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  totalLabel: { fontSize: 14, marginBottom: 8 },
  totalValue: { fontSize: 32, fontWeight: 'bold' },
  categoryFilter: {
    marginBottom: 12,
    maxHeight: 40,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
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
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: 'bold' },
  amount: { fontSize: 18, fontWeight: 'bold' },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: { fontSize: 16, marginTop: 16 },
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
  label: { fontSize: 12, marginTop: 8, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12 },
  categorySelector: {
    marginBottom: 12,
    maxHeight: 40,
  },
  categorySelectorChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  button: { padding: 10, marginLeft: 10, borderRadius: 6 },
});
