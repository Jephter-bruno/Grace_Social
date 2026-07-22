import { AntDesign, Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { POST_IMAGES } from '@/constants/images';
import { Story, StoryComment, StoryItem, useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';

const STORY_ADS = [
  { network: 'facebook' as const, advertiser: 'YouVersion Bible App', headline: 'Read the Bible Daily', ctaText: 'Get it Free', iconName: 'book-open', accentColor: '#4A90A4' },
  { network: 'google' as const, advertiser: 'Hillsong Worship', headline: 'Stream Worship Music', ctaText: 'Listen Free', iconName: 'music', accentColor: '#9B59B6' },
  { network: 'facebook' as const, advertiser: 'Life Conference 2026', headline: 'Faith Life Conference · July 14', ctaText: 'Register Now', iconName: 'calendar', accentColor: '#27AE60' },
  { network: 'google' as const, advertiser: 'Proverbs 31 Ministries', headline: 'Devotionals for Women of Faith', ctaText: 'Explore Now', iconName: 'heart', accentColor: '#E91E8C' },
];
const STORY_AD_DURATION = 6000;
const STORY_DURATION = 5000;
const VIDEO_DURATION = 15000;
const QUICK_REACTIONS = ['🙏', '🔥', '❤️', '🙌', '✝️', '😭'];
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const VIEWER_COLORS = ['#D4A843', '#9B59B6', '#27AE60', '#E91E8C', '#4A90A4', '#E74C3C', '#F39C12'];
const VIEWER_INITIALS = ['PJ', 'MK', 'DL', 'SW', 'TB', 'GM', 'RB', 'LH', 'AF', 'CE'];

// ─── Gradient palettes for verse/text stories ────────────────────────────────
const VERSE_GRADIENTS: [string, string][] = [
  ['#1A1A2E', '#16213E'],
  ['#0D1B2A', '#1B263B'],
  ['#1C0A00', '#3E1C00'],
  ['#0A1628', '#1D3461'],
  ['#1A0A2E', '#2D1B69'],
  ['#0A2618', '#0D5C30'],
];

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({
  active, done, paused, duration, isVideo, onFinish,
}: {
  active: boolean; done: boolean; paused: boolean; duration: number; isVideo?: boolean; onFinish: () => void;
}) {
  const progress = useSharedValue(done ? 1 : 0);
  const cbRef = useRef(onFinish);
  cbRef.current = onFinish;

  // Start or reset progress when active/done changes
  useEffect(() => {
    if (!active) {
      progress.value = done ? 1 : 0;
      return;
    }
    progress.value = 0;
    if (!paused) {
      progress.value = withTiming(1, { duration }, (finished) => {
        if (finished) runOnJS(cbRef.current)();
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, done]);

  // Pause / resume without resetting
  useEffect(() => {
    if (!active) return;
    if (paused) {
      cancelAnimation(progress);
    } else {
      const remaining = Math.max(50, (1 - progress.value) * duration);
      progress.value = withTiming(1, { duration: remaining }, (finished) => {
        if (finished) runOnJS(cbRef.current)();
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` as any }));

  return (
    <View style={styles.barTrack}>
      <Animated.View style={[styles.barFill, isVideo ? styles.barFillVideo : null, barStyle]} />
    </View>
  );
}

// ─── Video background (isolated so useVideoPlayer is only called with a real URI) ─

function VideoBackground({
  uri, paused, muted,
}: {
  uri: string; paused: boolean; muted: boolean;
}) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.muted = muted;
    if (!paused) p.play();
  });

  useEffect(() => {
    try {
      if (paused) { player.pause(); } else { player.play(); }
    } catch {}
  }, [paused]);

  useEffect(() => {
    try { player.muted = muted; } catch {}
  }, [muted]);

  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

// ─── Story background (handles all media types) ───────────────────────────────

function StoryBackground({
  item, story, paused, muted,
}: {
  item: StoryItem; story: Story; paused: boolean; muted: boolean;
}) {
  if (item.type === 'video' && item.videoUri) {
    return (
      <VideoBackground uri={item.videoUri} paused={paused} muted={muted} />
    );
  }

  if (item.imageUri) {
    return (
      <Image
        source={{ uri: item.imageUri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
    );
  }

  if (item.imageIndex !== undefined && item.imageIndex !== null && POST_IMAGES[item.imageIndex]) {
    return (
      <Image
        source={POST_IMAGES[item.imageIndex]}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
    );
  }

  // verse / text / fallback — rich gradient background
  const gradIdx = Math.abs(story.id.charCodeAt(0) ?? 0) % VERSE_GRADIENTS.length;
  const [c1, c2] = VERSE_GRADIENTS[gradIdx];
  return (
    <LinearGradient
      colors={[c1, c2, '#000']}
      locations={[0, 0.65, 1]}
      style={StyleSheet.absoluteFill}
    />
  );
}

// ─── Verse / Text content overlay ────────────────────────────────────────────

function VerseOverlay({ item }: { item: StoryItem }) {
  if (!item.verseText && item.type !== 'text') return null;

  const isVerse = item.type === 'verse' || !!item.verseReference;

  return (
    <View style={styles.verseOverlay} pointerEvents="none">
      {isVerse && (
        <View style={styles.verseBadge}>
          <Feather name="book-open" size={13} color="#D4A843" />
          <Text style={styles.verseBadgeText}>Bible Verse</Text>
        </View>
      )}
      <View style={styles.verseCard}>
        {isVerse && <View style={styles.verseAccentBar} />}
        <Text style={[styles.verseText, !isVerse && styles.textStoryBody]}>
          {item.verseText ? `"${item.verseText}"` : ''}
        </Text>
        {item.verseReference ? (
          <Text style={styles.verseRef}>— {item.verseReference}</Text>
        ) : null}
      </View>
    </View>
  );
}

// ─── Center Heart Burst (double-tap like) ─────────────────────────────────────

function HeartBurst({ visible }: { visible: boolean }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = 0;
      opacity.value = 0;
      scale.value = withSequence(
        withSpring(1.2, { damping: 6, stiffness: 300 }),
        withTiming(0.9, { duration: 100 }),
      );
      opacity.value = withSequence(
        withTiming(1, { duration: 80 }),
        withTiming(0, { duration: 550 }),
      );
    }
  }, [visible]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.heartBurst, style]} pointerEvents="none">
      <AntDesign name="heart" size={90} color="#E91E8C" />
    </Animated.View>
  );
}

// ─── Analytics Drawer ─────────────────────────────────────────────────────────

function AnalyticsDrawer({
  onClose, story,
}: {
  onClose: () => void;
  story: Story;
}) {
  const insets = useSafeAreaInsets();
  const viewerCount = Math.min(story.viewCount, VIEWER_INITIALS.length);

  return (
    <View style={[styles.analyticsDrawer, { paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.analyticsHandle} />
      <View style={styles.analyticsHeader}>
        <View>
          <Text style={styles.analyticsTitle}>Story Insights</Text>
          <Text style={styles.analyticsSubtitle}>Performance overview</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.analyticsClose}>
          <Feather name="x" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderColor: 'rgba(255,255,255,0.15)' }]}>
          <View style={[styles.statIconWrap, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
            <Feather name="eye" size={20} color="#fff" />
          </View>
          <Text style={styles.statNum}>{story.viewCount}</Text>
          <Text style={styles.statLabel}>Views</Text>
        </View>
        <View style={[styles.statCard, { borderColor: 'rgba(233,30,140,0.3)' }]}>
          <View style={[styles.statIconWrap, { backgroundColor: 'rgba(233,30,140,0.15)' }]}>
            <AntDesign name="heart" size={20} color="#E91E8C" />
          </View>
          <Text style={styles.statNum}>{story.likeCount}</Text>
          <Text style={styles.statLabel}>Likes</Text>
        </View>
        <View style={[styles.statCard, { borderColor: 'rgba(74,144,164,0.3)' }]}>
          <View style={[styles.statIconWrap, { backgroundColor: 'rgba(74,144,164,0.15)' }]}>
            <Feather name="send" size={20} color="#4A90A4" />
          </View>
          <Text style={styles.statNum}>{story.shareCount}</Text>
          <Text style={styles.statLabel}>Shares</Text>
        </View>
      </View>

      {viewerCount > 0 && (
        <View style={styles.viewersSection}>
          <View style={styles.viewersFaceRow}>
            {Array.from({ length: viewerCount }).map((_, i) => (
              <View
                key={i}
                style={[styles.viewerFace, {
                  backgroundColor: VIEWER_COLORS[i % VIEWER_COLORS.length],
                  marginLeft: i === 0 ? 0 : -10,
                  zIndex: viewerCount - i,
                }]}
              >
                <Text style={styles.viewerFaceText}>{VIEWER_INITIALS[i]}</Text>
              </View>
            ))}
            {story.viewCount > VIEWER_INITIALS.length && (
              <View style={[styles.viewerFace, styles.viewerFaceMore, { marginLeft: -10, zIndex: 0 }]}>
                <Text style={styles.viewerFaceText}>+{story.viewCount - VIEWER_INITIALS.length}</Text>
              </View>
            )}
          </View>
          <Text style={styles.viewersCaption}>
            {story.viewCount} {story.viewCount === 1 ? 'person' : 'people'} viewed your story
          </Text>
        </View>
      )}

      <View style={styles.drawerDivider} />
      <Text style={styles.commentsHeading}>
        {story.storyComments.length > 0 ? `Replies · ${story.storyComments.length}` : 'No replies yet'}
      </Text>

      {story.storyComments.length > 0 ? (
        <ScrollView style={styles.commentsList} showsVerticalScrollIndicator={false}>
          {story.storyComments.map((c) => (
            <View key={c.id} style={styles.commentRow}>
              <View style={[styles.commentAvatar, { backgroundColor: c.userColor }]}>
                <Text style={styles.commentAvatarText}>{c.userInitials}</Text>
              </View>
              <View style={styles.commentBubble}>
                <View style={styles.commentBubbleTop}>
                  <Text style={styles.commentName}>{c.userName}</Text>
                  <Text style={styles.commentTime}>{c.timestamp}</Text>
                </View>
                <Text style={styles.commentText}>{c.text}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyComments}>
          <Feather name="message-circle" size={28} color="rgba(255,255,255,0.2)" />
          <Text style={styles.emptyCommentsText}>Be the first to reply to your story</Text>
        </View>
      )}
    </View>
  );
}

// ─── Main StoryViewer ─────────────────────────────────────────────────────────

interface StoryViewerProps {
  stories: Story[];   // receive viewable stories directly to avoid re-filtering
  startIndex: number;
  onClose: () => void;
}

export function StoryViewer({ stories: viewableStories, startIndex, onClose }: StoryViewerProps) {
  const { markStorySeen, toggleStoryLike, addStoryComment,
    incrementStoryShare, recordStoryView } = useApp();
  const { currentUser } = useAuth();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';

  // Clamp startIndex defensively
  const safeStart = Math.max(0, Math.min(startIndex, viewableStories.length - 1));

  const [userIdx, setUserIdx] = useState(safeStart);
  const [itemIdx, setItemIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showStoryAd, setShowStoryAd] = useState(false);
  const [storyAdIndex, setStoryAdIndex] = useState(0);
  const [pendingNextUser, setPendingNextUser] = useState<number | null>(null);
  const [adCountdown, setAdCountdown] = useState(Math.ceil(STORY_AD_DURATION / 1000));
  const [videoMuted, setVideoMuted] = useState(false);
  const [heartVisible, setHeartVisible] = useState(false);

  const pressStart = useRef(0);
  const adTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const adCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const adProgress = useSharedValue(0);
  const commentInputRef = useRef<TextInput>(null);
  const likeScale = useSharedValue(1);
  const lastTap = useRef(0);

  const currentStory = viewableStories[userIdx];
  const currentItem = currentStory?.items[itemIdx];
  const isVideo = currentItem?.type === 'video' && !!currentItem?.videoUri;
  const isOwnStory = !!currentStory?.isOwn;
  const isPaused = paused || showCommentInput || showAnalytics || showStoryAd;

  // Track views
  useEffect(() => {
    if (currentStory) recordStoryView(currentStory.id);
  }, [userIdx]);

  const adProgressStyle = useAnimatedStyle(() => ({ width: `${adProgress.value * 100}%` as any }));
  const likeAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: likeScale.value }] }));

  // ─── Ad logic ──────────────────────────────────────────────────────────────
  const dismissAd = useCallback((nextUser: number) => {
    setShowStoryAd(false);
    adProgress.value = 0;
    if (adTimerRef.current) clearTimeout(adTimerRef.current);
    if (adCountdownRef.current) clearInterval(adCountdownRef.current);
    if (nextUser < viewableStories.length) { setUserIdx(nextUser); setItemIdx(0); }
    else onClose();
  }, [viewableStories.length, onClose]);

  useEffect(() => {
    return () => {
      if (adTimerRef.current) clearTimeout(adTimerRef.current);
      if (adCountdownRef.current) clearInterval(adCountdownRef.current);
    };
  }, []);

  // ─── Navigation ────────────────────────────────────────────────────────────
  const advance = useCallback(() => {
    if (!currentStory) { onClose(); return; }
    const nextItem = itemIdx + 1;
    if (nextItem < currentStory.items.length) {
      setItemIdx(nextItem);
      return;
    }
    // End of this user's story
    markStorySeen(currentStory.id);
    const nextUser = userIdx + 1;
    if (nextUser < viewableStories.length && userIdx % 2 === 1) {
      // Show ad between every 2nd user
      setPendingNextUser(nextUser);
      setStoryAdIndex((i) => i + 1);
      setAdCountdown(Math.ceil(STORY_AD_DURATION / 1000));
      adProgress.value = 0;
      adProgress.value = withTiming(1, { duration: STORY_AD_DURATION });
      setShowStoryAd(true);
      if (adTimerRef.current) clearTimeout(adTimerRef.current);
      adTimerRef.current = setTimeout(() => dismissAd(nextUser), STORY_AD_DURATION);
      let rem = Math.ceil(STORY_AD_DURATION / 1000);
      if (adCountdownRef.current) clearInterval(adCountdownRef.current);
      adCountdownRef.current = setInterval(() => {
        rem -= 1;
        setAdCountdown(rem);
        if (rem <= 0 && adCountdownRef.current) clearInterval(adCountdownRef.current);
      }, 1000);
    } else if (nextUser < viewableStories.length) {
      setUserIdx(nextUser);
      setItemIdx(0);
    } else {
      onClose();
    }
  }, [currentStory, itemIdx, userIdx, viewableStories.length, markStorySeen, onClose, adProgress, dismissAd]);

  const retreat = useCallback(() => {
    if (itemIdx > 0) {
      setItemIdx(itemIdx - 1);
    } else if (userIdx > 0) {
      setUserIdx(userIdx - 1);
      setItemIdx(0);
    }
  }, [itemIdx, userIdx]);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handlePressIn = () => {
    pressStart.current = Date.now();
    setPaused(true);
  };
  const handlePressOut = (navigate: () => void) => {
    const elapsed = Date.now() - pressStart.current;
    setPaused(false);
    if (elapsed < 220) navigate();
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300 && !isOwnStory && currentStory) {
      if (!currentStory.isLikedByMe) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        toggleStoryLike(currentStory.id);
      }
      setHeartVisible(false);
      setTimeout(() => {
        setHeartVisible(true);
        setTimeout(() => setHeartVisible(false), 900);
      }, 10);
    }
    lastTap.current = now;
  };

  const handleLike = () => {
    if (!currentStory) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    likeScale.value = withSequence(
      withSpring(1.4, { damping: 4, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    );
    toggleStoryLike(currentStory.id);
  };

  const handleShare = () => {
    if (!currentStory) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    incrementStoryShare(currentStory.id);
  };

  const handleSendComment = () => {
    if (!currentStory) return;
    const trimmed = commentText.trim();
    if (!trimmed) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addStoryComment(currentStory.id, trimmed, {
      userName: currentUser?.name ?? 'You',
      userInitials: currentUser?.initials ?? 'ME',
      userColor: currentUser?.color ?? '#4A90A4',
    });
    setCommentText('');
    setShowCommentInput(false);
  };

  const handleReaction = (emoji: string) => {
    if (!currentStory) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addStoryComment(currentStory.id, emoji, {
      userName: currentUser?.name ?? 'You',
      userInitials: currentUser?.initials ?? 'ME',
      userColor: currentUser?.color ?? '#4A90A4',
    });
    setShowCommentInput(false);
  };

  // ─── Guard: no stories ─────────────────────────────────────────────────────
  if (!currentStory || !currentItem) {
    // Shouldn't happen since StoryBar guards this, but safety close
    onClose();
    return null;
  }

  const topPad = isWeb ? 67 : insets.top;

  return (
    <>
      <Modal visible transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.container}>

          {/* ── Background media ── */}
          <StoryBackground
            item={currentItem}
            story={currentStory}
            paused={isPaused}
            muted={videoMuted}
          />

          {/* ── Dark scrim ── */}
          <View style={[StyleSheet.absoluteFill, styles.scrim]} />

          {/* ── Top gradient ── */}
          <LinearGradient
            colors={['rgba(0,0,0,0.75)', 'transparent']}
            style={[styles.topGrad, { height: 130 + topPad }]}
          />

          {/* ── Progress bars ── */}
          <View style={[styles.barsRow, { top: topPad + 6 }]}>
            {currentStory.items.map((item, i) => (
              <ProgressBar
                key={`${currentStory.id}-${i}`}
                active={i === itemIdx}
                done={i < itemIdx}
                paused={isPaused}
                duration={item.type === 'video' ? VIDEO_DURATION : STORY_DURATION}
                isVideo={item.type === 'video'}
                onFinish={advance}
              />
            ))}
          </View>

          {/* ── User header ── */}
          <View style={[styles.userHeader, { top: topPad + 22 }]}>
            <View style={[styles.avatarRing, { borderColor: currentStory.userColor }]}>
              <View style={[styles.avatarInner, { backgroundColor: currentStory.userColor }]}>
                <Text style={styles.avatarText}>{currentStory.userInitials}</Text>
              </View>
            </View>
            <View style={styles.userMeta}>
              <View style={styles.userNameRow}>
                <Text style={styles.userName}>
                  {isOwnStory ? 'Your Story' : currentStory.userName}
                </Text>
                {isVideo && (
                  <View style={styles.videoBadge}>
                    <Feather name="video" size={10} color="#fff" />
                    <Text style={styles.videoBadgeText}>Video</Text>
                  </View>
                )}
              </View>
              <Text style={styles.userTime}>{currentItem.timestamp ?? 'Just now'}</Text>
            </View>

            {isVideo && (
              <TouchableOpacity
                onPress={() => setVideoMuted((m) => !m)}
                style={styles.muteBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name={videoMuted ? 'volume-x' : 'volume-2'} size={20} color="#fff" />
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* ── Verse / text overlay ── */}
          <VerseOverlay item={currentItem} />

          {/* ── Double-tap heart ── */}
          <HeartBurst visible={heartVisible} />

          {/* ── Tap zones ── */}
          <View
            style={styles.tapZones}
            pointerEvents={showCommentInput ? 'none' : 'box-none'}
          >
            <Pressable
              style={styles.tapLeft}
              onPressIn={handlePressIn}
              onPressOut={() => handlePressOut(retreat)}
            />
            <Pressable
              style={styles.tapRight}
              onPressIn={handlePressIn}
              onPressOut={() => {
                handlePressOut(advance);
                handleDoubleTap();
              }}
            />
          </View>

          {/* ── Bottom gradient ── */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.85)']}
            style={styles.bottomGrad}
          />

          {/* ── Footer ── */}
          {!showCommentInput && !showStoryAd ? (
            <View style={[styles.footer, { paddingBottom: isWeb ? 20 : insets.bottom + 10 }]}>
              {isOwnStory ? (
                <TouchableOpacity
                  style={styles.ownFooterRow}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowAnalytics(true);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.ownViewerFaces}>
                    {Array.from({ length: Math.min(currentStory.viewCount, 3) }).map((_, i) => (
                      <View
                        key={i}
                        style={[styles.ownViewerFace, {
                          backgroundColor: VIEWER_COLORS[i % VIEWER_COLORS.length],
                          marginLeft: i === 0 ? 0 : -6,
                        }]}
                      >
                        <Text style={styles.ownViewerFaceText}>{VIEWER_INITIALS[i]}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.ownViewerInfo}>
                    <Text style={styles.ownViewerCount}>{currentStory.viewCount} views</Text>
                    <Text style={styles.ownViewerSub}>Tap for insights</Text>
                  </View>
                  <View style={styles.ownStatsRight}>
                    <View style={styles.ownStatPill}>
                      <AntDesign name="heart" size={12} color="#E91E8C" />
                      <Text style={styles.ownStatPillText}>{currentStory.likeCount}</Text>
                    </View>
                    <View style={styles.ownStatPill}>
                      <Feather name="send" size={12} color="#4A90A4" />
                      <Text style={styles.ownStatPillText}>{currentStory.shareCount}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowAnalytics(true);
                      }}
                      style={styles.analyticsIconBtn}
                    >
                      <Feather name="bar-chart-2" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.engagementRow}>
                  <TouchableOpacity
                    style={styles.replyInputBtn}
                    activeOpacity={0.85}
                    onPress={() => {
                      setShowCommentInput(true);
                      setTimeout(() => commentInputRef.current?.focus(), 100);
                    }}
                  >
                    <Text style={styles.replyPlaceholder}>
                      Reply to {currentStory.userName.split(' ')[0]}…
                    </Text>
                  </TouchableOpacity>

                  <Animated.View style={likeAnimStyle}>
                    <TouchableOpacity
                      onPress={handleLike}
                      style={styles.actionBtn}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <AntDesign
                        name={(currentStory.isLikedByMe ? 'heart' : 'hearto') as any}
                        size={26}
                        color={currentStory.isLikedByMe ? '#E91E8C' : '#fff'}
                      />
                    </TouchableOpacity>
                  </Animated.View>

                  <TouchableOpacity
                    onPress={handleShare}
                    style={styles.actionBtn}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Feather name="send" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : null}

          {/* ── Comment input overlay ── */}
          {showCommentInput ? (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.commentOverlay}
            >
              <TouchableOpacity
                style={StyleSheet.absoluteFill}
                onPress={() => setShowCommentInput(false)}
                activeOpacity={1}
              />
              <View style={[styles.commentPanel, { paddingBottom: isWeb ? 16 : insets.bottom + 8 }]}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.reactionsRow}
                >
                  {QUICK_REACTIONS.map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      style={styles.reactionChip}
                      onPress={() => handleReaction(emoji)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.reactionEmoji}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.commentInputRow}>
                  <View style={[styles.myAvatar, { backgroundColor: currentUser?.color ?? '#4A90A4' }]}>
                    <Text style={styles.myAvatarText}>{currentUser?.initials ?? 'ME'}</Text>
                  </View>
                  <TextInput
                    ref={commentInputRef}
                    style={styles.commentInput}
                    value={commentText}
                    onChangeText={setCommentText}
                    placeholder={`Reply to ${currentStory.userName.split(' ')[0]}…`}
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    returnKeyType="send"
                    onSubmitEditing={handleSendComment}
                    autoFocus
                    multiline
                    maxLength={200}
                  />
                  <TouchableOpacity
                    onPress={handleSendComment}
                    disabled={!commentText.trim()}
                    style={[styles.sendBtn, { opacity: commentText.trim() ? 1 : 0.35 }]}
                  >
                    <Feather name="send" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          ) : null}

          {/* ── Story Ad Overlay ── */}
          {showStoryAd ? (() => {
            const ad = STORY_ADS[storyAdIndex % STORY_ADS.length];
            const isGoogle = ad.network === 'google';
            return (
              <View style={[StyleSheet.absoluteFill, styles.adOverlay]} pointerEvents="box-none">
                <LinearGradient
                  colors={['rgba(0,0,0,0.92)', 'rgba(0,0,0,0.75)', 'rgba(0,0,0,0.92)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={[styles.adProgressTrack, { top: topPad + 8 }]}>
                  <Animated.View style={[styles.adProgressFill, adProgressStyle]} />
                </View>
                <View style={[styles.adTopRow, { top: topPad + 20 }]}>
                  <View style={[styles.adNetworkBadge, { backgroundColor: isGoogle ? '#FBBC04' : '#1877F2' }]}>
                    <Text style={styles.adNetworkText}>{isGoogle ? 'Ad' : 'Sponsored'}</Text>
                  </View>
                  <Text style={styles.adNetworkLabel}>{isGoogle ? 'Google AdMob' : 'Facebook Audience Network'}</Text>
                  <TouchableOpacity
                    style={styles.adSkipBtn}
                    onPress={() => pendingNextUser !== null && dismissAd(pendingNextUser)}
                  >
                    <Text style={styles.adSkipText}>{adCountdown > 0 ? `${adCountdown}s` : 'Skip'}</Text>
                    {adCountdown <= 0 && <Feather name="chevron-right" size={12} color="rgba(255,255,255,0.8)" />}
                  </TouchableOpacity>
                </View>
                <View style={styles.adBody}>
                  <View style={[styles.adIconWrap, { backgroundColor: ad.accentColor + '28' }]}>
                    <Feather name={ad.iconName as any} size={44} color={ad.accentColor} />
                  </View>
                  <Text style={styles.adAdvertiser}>{ad.advertiser}</Text>
                  <Text style={styles.adHeadline}>{ad.headline}</Text>
                  <TouchableOpacity
                    style={[styles.adCtaBtn, { backgroundColor: isGoogle ? '#FBBC04' : '#1877F2' }]}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.adCtaText, { color: isGoogle ? '#1a1a1a' : '#fff' }]}>{ad.ctaText}</Text>
                    <Feather name="external-link" size={13} color={isGoogle ? '#1a1a1a' : '#fff'} />
                  </TouchableOpacity>
                </View>
                <View style={[styles.adFooter, { paddingBottom: isWeb ? 24 : insets.bottom + 12 }]}>
                  <TouchableOpacity
                    style={styles.adLearnMore}
                    onPress={() => pendingNextUser !== null && dismissAd(pendingNextUser)}
                  >
                    <Feather name="chevrons-up" size={18} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.adLearnMoreText}>Swipe up to learn more</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })() : null}

        </View>
      </Modal>

      {/* ── Analytics Modal (separate layer, avoids nested-Modal issues) ── */}
      <Modal
        visible={!!isOwnStory && showAnalytics}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAnalytics(false)}
      >
        <TouchableOpacity
          style={styles.analyticsBackdrop}
          activeOpacity={1}
          onPress={() => setShowAnalytics(false)}
        />
        <AnalyticsDrawer
          onClose={() => setShowAnalytics(false)}
          story={currentStory}
        />
      </Modal>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrim: { backgroundColor: 'rgba(0,0,0,0.18)' },

  topGrad: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 },
  barsRow: {
    position: 'absolute', left: 10, right: 10,
    flexDirection: 'row', gap: 4, zIndex: 10,
  },
  barTrack: {
    flex: 1, height: 2.5,
    backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 2, overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
  barFillVideo: { backgroundColor: '#4ADE80' },

  userHeader: {
    position: 'absolute', left: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 10,
  },
  avatarRing: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 2,
    padding: 2, alignItems: 'center', justifyContent: 'center',
  },
  avatarInner: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_700Bold' },
  userMeta: { flex: 1 },
  userNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userName: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },
  userTime: { color: 'rgba(255,255,255,0.65)', fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  videoBadge: {
    backgroundColor: '#4ADE80', borderRadius: 4,
    paddingHorizontal: 5, paddingVertical: 2,
    flexDirection: 'row', alignItems: 'center', gap: 3,
  },
  videoBadgeText: { color: '#fff', fontSize: 9, fontFamily: 'Inter_700Bold' },
  muteBtn: { padding: 6, marginRight: 2 },
  closeBtn: { padding: 6 },

  // Verse / text overlay
  verseOverlay: {
    position: 'absolute', left: 0, right: 0,
    top: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 24, zIndex: 5,
    pointerEvents: 'none' as any,
  },
  verseBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(212,168,67,0.2)',
    borderWidth: 1, borderColor: 'rgba(212,168,67,0.4)',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
    marginBottom: 18,
  },
  verseBadgeText: { color: '#D4A843', fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  verseCard: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    gap: 14, width: '100%',
    flexDirection: 'column',
  },
  verseAccentBar: {
    width: 36, height: 3, backgroundColor: '#D4A843', borderRadius: 2,
  },
  verseText: {
    color: '#fff', fontSize: 18, fontFamily: 'Inter_400Regular',
    fontStyle: 'italic', textAlign: 'center', lineHeight: 28,
  },
  textStoryBody: { fontStyle: 'normal', fontSize: 20, lineHeight: 30 },
  verseRef: { color: '#D4A843', fontSize: 13, fontFamily: 'Inter_700Bold', textAlign: 'center' },

  heartBurst: {
    position: 'absolute',
    top: '50%', left: '50%',
    marginTop: -45, marginLeft: -45,
    zIndex: 30,
  },

  tapZones: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', zIndex: 4 },
  tapLeft: { width: '40%', height: '100%' },
  tapRight: { flex: 1, height: '100%' },

  bottomGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 220, zIndex: 2 },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 12, paddingTop: 8, zIndex: 10,
  },

  engagementRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  replyInputBtn: {
    flex: 1, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.45)',
    borderRadius: 26, paddingHorizontal: 16, paddingVertical: 11,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  replyPlaceholder: { color: 'rgba(255,255,255,0.55)', fontSize: 14, fontFamily: 'Inter_400Regular' },
  actionBtn: { padding: 6 },

  ownFooterRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 18,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  ownViewerFaces: { flexDirection: 'row', alignItems: 'center' },
  ownViewerFace: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.4)',
  },
  ownViewerFaceText: { color: '#fff', fontSize: 8, fontFamily: 'Inter_700Bold' },
  ownViewerInfo: { flex: 1 },
  ownViewerCount: { color: '#fff', fontSize: 13, fontFamily: 'Inter_700Bold' },
  ownViewerSub: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: 'Inter_400Regular' },
  ownStatsRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ownStatPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 5,
  },
  ownStatPillText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_700Bold' },
  analyticsIconBtn: { padding: 4 },

  commentOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 20, justifyContent: 'flex-end' },
  commentPanel: {
    backgroundColor: 'rgba(15,15,20,0.97)',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 12, paddingHorizontal: 12,
    borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.1)',
  },
  reactionsRow: { paddingHorizontal: 4, paddingBottom: 12, gap: 8 },
  reactionChip: {
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 22,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  reactionEmoji: { fontSize: 20 },
  commentInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  myAvatar: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginBottom: 2,
  },
  myAvatarText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_700Bold' },
  commentInput: {
    flex: 1, color: '#fff', fontSize: 15, fontFamily: 'Inter_400Regular',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10,
    maxHeight: 100, backgroundColor: 'rgba(255,255,255,0.08)',
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#E91E8C',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginBottom: 2,
  },

  analyticsBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  analyticsDrawer: {
    backgroundColor: '#0F0F1A',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 10, paddingHorizontal: 20,
    maxHeight: SCREEN_H * 0.72,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
  },
  analyticsHandle: {
    width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2, alignSelf: 'center', marginBottom: 18,
  },
  analyticsHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  analyticsTitle: { color: '#fff', fontSize: 18, fontFamily: 'Inter_700Bold' },
  analyticsSubtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  analyticsClose: { padding: 4, marginLeft: 'auto' },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16, padding: 14,
    alignItems: 'center', gap: 6, borderWidth: 1,
  },
  statIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  statNum: { color: '#fff', fontSize: 20, fontFamily: 'Inter_700Bold' },
  statLabel: {
    color: 'rgba(255,255,255,0.45)', fontSize: 11, fontFamily: 'Inter_400Regular',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },

  viewersSection: { marginBottom: 18, gap: 8 },
  viewersFaceRow: { flexDirection: 'row', alignItems: 'center' },
  viewerFace: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#0F0F1A',
  },
  viewerFaceText: { color: '#fff', fontSize: 9, fontFamily: 'Inter_700Bold' },
  viewerFaceMore: { backgroundColor: 'rgba(255,255,255,0.15)' },
  viewersCaption: { color: 'rgba(255,255,255,0.55)', fontSize: 13, fontFamily: 'Inter_400Regular' },

  drawerDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginBottom: 16 },
  commentsHeading: {
    color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'Inter_700Bold',
    marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8,
  },
  commentsList: { maxHeight: 220 },
  commentRow: { flexDirection: 'row', gap: 10, marginBottom: 14, alignItems: 'flex-start' },
  commentAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  commentAvatarText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_700Bold' },
  commentBubble: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14, padding: 11, gap: 4,
  },
  commentBubbleTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  commentName: { color: '#fff', fontSize: 12, fontFamily: 'Inter_700Bold' },
  commentText: { color: 'rgba(255,255,255,0.82)', fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  commentTime: { color: 'rgba(255,255,255,0.35)', fontSize: 11, fontFamily: 'Inter_400Regular' },
  emptyComments: { alignItems: 'center', paddingVertical: 24, gap: 10 },
  emptyCommentsText: { color: 'rgba(255,255,255,0.3)', fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },

  adOverlay: { zIndex: 20, alignItems: 'center', justifyContent: 'center' },
  adProgressTrack: {
    position: 'absolute', left: 10, right: 10, height: 2.5,
    backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden', zIndex: 30,
  },
  adProgressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
  adTopRow: {
    position: 'absolute', left: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 30,
  },
  adNetworkBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4 },
  adNetworkText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#fff' },
  adNetworkLabel: { flex: 1, color: 'rgba(255,255,255,0.65)', fontSize: 12, fontFamily: 'Inter_400Regular' },
  adSkipBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  adSkipText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  adBody: { alignItems: 'center', gap: 14, paddingHorizontal: 28 },
  adIconWrap: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  adAdvertiser: {
    color: 'rgba(255,255,255,0.55)', fontSize: 12, fontFamily: 'Inter_400Regular',
    textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center',
  },
  adHeadline: { color: '#fff', fontSize: 22, fontFamily: 'Inter_700Bold', textAlign: 'center', lineHeight: 29 },
  adCtaBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 28, marginTop: 6 },
  adCtaText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  adFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', paddingTop: 12, zIndex: 30 },
  adLearnMore: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  adLearnMoreText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontFamily: 'Inter_400Regular' },
});
