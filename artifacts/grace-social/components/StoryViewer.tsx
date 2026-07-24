import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { Story, StoryItem } from '@/hooks/useStories';

const STORY_DURATION = 5000;
const VIDEO_DURATION = 10000;
const CORAL = '#E07A54';

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
  const { currentUser } = useAuth();
  const videoRef = useRef<Video>(null);
  const inputRef = useRef<TextInput>(null);

  const [storyIndex, setStoryIndex] = useState(initialIndex);
  const [itemIndex, setItemIndex] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  const progressAnim = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const heartScaleAnim = useRef(new Animated.Value(1)).current;
  const heartOpacityAnim = useRef(new Animated.Value(0)).current;

  const currentStory = stories[storyIndex];
  const currentItem: StoryItem | undefined = currentStory?.items[itemIndex];
  const isOwnEmpty = currentStory?.isOwn && currentStory.items.length === 0;
  const itemCount = currentStory?.items.length ?? 0;
  const likeKey = `${storyIndex}-${itemIndex}`;
  const isLiked = likedMap[likeKey] ?? false;

  // ── Progress bar ──
  const stopAnim = useCallback(() => {
    if (animRef.current) { animRef.current.stop(); animRef.current = null; }
  }, []);

  const startAnim = useCallback(() => {
    if (!currentItem) return;
    const duration = currentItem.mediaType === 'video' ? VIDEO_DURATION : STORY_DURATION;
    animRef.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration,
      useNativeDriver: false,
    });
    animRef.current.start(({ finished }) => { if (finished) goNext(); });
  }, [currentItem, progressAnim]);

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

  // Start/stop animation when focused state or item changes
  useEffect(() => {
    if (!visible || isOwnEmpty || !currentItem) return;
    progressAnim.setValue(0);
    stopAnim();
    if (!inputFocused) startAnim();
    return () => stopAnim();
  }, [visible, storyIndex, itemIndex, isOwnEmpty, inputFocused]);

  // Pause/resume when keyboard appears
  useEffect(() => {
    if (!visible || isOwnEmpty) return;
    if (inputFocused) {
      stopAnim();
    } else {
      stopAnim();
      startAnim();
    }
  }, [inputFocused]);

  // Mark seen
  useEffect(() => {
    if (visible && currentStory && !currentStory.isOwn) onSeen(currentStory.id);
  }, [visible, storyIndex]);

  // Reset on open
  useEffect(() => {
    if (visible) {
      setStoryIndex(initialIndex);
      setItemIndex(0);
      setReplyText('');
      setInputFocused(false);
    }
  }, [visible, initialIndex]);

  // ── Actions ──
  const handleLike = useCallback(() => {
    setLikedMap((prev) => ({ ...prev, [likeKey]: !prev[likeKey] }));

    // Burst animation
    heartScaleAnim.setValue(0.8);
    heartOpacityAnim.setValue(1);
    Animated.sequence([
      Animated.spring(heartScaleAnim, { toValue: 1.5, useNativeDriver: true, speed: 30 }),
      Animated.timing(heartScaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();

    // Floating heart in center (if liking, not unliking)
    if (!isLiked) {
      Animated.sequence([
        Animated.timing(heartOpacityAnim, { toValue: 1, duration: 0, useNativeDriver: true }),
        Animated.delay(600),
        Animated.timing(heartOpacityAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      heartOpacityAnim.setValue(0);
    }
  }, [likeKey, isLiked, heartScaleAnim, heartOpacityAnim]);

  const handleSendReply = useCallback(() => {
    if (!replyText.trim()) return;
    setSentMap((prev) => ({ ...prev, [likeKey]: true }));
    setReplyText('');
    inputRef.current?.blur();
    setTimeout(() => {
      setSentMap((prev) => ({ ...prev, [likeKey]: false }));
    }, 2000);
  }, [replyText, likeKey]);

  const handleShare = useCallback(async () => {
    stopAnim();
    try {
      const storyAuthor = currentStory?.displayName ?? 'Someone';
      const storyText = currentItem?.text ?? currentItem?.scripture?.text ?? 'a story';
      await Share.share({
        message: `Check out this story from ${storyAuthor} on Grace Social: "${storyText}"`,
        title: `${storyAuthor}'s Story`,
      });
    } catch (_) {}
    // Resume after share sheet dismisses
    setTimeout(() => { if (!inputFocused) startAnim(); }, 500);
  }, [currentStory, currentItem, inputFocused]);

  if (!currentStory) return null;

  // ── Own story: empty state ──
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

  const hasMedia = !!currentItem?.mediaUri;
  const gradient = (currentItem?.gradient ?? ['#111', '#222', '#111']) as [string, string, string];
  const sentReply = sentMap[likeKey] ?? false;
  const userInitials = currentUser?.initials ?? '?';
  const userColor = currentUser?.color ?? '#4A90A4';

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ── Background ── */}
        {hasMedia && currentItem?.mediaType === 'image' ? (
          <Image source={{ uri: currentItem.mediaUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : hasMedia && currentItem?.mediaType === 'video' ? (
          <Video
            ref={videoRef}
            source={{ uri: currentItem.mediaUri! }}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.COVER}
            isLooping
            shouldPlay={visible && !inputFocused}
            isMuted={false}
          />
        ) : (
          <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        )}
        {hasMedia && <View style={styles.scrim} />}

        {/* ── Progress bars ── */}
        <View style={[styles.progressRow, { paddingTop: isWeb ? 14 : insets.top + 6 }]}>
          {currentStory.items.map((_, i) => (
            <View key={i} style={[styles.progressTrack, { marginRight: i < itemCount - 1 ? 4 : 0 }]}>
              {i < itemIndex ? (
                <View style={[styles.progressFill, { width: '100%' }]} />
              ) : i === itemIndex ? (
                <Animated.View
                  style={[styles.progressFill, {
                    width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                  }]}
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

        {/* ── Story body ── */}
        <View style={styles.storyBody} pointerEvents="none">
          {!hasMedia && currentItem?.text && (
            <>
              {currentItem.label && <Text style={styles.labelText}>{currentItem.label}</Text>}
              <Text style={styles.bigText}>{currentItem.text}</Text>
            </>
          )}
        </View>

        {/* ── Scripture overlay ── */}
        {(currentItem?.scripture || currentItem?.label) && (
          <View style={[styles.scriptureOverlay, { bottom: inputFocused ? 16 : 88 + insets.bottom }]} pointerEvents="none">
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

        {/* ── Caption bar (media + caption) ── */}
        {hasMedia && currentItem?.text && !inputFocused && (
          <View style={[styles.captionBar, { bottom: 80 + insets.bottom }]} pointerEvents="none">
            <Text style={styles.captionText}>{currentItem.text}</Text>
          </View>
        )}

        {/* ── Floating heart (center of screen when double-liked) ── */}
        <Animated.View
          style={[styles.floatingHeart, { opacity: heartOpacityAnim }]}
          pointerEvents="none"
        >
          <Text style={styles.floatingHeartIcon}>❤️</Text>
        </Animated.View>

        {/* ── Tap zones (above the bottom bar) ── */}
        {!inputFocused && (
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <View style={[styles.tapRow, { marginTop: isWeb ? 80 : insets.top + 80, marginBottom: 80 + insets.bottom }]}>
              <TouchableWithoutFeedback onPress={goPrev}>
                <View style={styles.tapLeft} />
              </TouchableWithoutFeedback>
              <TouchableWithoutFeedback onPress={goNext}>
                <View style={styles.tapRight} />
              </TouchableWithoutFeedback>
            </View>
          </View>
        )}

        {/* ── Own story: add more ── */}
        {currentStory.isOwn && !inputFocused && (
          <TouchableOpacity
            style={[styles.addMoreBtn, { bottom: 82 + insets.bottom }]}
            onPress={() => { onClose(); onRequestAddStory(); }}
          >
            <Feather name="plus" size={15} color="#fff" />
            <Text style={styles.addMoreText}>Add to Story</Text>
          </TouchableOpacity>
        )}

        {/* ── Bottom action bar ── */}
        {!currentStory.isOwn ? (
          <View style={[styles.actionBar, { paddingBottom: isWeb ? 16 : insets.bottom + 10 }]}>
            {/* User avatar */}
            <View style={[styles.replyAvatar, { backgroundColor: userColor }]}>
              <Text style={styles.replyAvatarText}>{userInitials}</Text>
            </View>

            {/* Reply input */}
            <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
              <View style={[styles.replyInputWrap, inputFocused && styles.replyInputWrapFocused]}>
                {sentReply ? (
                  <Text style={styles.sentText}>Sent ✓</Text>
                ) : (
                  <TextInput
                    ref={inputRef}
                    style={styles.replyInput}
                    value={replyText}
                    onChangeText={setReplyText}
                    placeholder={`Reply to ${currentStory.displayName.split(' ')[0]}…`}
                    placeholderTextColor="rgba(255,255,255,0.45)"
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    returnKeyType="send"
                    onSubmitEditing={handleSendReply}
                    blurOnSubmit
                  />
                )}
              </View>
            </TouchableWithoutFeedback>

            {/* Send button (only when typing) */}
            {inputFocused && replyText.trim().length > 0 && (
              <TouchableOpacity style={styles.sendBtn} onPress={handleSendReply} activeOpacity={0.8}>
                <Feather name="send" size={18} color="#fff" />
              </TouchableOpacity>
            )}

            {/* Like button */}
            {!inputFocused && (
              <TouchableOpacity style={styles.iconActionBtn} onPress={handleLike} activeOpacity={0.7}>
                <Animated.Text style={[styles.heartIcon, { transform: [{ scale: heartScaleAnim }] }]}>
                  {isLiked ? '❤️' : '🤍'}
                </Animated.Text>
              </TouchableOpacity>
            )}

            {/* Share button */}
            {!inputFocused && (
              <TouchableOpacity style={styles.iconActionBtn} onPress={handleShare} activeOpacity={0.7}>
                <Feather name="send" size={22} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // Progress
  progressRow: { flexDirection: 'row', paddingHorizontal: 10, paddingBottom: 10, zIndex: 10 },
  progressTrack: { flex: 1, height: 2.5, backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },

  // Header
  userHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 14, gap: 10, zIndex: 10 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)' },
  headerAvatarText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#fff' },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff' },
  headerTime: { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  closeBtn: { padding: 6 },
  closeTop: { position: 'absolute', top: 16, right: 16, padding: 8, zIndex: 20 },

  // Background
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)' },

  // Story body (text mode)
  storyBody: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 14 },
  labelText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: 'rgba(255,255,255,0.65)', textAlign: 'center', letterSpacing: 0.6, textTransform: 'uppercase' },
  bigText: { fontSize: 26, fontFamily: 'Inter_700Bold', color: '#fff', textAlign: 'center', lineHeight: 36 },

  // Scripture overlay
  scriptureOverlay: { position: 'absolute', left: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.52)', borderRadius: 14, padding: 14, borderLeftWidth: 3, borderLeftColor: '#D4A843' },
  scriptureRef: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#D4A843', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.6 },
  scriptureVerse: { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.9)', lineHeight: 19, fontStyle: 'italic' },

  // Caption bar
  captionBar: { position: 'absolute', left: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  captionText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff', textAlign: 'center' },

  // Floating heart
  floatingHeart: { position: 'absolute', alignSelf: 'center', top: '40%', zIndex: 30, pointerEvents: 'none' },
  floatingHeartIcon: { fontSize: 80 },

  // Tap zones
  tapRow: { flex: 1, flexDirection: 'row' },
  tapLeft: { flex: 1 },
  tapRight: { flex: 2 },

  // Add more (own story)
  addMoreBtn: { position: 'absolute', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  addMoreText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold' },

  // Bottom action bar
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  replyAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  replyAvatarText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#fff' },
  replyInputWrap: {
    flex: 1,
    minHeight: 40,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  replyInputWrapFocused: { borderColor: 'rgba(255,255,255,0.7)', backgroundColor: 'rgba(255,255,255,0.08)' },
  replyInput: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#fff', padding: 0 },
  sentText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: 'rgba(255,255,255,0.8)' },
  sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: CORAL, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  iconActionBtn: { padding: 6, flexShrink: 0 },
  heartIcon: { fontSize: 26 },

  // Empty own story
  emptyOwnState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 },
  emptyIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  emptyTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#fff', textAlign: 'center' },
  emptySub: { fontSize: 14, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 21 },
  emptyAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: CORAL, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 28, marginTop: 8 },
  emptyAddText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
});
