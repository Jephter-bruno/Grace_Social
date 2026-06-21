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

import { AvatarCircle } from '@/components/AvatarCircle';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';

const REEL_BACKGROUNDS = [
  { id: 0, label: 'Worship', emoji: '🎵', color: '#4A90A4' },
  { id: 1, label: 'Testimony', emoji: '🙏', color: '#27AE60' },
  { id: 2, label: 'Scripture', emoji: '📖', color: '#8B5CF6' },
  { id: 3, label: 'Devotion', emoji: '☀️', color: '#F59E0B' },
  { id: 4, label: 'Prayer', emoji: '💙', color: '#E91E8C' },
];

const VERSE_SUGGESTIONS = [
  { reference: 'Psalm 100:1', text: 'Make a joyful noise to the Lord, all the earth!' },
  { reference: 'Philippians 4:4', text: 'Rejoice in the Lord always. I will say it again: Rejoice!' },
  { reference: 'Psalm 150:6', text: 'Let everything that has breath praise the Lord.' },
  { reference: 'Colossians 3:16', text: 'Let the message of Christ dwell among you richly... singing to God with gratitude in your hearts.' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function NewReelModal({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addReel } = useApp();
  const { currentUser } = useAuth();
  const isWeb = Platform.OS === 'web';

  const [description, setDescription] = useState('');
  const [selectedBg, setSelectedBg] = useState(0);
  const [verseEnabled, setVerseEnabled] = useState(false);
  const [verseRef, setVerseRef] = useState('');
  const [verseText, setVerseText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const canPost = description.trim().length > 0;

  const applyVerseSuggestion = (v: typeof VERSE_SUGGESTIONS[0]) => {
    setVerseRef(v.reference);
    setVerseText(v.text);
  };

  const handlePost = () => {
    if (!canPost) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    addReel({
      userName: currentUser?.displayName || currentUser?.name || 'You',
      userHandle: currentUser?.handle || '@gracemember',
      userInitials: currentUser?.initials || 'ME',
      userColor: currentUser?.color || '#4A90A4',
      description: description.trim(),
      bibleVerse: verseEnabled && verseRef.trim() ? `${verseRef} — "${verseText}"` : '',
      likes: 0,
      comments: 0,
      isLiked: false,
      imageIndex: selectedBg,
      duration: '0:15',
      isFollowing: false,
    });

    setSubmitted(true);
    setTimeout(() => {
      reset();
      onClose();
    }, 1400);
  };

  const reset = () => {
    setDescription('');
    setSelectedBg(0);
    setVerseEnabled(false);
    setVerseRef('');
    setVerseText('');
    setSubmitted(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={[styles.root, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={{ marginTop: isWeb ? 16 : insets.top + 8, alignItems: 'center' }}>
          <View style={[styles.handleBar, { backgroundColor: colors.border }]} />
        </View>

        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>New Reel</Text>
          <TouchableOpacity
            style={[styles.postBtn, { backgroundColor: canPost ? colors.primary : colors.muted }]}
            onPress={handlePost}
            disabled={!canPost}
          >
            <Text style={[styles.postBtnText, { color: canPost ? '#fff' : colors.mutedForeground }]}>Post</Text>
          </TouchableOpacity>
        </View>

        {submitted ? (
          <View style={styles.successView}>
            <View style={[styles.successCircle, { backgroundColor: colors.primary + '20' }]}>
              <Feather name="film" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.successTitle, { color: colors.foreground }]}>Reel Posted!</Text>
            <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
              Your reel is now live in the feed
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.authorRow}>
              <AvatarCircle
                initials={currentUser?.initials || 'ME'}
                color={currentUser?.color || '#4A90A4'}
                avatarUrl={currentUser?.avatarUrl}
                size={44}
              />
              <View style={styles.authorInfo}>
                <Text style={[styles.authorName, { color: colors.foreground }]}>
                  {currentUser?.displayName || currentUser?.name || 'You'}
                </Text>
                <Text style={[styles.authorHandle, { color: colors.mutedForeground }]}>
                  {currentUser?.handle || '@gracemember'}
                </Text>
              </View>
            </View>

            <TextInput
              style={[styles.descInput, { color: colors.foreground }]}
              placeholder="Share what God is doing in your life..."
              placeholderTextColor={colors.mutedForeground}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={300}
              autoFocus
            />

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>BACKGROUND STYLE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bgOptions}>
              {REEL_BACKGROUNDS.map((bg) => (
                <TouchableOpacity
                  key={bg.id}
                  style={[
                    styles.bgOption,
                    {
                      backgroundColor: selectedBg === bg.id ? bg.color : colors.muted,
                      borderColor: selectedBg === bg.id ? bg.color : colors.border,
                      borderWidth: selectedBg === bg.id ? 2 : 1,
                    },
                  ]}
                  onPress={() => { Haptics.selectionAsync(); setSelectedBg(bg.id); }}
                >
                  <Text style={styles.bgEmoji}>{bg.emoji}</Text>
                  <Text style={[styles.bgLabel, { color: selectedBg === bg.id ? '#fff' : colors.mutedForeground }]}>
                    {bg.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={[
                styles.verseToggle,
                {
                  backgroundColor: verseEnabled ? colors.accent + '15' : colors.muted,
                  borderColor: verseEnabled ? colors.accent : colors.border,
                },
              ]}
              onPress={() => { Haptics.selectionAsync(); setVerseEnabled((v) => !v); }}
            >
              <Feather name="book-open" size={16} color={verseEnabled ? colors.accent : colors.mutedForeground} />
              <Text style={[styles.verseToggleText, { color: verseEnabled ? colors.accent : colors.mutedForeground }]}>
                {verseEnabled ? 'Bible verse added' : 'Add a Bible verse'}
              </Text>
              <Feather name={verseEnabled ? 'chevron-up' : 'chevron-down'} size={16} color={verseEnabled ? colors.accent : colors.mutedForeground} />
            </TouchableOpacity>

            {verseEnabled && (
              <View style={[styles.verseSection, { borderColor: colors.border }]}>
                <TextInput
                  style={[styles.verseRefInput, { color: colors.foreground, borderBottomColor: colors.border }]}
                  placeholder="Reference (e.g. John 3:16)"
                  placeholderTextColor={colors.mutedForeground}
                  value={verseRef}
                  onChangeText={setVerseRef}
                />
                <TextInput
                  style={[styles.verseBodyInput, { color: colors.foreground }]}
                  placeholder="Verse text..."
                  placeholderTextColor={colors.mutedForeground}
                  value={verseText}
                  onChangeText={setVerseText}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
                <Text style={[styles.suggestLabel, { color: colors.mutedForeground }]}>QUICK PICKS</Text>
                {VERSE_SUGGESTIONS.map((v) => (
                  <TouchableOpacity
                    key={v.reference}
                    style={[styles.verseSuggestion, { backgroundColor: colors.muted }]}
                    onPress={() => applyVerseSuggestion(v)}
                  >
                    <Text style={[styles.verseSugRef, { color: colors.primary }]}>{v.reference}</Text>
                    <Text style={[styles.verseSugText, { color: colors.foreground }]} numberOfLines={1}>
                      {v.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  handleBar: { width: 36, height: 4, borderRadius: 2, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 0.5 },
  closeBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  postBtn: { borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8 },
  postBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  body: { flex: 1, padding: 16 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  authorInfo: { gap: 2 },
  authorName: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  authorHandle: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  descInput: { fontSize: 16, fontFamily: 'Inter_400Regular', lineHeight: 24, minHeight: 100, marginBottom: 16 },
  divider: { height: 0.5, marginVertical: 16 },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0.8, marginBottom: 12 },
  bgOptions: { gap: 10, paddingBottom: 4 },
  bgOption: { alignItems: 'center', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, gap: 4, minWidth: 80 },
  bgEmoji: { fontSize: 24 },
  bgLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  verseToggle: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, padding: 14, borderWidth: 1 },
  verseToggleText: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium' },
  verseSection: { marginTop: 10, borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  verseRefInput: { fontSize: 14, fontFamily: 'Inter_600SemiBold', borderBottomWidth: 0.5, paddingBottom: 8 },
  verseBodyInput: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21, minHeight: 60 },
  suggestLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.8, marginTop: 4 },
  verseSuggestion: { borderRadius: 10, padding: 10, gap: 2 },
  verseSugRef: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  verseSugText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  successView: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 40 },
  successCircle: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  successSub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
});
