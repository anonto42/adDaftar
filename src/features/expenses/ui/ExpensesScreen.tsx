import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/shared/theme';
import { useExpenseStore } from '../model/expense.store';
import { useAppStore } from '@/src/features/settings';
import { Expense, ExpenseCategory } from '@/src/shared/types/shop.types';
import { PressableScale, ScreenHeader } from '@/src/shared/components';
import { formatCurrency } from '@/src/shared/utils/format';

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
  const { currency } = useAppStore();

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

  const loadMonthlyTotal = useCallback(async () => {
    const now = new Date();
    const total = await getMonthlyTotal(now.getMonth() + 1, now.getFullYear());
    setMonthlyTotal(total);
  }, [getMonthlyTotal]);

  const filterExpenses = useCallback(() => {
    if (selectedCategory === 'all') {
      setFilteredExpenses(expenses);
    } else {
      setFilteredExpenses(expenses.filter((e) => e.category === selectedCategory));
    }
  }, [expenses, selectedCategory]);

  useEffect(() => {
    loadMonthlyTotal();
  }, [loadMonthlyTotal]);

  useEffect(() => {
    filterExpenses();
  }, [filterExpenses]);

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
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount greater than 0');
      return;
    }

    const expenseData: Omit<Expense, 'id' | 'businessId'> = {
      description: description.trim(),
      amount: parsedAmount,
      category,
      expenseDate: new Date().toISOString(),
      notes: notes.trim() || undefined,
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
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top + 16 }]}>
      <ScreenHeader 
        title="Expenses" 
        subtitle="Cash Out" 
        icon="receipt" 
      />

      {/* Monthly Total Card */}
      <View style={[styles.totalCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Text style={[styles.totalLabel, { color: theme.colors.textSecondary }]}>
          This Month&apos;s Expenses
        </Text>
        <Text style={[styles.totalValue, { color: theme.colors.error, fontVariant: ['tabular-nums'] }]}>
          {formatCurrency(monthlyTotal, currency)}
        </Text>
      </View>

      {/* Category Filter */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryFilter}
        >
          <PressableScale
            style={[
              styles.categoryChip,
              {
                backgroundColor:
                  selectedCategory === 'all' ? theme.colors.primary : theme.colors.card,
                borderColor: selectedCategory === 'all' ? theme.colors.primary : theme.colors.border,
                borderWidth: 1,
              },
            ]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={{ color: selectedCategory === 'all' ? 'white' : theme.colors.text, fontWeight: '600', fontSize: 13 }}>
              All
            </Text>
          </PressableScale>
          {EXPENSE_CATEGORIES.map((cat) => {
            const total = getTotalForCategory(cat.value);
            return (
              <PressableScale
                key={cat.value}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor:
                      selectedCategory === cat.value ? theme.colors.primary : theme.colors.card,
                    borderColor: selectedCategory === cat.value ? theme.colors.primary : theme.colors.border,
                    borderWidth: 1,
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
                    fontSize: 13,
                    fontWeight: '600',
                  }}
                >
                  {cat.label}
                </Text>
                <Text
                  style={{
                    color: selectedCategory === cat.value ? 'white' : theme.colors.textTertiary,
                    marginLeft: 6,
                    fontSize: 11,
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {formatCurrency(total, currency).split('.')[0]}
                </Text>
              </PressableScale>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const catInfo = getCategoryInfo(item.category);
          return (
            <PressableScale
              style={[
                styles.item,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
              ]}
              onPress={() => handleOpenModal(item)}
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
                      style={{ color: theme.colors.textTertiary, fontSize: 11, marginTop: 2 }}
                      numberOfLines={1}
                    >
                      {item.notes}
                    </Text>
                  )}
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.amount, { color: theme.colors.error, marginRight: 12, fontVariant: ['tabular-nums'] }]}>
                  {formatCurrency(item.amount, currency)}
                </Text>
                <TouchableOpacity
                  onPress={() => handleDelete(item.id)}
                  style={[styles.actionButton, { backgroundColor: theme.colors.error + '10' }]}
                >
                  <Ionicons name="trash" size={20} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            </PressableScale>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={theme.colors.textTertiary} />
            <Text style={[styles.emptyText, { color: theme.colors.textTertiary }]}>
              No expenses recorded yet
            </Text>
          </View>
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
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Save</Text>
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
  totalCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  totalLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  totalValue: { fontSize: 32, fontWeight: 'bold' },
  categoryFilter: {
    marginBottom: 16,
    maxHeight: 44,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
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
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: 'bold' },
  amount: { fontSize: 17, fontWeight: 'bold' },
  actionButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: { fontSize: 16, marginTop: 16, fontWeight: '500' },
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
  label: { fontSize: 12, fontWeight: '600', marginTop: 12, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12, fontSize: 15 },
  categorySelector: {
    marginBottom: 12,
    maxHeight: 44,
  },
  categorySelectorChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 },
  button: { paddingVertical: 12, paddingHorizontal: 20, marginLeft: 12, borderRadius: 10 },
});