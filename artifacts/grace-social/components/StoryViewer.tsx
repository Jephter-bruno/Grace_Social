import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
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
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({
  active, done, paused, duration, onFinish,
}: {
  active: boolean; done: boolean; paused: boolean; duration: number; onFinish: () => void;
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
      <Animated.View style={[styles.barFill, barStyle]} />
    </View>
  );
}

// ─── Analytics Drawer ─────────────────────────────────────────────────────────

function AnalyticsDrawer({
  visible, onClose, viewCount, likeCount, shareCount, comments, colors,
}: {
  visible: boolean; onClose: () => void; viewCount: number; likeCount: number;
  shareCount: number; comments: StoryComment[]; colors: ReturnType<typeof useColors>;
}) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SCREEN_H);

  useEffect(() => {
    translateY.value = visible
      ? withSpring(0, { damping: 22, stiffness: 220 })
      : withTiming(SCREEN_H, { duration: 280 });
  }, [visible]);

  const drawerStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.analyticsDrawer, drawerStyle, { paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.analyticsHandle} />
      <View style={styles.analyticsHeader}>
        <Text style={styles.analyticsTitle}>Story Insights</Text>
        <TouchableOpacity onPress={onClose} style={styles.analyticsClose}>
          <Feather name="x" size={20} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Feather name="eye" size={22} color="#fff" />
          <Text style={styles.statNum}>{viewCount}</Text>
          <Text style={styles.statLabel}>Views</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Feather name="heart" size={22} color="#E91E8C" />
          <Text style={styles.statNum}>{likeCount}</Text>
          <Text style={styles.statLabel}>Likes</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Feather name="share-2" size={22} color="#4A90A4" />
          <Text style={styles.statNum}>{shareCount}</Text>
          <Text style={styles.statLabel}>Shares</Text>
        </View>
      </View>

      {/* Comments */}
      <Text style={styles.commentsHeading}>
        {comments.length > 0 ? `Comments (${comments.length})` : 'No comments yet'}
      </Text>
      {comments.length > 0 && (
        <ScrollView style={styles.commentsList} showsVerticalScrollIndicator={false}>
          {comments.map((c) => (
            <View key={c.id} style={styles.commentRow}>
              <View style={[styles.commentAvatar, { backgroundColor: c.userColor }]}>
                <Text style={styles.commentAvatarText}>{c.userInitials}</Text>
              </View>
              <View style={styles.commentBubble}>
                <Text style={styles.commentName}>{c.userName}</Text>
                <Text style={styles.commentText}>{c.text}</Text>
                <Text style={styles.commentTime}>{c.timestamp}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
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

  const pressStart = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const adTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const adCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const adProgress = useSharedValue(0);
  const commentInputRef = useRef<TextInput>(null);

  const currentUser_ = viewableStories[userIdx];
  const currentItem = currentUser_?.items[itemIdx];
  const isVideo = currentItem?.type === 'video' && !!currentItem?.videoUri;
  const isOwnStory = currentUser_?.isOwn;
  const isPaused = paused || showCommentInput || showAnalytics;

  // Video player
  const videoPlayer = useVideoPlayer(null);

  useEffect(() => {
    if (!visible || !isVideo || !currentItem?.videoUri) {
      videoPlayer.pause();
      return;
    }
    videoPlayer.replace({ uri: currentItem.videoUri });
    if (!isPaused) videoPlayer.play();
  }, [visible, currentItem?.id, isVideo]);

  useEffect(() => {
    if (!isVideo) return;
    if (isPaused) { videoPlayer.pause(); } else { videoPlayer.play(); }
  }, [isPaused, isVideo]);

  const dismissAd = useCallback((nextUser: number) => {
    setShowStoryAd(false);
    adProgress.value = 0;
    if (adTimerRef.current) clearTimeout(adTimerRef.current);
    if (adCountdownRef.current) clearInterval(adCountdownRef.current);
    if (nextUser < viewableStories.length) { setUserIdx(nextUser); setItemIdx(0); }
    else onClose();
  }, [viewableStories.length, onClose]);

  const advance = useCallback(() => {
    if (!currentUser_) return;
    const nextItem = itemIdx + 1;
    if (nextItem < currentUser_.items.length) {
      setItemIdx(nextItem);
    } else {
      markStorySeen(currentUser_.id);
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
  }, [currentUser_, itemIdx, userIdx, viewableStories.length, markStorySeen, onClose, adProgress, dismissAd]);

  const retreat = useCallback(() => {
    const prevItem = itemIdx - 1;
    if (prevItem >= 0) setItemIdx(prevItem);
    else if (userIdx - 1 >= 0) { setUserIdx(userIdx - 1); setItemIdx(0); }
  }, [itemIdx, userIdx]);

  // Record view when user changes
  useEffect(() => {
    if (visible && currentUser_) recordStoryView(currentUser_.id);
  }, [visible, userIdx]);

  useEffect(() => {
    if (visible) {
      setUserIdx(Math.min(startIndex, Math.max(0, viewableStories.length - 1)));
      setItemIdx(0);
    }
  }, [visible, startIndex]);

  const adProgressStyle = useAnimatedStyle(() => ({ width: `${adProgress.value * 100}%` as any }));

  if (!visible || !currentUser_) return null;

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

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleStoryLike(currentUser_.id);
  };

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    incrementStoryShare(currentUser_.id);
  };

  const handleSendComment = () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addStoryComment(currentUser_.id, trimmed, {
      userName: currentUser?.name ?? 'You',
      userInitials: currentUser?.initials ?? 'ME',
      userColor: currentUser?.color ?? '#4A90A4',
    });
    setCommentText('');
    setShowCommentInput(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* ── Background ── */}
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
          <LinearGradient colors={[currentUser_.userColor, '#000']} style={StyleSheet.absoluteFill} />
        )}

        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.18)' }]} />

        {/* ── Top gradient ── */}
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent']}
          style={[styles.topGrad, { height: 120 + topPad }]}
        />

        {/* ── Progress bars ── */}
        <View style={[styles.barsRow, { top: topPad + 8 }]}>
          {currentUser_.items.map((item, i) => (
            <ProgressBar
              key={`${userIdx}-${i}`}
              active={i === itemIdx}
              done={i < itemIdx}
              paused={isPaused}
              duration={item.type === 'video' ? VIDEO_DURATION : STORY_DURATION}
              onFinish={advance}
            />
          ))}
        </View>

        {/* ── User header ── */}
        <View style={[styles.userHeader, { top: topPad + 24 }]}>
          <View style={[styles.avatarRing, { borderColor: currentUser_.userColor }]}>
            <View style={[styles.avatarInner, { backgroundColor: currentUser_.userColor }]}>
              <Text style={styles.avatarText}>{currentUser_.userInitials}</Text>
            </View>
          </View>
          <View style={styles.userMeta}>
            <Text style={styles.userName}>{isOwnStory ? 'Your Story' : currentUser_.userName}</Text>
            <Text style={styles.userTime}>{currentItem?.timestamp ?? 'Just now'}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ── Story content ── */}
        {currentItem?.verseText && (
          <View style={styles.verseOverlay}>
            <View style={styles.verseBox}>
              <Feather name="book-open" size={20} color="#D4A843" />
              <Text style={styles.verseText}>"{currentItem.verseText}"</Text>
              {currentItem.verseReference && (
                <Text style={styles.verseRef}>— {currentItem.verseReference}</Text>
              )}
            </View>
          </View>
        )}

        {/* ── Tap zones with hold-to-pause ── */}
        <View style={styles.tapZones} pointerEvents={showCommentInput ? 'none' : 'box-none'}>
          <Pressable
            style={styles.tapLeft}
            onPressIn={handlePressIn}
            onPressOut={() => handlePressOut(retreat)}
          />
          <Pressable
            style={styles.tapRight}
            onPressIn={handlePressIn}
            onPressOut={() => handlePressOut(advance)}
          />
        </View>

        {/* ── Bottom gradient ── */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.bottomGrad}
        />

        {/* ── Footer ── */}
        {!showCommentInput && (
          <View style={[styles.footer, { paddingBottom: isWeb ? 24 : insets.bottom + 12 }]}>
            {isOwnStory ? (
              /* Own story: view count + analytics */
              <>
                <TouchableOpacity
                  style={styles.viewersBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowAnalytics(true);
                  }}
                >
                  <Feather name="eye" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.viewersText}>{currentUser_.viewCount} views</Text>
                </TouchableOpacity>
                <View style={styles.footerActions}>
                  <View style={styles.metaPill}>
                    <Feather name="heart" size={14} color="#E91E8C" />
                    <Text style={styles.metaPillText}>{currentUser_.likeCount}</Text>
                  </View>
                  <View style={styles.metaPill}>
                    <Feather name="share-2" size={14} color="#4A90A4" />
                    <Text style={styles.metaPillText}>{currentUser_.shareCount}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.analyticsBtn}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowAnalytics(true);
                    }}
                  >
                    <Feather name="bar-chart-2" size={22} color="#fff" />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              /* Other story: like + comment + share */
              <>
                <TouchableOpacity onPress={handleLike} style={styles.likeBtn}>
                  <Feather
                    name={currentUser_.isLikedByMe ? 'heart' : 'heart'}
                    size={26}
                    color={currentUser_.isLikedByMe ? '#E91E8C' : '#fff'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.replyInputBtn}
                  activeOpacity={0.8}
                  onPress={() => {
                    setShowCommentInput(true);
                    setTimeout(() => commentInputRef.current?.focus(), 100);
                  }}
                >
                  <Text style={styles.replyPlaceholder}>
                    Reply to {currentUser_.userName.split(' ')[0]}…
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
                  <Feather name="send" size={22} color="#fff" />
                </TouchableOpacity>
              </>
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
            <View style={[styles.commentBar, { paddingBottom: isWeb ? 16 : insets.bottom + 8 }]}>
              <TextInput
                ref={commentInputRef}
                style={styles.commentInput}
                value={commentText}
                onChangeText={setCommentText}
                placeholder={`Reply to ${currentUser_.userName.split(' ')[0]}…`}
                placeholderTextColor="rgba(255,255,255,0.45)"
                returnKeyType="send"
                onSubmitEditing={handleSendComment}
                autoFocus
              />
              <TouchableOpacity
                onPress={handleSendComment}
                disabled={!commentText.trim()}
                style={[styles.sendBtn, { opacity: commentText.trim() ? 1 : 0.4 }]}
              >
                <Feather name="send" size={20} color="#fff" />
              </TouchableOpacity>
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

      {/* ── Analytics Drawer (rendered outside main view so it overlays) ── */}
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
          <View style={[styles.analyticsDrawer, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.analyticsHandle} />
            <View style={styles.analyticsHeader}>
              <Text style={styles.analyticsTitle}>Story Insights</Text>
              <TouchableOpacity onPress={() => setShowAnalytics(false)} style={styles.analyticsClose}>
                <Feather name="x" size={20} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Feather name="eye" size={24} color="#fff" />
                <Text style={styles.statNum}>{currentUser_.viewCount}</Text>
                <Text style={styles.statLabel}>Views</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Feather name="heart" size={24} color="#E91E8C" />
                <Text style={styles.statNum}>{currentUser_.likeCount}</Text>
                <Text style={styles.statLabel}>Likes</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Feather name="share-2" size={24} color="#4A90A4" />
                <Text style={styles.statNum}>{currentUser_.shareCount}</Text>
                <Text style={styles.statLabel}>Shares</Text>
              </View>
            </View>

            <Text style={styles.commentsHeading}>
              {currentUser_.storyComments.length > 0
                ? `Comments (${currentUser_.storyComments.length})`
                : 'No comments yet'}
            </Text>
            {currentUser_.storyComments.length > 0 && (
              <ScrollView style={styles.commentsList} showsVerticalScrollIndicator={false}>
                {currentUser_.storyComments.map((c) => (
                  <View key={c.id} style={styles.commentRow}>
                    <View style={[styles.commentAvatar, { backgroundColor: c.userColor }]}>
                      <Text style={styles.commentAvatarText}>{c.userInitials}</Text>
                    </View>
                    <View style={styles.commentBubble}>
                      <Text style={styles.commentName}>{c.userName}</Text>
                      <Text style={styles.commentText}>{c.text}</Text>
                      <Text style={styles.commentTime}>{c.timestamp}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </Modal>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  topGrad: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 },
  barsRow: { position: 'absolute', left: 10, right: 10, flexDirection: 'row', gap: 4, zIndex: 10 },
  barTrack: { flex: 1, height: 2.5, backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 2, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
  userHeader: { position: 'absolute', left: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 10 },
  avatarRing: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, padding: 2, alignItems: 'center', justifyContent: 'center' },
  avatarInner: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_700Bold' },
  userMeta: { flex: 1 },
  userName: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  userTime: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: 'Inter_400Regular' },
  closeBtn: { padding: 6 },
  verseOverlay: { position: 'absolute', left: 0, right: 0, top: '32%', alignItems: 'center', paddingHorizontal: 24, zIndex: 5 },
  verseBox: { backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 16, padding: 22, borderLeftWidth: 3, borderLeftColor: '#D4A843', gap: 10, width: '100%' },
  verseText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_400Regular', fontStyle: 'italic', textAlign: 'center', lineHeight: 24 },
  verseRef: { color: '#D4A843', fontSize: 13, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  tapZones: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', zIndex: 4 },
  tapLeft: { width: '40%', height: '100%' },
  tapRight: { flex: 1, height: '100%' },
  bottomGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 180, zIndex: 2 },

  // Footer
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 12, gap: 10, zIndex: 10 },
  likeBtn: { padding: 6 },
  shareBtn: { padding: 6 },
  replyInputBtn: { flex: 1, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10 },
  replyPlaceholder: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontFamily: 'Inter_400Regular' },

  // Own story footer
  viewersBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  viewersText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: 'Inter_400Regular' },
  footerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metaPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  metaPillText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  analyticsBtn: { padding: 6 },

  // Comment input
  commentOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 20, justifyContent: 'flex-end' },
  commentBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingTop: 12, backgroundColor: 'rgba(0,0,0,0.6)', borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.15)' },
  commentInput: { flex: 1, color: '#fff', fontSize: 15, fontFamily: 'Inter_400Regular', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, maxHeight: 100 },
  sendBtn: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)' },

  // Analytics drawer
  analyticsBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  analyticsDrawer: { backgroundColor: '#1a1a2e', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 10, paddingHorizontal: 20, maxHeight: SCREEN_H * 0.65 },
  analyticsHandle: { width: 36, height: 4, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  analyticsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  analyticsTitle: { flex: 1, color: '#fff', fontSize: 17, fontFamily: 'Inter_700Bold' },
  analyticsClose: { padding: 4 },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 20, marginBottom: 24, alignItems: 'center' },
  statBox: { flex: 1, alignItems: 'center', gap: 6 },
  statDivider: { width: 1, height: 44, backgroundColor: 'rgba(255,255,255,0.12)' },
  statNum: { color: '#fff', fontSize: 22, fontFamily: 'Inter_700Bold' },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'Inter_400Regular' },
  commentsHeading: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  commentsList: { maxHeight: 220 },
  commentRow: { flexDirection: 'row', gap: 10, marginBottom: 14, alignItems: 'flex-start' },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  commentAvatarText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_700Bold' },
  commentBubble: { flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: 10, gap: 3 },
  commentName: { color: '#fff', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  commentText: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  commentTime: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'Inter_400Regular' },

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
