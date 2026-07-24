import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  ActivityIndicator,
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

const AMBER = '#D4A843';
const CORAL = '#E07A54';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (title: string, content: string) => Promise<boolean>;
}

export function NewTestimonyModal({ visible, onClose, onSubmit }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const canSubmit = title.trim().length > 2 && content.trim().length > 10 && !submitting;

  const handleClose = () => {
    setTitle('');
    setContent('');
    setSuccess(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const ok = await onSubmit(title.trim(), content.trim());
    setSubmitting(false);
    if (ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);
      setTimeout(handleClose, 1600);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              paddingTop: isWeb ? 24 : insets.top + 10,
              borderBottomColor: colors.border,
              backgroundColor: colors.background,
            },
          ]}
        >
          <TouchableOpacity onPress={handleClose} style={styles.cancelBtn}>
            <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Share Testimony</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={[
              styles.shareBtn,
              { backgroundColor: canSubmit ? CORAL : colors.muted },
            ]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={[styles.shareBtnText, { color: canSubmit ? '#fff' : colors.mutedForeground }]}>
                Share
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Success state */}
        {success ? (
          <View style={styles.successState}>
            <View style={styles.successCircle}>
              <Feather name="check" size={36} color="#fff" />
            </View>
            <Text style={[styles.successTitle, { color: colors.foreground }]}>
              Testimony Shared! ✨
            </Text>
            <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
              Your testimony encourages the community
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.body,
              { paddingBottom: isWeb ? 40 : insets.bottom + 40 },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            {/* Answered badge preview */}
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>✨ Answered</Text>
              </View>
              <Text style={[styles.badgeHint, { color: colors.mutedForeground }]}>
                Your testimony marks God's faithfulness
              </Text>
            </View>

            {/* Title */}
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Title *</Text>
            <TextInput
              style={[styles.titleInput, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
              placeholder="e.g. God opened the door!"
              placeholderTextColor={colors.mutedForeground}
              value={title}
              onChangeText={setTitle}
              maxLength={80}
              returnKeyType="next"
            />

            {/* Content */}
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Your Testimony *</Text>
            <TextInput
              style={[styles.contentInput, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
              placeholder="Share how God answered your prayer or moved in your life..."
              placeholderTextColor={colors.mutedForeground}
              value={content}
              onChangeText={setContent}
              multiline
              maxLength={800}
              textAlignVertical="top"
            />
            <Text style={[styles.charCount, { color: colors.mutedForeground }]}>
              {content.length}/800
            </Text>

            {/* Encouragement */}
            <View style={[styles.encourageCard, { backgroundColor: colors.card, borderColor: AMBER + '40' }]}>
              <Text style={styles.encourageIcon}>🙏</Text>
              <Text style={[styles.encourageText, { color: colors.mutedForeground }]}>
                Your story of God's faithfulness can strengthen someone else's faith today.
              </Text>
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
  },
  cancelBtn: { minWidth: 60 },
  cancelText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontFamily: 'Inter_700Bold' },
  shareBtn: {
    minWidth: 60,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  shareBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },

  body: { paddingHorizontal: 16, paddingTop: 22, gap: 6 },

  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  badge: {
    backgroundColor: AMBER + '28',
    borderWidth: 1,
    borderColor: AMBER + '55',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: AMBER },
  badgeHint: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular' },

  fieldLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 12,
    marginBottom: 8,
  },
  titleInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  contentInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    minHeight: 150,
  },
  charCount: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'right',
    marginTop: 4,
  },

  encourageCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 16,
  },
  encourageIcon: { fontSize: 20 },
  encourageText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },

  // Success
  successState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32 },
  successCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#27AE60',
    alignItems: 'center', justifyContent: 'center',
  },
  successTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  successSub: { fontSize: 15, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22 },
});
