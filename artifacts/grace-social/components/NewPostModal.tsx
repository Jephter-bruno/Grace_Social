import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import React, { useRef, useState } from 'react';
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
import { POST_IMAGES } from '@/constants/images';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';

const IMAGE_OPTIONS = [
  { index: 0, label: 'Community' },
  { index: 1, label: 'Sunrise' },
  { index: 2, label: 'Scripture' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function NewPostModal({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addPost } = useApp();
  const { currentUser } = useAuth();
  const isWeb = Platform.OS === 'web';

  const [caption, setCaption] = useState('');
  const [verseEnabled, setVerseEnabled] = useState(false);
  const [verseRef, setVerseRef] = useState('');
  const [verseText, setVerseText] = useState('');
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const captionRef = useRef<TextInput>(null);

  const canShare = caption.trim().length > 0;

  const handleShare = () => {
    if (!canShare) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    addPost({
      userId: 'currentUser',
      userName: currentUser?.displayName || currentUser?.name || 'You',
      userHandle: currentUser?.handle || '@gracemember',
      userInitials: currentUser?.initials || 'ME',
      userColor: currentUser?.color || '#4A90A4',
      imageIndex: selectedImage,
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
    setSelectedImage(null);
    setSubmitted(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const toggleVerse = () => {
    Haptics.selectionAsync();
    setVerseEnabled((v) => !v);
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
        <View style={{ marginTop: isWeb ? 16 : insets.top + 8, alignItems: 'center' }}>
          <View style={[styles.handleBar, { backgroundColor: colors.border }]} />
        </View>

        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>New Post</Text>
          <TouchableOpacity
            style={[
              styles.shareBtn,
              { backgroundColor: canShare ? colors.primary : colors.muted },
            ]}
            onPress={handleShare}
            disabled={!canShare}
          >
            <Text
              style={[
                styles.shareBtnText,
                { color: canShare ? '#fff' : colors.mutedForeground },
              ]}
            >
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
              ref={captionRef}
              style={[styles.captionInput, { color: colors.foreground }]}
              placeholder="What's on your heart today?"
              placeholderTextColor={colors.mutedForeground}
              value={caption}
              onChangeText={setCaption}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              maxLength={500}
              autoFocus
            />

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              PHOTO
            </Text>
            <View style={styles.imageOptions}>
              <TouchableOpacity
                style={[
                  styles.noneOption,
                  {
                    backgroundColor: selectedImage === null ? colors.primary + '18' : colors.muted,
                    borderColor: selectedImage === null ? colors.primary : colors.border,
                    borderWidth: selectedImage === null ? 1.5 : 1,
                  },
                ]}
                onPress={() => { Haptics.selectionAsync(); setSelectedImage(null); }}
              >
                <Feather
                  name="type"
                  size={18}
                  color={selectedImage === null ? colors.primary : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.noneLabel,
                    { color: selectedImage === null ? colors.primary : colors.mutedForeground },
                  ]}
                >
                  Text only
                </Text>
              </TouchableOpacity>
              {IMAGE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.index}
                  style={[
                    styles.imageThumbnailWrap,
                    {
                      borderColor: selectedImage === opt.index ? colors.primary : colors.border,
                      borderWidth: selectedImage === opt.index ? 2.5 : 1,
                    },
                  ]}
                  onPress={() => { Haptics.selectionAsync(); setSelectedImage(opt.index); }}
                >
                  <Image
                    source={POST_IMAGES[opt.index]}
                    style={styles.imageThumbnail}
                    contentFit="cover"
                  />
                  {selectedImage === opt.index && (
                    <View style={styles.imageCheckOverlay}>
                      <Feather name="check" size={14} color="#fff" />
                    </View>
                  )}
                  <Text style={[styles.imageLabel, { color: colors.mutedForeground }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

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
              <Feather
                name="book-open"
                size={16}
                color={verseEnabled ? colors.accent : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.verseToggleText,
                  { color: verseEnabled ? colors.accent : colors.mutedForeground },
                ]}
              >
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
                  style={[
                    styles.verseRefInput,
                    {
                      color: colors.foreground,
                      borderBottomColor: colors.border,
                    },
                  ]}
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
  root: {
    flex: 1,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
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
  shareBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  shareBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  successView: {
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
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  authorInfo: {
    gap: 2,
  },
  authorName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  authorHandle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  captionInput: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    lineHeight: 24,
    minHeight: 100,
    marginBottom: 16,
  },
  divider: {
    height: 0.5,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
    marginBottom: 12,
  },
  imageOptions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  noneOption: {
    flex: 1,
    height: 80,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
  },
  noneLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
  imageThumbnailWrap: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
  },
  imageThumbnail: {
    width: '100%',
    height: 80,
    borderRadius: 8,
  },
  imageCheckOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4A90A4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageLabel: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
    marginBottom: 2,
  },
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
  verseToggleText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  verseSection: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
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
