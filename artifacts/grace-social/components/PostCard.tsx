import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  Animated as RNAnimated,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarCircle } from '@/components/AvatarCircle';
import { CommentsModal } from '@/components/CommentsModal';
import { MediaCarousel } from '@/components/MediaCarousel';
import { PostDetailModal } from '@/components/PostDetailModal';
import { SharePostModal } from '@/components/SharePostModal';
import { VideoPlayer } from '@/components/VideoPlayer';
import { POST_IMAGES } from '@/constants/images';
import { Post, useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';

interface PostCardProps {
  post: Post;
  isActive?: boolean;
}

function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

// ── Verified badge ──────────────────────────────────────────────────────────
function VerifiedBadge() {
  return (
    <View style={badge.wrap}>
      <Text style={badge.check}>✓</Text>
    </View>
  );
}
const badge = StyleSheet.create({
  wrap: {
    width: 15, height: 15, borderRadius: 8,
    backgroundColor: '#1877F2',
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 4,
  },
  check: { fontSize: 9, color: '#fff', fontFamily: 'Inter_700Bold', lineHeight: 13 },
});

// ── Stat button ──────────────────────────────────────────────────────────────
function StatBtn({
  icon,
  count,
  color = '#fff',
  onPress,
  animated = false,
}: {
  icon: React.ReactNode;
  count?: number | string;
  color?: string;
  onPress?: () => void;
  animated?: boolean;
}) {
  return (
    <TouchableOpacity style={sb.btn} onPress={onPress} activeOpacity={0.7}>
      {icon}
      {count !== undefined && (
        <Text style={[sb.count, { color }]}>{count}</Text>
      )}
    </TouchableOpacity>
  );
}
const sb = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  count: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});

