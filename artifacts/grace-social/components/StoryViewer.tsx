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
import { StoryComment, useApp } from '@/context/AppContext';
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

// ─── Fake viewer avatars for analytics ───────────────────────────────────────
const VIEWER_COLORS = ['#D4A843', '#9B59B6', '#27AE60', '#E91E8C', '#4A90A4', '#E74C3C', '#F39C12'];
const VIEWER_INITIALS = ['PJ', 'MK', 'DL', 'SW', 'TB', 'GM', 'RB', 'LH', 'AF', 'CE'];

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({
  active, done, paused, duration, isVideo, onFinish,
}: {
  active: boolean; done: boolean; paused: boolean; duration: number; isVideo?: boolean; onFinish: () => void;
}) {
  const progress = useSharedValue(done ? 1 : 0);
  const cbRef = useRef(onFinish);
  cbRef.current = onFinish;

  useEffect(() => {
    if (!active) { progress.value = done ? 1 : 0; return; }
    progress.value = 0;
    if (!paused) {
      progress.value = withTiming(1, { duration }, (finished) => {
        if (finished) runOnJS(cbRef.current)();
      });
    }
  }, [active, done]);

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
  }, [paused]);

  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View style={styles.barTrack}>
      <Animated.View style={[styles.barFill, barStyle, isVideo && styles.barFillVideo]} />
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
      opacity.value = 1;
      scale.value = withSequence(
        withSpring(1.2, { damping: 6, stiffness: 300 }),
        withTiming(0.9, { duration: 100 }),
      );
      opacity.value = withSequence(
        withTiming(1, { duration: 50 }),
        withTiming(0, { duration: 600, /* delay */ }),
      );
    }
  }, [visible]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;
  return (
    <Animated.View style={[styles.heartBurst, style]} pointerEvents="none">
      <AntDesign name="heart" size={90} color="#E91E8C" />
    </Animated.View>
  );
}

// ─── Analytics Drawer ─────────────────────────────────────────────────────────

function AnalyticsDrawer({
  visible, onClose, story,
}: {
  visible: boolean;
  onClose: () => void;
  story: { viewCount: number; likeCount: number; shareCount: number; storyComments: StoryComment[] };
}) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SCREEN_H);

  useEffect(() => {
    translateY.value = visible
      ? withSpring(0, { damping: 22, stiffness: 220 })
      : withTiming(SCREEN_H, { duration: 280 });
  }, [visible]);

  const drawerStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  const viewerCount = Math.min(story.viewCount, VIEWER_INITIALS.length);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.analyticsDrawer, drawerStyle, { paddingBottom: insets.bottom + 20 }]}>
      {/* Handle */}
      <View style={styles.analyticsHandle} />

      {/* Header */}
      <View style={styles.analyticsHeader}>
        <View>
          <Text style={styles.analyticsTitle}>Story Insights</Text>
          <Text style={styles.analyticsSubtitle}>Performance overview</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.analyticsClose}>
          <Feather name="x" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>

      {/* Stats cards */}
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

      {/* Viewers row */}
      {viewerCount > 0 && (
        <View style={styles.viewersSection}>
          <View style={styles.viewersFaceRow}>
            {Array.from({ length: viewerCount }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.viewerFace,
                  { backgroundColor: VIEWER_COLORS[i % VIEWER_COLORS.length], marginLeft: i === 0 ? 0 : -10, zIndex: viewerCount - i },
                ]}
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

      {/* Divider */}
      <View style={styles.drawerDivider} />

      {/* Comments */}
      <Text style={styles.commentsHeading}>
        {story.storyComments.length > 0
          ? `Replies · ${story.storyComments.length}`
          : 'No replies yet'}
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
    </Animated.View>
  );
}

// ─── Main StoryViewer ─────────────────────────────────────────────────────────

interface StoryViewerProps {
  visible: boolean;
  startIndex: number;
  onClose: () => void;
}

