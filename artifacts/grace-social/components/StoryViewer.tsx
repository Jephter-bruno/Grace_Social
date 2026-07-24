import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Story, StoryItem } from '@/hooks/useStories';

const STORY_DURATION = 5000;
const VIDEO_DURATION = 10000;

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
  onSeen: (storyId: string) => void;
  onRequestAddStory: () => void;
}

export function StoryViewer({
  stories,
  initialIndex,
  visible,
  onClose,
  onSeen,
  onRequestAddStory,
}: StoryViewerProps) {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const videoRef = useRef<Video>(null);

  const [storyIndex, setStoryIndex] = useState(initialIndex);
  const [itemIndex, setItemIndex] = useState(0);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  const currentStory = stories[storyIndex];
  const currentItem: StoryItem | undefined = currentStory?.items[itemIndex];
  const isOwnEmpty = currentStory?.isOwn && currentStory.items.length === 0;
  const itemCount = currentStory?.items.length ?? 0;

  const stopAnim = useCallback(() => {
    if (animRef.current) { animRef.current.stop(); animRef.current = null; }
  }, []);

  const goNext = useCallback(() => {
    if (itemIndex < (currentStory?.items.length ?? 0) - 1) {
      setItemIndex((i) => i + 1);
    } else if (storyIndex < stories.length - 1) {
      setStoryIndex((s) => s + 1);
      setItemIndex(0);
    } else {
      onClose();
    }
  }, [currentStory, itemIndex, storyIndex, stories.length, onClose]);

  const goPrev = useCallback(() => {
    if (itemIndex > 0) {
      setItemIndex((i) => i - 1);
    } else if (storyIndex > 0) {
      const prev = stories[storyIndex - 1];
      setStoryIndex((s) => s - 1);
      setItemIndex(Math.max(0, (prev.items.length ?? 1) - 1));
    }
  }, [itemIndex, storyIndex, stories]);

  // Progress bar animation
  useEffect(() => {
    if (!visible || isOwnEmpty || !currentItem) return;
    progressAnim.setValue(0);
    stopAnim();
    const duration = currentItem.mediaType === 'video' ? VIDEO_DURATION : STORY_DURATION;
    animRef.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration,
      useNativeDriver: false,
    });
    animRef.current.start(({ finished }) => { if (finished) goNext(); });
    return () => stopAnim();
  }, [visible, storyIndex, itemIndex, isOwnEmpty]);

  // Mark seen
  useEffect(() => {
    if (visible && currentStory && !currentStory.isOwn) {
      onSeen(currentStory.id);
    }
  }, [visible, storyIndex]);

  // Reset on open
  useEffect(() => {
    if (visible) {
      setStoryIndex(initialIndex);
      setItemIndex(0);
    }
  }, [visible, initialIndex]);

  if (!currentStory) return null;

  // ── Own story with no items: show prompt to add ──
  if (isOwnEmpty) {
    return (
      <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
        <View style={[styles.container, { paddingTop: isWeb ? 20 : insets.top }]}>
          <LinearGradient colors={['#1a3a4a', '#2d6a7f', '#1a3a4a']} style={StyleSheet.absoluteFill} />
          <TouchableOpacity style={styles.closeTop} onPress={onClose}>
            <Feather name="x" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.emptyOwnState}>
            <View style={styles.emptyIconCircle}>
              <Feather name="camera" size={32} color="#fff" />
            </View>
            <Text style={styles.emptyTitle}>Share your story</Text>
            <Text style={styles.emptySub}>Add a photo, video, or text to share with your community.</Text>
            <TouchableOpacity style={styles.emptyAddBtn} onPress={() => { onClose(); onRequestAddStory(); }}>
              <Feather name="plus" size={18} color="#fff" />
              <Text style={styles.emptyAddText}>Add to Story</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // ── Background ──
  const hasMedia = !!currentItem?.mediaUri;
  const gradient = (currentItem?.gradient ?? ['#111', '#222', '#111']) as [string, string, string];

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.container}>

        {/* Background */}
        {hasMedia && currentItem?.mediaType === 'image' ? (
          <Image source={{ uri: currentItem.mediaUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : hasMedia && currentItem?.mediaType === 'video' ? (
          <Video
            ref={videoRef}
            source={{ uri: currentItem.mediaUri! }}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.COVER}
            isLooping
            shouldPlay={visible}
            isMuted={false}
          />
        ) : (
          <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        )}

        {/* Scrim over media for readability */}
        {hasMedia && <View style={styles.scrim} />}

        {/* ── Progress bars ── */}
        <View style={[styles.progressRow, { paddingTop: isWeb ? 14 : insets.top + 6 }]}>
          {currentStory.items.map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressTrack,
                { marginRight: i < itemCount - 1 ? 4 : 0 },
              ]}
            >
              {i < itemIndex ? (
                <View style={[styles.progressFill, { width: '100%' }]} />
              ) : i === itemIndex ? (
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              ) : null}
            </View>
          ))}
        </View>

        {/* ── User header ── */}
        <View style={styles.userHeader}>
          <View style={[styles.headerAvatar, { backgroundColor: currentStory.color }]}>
            <Text style={styles.headerAvatarText}>{currentStory.initials}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{currentStory.displayName}</Text>
            <Text style={styles.headerTime}>{currentItem?.timestamp ?? ''}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ── Story content ── */}
        <View style={styles.storyContent} pointerEvents="none">
          {/* Text-mode big text (no media) */}
          {!hasMedia && currentItem?.text && (
            <>
              {currentItem.label && (
                <Text style={styles.labelText}>{currentItem.label}</Text>
              )}
              <Text style={styles.bigText}>{currentItem.text}</Text>
            </>
          )}
        </View>

        {/* ── Scripture overlay ── */}
        {(currentItem?.scripture || currentItem?.label) && (
          <View style={styles.scriptureOverlay} pointerEvents="none">
            <Text style={styles.scriptureRef}>
              {currentItem.scripture?.reference ?? currentItem.label}
            </Text>
            {currentItem.scripture && (
              <Text style={styles.scriptureVerse} numberOfLines={4}>
                {currentItem.scripture.text}
              </Text>
            )}
          </View>
        )}

        {/* ── Caption overlay (media + caption) ── */}
        {hasMedia && currentItem?.text && (
          <View style={styles.captionBar} pointerEvents="none">
            <Text style={styles.captionText}>{currentItem.text}</Text>
          </View>
        )}

        {/* ── Tap zones ── */}
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <View style={[styles.tapRow, { marginTop: isWeb ? 80 : insets.top + 80 }]}>
            <TouchableWithoutFeedback onPress={goPrev}>
              <View style={styles.tapLeft} />
            </TouchableWithoutFeedback>
            <TouchableWithoutFeedback onPress={goNext}>
              <View style={styles.tapRight} />
            </TouchableWithoutFeedback>
          </View>
        </View>

        {/* ── Own story: add more button ── */}
        {currentStory.isOwn && (
          <TouchableOpacity
            style={[styles.addMoreBtn, { bottom: isWeb ? 40 : insets.bottom + 30 }]}
            onPress={() => { onClose(); onRequestAddStory(); }}
          >
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.addMoreText}>Add to Story</Text>
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // Progress
  progressRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingBottom: 10,
    zIndex: 10,
  },
  progressTrack: {
    flex: 1,
    height: 2.5,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },

  // Header
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 10,
    zIndex: 10,
  },
  headerAvatar: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)',
  },
  headerAvatarText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#fff' },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff' },
  headerTime: { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  closeBtn: { padding: 6 },
  closeTop: { position: 'absolute', top: 16, right: 16, padding: 8, zIndex: 20 },

  // Scrim
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)' },

  // Story content (text mode)
  storyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 14,
  },
  labelText: {
    fontSize: 12, fontFamily: 'Inter_600SemiBold',
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center', letterSpacing: 0.6, textTransform: 'uppercase',
  },
  bigText: {
    fontSize: 26, fontFamily: 'Inter_700Bold',
    color: '#fff', textAlign: 'center', lineHeight: 36,
  },

  // Scripture overlay (bottom-left card)
  scriptureOverlay: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.52)',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#D4A843',
  },
  scriptureRef: {
    fontSize: 11, fontFamily: 'Inter_700Bold',
    color: '#D4A843', marginBottom: 5,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  scriptureVerse: {
    fontSize: 13, fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.9)', lineHeight: 19, fontStyle: 'italic',
  },

  // Caption bar (media mode)
  captionBar: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  captionText: {
    fontSize: 15, fontFamily: 'Inter_600SemiBold',
    color: '#fff', textAlign: 'center',
  },

  // Tap zones
  tapRow: { flex: 1, flexDirection: 'row' },
  tapLeft: { flex: 1 },
  tapRight: { flex: 2 },

  // Add more button
  addMoreBtn: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  addMoreText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold' },

  // Empty own story state
  emptyOwnState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, gap: 16,
  },
  emptyIconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  emptyTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#fff', textAlign: 'center' },
  emptySub: { fontSize: 14, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 21 },
  emptyAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#E07A54',
    paddingHorizontal: 24, paddingVertical: 13,
    borderRadius: 28, marginTop: 8,
  },
  emptyAddText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
});
