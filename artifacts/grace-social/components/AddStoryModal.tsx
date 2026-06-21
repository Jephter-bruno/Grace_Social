import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  withSequence,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { POST_IMAGES } from '@/constants/images';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

const VERSE_OPTIONS = [
  { text: 'For I know the plans I have for you', reference: 'Jeremiah 29:11', gradient: ['#4A90A4', '#27AE60'] as [string, string] },
  { text: 'I can do all things through Christ who strengthens me', reference: 'Philippians 4:13', gradient: ['#D4A843', '#E74C3C'] as [string, string] },
  { text: "The Lord is my shepherd; I shall not want", reference: 'Psalm 23:1', gradient: ['#9B59B6', '#4A90A4'] as [string, string] },
];

interface AddStoryModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AddStoryModal({ visible, onClose }: AddStoryModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addStory } = useApp();
  const isWeb = Platform.OS === 'web';
  const [selectedType, setSelectedType] = useState<'image' | 'verse' | null>(null);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [customText, setCustomText] = useState('');
  const checkScale = useSharedValue(1);

  const checkStyle = useAnimatedStyle(() => ({ transform: [{ scale: checkScale.value }] }));

  const handleShare = () => {
    if (selectedType === 'image' && selectedImage !== null) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      addStory({ imageIndex: selectedImage });
    } else if (selectedType === 'verse' && selectedVerse !== null) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const v = VERSE_OPTIONS[selectedVerse];
      addStory({ verseText: v.text, verseReference: v.reference });
    } else if (customText.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      addStory({ verseText: customText.trim() });
    }

    checkScale.value = withSequence(withTiming(1.4, { duration: 100 }), withTiming(1, { duration: 150 }));
    setTimeout(onClose, 400);
  };

  const canShare =
    (selectedType === 'image' && selectedImage !== null) ||
    (selectedType === 'verse' && selectedVerse !== null) ||
    customText.trim().length > 0;

  const reset = () => {
    setSelectedType(null);
    setSelectedImage(null);
    setSelectedVerse(null);
    setCustomText('');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            { paddingTop: isWeb ? 24 : insets.top + 8, borderBottomColor: colors.border },
          ]}
        >
          <TouchableOpacity onPress={() => { reset(); onClose(); }} style={styles.cancelBtn}>
            <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>Add to Story</Text>
          <TouchableOpacity
            onPress={handleShare}
            disabled={!canShare}
            style={[styles.shareBtn, { backgroundColor: canShare ? colors.primary : colors.muted }]}
          >
            <Animated.View style={checkStyle}>
              <Text style={[styles.shareBtnText, { color: canShare ? '#fff' : colors.mutedForeground }]}>
                Share
              </Text>
            </Animated.View>
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {/* Type picker */}
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                {
                  backgroundColor: selectedType === 'image' ? colors.primary : colors.muted,
                  borderColor: selectedType === 'image' ? colors.primary : colors.border,
                },
              ]}
              onPress={() => { setSelectedType('image'); setSelectedVerse(null); }}
            >
              <Feather name="image" size={16} color={selectedType === 'image' ? '#fff' : colors.foreground} />
              <Text style={[styles.typeBtnText, { color: selectedType === 'image' ? '#fff' : colors.foreground }]}>
                Photo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                {
                  backgroundColor: selectedType === 'verse' ? colors.accent : colors.muted,
                  borderColor: selectedType === 'verse' ? colors.accent : colors.border,
                },
              ]}
              onPress={() => { setSelectedType('verse'); setSelectedImage(null); }}
            >
              <Feather name="book-open" size={16} color={selectedType === 'verse' ? '#fff' : colors.foreground} />
              <Text style={[styles.typeBtnText, { color: selectedType === 'verse' ? '#fff' : colors.foreground }]}>
                Verse
              </Text>
            </TouchableOpacity>
          </View>

          {/* Image selection */}
          {selectedType === 'image' && (
            <View style={styles.imagesGrid}>
              {POST_IMAGES.map((src, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setSelectedImage(i)}
                  style={[
                    styles.imgThumb,
                    selectedImage === i && { borderColor: colors.primary, borderWidth: 3 },
                  ]}
                >
                  <Image source={src} style={styles.imgFill} contentFit="cover" />
                  {selectedImage === i && (
                    <View style={styles.checkOverlay}>
                      <Feather name="check-circle" size={24} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Verse selection */}
          {selectedType === 'verse' && (
            <View style={styles.versesCol}>
              {VERSE_OPTIONS.map((v, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setSelectedVerse(i)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={v.gradient}
                    style={[
                      styles.verseCard,
                      selectedVerse === i && styles.verseCardSelected,
                    ]}
                  >
                    <Text style={styles.verseCardText}>"{v.text}"</Text>
                    <Text style={styles.verseCardRef}>— {v.reference}</Text>
                    {selectedVerse === i && (
                      <View style={styles.verseCheck}>
                        <Feather name="check-circle" size={20} color="#fff" />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Custom text (always visible) */}
          <View style={[styles.customSection, { borderTopColor: colors.border }]}>
            <Text style={[styles.customLabel, { color: colors.mutedForeground }]}>
              Or write your own message
            </Text>
            <TextInput
              style={[
                styles.customInput,
                { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border },
              ]}
              placeholder="Share a word of encouragement..."
              placeholderTextColor={colors.mutedForeground}
              value={customText}
              onChangeText={setCustomText}
              multiline
              maxLength={150}
            />
          </View>
        </View>
      </View>
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
  cancelBtn: { padding: 4, minWidth: 60 },
  cancelText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  title: { flex: 1, textAlign: 'center', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  shareBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  shareBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  body: { flex: 1, paddingTop: 20, paddingHorizontal: 16, gap: 20 },
  typeRow: { flexDirection: 'row', gap: 12 },
  typeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
  },
  typeBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  imagesGrid: { flexDirection: 'row', gap: 10 },
  imgThumb: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 0,
    borderColor: 'transparent',
  },
  imgFill: { width: '100%', height: '100%' },
  checkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  versesCol: { gap: 10 },
  verseCard: {
    borderRadius: 14,
    padding: 16,
    gap: 6,
    position: 'relative',
  },
  verseCardSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  verseCardText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
    lineHeight: 20,
    paddingRight: 30,
  },
  verseCardRef: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  verseCheck: { position: 'absolute', top: 12, right: 12 },
  customSection: { borderTopWidth: 0.5, paddingTop: 20, gap: 10 },
  customLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  customInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
