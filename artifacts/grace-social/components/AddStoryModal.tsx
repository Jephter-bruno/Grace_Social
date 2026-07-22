import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
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
  { text: 'The Lord is my shepherd; I shall not want', reference: 'Psalm 23:1', gradient: ['#9B59B6', '#4A90A4'] as [string, string] },
  { text: 'Trust in the Lord with all your heart', reference: 'Proverbs 3:5', gradient: ['#E91E8C', '#9B59B6'] as [string, string] },
];

type StoryType = 'image' | 'video' | 'verse' | null;

interface AddStoryModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AddStoryModal({ visible, onClose }: AddStoryModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addStory } = useApp();
  const isWeb = Platform.OS === 'web';

  const [selectedType, setSelectedType] = useState<StoryType>(null);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [selectedVideoUri, setSelectedVideoUri] = useState<string | null>(null);
  const [customText, setCustomText] = useState('');
  const [pickingVideo, setPickingVideo] = useState(false);

  const checkScale = useSharedValue(1);
  const checkStyle = useAnimatedStyle(() => ({ transform: [{ scale: checkScale.value }] }));

  // Video preview player
  const videoPlayer = useVideoPlayer(
    selectedVideoUri ? { uri: selectedVideoUri } : null,
    (p) => { p.loop = true; p.play(); }
  );

  const reset = () => {
    setSelectedType(null);
    setSelectedImage(null);
    setSelectedVerse(null);
    setSelectedVideoUri(null);
    setCustomText('');
  };

  const pickVideo = async () => {
    setPickingVideo(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setPickingVideo(false);
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'videos',
        allowsEditing: true,
        videoMaxDuration: 30,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setSelectedVideoUri(result.assets[0].uri);
      }
    } catch {
      // picker dismissed
    } finally {
      setPickingVideo(false);
    }
  };

  const handleShare = () => {
    if (selectedType === 'image' && selectedImage !== null) {
      addStory({ type: 'image', imageIndex: selectedImage });
    } else if (selectedType === 'video' && selectedVideoUri) {
      addStory({ type: 'video', videoUri: selectedVideoUri });
    } else if (selectedType === 'verse' && selectedVerse !== null) {
      const v = VERSE_OPTIONS[selectedVerse];
      addStory({ type: 'verse', verseText: v.text, verseReference: v.reference });
    } else if (customText.trim()) {
      addStory({ type: 'text', verseText: customText.trim() });
    } else {
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    checkScale.value = withSequence(withTiming(1.4, { duration: 100 }), withTiming(1, { duration: 150 }));
    setTimeout(() => { reset(); onClose(); }, 400);
  };

  const canShare =
    (selectedType === 'image' && selectedImage !== null) ||
    (selectedType === 'video' && !!selectedVideoUri) ||
    (selectedType === 'verse' && selectedVerse !== null) ||
    customText.trim().length > 0;

  const TYPE_BTNS: { type: StoryType; icon: string; label: string; color: string }[] = [
    { type: 'image', icon: 'image', label: 'Photo', color: colors.primary },
    { type: 'video', icon: 'video', label: 'Video', color: '#E91E8C' },
    { type: 'verse', icon: 'book-open', label: 'Verse', color: colors.accent },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => { reset(); onClose(); }}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: isWeb ? 24 : insets.top + 8, borderBottomColor: colors.border }]}>
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

        <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {/* Type row */}
          <View style={styles.typeRow}>
            {TYPE_BTNS.map(({ type, icon, label, color }) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeBtn,
                  {
                    backgroundColor: selectedType === type ? color : colors.muted,
                    borderColor: selectedType === type ? color : colors.border,
                  },
                ]}
                onPress={() => {
                  setSelectedType(type);
                  if (type !== 'image') setSelectedImage(null);
                  if (type !== 'verse') setSelectedVerse(null);
                  if (type !== 'video') setSelectedVideoUri(null);
                }}
              >
                <Feather name={icon as any} size={15} color={selectedType === type ? '#fff' : colors.foreground} />
                <Text style={[styles.typeBtnText, { color: selectedType === type ? '#fff' : colors.foreground }]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Image picker */}
          {selectedType === 'image' && (
            <View style={styles.imagesGrid}>
              {POST_IMAGES.map((src, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setSelectedImage(i)}
                  style={[styles.imgThumb, selectedImage === i && { borderColor: colors.primary, borderWidth: 3 }]}
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

          {/* Video picker */}
          {selectedType === 'video' && (
            <View style={styles.videoSection}>
              {selectedVideoUri ? (
                <View style={styles.videoPreview}>
                  <VideoView
                    player={videoPlayer}
                    style={styles.videoPreviewPlayer}
                    contentFit="cover"
                    nativeControls={false}
                  />
                  <View style={styles.videoOverlay}>
                    <View style={styles.videoPlayBadge}>
                      <Feather name="video" size={16} color="#fff" />
                      <Text style={styles.videoReadyText}>Video ready</Text>
                    </View>
                    <TouchableOpacity style={styles.videoChangeBtn} onPress={pickVideo}>
                      <Text style={styles.videoChangeBtnText}>Change</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.videoPicker, { borderColor: colors.border, backgroundColor: colors.muted }]}
                  onPress={pickVideo}
                  disabled={pickingVideo}
                >
                  {pickingVideo ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <>
                      <View style={[styles.videoPickerIcon, { backgroundColor: '#E91E8C20' }]}>
                        <Feather name="video" size={32} color="#E91E8C" />
                      </View>
                      <Text style={[styles.videoPickerTitle, { color: colors.foreground }]}>Choose a Video</Text>
                      <Text style={[styles.videoPickerSub, { color: colors.mutedForeground }]}>
                        Select from your library · up to 30s
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Verse picker */}
          {selectedType === 'verse' && (
            <View style={styles.versesCol}>
              {VERSE_OPTIONS.map((v, i) => (
                <TouchableOpacity key={i} onPress={() => setSelectedVerse(i)} activeOpacity={0.85}>
                  <LinearGradient
                    colors={v.gradient}
                    style={[styles.verseCard, selectedVerse === i && styles.verseCardSelected]}
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
              style={[styles.customInput, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
              placeholder="Share a word of encouragement..."
              placeholderTextColor={colors.mutedForeground}
              value={customText}
              onChangeText={setCustomText}
              multiline
              maxLength={150}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
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
  shareBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, minWidth: 60, alignItems: 'center' },
  shareBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  body: { paddingTop: 20, paddingHorizontal: 16, gap: 20, paddingBottom: 40 },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
  },
  typeBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
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

  // Video
  videoSection: { gap: 12 },
  videoPicker: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  videoPickerIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  videoPickerTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  videoPickerSub: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  videoPreview: { borderRadius: 16, overflow: 'hidden', aspectRatio: 9 / 16, maxHeight: 280, position: 'relative' },
  videoPreviewPlayer: { width: '100%', height: '100%' },
  videoOverlay: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', padding: 12, backgroundColor: 'rgba(0,0,0,0.2)' },
  videoPlayBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  videoReadyText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  videoChangeBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  videoChangeBtnText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  // Verse
  versesCol: { gap: 10 },
  verseCard: { borderRadius: 14, padding: 16, gap: 6, position: 'relative' },
  verseCardSelected: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  verseCardText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_400Regular', fontStyle: 'italic', lineHeight: 20, paddingRight: 30 },
  verseCardRef: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  verseCheck: { position: 'absolute', top: 12, right: 12 },

  // Custom text
  customSection: { borderTopWidth: 0.5, paddingTop: 20, gap: 10 },
  customLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  customInput: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 14, fontFamily: 'Inter_400Regular', minHeight: 80, textAlignVertical: 'top' },
});
