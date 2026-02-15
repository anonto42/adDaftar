import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/shared/theme';
import { useBusinessStore } from '@/src/features/business';
import { ScreenHeader, Button, GlassCard } from '@/src/shared/components';

export default function BusinessProfileScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { 
    businesses, 
    activeBusinessId, 
    activeBusiness,
    setActiveBusinessId, 
    addBusiness, 
    updateBusiness, 
    deleteBusiness 
  } = useBusinessStore();

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<{ id: string, name: string, description: string } | null>(null);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const handleAddBusiness = async () => {
    if (!newName.trim()) {
      Alert.alert('Error', 'Business name is required');
      return;
    }

    try {
      await addBusiness({
        name: newName,
        description: newDescription,
      });
      setNewName('');
      setNewDescription('');
      setIsAddModalVisible(false);
      Alert.alert('Success', 'Business added successfully');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to add business');
    }
  };

  const handleUpdateBusiness = async () => {
    if (!editingBusiness || !editingBusiness.name.trim()) {
      Alert.alert('Error', 'Business name is required');
      return;
    }

    try {
      await updateBusiness(editingBusiness.id, {
        name: editingBusiness.name,
        description: editingBusiness.description,
      });
      setIsEditModalVisible(false);
      setEditingBusiness(null);
      Alert.alert('Success', 'Business updated successfully');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update business');
    }
  };

  const handleDeleteBusiness = (id: string, name: string) => {
    if (businesses.length <= 1) {
      Alert.alert('Error', 'You must have at least one business');
      return;
    }

    Alert.alert(
      'Delete Business',
      `Are you sure you want to delete "${name}"? All data associated with this business (products, sales, etc.) will be permanently deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBusiness(id);
              Alert.alert('Success', 'Business deleted successfully');
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'Failed to delete business');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Manage Businesses',
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        headerShadowVisible: false,
      }} />

      <ScrollView 
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader 
          title="Businesses" 
          subtitle="Multi-business management" 
          topTitle={activeBusiness?.name}
          icon="business" 
        />

        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, marginTop: 24 }]}>
          Your Businesses
        </Text>

        {businesses.map((business) => (
          <GlassCard
            key={business.id}
            style={StyleSheet.flatten([
              styles.businessCard,
              activeBusinessId === business.id && { borderColor: theme.colors.primary, borderWidth: 2 }
            ])}
          >
            <TouchableOpacity 
              style={styles.businessContent}
              onPress={() => setActiveBusinessId(business.id)}
            >
              <View style={styles.businessInfo}>
                <View style={[styles.iconContainer, { backgroundColor: activeBusinessId === business.id ? theme.colors.primary : theme.colors.card }]}>
                  <Ionicons 
                    name="business" 
                    size={24} 
                    color={activeBusinessId === business.id ? '#FFF' : theme.colors.primary} 
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={[styles.businessName, { color: theme.colors.text }]}>
                    {business.name}
                  </Text>
                  {business.description ? (
                    <Text style={[styles.businessDesc, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                      {business.description}
                    </Text>
                  ) : null}
                  {activeBusinessId === business.id && (
                    <View style={[styles.activeBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                      <Text style={{ color: theme.colors.primary, fontSize: 10, fontWeight: 'bold' }}>ACTIVE</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.businessActions}>
                <TouchableOpacity 
                  onPress={() => {
                    setEditingBusiness({ id: business.id, name: business.name, description: business.description || '' });
                    setIsEditModalVisible(true);
                  }}
                  style={styles.actionButton}
                >
                  <Ionicons name="pencil" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleDeleteBusiness(business.id, business.name)}
                  style={styles.actionButton}
                >
                  <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </GlassCard>
        ))}

        <Button
          title="Add New Business"
          onPress={() => setIsAddModalVisible(true)}
          variant="outline"
          leftIcon={<Ionicons name="add" size={20} color={theme.colors.primary} />}
          style={{ marginTop: 16 }}
        />
      </ScrollView>

      {/* Add Business Modal */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Add Business</Text>
            
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Business Name</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="Enter business name"
              placeholderTextColor={theme.colors.textTertiary}
              value={newName}
              onChangeText={setNewName}
            />

            <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 16 }]}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, height: 80 }]}
              placeholder="Enter business description"
              placeholderTextColor={theme.colors.textTertiary}
              value={newDescription}
              onChangeText={setNewDescription}
              multiline
            />

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setIsAddModalVisible(false)}
                variant="ghost"
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Add"
                onPress={handleAddBusiness}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Business Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Edit Business</Text>
            
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Business Name</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="Enter business name"
              placeholderTextColor={theme.colors.textTertiary}
              value={editingBusiness?.name || ''}
              onChangeText={(text) => setEditingBusiness(prev => prev ? { ...prev, name: text } : null)}
            />

            <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 16 }]}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, height: 80 }]}
              placeholder="Enter business description"
              placeholderTextColor={theme.colors.textTertiary}
              value={editingBusiness?.description || ''}
              onChangeText={(text) => setEditingBusiness(prev => prev ? { ...prev, description: text } : null)}
              multiline
            />

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setIsEditModalVisible(false)}
                variant="ghost"
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Update"
                onPress={handleUpdateBusiness}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionTitle: { fontSize: 13, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  businessCard: { marginBottom: 16, padding: 0, overflow: 'hidden' },
  businessContent: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  businessInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  businessName: { fontSize: 18, fontWeight: 'bold' },
  businessDesc: { fontSize: 14, marginTop: 2 },
  activeBadge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  businessActions: { flexDirection: 'row', alignItems: 'center' },
  actionButton: { padding: 8, marginLeft: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 24, padding: 24, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16 },
  modalButtons: { flexDirection: 'row', marginTop: 24 },
});