export function StoryViewer({ visible, startIndex, onClose }: StoryViewerProps) {
  const { stories, markStorySeen, toggleStoryLike, addStoryComment,
    incrementStoryShare, recordStoryView } = useApp();
  const { currentUser } = useAuth();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';

  const viewableStories = stories.filter((s) => s.items.length > 0);
  const [userIdx, setUserIdx] = useState(startIndex);
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
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const heartBurstKey = useRef(0);

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
  const isOwnStory = currentStory?.isOwn;
  const isPaused = paused || showCommentInput || showAnalytics;

  // Video player
  const videoPlayer = useVideoPlayer(null);

  useEffect(() => {
    if (!visible || !isVideo || !currentItem?.videoUri) {
      videoPlayer.pause();
      return;
    }
    videoPlayer.replace({ uri: currentItem.videoUri });
    videoPlayer.muted = videoMuted;
    if (!isPaused) videoPlayer.play();
  }, [visible, currentItem?.id, isVideo]);

  useEffect(() => {
    if (!isVideo) return;
    if (isPaused) { videoPlayer.pause(); } else { videoPlayer.play(); }
  }, [isPaused, isVideo]);

  useEffect(() => {
    if (isVideo) videoPlayer.muted = videoMuted;
  }, [videoMuted, isVideo]);

  const dismissAd = useCallback((nextUser: number) => {
    setShowStoryAd(false);
    adProgress.value = 0;
    if (adTimerRef.current) clearTimeout(adTimerRef.current);
    if (adCountdownRef.current) clearInterval(adCountdownRef.current);
    if (nextUser < viewableStories.length) { setUserIdx(nextUser); setItemIdx(0); }
    else onClose();
  }, [viewableStories.length, onClose]);

  const advance = useCallback(() => {
    if (!currentStory) return;
    const nextItem = itemIdx + 1;
    if (nextItem < currentStory.items.length) {
      setItemIdx(nextItem);
    } else {
      markStorySeen(currentStory.id);
      const nextUser = userIdx + 1;
      if (nextUser < viewableStories.length && userIdx % 2 === 1) {
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
    }
  }, [currentStory, itemIdx, userIdx, viewableStories.length, markStorySeen, onClose, adProgress, dismissAd]);

  const retreat = useCallback(() => {
    const prevItem = itemIdx - 1;
    if (prevItem >= 0) setItemIdx(prevItem);
    else if (userIdx - 1 >= 0) { setUserIdx(userIdx - 1); setItemIdx(0); }
  }, [itemIdx, userIdx]);

  useEffect(() => {
    if (visible && currentStory) recordStoryView(currentStory.id);
  }, [visible, userIdx]);

  useEffect(() => {
    if (visible) {
      setUserIdx(Math.min(startIndex, Math.max(0, viewableStories.length - 1)));
      setItemIdx(0);
    }
  }, [visible, startIndex]);

  const adProgressStyle = useAnimatedStyle(() => ({ width: `${adProgress.value * 100}%` as any }));
  const likeAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: likeScale.value }] }));

  if (!visible || !currentStory) return null;

  const topPad = isWeb ? 67 : insets.top;
  const itemDuration = isVideo ? VIDEO_DURATION : STORY_DURATION;

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
    if (now - lastTap.current < 300) {
      // Double tap — like!
      if (!isOwnStory) {
        if (!currentStory.isLikedByMe) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          toggleStoryLike(currentStory.id);
        }
        heartBurstKey.current += 1;
        setShowHeartBurst(false);
        setTimeout(() => setShowHeartBurst(true), 10);
        setTimeout(() => setShowHeartBurst(false), 900);
      }
    }
    lastTap.current = now;
  };

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    likeScale.value = withSequence(
      withSpring(1.35, { damping: 4, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    );
    toggleStoryLike(currentStory.id);
  };

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    incrementStoryShare(currentStory.id);
  };

  const handleSendComment = () => {
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addStoryComment(currentStory.id, emoji, {
      userName: currentUser?.name ?? 'You',
      userInitials: currentUser?.initials ?? 'ME',
      userColor: currentUser?.color ?? '#4A90A4',
    });
    setShowCommentInput(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>

        {/* ── Background media ── */}
        {isVideo && currentItem?.videoUri ? (
          <VideoView
            player={videoPlayer}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            nativeControls={false}
          />
        ) : currentItem?.imageIndex !== undefined ? (
          <Image
            source={POST_IMAGES[currentItem.imageIndex]}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : (
          <LinearGradient colors={[currentStory.userColor, '#000']} style={StyleSheet.absoluteFill} />
        )}

        {/* ── Scrim overlay ── */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.15)' }]} />

        {/* ── Top gradient ── */}
        <LinearGradient
          colors={['rgba(0,0,0,0.65)', 'transparent']}
          style={[styles.topGrad, { height: 130 + topPad }]}
        />

        {/* ── Progress bars ── */}
        <View style={[styles.barsRow, { top: topPad + 6 }]}>
          {currentStory.items.map((item, i) => (
            <ProgressBar
              key={`${userIdx}-${i}`}
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
        <View style={[styles.userHeader, { top: topPad + 20 }]}>
          <View style={[styles.avatarRing, { borderColor: currentStory.userColor }]}>
            <View style={[styles.avatarInner, { backgroundColor: currentStory.userColor }]}>
              <Text style={styles.avatarText}>{currentStory.userInitials}</Text>
            </View>
          </View>
          <View style={styles.userMeta}>
            <View style={styles.userNameRow}>
              <Text style={styles.userName}>{isOwnStory ? 'Your Story' : currentStory.userName}</Text>
              {isVideo && (
                <View style={styles.videoBadge}>
                  <Feather name="video" size={10} color="#fff" />
                </View>
              )}
            </View>
            <Text style={styles.userTime}>{currentItem?.timestamp ?? 'Just now'}</Text>
          </View>

          {/* Mute button for video */}
          {isVideo && (
            <TouchableOpacity
              onPress={() => setVideoMuted((m) => !m)}
              style={styles.muteBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name={videoMuted ? 'volume-x' : 'volume-2'} size={20} color="#fff" />
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ── Verse overlay ── */}
        {currentItem?.verseText && (
          <View style={styles.verseOverlay}>
            <LinearGradient
              colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.0)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.verseBox}>
              <Feather name="book-open" size={18} color="#D4A843" />
              <Text style={styles.verseText}>"{currentItem.verseText}"</Text>
              {currentItem.verseReference && (
                <Text style={styles.verseRef}>— {currentItem.verseReference}</Text>
              )}
            </View>
          </View>
        )}

        {/* ── Center heart burst (double-tap) ── */}
        <HeartBurst visible={showHeartBurst} />

        {/* ── Tap zones with hold-to-pause + double-tap-to-like ── */}
        <View style={styles.tapZones} pointerEvents={showCommentInput ? 'none' : 'box-none'}>
          <Pressable
            style={styles.tapLeft}
            onPressIn={handlePressIn}
            onPressOut={() => handlePressOut(retreat)}
          />
          <Pressable
            style={styles.tapRight}
            onPressIn={handlePressIn}
            onPressOut={() => { handlePressOut(advance); handleDoubleTap(); }}
          />
        </View>

        {/* ── Bottom gradient ── */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.bottomGrad}
        />

        {/* ── Footer ── */}
        {!showCommentInput && (
          <View style={[styles.footer, { paddingBottom: isWeb ? 20 : insets.bottom + 10 }]}>
            {isOwnStory ? (
              /* ── Own story: analytics row ── */
              <TouchableOpacity
                style={styles.ownFooterRow}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowAnalytics(true);
                }}
                activeOpacity={0.8}
              >
                {/* Viewer faces */}
                <View style={styles.ownViewerFaces}>
                  {Array.from({ length: Math.min(currentStory.viewCount, 3) }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.ownViewerFace,
                        { backgroundColor: VIEWER_COLORS[i % VIEWER_COLORS.length], marginLeft: i === 0 ? 0 : -6, zIndex: 3 - i },
                      ]}
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
              /* ── Other story: like + reply + share ── */
              <View style={styles.engagementRow}>
                {/* Reply input button */}
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

                {/* Like button */}
                <Animated.View style={likeAnimStyle}>
                  <TouchableOpacity onPress={handleLike} style={styles.actionBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <AntDesign
                      name={(currentStory.isLikedByMe ? 'heart' : 'hearto') as any}
                      size={26}
                      color={currentStory.isLikedByMe ? '#E91E8C' : '#fff'}
                    />
                  </TouchableOpacity>
                </Animated.View>

                {/* Share button */}
                <TouchableOpacity onPress={handleShare} style={styles.actionBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Feather name="send" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ── Comment input overlay ── */}
        {showCommentInput && (
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
              {/* Quick reactions */}
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

              {/* Input row */}
              <View style={styles.commentInputRow}>
                {/* Current user avatar */}
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
        )}

        {/* ── Story Ad Overlay ── */}
        {showStoryAd && (() => {
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
                <TouchableOpacity style={[styles.adCtaBtn, { backgroundColor: isGoogle ? '#FBBC04' : '#1877F2' }]} activeOpacity={0.85}>
                  <Text style={[styles.adCtaText, { color: isGoogle ? '#1a1a1a' : '#fff' }]}>{ad.ctaText}</Text>
                  <Feather name="external-link" size={13} color={isGoogle ? '#1a1a1a' : '#fff'} />
                </TouchableOpacity>
              </View>
              <View style={[styles.adFooter, { paddingBottom: isWeb ? 24 : insets.bottom + 12 }]}>
                <TouchableOpacity style={styles.adLearnMore} onPress={() => pendingNextUser !== null && dismissAd(pendingNextUser)}>
                  <Feather name="chevrons-up" size={18} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.adLearnMoreText}>Swipe up to learn more</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })()}
      </View>

      {/* ── Analytics Drawer (own story) ── */}
      {isOwnStory && showAnalytics && (
        <Modal
          visible={showAnalytics}
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
            visible={showAnalytics}
            onClose={() => setShowAnalytics(false)}
            story={currentStory}
          />
        </Modal>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // Top gradient + progress
  topGrad: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 },
  barsRow: { position: 'absolute', left: 10, right: 10, flexDirection: 'row', gap: 4, zIndex: 10 },
  barTrack: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
  barFillVideo: { backgroundColor: '#4ADE80' },

  // User header
  userHeader: { position: 'absolute', left: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 10 },
  avatarRing: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, padding: 2, alignItems: 'center', justifyContent: 'center' },
  avatarInner: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_700Bold' },
  userMeta: { flex: 1 },
  userNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userName: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },
  userTime: { color: 'rgba(255,255,255,0.65)', fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  videoBadge: { backgroundColor: '#4ADE80', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, flexDirection: 'row', alignItems: 'center', gap: 3 },
  muteBtn: { padding: 6, marginRight: 2 },
  closeBtn: { padding: 6 },

  // Verse overlay
  verseOverlay: { position: 'absolute', left: 0, right: 0, top: '30%', alignItems: 'center', paddingHorizontal: 20, zIndex: 5 },
  verseBox: { backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 18, padding: 20, borderLeftWidth: 3, borderLeftColor: '#D4A843', gap: 10, width: '100%', backdropFilter: 'blur(8px)' },
  verseText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_400Regular', fontStyle: 'italic', textAlign: 'center', lineHeight: 24 },
  verseRef: { color: '#D4A843', fontSize: 13, fontFamily: 'Inter_700Bold', textAlign: 'center' },

  // Heart burst
  heartBurst: { position: 'absolute', top: '50%', left: '50%', marginTop: -45, marginLeft: -45, zIndex: 30, pointerEvents: 'none' },

  // Tap zones
  tapZones: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', zIndex: 4 },
  tapLeft: { width: '40%', height: '100%' },
  tapRight: { flex: 1, height: '100%' },

  // Bottom gradient
  bottomGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 200, zIndex: 2 },

  // Footer - other story
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 12, paddingTop: 8, zIndex: 10 },
  engagementRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  replyInputBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.45)',
    borderRadius: 26,
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  replyPlaceholder: { color: 'rgba(255,255,255,0.55)', fontSize: 14, fontFamily: 'Inter_400Regular' },
  actionBtn: { padding: 6 },

  // Footer - own story
  ownFooterRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  ownViewerFaces: { flexDirection: 'row', alignItems: 'center' },
  ownViewerFace: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.4)' },
  ownViewerFaceText: { color: '#fff', fontSize: 8, fontFamily: 'Inter_700Bold' },
  ownViewerInfo: { flex: 1 },
  ownViewerCount: { color: '#fff', fontSize: 13, fontFamily: 'Inter_700Bold' },
  ownViewerSub: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: 'Inter_400Regular' },
  ownStatsRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ownStatPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 5 },
  ownStatPillText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_700Bold' },
  analyticsIconBtn: { padding: 4 },

  // Comment panel
  commentOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 20, justifyContent: 'flex-end' },
  commentPanel: {
    backgroundColor: 'rgba(15,15,20,0.96)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 12,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  reactionsRow: { paddingHorizontal: 4, paddingBottom: 12, gap: 8 },
  reactionChip: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  reactionEmoji: { fontSize: 20 },
  commentInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  myAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: 2 },
  myAvatarText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_700Bold' },
  commentInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E91E8C',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginBottom: 2,
  },

  // Analytics drawer
  analyticsBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  analyticsDrawer: {
    backgroundColor: '#0F0F1A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    paddingHorizontal: 20,
    maxHeight: SCREEN_H * 0.72,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  analyticsHandle: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  analyticsHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  analyticsTitle: { color: '#fff', fontSize: 18, fontFamily: 'Inter_700Bold' },
  analyticsSubtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  analyticsClose: { padding: 4, marginLeft: 'auto' },

  // Stats cards
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
  },
  statIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  statNum: { color: '#fff', fontSize: 20, fontFamily: 'Inter_700Bold' },
  statLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 11, fontFamily: 'Inter_400Regular', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Viewers row
  viewersSection: { marginBottom: 18, gap: 8 },
  viewersFaceRow: { flexDirection: 'row', alignItems: 'center' },
  viewerFace: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#0F0F1A' },
  viewerFaceText: { color: '#fff', fontSize: 9, fontFamily: 'Inter_700Bold' },
  viewerFaceMore: { backgroundColor: 'rgba(255,255,255,0.15)' },
  viewersCaption: { color: 'rgba(255,255,255,0.55)', fontSize: 13, fontFamily: 'Inter_400Regular' },

  drawerDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginBottom: 16 },

  // Drawer comments
  commentsHeading: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'Inter_700Bold', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  commentsList: { maxHeight: 220 },
  commentRow: { flexDirection: 'row', gap: 10, marginBottom: 14, alignItems: 'flex-start' },
  commentAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  commentAvatarText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_700Bold' },
  commentBubble: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 11, gap: 4 },
  commentBubbleTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  commentName: { color: '#fff', fontSize: 12, fontFamily: 'Inter_700Bold' },
  commentText: { color: 'rgba(255,255,255,0.82)', fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  commentTime: { color: 'rgba(255,255,255,0.35)', fontSize: 11, fontFamily: 'Inter_400Regular' },
  emptyComments: { alignItems: 'center', paddingVertical: 24, gap: 10 },
  emptyCommentsText: { color: 'rgba(255,255,255,0.3)', fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },

  // Ads
  adOverlay: { zIndex: 20, alignItems: 'center', justifyContent: 'center' },
  adProgressTrack: { position: 'absolute', left: 10, right: 10, height: 2.5, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden', zIndex: 30 },
  adProgressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
  adTopRow: { position: 'absolute', left: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 30 },
  adNetworkBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4 },
  adNetworkText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#fff' },
  adNetworkLabel: { flex: 1, color: 'rgba(255,255,255,0.65)', fontSize: 12, fontFamily: 'Inter_400Regular' },
  adSkipBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  adSkipText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  adBody: { alignItems: 'center', gap: 14, paddingHorizontal: 28 },
  adIconWrap: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  adAdvertiser: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontFamily: 'Inter_400Regular', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' },
  adHeadline: { color: '#fff', fontSize: 22, fontFamily: 'Inter_700Bold', textAlign: 'center', lineHeight: 29 },
  adCtaBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 28, marginTop: 6 },
  adCtaText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  adFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', paddingTop: 12, zIndex: 30 },
  adLearnMore: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  adLearnMoreText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontFamily: 'Inter_400Regular' },
});
