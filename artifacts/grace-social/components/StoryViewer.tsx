import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Alert,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Story, StoryItem } from '@/hooks/useStories';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const STORY_DURATION = 5000; // ms per story item
const ADD_STORY_GRADIENTS: [string, string, string][] = [
  ['#1a3a4a', '#2d6a7f', '#1a3a4a'],
  ['#2a1a3a', '#5a3a7a', '#2a1a3a'],
  ['#1a2a1a', '#2a5a3a', '#1a3a2a'],
  ['#3a1a10', '#7a3520', '#3a1a10'],
  ['#2a2010', '#5a4520', '#2a2010'],
];

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
  onSeen: (storyId: string) => void;
  onAddStory?: (text: string, gradient: [string, string, string]) => void;
  hasOwnStory: boolean;
}

export function StoryViewer({
  stories,
  initialIndex,
  visible,
  onClose,
  onSeen,
  onAddStory,
  hasOwnStory,
}: StoryViewerProps) {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';

  const [storyIndex, setStoryIndex] = useState(initialIndex);
  const [itemIndex, setItemIndex] = useState(0);
  const [addMode, setAddMode] = useState(false);
  const [addText, setAddText] = useState('');
  const [selectedGradientIdx, setSelectedGradientIdx] = useState(0);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  const currentStory = stories[storyIndex];
  const currentItem: StoryItem | undefined = currentStory?.items[itemIndex];
  const isOwnEmpty = currentStory?.isOwn && currentStory.items.length === 0;
  const totalItems = Math.max(currentStory?.items.length ?? 0, 1);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (animRef.current) animRef.current.stop();
  }, []);

  const goToNextItem = useCallback(() => {
    const items = currentStory?.items ?? [];
    if (itemIndex < items.length - 1) {
      setItemIndex((i) => i + 1);
    } else {
      // Next story
      if (storyIndex < stories.length - 1) {
        setStoryIndex((s) => s + 1);
        setItemIndex(0);
      } else {
        onClose();
      }
    }
  }, [currentStory, itemIndex, storyIndex, stories.length, onClose]);

  const goToPrevItem = useCallback(() => {
    if (itemIndex > 0) {
      setItemIndex((i) => i - 1);
    } else if (storyIndex > 0) {
      const prevStory = stories[storyIndex - 1];
      setStoryIndex((s) => s - 1);
      setItemIndex(Math.max(0, prevStory.items.length - 1));
    }
  }, [itemIndex, storyIndex, stories]);

  // Animate progress bar for current item
  useEffect(() => {
    if (!visible || isOwnEmpty || addMode) return;

    progressAnim.setValue(0);
    stopTimer();

    if (!currentItem) return;

    animRef.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });
    animRef.current.start(({ finished }) => {
      if (finished) goToNextItem();
    });

    return () => stopTimer();
  }, [visible, storyIndex, itemIndex, addMode, isOwnEmpty]);

  // Mark seen when story changes
  useEffect(() => {
    if (visible && currentStory && !currentStory.isOwn) {
      onSeen(currentStory.id);
    }
  }, [visible, storyIndex]);

  // Reset when opening
  useEffect(() => {
    if (visible) {
      setStoryIndex(initialIndex);
      setItemIndex(0);
      setAddMode(false);
      setAddText('');
    }
  }, [visible, initialIndex]);

  const handleAddSubmit = () => {
    if (!addText.trim()) return;
    onAddStory?.(addText.trim(), ADD_STORY_GRADIENTS[selectedGradientIdx]);
    setAddMode(false);
    setAddText('');
    onClose();
  };

  if (!currentStory) return null;

  // ── Add Story Mode ──
  if (isOwnEmpty || addMode) {
    return (
      <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
        <LinearGradient
          colors={ADD_STORY_GRADIENTS[selectedGradientIdx]}
          style={[styles.addContainer, { paddingTop: isWeb ? 50 : insets.top + 10 }]}
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            {/* Top bar */}
            <View style={styles.addTopBar}>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Feather name="x" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.addTitle}>Add to Story</Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Gradient picker */}
            <View style={styles.gradientPicker}>
              {ADD_STORY_GRADIENTS.map((g, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setSelectedGradientIdx(i)}
                  style={[
                    styles.gradientDot,
                    i === selectedGradientIdx && styles.gradientDotSelected,
                  ]}
                >
                  <LinearGradient colors={g} style={styles.gradientDotInner} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Text input */}
            <TextInput
              style={styles.addInput}
              value={addText}
              onChangeText={setAddText}
              placeholder="Share something inspiring..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              multiline
              maxLength={200}
              autoFocus
              textAlign="center"
            />

            {/* Share button */}
            <TouchableOpacity
              style={[styles.addShareBtn, !addText.trim() && { opacity: 0.4 }]}
              onPress={handleAddSubmit}
              disabled={!addText.trim()}
            >
              <Text style={styles.addShareText}>Share to Story</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </LinearGradient>
      </Modal>
    );
  }

  // ── Story Viewer Mode ──
  const gradient = currentItem?.gradient ?? ['#111', '#222', '#111'];

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.viewerContainer}>
        <LinearGradient
          colors={gradient as [string, string, string]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* ── Progress bars ── */}
        <View
          style={[
            styles.progressRow,
            { paddingTop: isWeb ? 14 : insets.top + 6 },
          ]}
        >
          {currentStory.items.map((_, i) => (
            <View key={i} style={[styles.progressTrack, { marginRight: i < totalItems - 1 ? 4 : 0 }]}>
              {i < itemIndex ? (
                // Fully filled
                <View style={[styles.progressFill, { width: '100%' }]} />
              ) : i === itemIndex ? (
                // Animating
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
          {currentItem?.label && (
            <Text style={styles.storyLabel}>{currentItem.label}</Text>
          )}
          <Text style={styles.storyText}>{currentItem?.text}</Text>
        </View>

        {/* ── Tap zones ── */}
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <View style={styles.tapRow}>
            {/* Prev */}
            <TouchableWithoutFeedback onPress={goToPrevItem}>
              <View style={styles.tapLeft} />
            </TouchableWithoutFeedback>
            {/* Next */}
            <TouchableWithoutFeedback onPress={goToNextItem}>
              <View style={styles.tapRight} />
            </TouchableWithoutFeedback>
          </View>
        </View>

        {/* ── Own story: edit button ── */}
        {currentStory.isOwn && (
          <TouchableOpacity
            style={[styles.editStoryBtn, { bottom: isWeb ? 40 : insets.bottom + 30 }]}
            onPress={() => setAddMode(true)}
          >
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.editStoryText}>Add to Story</Text>
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // ── Viewer ──
  viewerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  progressRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingBottom: 10,
    gap: 0,
    zIndex: 10,
  },
  progressTrack: {
    flex: 1,
    height: 2.5,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 10,
    zIndex: 10,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  headerAvatarText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  headerInfo: { flex: 1 },
  headerName: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  headerTime: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.65)',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  storyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  storyLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  storyText: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 36,
  },
  tapRow: {
    flex: 1,
    flexDirection: 'row',
    marginTop: 100, // below header
  },
  tapLeft: { flex: 1 },
  tapRight: { flex: 2 },
  editStoryBtn: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  editStoryText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },

  // ── Add Story ──
  addContainer: {
    flex: 1,
  },
  addTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  addTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  gradientPicker: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  gradientDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gradientDotSelected: {
    borderColor: '#fff',
    transform: [{ scale: 1.2 }],
  },
  gradientDotInner: {
    width: '100%',
    height: '100%',
  },
  addInput: {
    flex: 1,
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    textAlignVertical: 'center',
    paddingHorizontal: 32,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  addShareBtn: {
    marginHorizontal: 32,
    marginBottom: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  addShareText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
});
