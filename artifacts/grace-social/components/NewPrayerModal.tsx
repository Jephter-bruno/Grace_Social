import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
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

import { PrayerCategory, useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';

const CATEGORIES: { key: PrayerCategory; label: string; icon: string; color: string }[] = [
  { key: 'health', label: 'Health', icon: 'activity', color: '#27AE60' },
  { key: 'family', label: 'Family', icon: 'users', color: '#2980B9' },
  { key: 'faith', label: 'Faith', icon: 'heart', color: '#E91E8C' },
  { key: 'work', label: 'Work', icon: 'briefcase', color: '#F39C12' },
  { key: 'gratitude', label: 'Gratitude', icon: 'star', color: '#D4A843' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function NewPrayerModal({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addPrayer } = useApp();
  const { currentUser } = useAuth();
  const isWeb = Platform.OS === 'web';

  const [request, setRequest] = useState('');
  const [category, setCategory] = useState<PrayerCategory>('faith');
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = request.trim().length > 10;

  const handleSubmit = () => {
    if (!canSubmit) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addPrayer({
      userName: currentUser?.displayName || currentUser?.name || 'You',
      userInitials: currentUser?.initials || 'ME',
      userColor: currentUser?.color || '#4A90A4',
      request: request.trim(),
      prayerCount: 0,
      isPraying: false,
      timestamp: 'just now',
      category,
    });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setRequest('');
      setCategory('faith');
      onClose();
    }, 1400);
  };

  const handleClose = () => {
    setRequest('');
    setCategory('faith');
    setSubmitted(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={[styles.root, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View
          style={[
            styles.handle,
            { marginTop: isWeb ? 16 : insets.top + 8 },
          ]}
        >
          <View style={[styles.handleBar, { backgroundColor: colors.border }]} />
        </View>

        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            New Prayer Request
          </Text>
          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: canSubmit ? colors.primary : colors.muted },
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            <Text
              style={[
                styles.submitText,
                { color: canSubmit ? colors.primaryForeground : colors.mutedForeground },
              ]}
            >
              Share
            </Text>
          </TouchableOpacity>
        </View>

        {submitted ? (
          <View style={styles.successContainer}>
            <View style={[styles.successCircle, { backgroundColor: colors.primary + '20' }]}>
              <Feather name="check-circle" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.successTitle, { color: colors.foreground }]}>
              Prayer Shared
            </Text>
            <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
              The community will be praying for you
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              CATEGORY
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesRow}
            >
              {CATEGORIES.map((cat) => {
                const isActive = category === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.catChip,
                      {
                        backgroundColor: isActive ? cat.color + '18' : colors.muted,
                        borderColor: isActive ? cat.color : colors.border,
                        borderWidth: isActive ? 1.5 : 1,
                      },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setCategory(cat.key);
                    }}
                  >
                    <Feather
                      name={cat.icon as any}
                      size={14}
                      color={isActive ? cat.color : colors.mutedForeground}
                    />
                    <Text
                      style={[
                        styles.catLabel,
                        { color: isActive ? cat.color : colors.mutedForeground },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>
              YOUR REQUEST
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              placeholder="Share what's on your heart. The community will pray with you..."
              placeholderTextColor={colors.mutedForeground}
              value={request}
              onChangeText={setRequest}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              maxLength={500}
              autoFocus
            />
            <Text style={[styles.charCount, { color: colors.mutedForeground }]}>
              {request.length}/500
            </Text>

            <View style={[styles.encouragement, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Feather name="heart" size={16} color={colors.accent} />
              <Text style={[styles.encouragementText, { color: colors.mutedForeground }]}>
                "Cast all your anxiety on him because he cares for you." — 1 Peter 5:7
              </Text>
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  handle: {
    alignItems: 'center',
    marginBottom: 4,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  closeBtn: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
  },
  submitBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  submitText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  body: {
    flex: 1,
    padding: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
    marginBottom: 10,
  },
  categoriesRow: {
    gap: 8,
    paddingBottom: 4,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  catLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
    minHeight: 160,
  },
  charCount: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'right',
    marginTop: 6,
  },
  encouragement: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  encouragementText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 40,
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  successSub: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
});
