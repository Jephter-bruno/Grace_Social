import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useRef, useState } from 'react';
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

import { AvatarCircle } from '@/components/AvatarCircle';
import { VideoPlayer } from '@/components/VideoPlayer';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';

interface Props {
  visible: boolean;
  onClose: () => void;
  initialVerse?: { reference: string; text: string } | null;
}

export function NewPostModal({ visible, onClose, initialVerse }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addPost } = useApp();
  const { currentUser } = useAuth();
  const isWeb = Platform.OS === 'web';

  const [caption, setCaption] = useState('');
  const [verseEnabled, setVerseEnabled] = useState(false);
  const [verseRef, setVerseRef] = useState('');
  const [verseText, setVerseText] = useState('');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pickingMedia, setPickingMedia] = useState(false);

  const captionRef = useRef<TextInput>(null);

  React.useEffect(() => {
    if (visible && initialVerse) {
      setVerseEnabled(true);
      setVerseRef(initialVerse.reference);
      setVerseText(initialVerse.text);
    }
  }, [visible, initialVerse]);

  const canShare = caption.trim().length > 0;

  const pickImage = async () => {
    Haptics.selectionAsync();
    setPickingMedia(true);
    try {
      if (!isWeb) {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (perm.status !== 'granted') {
          setPickingMedia(false);
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
        aspect: [4, 3],
      });
      if (!result.canceled && result.assets[0]) {
        setMediaUri(result.assets[0].uri);
        setMediaType('image');
      }
    } catch {
    } finally {
      setPickingMedia(false);
    }
  };

  const pickVideo = async () => {
    Haptics.selectionAsync();
    setPickingMedia(true);
    try {
      if (!isWeb) {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (perm.status !== 'granted') {
          setPickingMedia(false);
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        videoMaxDuration: 60,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setMediaUri(result.assets[0].uri);
        setMediaType('video');
      }
    } catch {
    } finally {
      setPickingMedia(false);
    }
  };

  const pickCamera = async () => {
    Haptics.selectionAsync();
    setPickingMedia(true);
    try {
      if (!isWeb) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (perm.status !== 'granted') {
          setPickingMedia(false);
          return;
        }
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setMediaUri(asset.uri);
        setMediaType(asset.type === 'video' ? 'video' : 'image');
      }
    } catch {
    } finally {
      setPickingMedia(false);
    }
  };

  const clearMedia = () => {
    setMediaUri(null);
    setMediaType(null);
  };

  const handleShare = () => {
    if (!canShare) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    addPost({
      userId: 'currentUser',
      userName: currentUser?.displayName || currentUser?.name || 'You',
      userHandle: currentUser?.handle || '@gracemember',
      userInitials: currentUser?.initials || 'ME',
      userColor: currentUser?.color || '#4A90A4',
      imageIndex: null,
      localImageUri: mediaType === 'image' ? (mediaUri ?? undefined) : undefined,
      videoUri: mediaType === 'video' ? (mediaUri ?? undefined) : undefined,
      caption: caption.trim(),
      bibleVerse:
        verseEnabled && verseRef.trim() && verseText.trim()
          ? { reference: verseRef.trim(), text: verseText.trim() }
          : undefined,
      likes: 0,
      comments: 0,
      isLiked: false,
      isSaved: false,
      timestamp: 'just now',
    });

    setSubmitted(true);
    setTimeout(() => {
      reset();
      onClose();
    }, 1400);
  };

  const reset = () => {
    setCaption('');
    setVerseEnabled(false);
    setVerseRef('');
    setVerseText('');
    setMediaUri(null);
    setMediaType(null);
    setSubmitted(false);
    setPickingMedia(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const toggleVerse = () => {
    Haptics.selectionAsync();
    setVerseEnabled((v) => !v);
  };

  const MEDIA_BTNS = [
    { key: 'image' as const, icon: 'image', label: 'Photo', onPress: pickImage },
    { key: 'video' as const, icon: 'video', label: 'Video', onPress: pickVideo },
    ...(!isWeb ? [{ key: 'camera' as const, icon: 'camera', label: 'Camera', onPress: pickCamera }] : []),
  ];

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
        <View style={{ marginTop: isWeb ? 16 : insets.top + 8, alignItems: 'center' }}>
          <View style={[styles.handleBar, { backgroundColor: colors.border }]} />
        </View>

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>New Post</Text>
          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: canShare ? colors.primary : colors.muted }]}
            onPress={handleShare}
            disabled={!canShare}
          >
            <Text style={[styles.shareBtnText, { color: canShare ? '#fff' : colors.mutedForeground }]}>
              Share
            </Text>
          </TouchableOpacity>
        </View>

        {submitted ? (
          <View style={styles.successView}>
            <View style={[styles.successCircle, { backgroundColor: colors.primary + '20' }]}>
              <Feather name="check-circle" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.successTitle, { color: colors.foreground }]}>Post Shared!</Text>
            <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
              Your post is now visible to the community
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Author */}
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

            {/* Caption */}
            <TextInput
              ref={captionRef}
              style={[styles.captionInput, { color: colors.foreground }]}
              placeholder="What's on your heart today?"
              placeholderTextColor={colors.mutedForeground}
              value={caption}
              onChangeText={setCaption}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
              autoFocus
            />

            {/* Media preview */}
            {mediaUri ? (
              <View style={styles.previewWrap}>
                {mediaType === 'image' ? (
                  <Image source={{ uri: mediaUri }} style={styles.mediaPreview} contentFit="cover" />
                ) : (
                  <VideoPlayer uri={mediaUri} isActive muted style={styles.mediaPreview} />
                )}
                <TouchableOpacity style={styles.removeBtn} onPress={clearMedia}>
                  <Feather name="x" size={16} color="#fff" />
                </TouchableOpacity>
                <View style={styles.mediaBadge}>
                  <Feather name={mediaType === 'video' ? 'video' : 'image'} size={11} color="#fff" />
                  <Text style={styles.mediaBadgeText}>{mediaType === 'video' ? 'Video' : 'Photo'}</Text>
                </View>
              </View>
            ) : (
              /* Media picker buttons — only shown when no media selected */
              <View style={styles.mediaPicker}>
                {MEDIA_BTNS.map((btn) => (
                  <TouchableOpacity
                    key={btn.key}
                    style={[styles.mediaBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                    onPress={btn.onPress}
                    disabled={pickingMedia}
                  >
                    {pickingMedia ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Feather name={btn.icon as any} size={22} color={colors.primary} />
                    )}
                    <Text style={[styles.mediaBtnLabel, { color: colors.foreground }]}>{btn.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Bible verse toggle */}
            <TouchableOpacity
              style={[
                styles.verseToggle,
                {
                  backgroundColor: verseEnabled ? colors.accent + '15' : colors.muted,
                  borderColor: verseEnabled ? colors.accent : colors.border,
                },
              ]}
              onPress={toggleVerse}
            >
              <Feather name="book-open" size={16} color={verseEnabled ? colors.accent : colors.mutedForeground} />
              <Text style={[styles.verseToggleText, { color: verseEnabled ? colors.accent : colors.mutedForeground }]}>
                {verseEnabled ? 'Bible verse added' : 'Add a Bible verse'}
              </Text>
              <Feather
                name={verseEnabled ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={verseEnabled ? colors.accent : colors.mutedForeground}
              />
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
  handleBar: { width: 36, height: 4, borderRadius: 2, marginBottom: 4 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  closeBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  shareBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  shareBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  successView: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 40 },
  successCircle: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  successSub: { fontSize: 15, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22 },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  authorInfo: { gap: 2 },
  authorName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  authorHandle: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  captionInput: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    lineHeight: 24,
    minHeight: 80,
    marginBottom: 16,
  },
  previewWrap: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  mediaPreview: { width: '100%', height: '100%' },
  removeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  mediaBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mediaBadgeText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  mediaPicker: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  mediaBtn: {
    flex: 1,
    height: 80,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
  },
  mediaBtnLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  divider: { height: 0.5, marginBottom: 16 },
  verseToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  verseToggleText: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium' },
  verseSection: { borderWidth: 1, borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  verseRefInput: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    padding: 12,
    borderBottomWidth: 0.5,
  },
  verseBodyInput: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
    padding: 12,
    lineHeight: 20,
    minHeight: 80,
  },
});