// ── Main PostCard ────────────────────────────────────────────────────────────
export function PostCard({ post, isActive = false }: PostCardProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { toggleLike, toggleSave, toggleFollow, isFollowingUser, incrementPostShares, resharePost } = useApp();
  const { currentUser } = useAuth();

  // For repost cards, all content and interactions target the original post
  const effectivePost: Post = (post.isRepost && post.originalPost) ? (post.originalPost as Post) : post;
  const isRepostCard = post.isRepost && !!post.originalPost;

  const isOwnPost = effectivePost.userId === 'currentUser';
  // Multi-media carousel takes precedence over legacy single-media fields
  const hasCarousel = Array.isArray(effectivePost.mediaItems) && effectivePost.mediaItems.length >= 2;
  const isVideo = !hasCarousel && Boolean(effectivePost.videoUri);
  const hasImage = !hasCarousel && !isVideo && ((effectivePost.imageIndex !== null && effectivePost.imageIndex !== undefined) || !!effectivePost.localImageUri);
  const imageSource = effectivePost.localImageUri
    ? { uri: effectivePost.localImageUri }
    : effectivePost.imageIndex !== null && effectivePost.imageIndex !== undefined
      ? POST_IMAGES[effectivePost.imageIndex]
      : null;
  const isFollowing = isFollowingUser(effectivePost.userHandle);

  const [detailVisible, setDetailVisible] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [moreVisible, setMoreVisible] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);
  const [repostSheetVisible, setRepostSheetVisible] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);

  // Animated values
  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);
  const likeScale = useSharedValue(1);
  const pauseIconOpacity = useSharedValue(0);
  const sheetSlide = useRef(new RNAnimated.Value(300)).current;
  const repostSheetSlide = useRef(new RNAnimated.Value(300)).current;

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartOpacity.value,
  }));
  const likeAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: likeScale.value }] }));
  const pauseOverlayStyle = useAnimatedStyle(() => ({ opacity: pauseIconOpacity.value }));

  // ── Like animation ──
  const triggerLike = useCallback(() => {
    if (!effectivePost.isLiked) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      toggleLike(effectivePost.id);
    }
    heartScale.value = withSequence(
      withSpring(1.25, { damping: 6, stiffness: 200 }),
      withSpring(1.0, { damping: 10 })
    );
    heartOpacity.value = withSequence(
      withTiming(1, { duration: 60 }),
      withTiming(1, { duration: 600 }),
      withTiming(0, { duration: 350 })
    );
  }, [effectivePost.isLiked, effectivePost.id, toggleLike]);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => {
      const next = !prev;
      pauseIconOpacity.value = withSequence(
        withTiming(1, { duration: 80 }),
        withTiming(1, { duration: 500 }),
        withTiming(0, { duration: 300 })
      );
      return next;
    });
    Haptics.selectionAsync().catch(() => {});
  }, []);

  const videoDoubleTap = Gesture.Tap().numberOfTaps(2).maxDelay(250).onEnd(() => { runOnJS(triggerLike)(); });
  const videoSingleTap = Gesture.Tap().numberOfTaps(1).maxDelay(250).onEnd(() => { runOnJS(togglePause)(); });
  const videoTapGesture = Gesture.Exclusive(videoDoubleTap, videoSingleTap);

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    likeScale.value = withSequence(
      withTiming(1.35, { duration: 80 }),
      withTiming(1, { duration: 100 })
    );
    toggleLike(effectivePost.id);
  };

  const handleFollow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    toggleFollow(effectivePost.userHandle);
  };

  const openMemberProfile = () => {
    router.push({
      pathname: '/member-profile',
      params: {
        handle: effectivePost.userHandle,
        name: effectivePost.userName,
        initials: effectivePost.userInitials,
        color: effectivePost.userColor,
        userId: effectivePost.userId,
      },
    });
  };

  const openMore = () => {
    setMoreVisible(true);
    RNAnimated.spring(sheetSlide, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
  };

  const closeMore = (cb?: () => void) => {
    RNAnimated.timing(sheetSlide, { toValue: 300, duration: 220, useNativeDriver: true }).start(() => {
      setMoreVisible(false);
      cb?.();
    });
  };

  const openRepostSheet = () => {
    setRepostSheetVisible(true);
    RNAnimated.spring(repostSheetSlide, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
  };

  const closeRepostSheet = (cb?: () => void) => {
    RNAnimated.timing(repostSheetSlide, { toValue: 300, duration: 220, useNativeDriver: true }).start(() => {
      setRepostSheetVisible(false);
      cb?.();
    });
  };

  const handleRepost = () => {
    closeRepostSheet(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      resharePost(effectivePost.id, {
        userName: (currentUser as any)?.displayName || (currentUser as any)?.name || 'You',
        userHandle: (currentUser as any)?.handle || '@gracemember',
        userInitials: (currentUser as any)?.initials || 'ME',
        userColor: (currentUser as any)?.color || '#4A90A4',
      });
    });
  };

  const isWeb = Platform.OS === 'web';
  const likeColor = effectivePost.isLiked ? '#FF3B5C' : '#fff';
  const alreadyReposted = !!effectivePost.isRepostedByMe;
  const repostColor = alreadyReposted ? '#27AE60' : '#fff';

  return (
    <View style={s.card}>

      {/* ── Repost banner ──────────────────────────────────────────────── */}
      {isRepostCard && (
        <View style={s.repostBanner}>
          <Feather name="repeat" size={12} color="#27AE60" />
          <Text style={s.repostBannerText}>{post.userName} reposted</Text>
        </View>
      )}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={isOwnPost ? undefined : openMemberProfile}
          activeOpacity={isOwnPost ? 1 : 0.75}
          style={s.avatarWrap}
        >
          <AvatarCircle initials={effectivePost.userInitials} color={effectivePost.userColor} size={40} />
          {/* Audio note badge */}
          <View style={s.musicBadge}>
            <Feather name="music" size={8} color="#fff" />
          </View>
        </TouchableOpacity>

        <View style={s.headerMeta}>
          <View style={s.nameRow}>
            <TouchableOpacity onPress={isOwnPost ? undefined : openMemberProfile} activeOpacity={0.7}>
              <Text style={s.userName} numberOfLines={1}>{effectivePost.userHandle.replace('@', '')}</Text>
            </TouchableOpacity>
            {!isOwnPost && <VerifiedBadge />}
          </View>
          <Text style={s.audioLine} numberOfLines={1}>
            ♪ {effectivePost.userHandle.replace('@', '')} · Original audio
          </Text>
        </View>

        <TouchableOpacity style={s.menuBtn} onPress={openMore}>
          <View style={s.menuLine} />
          <View style={s.menuLine} />
          <View style={s.menuLine} />
        </TouchableOpacity>
      </View>

      {/* ── Bold headline (caption above media) ───────────────────────── */}
      {!!effectivePost.caption && (
        <View style={s.headlineWrap}>
          <Text style={s.headline} numberOfLines={captionExpanded ? undefined : 3}>
            {effectivePost.caption}
          </Text>
        </View>
      )}

      {/* ── Media ─────────────────────────────────────────────────────── */}
      {hasCarousel && effectivePost.mediaItems && (
        <MediaCarousel
          items={effectivePost.mediaItems}
          isActive={isActive}
          onDoubleTap={triggerLike}
        />
      )}

      {!hasCarousel && hasImage && imageSource && (
        <TouchableOpacity
          activeOpacity={0.97}
          onPress={() => setDetailVisible(true)}
          style={s.mediaWrap}
        >
          <Image source={imageSource} style={s.media} contentFit="cover" />
          {/* Double-tap like heart */}
          <Animated.View style={[s.heartOverlay, heartStyle]} pointerEvents="none">
            <Feather name="heart" size={80} color="#fff" />
          </Animated.View>
        </TouchableOpacity>
      )}

      {isVideo && (
        <GestureDetector gesture={videoTapGesture}>
          <View style={s.mediaWrap}>
            <VideoPlayer
              uri={effectivePost.videoUri!}
              isActive={isActive && !isPaused}
              muted={isMuted}
              style={s.media}
            />

            {/* Double-tap heart */}
            <Animated.View style={[s.heartOverlay, heartStyle]} pointerEvents="none">
            <Feather name="heart" size={80} color="#fff" />
            </Animated.View>

            {/* Pause/play flash */}
            <Animated.View style={[s.pauseOverlay, pauseOverlayStyle]} pointerEvents="none">
              <View style={s.pauseCircle}>
                <Feather name={isPaused ? 'play' : 'pause'} size={28} color="#fff" />
              </View>
            </Animated.View>

            {/* Mute — bottom right */}
            <TouchableOpacity
              style={s.muteBtn}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setIsMuted((v) => !v);
              }}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Feather name={isMuted ? 'volume-x' : 'volume-2'} size={14} color="#fff" />
            </TouchableOpacity>

            {isPaused && (
              <View style={s.pausedBadge} pointerEvents="none">
                <Text style={s.pausedText}>Paused</Text>
              </View>
            )}
          </View>
        </GestureDetector>
      )}

      {/* ── Action bar ─────────────────────────────────────────────────── */}
      <View style={s.actionBar}>
        {/* Left: 4 stat buttons */}
        <View style={s.actionLeft}>
          {/* Like */}
          <Animated.View style={likeAnimStyle}>
            <StatBtn
              onPress={handleLike}
              count={formatCount(effectivePost.likes)}
              color={likeColor}
              icon={
                <Feather
                  name="heart"
                  size={22}
                  color={likeColor}
                />
              }
            />
          </Animated.View>

          {/* Comment */}
          <StatBtn
            onPress={() => setDetailVisible(true)}
            count={formatCount(effectivePost.comments)}
            icon={<Feather name="message-circle" size={22} color="#fff" />}
          />

          {/* Reposts */}
          <StatBtn
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              openRepostSheet();
            }}
            count={formatCount(effectivePost.reposts)}
            color={repostColor}
            icon={<Feather name="repeat" size={22} color={repostColor} />}
          />

          {/* Shares/Send */}
          <StatBtn
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setShareVisible(true);
            }}
            count={formatCount(effectivePost.shares)}
            icon={<Feather name="send" size={20} color="#fff" />}
          />
        </View>

        {/* Right: Bookmark */}
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            toggleSave(effectivePost.id);
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather
            name="bookmark"
            size={22}
            color={effectivePost.isSaved ? '#E07A54' : '#fff'}
          />
        </TouchableOpacity>
      </View>

      {/* ── Liked by row ───────────────────────────────────────────────── */}
      {effectivePost.likedByName && (
        <View style={s.likedByRow}>
          <View style={s.avatarStack}>
            <View style={[s.tinyAvatar, { backgroundColor: '#9B59B6', zIndex: 2 }]}>
              <Text style={s.tinyInitial}>{effectivePost.likedByName[0]}</Text>
            </View>
            <View style={[s.tinyAvatar, { backgroundColor: '#D4A843', zIndex: 1, marginLeft: -8 }]}>
              <Text style={s.tinyInitial}>J</Text>
            </View>
          </View>
          <Text style={s.likedByText}>
            Liked by{' '}
            <Text style={s.likedByBold}>{effectivePost.likedByName.split(' ')[0].toLowerCase().replace(' ', '_')}</Text>
            {' '}and others
          </Text>
        </View>
      )}

      {/* ── Caption ────────────────────────────────────────────────────── */}
      {!!effectivePost.caption && (
        <View style={s.captionRow}>
          <Text style={s.captionText} numberOfLines={captionExpanded ? undefined : 1}>
            {effectivePost.caption}
            {!captionExpanded && effectivePost.caption.length > 60 && (
              <Text style={s.moreText} onPress={() => setCaptionExpanded(true)}>  more</Text>
            )}
          </Text>
        </View>
      )}

      {/* ── Bible verse — always visible when present ───────────────────── */}
      {effectivePost.bibleVerse && (
        <View style={s.verseCard}>
          <Text style={s.verseText}>"{effectivePost.bibleVerse.text}"</Text>
          <Text style={s.verseRef}>— {effectivePost.bibleVerse.reference}</Text>
        </View>
      )}

      {/* ── Timestamp ──────────────────────────────────────────────────── */}
      <Text style={s.timestamp}>{effectivePost.timestamp}</Text>

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      {hasImage ? (
        <PostDetailModal visible={detailVisible} post={effectivePost} onClose={() => setDetailVisible(false)} />
      ) : (
        <CommentsModal visible={detailVisible} entityId={effectivePost.id} entityType="post" onClose={() => setDetailVisible(false)} />
      )}

      {/* ── Share modal ────────────────────────────────────────────────── */}
      <SharePostModal
        visible={shareVisible}
        post={effectivePost}
        onClose={() => setShareVisible(false)}
        onShareCountIncrement={() => incrementPostShares(effectivePost.id)}
      />

      {/* ── Repost confirmation sheet ───────────────────────────────────── */}
      <Modal transparent visible={repostSheetVisible} animationType="fade" onRequestClose={() => closeRepostSheet()}>
        <TouchableOpacity style={s.sheetOverlay} activeOpacity={1} onPress={() => closeRepostSheet()}>
          <RNAnimated.View
            style={[
              s.sheet,
              { backgroundColor: '#1a1a1a', paddingBottom: isWeb ? 24 : insets.bottom + 8 },
              { transform: [{ translateY: repostSheetSlide }] },
            ]}
          >
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>{alreadyReposted ? 'Undo repost?' : 'Repost to your feed?'}</Text>

            <TouchableOpacity style={s.sheetRow} onPress={handleRepost}>
              <View style={[s.sheetIcon, alreadyReposted && { backgroundColor: 'rgba(231,76,60,0.12)' }]}>
                <Feather name="repeat" size={18} color={alreadyReposted ? '#E74C3C' : '#27AE60'} />
              </View>
              <Text style={[s.sheetLabel, alreadyReposted && { color: '#E74C3C' }]}>
                {alreadyReposted ? 'Remove Repost' : 'Repost'}
              </Text>
              <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>

            <TouchableOpacity style={s.sheetCancelBtn} onPress={() => closeRepostSheet()}>
              <Text style={s.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </RNAnimated.View>
        </TouchableOpacity>
      </Modal>

      {/* ── More options sheet ──────────────────────────────────────────── */}
      <Modal transparent visible={moreVisible} animationType="fade" onRequestClose={() => closeMore()}>
        <TouchableOpacity style={s.sheetOverlay} activeOpacity={1} onPress={() => closeMore()}>
          <RNAnimated.View
            style={[
              s.sheet,
              { backgroundColor: '#1a1a1a', paddingBottom: isWeb ? 24 : insets.bottom + 8 },
              { transform: [{ translateY: sheetSlide }] },
            ]}
          >
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Post options</Text>

            {[
              { icon: 'eye-off', label: 'Not Interested', action: () => closeMore() },
              { icon: 'copy', label: 'Copy Link', action: () => closeMore() },
              { icon: 'share-2', label: 'Share Post', action: () => closeMore(() => setShareVisible(true)) },
              ...(!isOwnPost ? [{ icon: isFollowing ? 'user-minus' : 'user-plus', label: isFollowing ? `Unfollow ${effectivePost.userHandle}` : `Follow ${effectivePost.userHandle}`, action: () => closeMore(handleFollow) }] : []),
              { icon: 'flag', label: 'Report Post', action: () => closeMore(), danger: true },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.label}
                style={s.sheetRow}
                onPress={opt.action}
              >
                <View style={[s.sheetIcon, (opt as any).danger && s.sheetIconDanger]}>
                  <Feather name={opt.icon as any} size={18} color={(opt as any).danger ? '#E53935' : '#fff'} />
                </View>
                <Text style={[s.sheetLabel, (opt as any).danger && s.sheetLabelDanger]}>
                  {opt.label}
                </Text>
                <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={s.sheetCancelBtn} onPress={() => closeMore()}>
              <Text style={s.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </RNAnimated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#000',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    paddingBottom: 4,
  },

  // Repost banner
  repostBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 2,
  },
  repostBannerText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#27AE60',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  avatarWrap: { position: 'relative' },
  musicBadge: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#000',
    borderWidth: 1.5,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMeta: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  userName: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  audioLine: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.55)',
  },
  menuBtn: { gap: 4, padding: 6, alignItems: 'center', justifyContent: 'center' },
  menuLine: {
    width: 18, height: 2, borderRadius: 1, backgroundColor: '#fff',
  },

  // Headline (caption above media)
  headlineWrap: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  headline: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    lineHeight: 22,
  },

  // Media
  mediaWrap: {
    width: '100%',
    aspectRatio: 4 / 3,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  media: { width: '100%', height: '100%' },
  heartOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  pauseOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  pauseCircle: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  muteBtn: {
    position: 'absolute', bottom: 10, right: 10,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  pausedBadge: {
    position: 'absolute', top: 10, left: 10,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  pausedText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_500Medium' },

  // Action bar
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },

  // Liked by
  likedByRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 6,
    gap: 8,
  },
  avatarStack: { flexDirection: 'row', alignItems: 'center' },
  tinyAvatar: {
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#000',
  },
  tinyInitial: { fontSize: 8, fontFamily: 'Inter_700Bold', color: '#fff' },
  likedByText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#fff',
  },
  likedByBold: { fontFamily: 'Inter_700Bold' },

  // Caption
  captionRow: {
    paddingHorizontal: 14,
    paddingBottom: 4,
  },
  captionText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#fff',
    lineHeight: 19,
  },
  captionHandle: {
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  moreText: {
    color: 'rgba(255,255,255,0.45)',
    fontFamily: 'Inter_400Regular',
  },

  // Bible verse (expanded)
  verseCard: {
    marginHorizontal: 14,
    marginBottom: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    borderLeftWidth: 2.5,
    borderLeftColor: '#D4A843',
  },
  verseText: {
    fontSize: 12, fontFamily: 'Inter_400Regular',
    fontStyle: 'italic', color: 'rgba(255,255,255,0.8)', lineHeight: 18,
  },
  verseRef: {
    fontSize: 11, fontFamily: 'Inter_600SemiBold',
    color: '#D4A843', marginTop: 4,
  },

  // Timestamp
  timestamp: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.35)',
    marginTop: 2,
  },

  // More sheet
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 12, paddingHorizontal: 16 },
  sheetHandle: {
    alignSelf: 'center', width: 36, height: 4,
    borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 12, fontFamily: 'Inter_500Medium', textAlign: 'center',
    color: 'rgba(255,255,255,0.4)', marginBottom: 12,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  sheetRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.08)',
    gap: 14,
  },
  sheetIcon: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  sheetIconDanger: { backgroundColor: '#3A1010' },
  sheetLabel: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium', color: '#fff' },
  sheetLabelDanger: { color: '#E53935' },
  sheetCancelBtn: {
    marginTop: 10, marginBottom: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  sheetCancelText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});
