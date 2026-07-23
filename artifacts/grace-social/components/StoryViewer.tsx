/**
 * StoryViewer — Instagram-style full-screen story player.
 *
 * Architecture notes:
 *  - expo-video is NEVER imported here; video is delegated to
 *    VideoStoryPlayer.native.tsx / VideoStoryPlayer.web.tsx so the
 *    module never loads on web and avoids the SharedObject crash.
 *  - ProgressBar uses a single merged useEffect to eliminate the
 *    double-animation bug that caused instant-close in the previous build.
 *  - PanResponder handles swipe-down dismiss without conflicting with
 *    the tap zones (activates only on clearly downward moves).
 */

import { AntDesign, Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Reanimated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarCircle } from '@/components/AvatarCircle';
import VideoStoryPlayer from '@/components/VideoStoryPlayer';
import { POST_IMAGES } from '@/constants/images';
import { Story, StoryItem, useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';

const { height: SH } = Dimensions.get('window');

const STORY_DURATION = 5000;
const VIDEO_DURATION = 15000;

const VERSE_GRADIENTS: readonly [string, string][] = [
  ['#1A1A2E', '#16213E'],
  ['#0D1B2A', '#1B263B'],
  ['#1C0A00', '#3E1C00'],
  ['#0A1628', '#1D3461'],
  ['#1A0A2E', '#2D1B69'],
  ['#0A2618', '#0D5C30'],
];

// ─── ProgressBar ─────────────────────────────────────────────────────────────
// Single merged effect:  active/done/paused are all handled together to prevent
// two concurrent withTiming calls that previously caused the bar to advance
// immediately and call onFinish (close) on the first frame.

function ProgressBar({
  active,
  done,
  paused,
  duration,
  onFinish,
}: {
  active: boolean;
  done: boolean;
  paused: boolean;
  duration: number;
  onFinish: () => void;
}) {
  const progress = useSharedValue(done ? 1 : 0);
  const cbRef = useRef(onFinish);
  cbRef.current = onFinish;

  // Track whether this bar has already started its first animation run so we
  // know when to reset the value to 0 vs resume from the current position.
  const wasActiveRef = useRef(false);

  useEffect(() => {
    cancelAnimation(progress);

    if (!active) {
      wasActiveRef.current = false;
      progress.value = done ? 1 : 0;
      return;
    }

    // First time becoming active — reset to zero.
    if (!wasActiveRef.current) {
      wasActiveRef.current = true;
      progress.value = 0;
    }

    if (paused) return; // cancelled above; value retained at pause position

    // Resume from wherever progress currently sits.
    const elapsed = progress.value * duration;
    const remaining = Math.max(50, duration - elapsed);
    progress.value = withTiming(1, { duration: remaining }, (finished) => {
      if (finished) runOnJS(cbRef.current)();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, done, paused]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%` as any,
  }));

  return (
    <View style={pb.track}>
      <Reanimated.View style={[pb.fill, barStyle]} />
    </View>
  );
}

const pb = StyleSheet.create({
  track: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 1,
  },
});

// ─── Story Background ─────────────────────────────────────────────────────────

function StoryBackground({
  item,
  story,
  paused,
  muted,
}: {
  item: StoryItem;
  story: Story;
  paused: boolean;
  muted: boolean;
}) {
  const [loading, setLoading] = useState(true);

  if (item.type === 'video' && item.videoUri) {
    return <VideoStoryPlayer uri={item.videoUri} paused={paused} muted={muted} />;
  }

  const imageSource = item.imageUri
    ? { uri: item.imageUri }
    : item.imageIndex != null
      ? POST_IMAGES[item.imageIndex % POST_IMAGES.length]
      : null;

  if (imageSource) {
    return (
      <View style={StyleSheet.absoluteFill}>
        {loading && (
          <View style={s.loadingBg}>
            <Feather name="image" size={32} color="rgba(255,255,255,0.2)" />
          </View>
        )}
        <Image
          source={imageSource}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          onLoadStart={() => setLoading(true)}
          onLoad={() => setLoading(false)}
        />
      </View>
    );
  }

  // Verse / text — gradient background
  const gradIdx = story.id.charCodeAt(0) % VERSE_GRADIENTS.length;
  const [c1, c2] = VERSE_GRADIENTS[gradIdx];
  return <LinearGradient colors={[c1, c2]} style={StyleSheet.absoluteFill} />;
}

// ─── Verse / Text Overlay ─────────────────────────────────────────────────────

function VerseOverlay({ item }: { item: StoryItem }) {
  const hasVerse = item.verseText || item.verseReference;
  if (!hasVerse) return null;

  return (
    <View style={vo.container} pointerEvents="none">
      <View style={vo.card}>
        <Text style={vo.decorTop}>✦</Text>
        {item.verseText ? (
          <Text style={vo.verseText}>"{item.verseText}"</Text>
        ) : null}
        {item.verseReference ? (
          <Text style={vo.reference}>— {item.verseReference}</Text>
        ) : null}
      </View>
    </View>
  );
}

const vo = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  card: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 28,
    gap: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
  },
  decorTop: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 18,
  },
  verseText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter_400Regular',
    lineHeight: 30,
    textAlign: 'center',
  },
  reference: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});

// ─── Main StoryViewer ─────────────────────────────────────────────────────────

export interface StoryViewerProps {
  stories: Story[];
  startIndex: number;
  onClose: () => void;
}

export function StoryViewer({ stories, startIndex, onClose }: StoryViewerProps) {
  const {
    markStorySeen,
    toggleStoryLike,
    addStoryComment,
    incrementStoryShare,
    recordStoryView,
  } = useApp();
  const { currentUser } = useAuth();
  const insets = useSafeAreaInsets();

  const safeStart = Math.max(0, Math.min(startIndex, stories.length - 1));
  const [userIdx, setUserIdx] = useState(safeStart);
  const [itemIdx, setItemIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [videoMuted, setVideoMuted] = useState(false);

  // Swipe-down-to-dismiss
  const translateY = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      // Don't steal touch from children on start; only activate on clear downward drag.
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) =>
        gs.dy > 12 && Math.abs(gs.dy) > Math.abs(gs.dx) * 1.5,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) translateY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 100) {
          Animated.timing(translateY, {
            toValue: SH,
            duration: 220,
            useNativeDriver: true,
          }).start(() => onClose());
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const currentStory = stories[userIdx];
  const currentItem = currentStory?.items[itemIdx];
  const isOwn = !!currentStory?.isOwn;
  const duration = currentItem?.type === 'video' ? VIDEO_DURATION : STORY_DURATION;
  const isPaused = paused || isHolding || showReply;

  // Mark seen + record view when the user story changes
  useEffect(() => {
    if (!currentStory) return;
    markStorySeen(currentStory.id);
    recordStoryView(currentStory.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIdx]);

  const advance = useCallback(() => {
    if (!currentStory) { onClose(); return; }
    const nextItem = itemIdx + 1;
    if (nextItem < currentStory.items.length) {
      setItemIdx(nextItem);
      return;
    }
    const nextUser = userIdx + 1;
    if (nextUser < stories.length) {
      setUserIdx(nextUser);
      setItemIdx(0);
    } else {
      onClose();
    }
  }, [itemIdx, userIdx, currentStory, stories.length, onClose]);

  const retreat = useCallback(() => {
    if (itemIdx > 0) {
      setItemIdx(itemIdx - 1);
      return;
    }
    if (userIdx > 0) {
      const prevStory = stories[userIdx - 1];
      setUserIdx(userIdx - 1);
      setItemIdx(Math.max(0, (prevStory?.items.length ?? 1) - 1));
    }
  }, [itemIdx, userIdx, stories]);

  const handlePressIn = useCallback(() => {
    setIsHolding(true);
    setPaused(true);
  }, []);

  const handlePressOut = useCallback(() => {
    setIsHolding(false);
    setPaused(false);
  }, []);

  const handleLike = useCallback(() => {
    if (currentStory) toggleStoryLike(currentStory.id);
  }, [currentStory, toggleStoryLike]);

  const handleShare = useCallback(() => {
    if (currentStory) incrementStoryShare(currentStory.id);
  }, [currentStory, incrementStoryShare]);

  const handleSendReply = useCallback(() => {
    if (!replyText.trim() || !currentStory) return;
    addStoryComment(currentStory.id, replyText.trim(), currentUser
      ? { userName: currentUser.name, userInitials: currentUser.initials, userColor: currentUser.color }
      : undefined
    );
    setReplyText('');
    setShowReply(false);
    setPaused(false);
  }, [replyText, currentStory, currentUser, addStoryComment]);

  const openReply = useCallback(() => {
    setPaused(true);
    setShowReply(true);
  }, []);

  const closeReply = useCallback(() => {
    setShowReply(false);
    setPaused(false);
  }, []);

  if (!currentStory || !currentItem) return null;

  const topPad = insets.top > 0 ? insets.top : 44;
  const bottomPad = insets.bottom > 0 ? insets.bottom : 20;
  const displayName = currentStory.isOwn ? (currentUser?.name ?? 'Your Story') : currentStory.userName;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        style={[s.root, { transform: [{ translateY }] }]}
        {...panResponder.panHandlers}
      >
        {/* ── Media background ── */}
        <StoryBackground
          item={currentItem}
          story={currentStory}
          paused={isPaused}
          muted={videoMuted}
        />

        {/* ── Verse / text overlay (behind header/controls) ── */}
        <VerseOverlay item={currentItem} />

        {/* ── Top readability gradient ── */}
        <View style={s.topGradientWrap} pointerEvents="none">
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* ── Progress bars ── */}
        {!isHolding && (
          <View style={[s.barsRow, { top: topPad + 8 }]}>
            {currentStory.items.map((_, i) => (
              <ProgressBar
                key={`${userIdx}-${i}`}
                active={i === itemIdx}
                done={i < itemIdx}
                paused={isPaused}
                duration={duration}
                onFinish={advance}
              />
            ))}
          </View>
        )}

        {/* ── Header row ── */}
        {!isHolding && (
          <View style={[s.header, { top: topPad + 20 }]}>
            {/* Left: avatar + name + time */}
            <View style={s.headerLeft}>
              <View style={s.avatarRing}>
                <AvatarCircle
                  initials={currentStory.userInitials}
                  color={currentStory.userColor}
                  size={34}
                />
              </View>
              <View>
                <Text style={s.headerName} numberOfLines={1}>
                  {displayName}
                </Text>
                <Text style={s.headerTime}>{currentItem.timestamp}</Text>
              </View>
            </View>
            {/* Right: options + close */}
            <View style={s.headerRight}>
              {currentItem.type === 'video' && (
                <TouchableOpacity
                  style={s.iconBtn}
                  onPress={() => setVideoMuted((m) => !m)}
                  hitSlop={8}
                >
                  <Feather name={videoMuted ? 'volume-x' : 'volume-2'} size={18} color="#fff" />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={s.iconBtn} hitSlop={8}>
                <Feather name="more-horizontal" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={s.iconBtn} onPress={onClose} hitSlop={8}>
                <Feather name="x" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Tap zones — left 30% = back, right 70% = forward ── */}
        <View style={s.tapZones} pointerEvents="box-none">
          <Pressable
            style={s.tapLeft}
            onPress={retreat}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          />
          <Pressable
            style={s.tapRight}
            onPress={advance}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          />
        </View>

        {/* ── Bottom readability gradient ── */}
        {!isHolding && !showReply && (
          <View style={s.bottomGradientWrap} pointerEvents="none">
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.65)']}
              style={StyleSheet.absoluteFill}
            />
          </View>
        )}

        {/* ── Bottom action bar ── */}
        {!isHolding && !showReply && (
          <View style={[s.bottomBar, { paddingBottom: bottomPad + 12 }]}>
            {isOwn ? (
              // Own story: show view / like count summary
              <View style={s.ownStatsRow}>
                <Feather name="eye" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={s.ownStatText}>{currentStory.viewCount} views</Text>
                <Feather name="heart" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={s.ownStatText}>{currentStory.likeCount} likes</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity style={s.messagePill} onPress={openReply} activeOpacity={0.8}>
                  <Text style={s.messagePillText}>Send message...</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.actionBtn} onPress={handleLike} hitSlop={8}>
                  <AntDesign
                    name={currentStory.isLikedByMe ? 'heart' : 'hearto'}
                    size={26}
                    color={currentStory.isLikedByMe ? '#FF3B5C' : '#fff'}
                  />
                </TouchableOpacity>
                <TouchableOpacity style={s.actionBtn} onPress={handleShare} hitSlop={8}>
                  <Feather name="send" size={23} color="#fff" />
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* ── Reply input (slides up with keyboard) ── */}
        {showReply && (
          <KeyboardAvoidingView
            style={s.kavContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={[s.replyRow, { paddingBottom: bottomPad + 8 }]}>
              <TextInput
                style={s.replyInput}
                placeholder={`Reply to ${displayName}...`}
                placeholderTextColor="rgba(255,255,255,0.45)"
                value={replyText}
                onChangeText={setReplyText}
                autoFocus
                returnKeyType="send"
                onSubmitEditing={handleSendReply}
                onBlur={closeReply}
              />
              <TouchableOpacity style={s.replySendBtn} onPress={handleSendReply}>
                <Feather name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
      </Animated.View>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Gradients
  topGradientWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  bottomGradientWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },

  // Progress bars
  barsRow: {
    position: 'absolute',
    left: 10,
    right: 10,
    flexDirection: 'row',
    gap: 4,
  },

  // Header
  header: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  avatarRing: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
    padding: 1,
  },
  headerName: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerTime: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: 6,
  },

  // Tap zones
  tapZones: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  tapLeft: {
    flex: 0.3,
    height: '100%',
  },
  tapRight: {
    flex: 0.7,
    height: '100%',
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 12,
  },
  messagePill: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  messagePillText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  actionBtn: {
    padding: 4,
  },

  // Own story stats
  ownStatsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 6,
  },
  ownStatText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginRight: 6,
  },

  // Reply input
  kavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  replyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 14,
    paddingTop: 10,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  replyInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 16,
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  replySendBtn: {
    padding: 6,
  },
});
