import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';

interface Props {
  visible: boolean;
  initialItems: string[];
  onClose: () => void;
  onSave: (items: string[]) => void;
}

export function GroupPrayerListModal({ visible, initialItems, onClose, onSave }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    if (visible) {
      setItems([...initialItems]);
      setNewItem('');
    }
  }, [visible, initialItems]);

  const updateItem = (index: number, value: string) => {
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? value : item));
  };

  const removeItem = (index: number) => {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const addItem = () => {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    setItems((current) => [...current, trimmed]);
    setNewItem('');
  };

  const handleSave = () => {
    const cleanedItems = items.map((item) => item.trim()).filter(Boolean);
    onSave(cleanedItems);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View
          style={[
            styles.header,
            {
              borderBottomColor: colors.border,
              paddingTop: (Platform.OS === 'web' ? 67 : insets.top) + 12,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Close prayer list editor"
          >
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>Group Prayer List</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Add requests and keep your circle praying with purpose.
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        >
          <View style={styles.sectionHeading}>
            <View style={styles.sectionHeadingText}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                PRAYER REQUESTS
              </Text>
              <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
                Tap any request to edit it.
              </Text>
            </View>
            <Text style={[styles.itemCount, { color: colors.primary }]}>
              {items.length} {items.length === 1 ? 'request' : 'requests'}
            </Text>
          </View>

          {items.length === 0 && (
            <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="clipboard" size={24} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No requests yet
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Add the first request your circle can carry together.
              </Text>
            </View>
          )}

          <View style={styles.itemList}>
            {items.map((item, index) => (
              <View
                key={`prayer-request-${index}`}
                style={[styles.itemRow, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.numberBadge, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.numberText, { color: colors.primary }]}>{index + 1}</Text>
                </View>
                <TextInput
                  style={[styles.itemInput, { color: colors.foreground }]}
                  value={item}
                  onChangeText={(value) => updateItem(index, value)}
                  placeholder="Prayer request"
                  placeholderTextColor={colors.mutedForeground}
                  maxLength={180}
                  multiline
                  textAlignVertical="top"
                  accessibilityLabel={`Prayer request ${index + 1}`}
                />
                <TouchableOpacity
                  onPress={() => removeItem(index)}
                  style={styles.removeButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove prayer request ${index + 1}`}
                >
                  <Feather name="trash-2" size={18} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.addSection}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ADD REQUEST</Text>
            <View style={[styles.addRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                style={[styles.addInput, { color: colors.foreground }]}
                value={newItem}
                onChangeText={setNewItem}
                placeholder="e.g. Peace for our families"
                placeholderTextColor={colors.mutedForeground}
                maxLength={180}
                multiline
                textAlignVertical="top"
                onSubmitEditing={addItem}
                accessibilityLabel="New prayer request"
              />
              <TouchableOpacity
                onPress={addItem}
                disabled={!newItem.trim()}
                style={[styles.addButton, { backgroundColor: colors.primary, opacity: newItem.trim() ? 1 : 0.45 }]}
                accessibilityRole="button"
                accessibilityLabel="Add prayer request"
              >
                <Feather name="plus" size={20} color={colors.primaryForeground} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Save group prayer list"
          >
            <Feather name="check" size={18} color={colors.primaryForeground} />
            <Text style={[styles.saveButtonText, { color: colors.primaryForeground }]}>Save Prayer List</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderBottomWidth: 1,
  },
  handle: { width: 36, height: 4, borderRadius: 2, marginBottom: 14 },
  closeButton: { position: 'absolute', right: 18, bottom: 18, padding: 4 },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 5, textAlign: 'center' },
  content: { padding: 20, gap: 12 },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionHeadingText: { flex: 1 },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0.9 },
  sectionHint: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 3 },
  itemCount: { fontSize: 12, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  emptyState: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 26,
    gap: 7,
  },
  emptyTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginTop: 2 },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 19 },
  itemList: { gap: 8 },
  itemRow: {
    minHeight: 66,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 10,
  },
  numberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  numberText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  itemInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    paddingVertical: 2,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  removeButton: { padding: 4, alignSelf: 'flex-start', marginTop: 2 },
  addSection: { gap: 8, marginTop: 4 },
  addRow: {
    minHeight: 60,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 8,
    gap: 8,
  },
  addInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 42,
    paddingVertical: 2,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    minHeight: 50,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  saveButtonText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
});