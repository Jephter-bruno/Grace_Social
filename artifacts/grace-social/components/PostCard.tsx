import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  Animated as RNAnimated,
  Modal,
  Platform,
  Share,
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
import { PostDetailModal } from '@/components/PostDetailModal';
import { VideoPlayer } from '@/components/VideoPlayer';
import { POST_IMAGES } from '@/constants/images';
import { Post, useApp } from '@/context/AppContext';
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

export function PostCard({ post, isActive = false }: PostCardProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { toggleLike, toggleSave, toggleFollow, isFollowingUser } = useApp();

  const isOwnPost = post.userId === 'currentUser';
  const isVideo = Boolean(post.videoUri);
  const hasImage = !isVideo && post.imageIndex !== null && post.imageIndex !== undefined;
  const isFollowing = isFollowingUser(post.userHandle);

  const [detailVisible, setDetailVisible] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [moreVisible, setMoreVisible] = useState(false);

  // Animated values
  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);
  const likeScale = useSharedValue(1);
  const pauseIconOpacity = useSharedValue(0);

  const sheetSlide = useRef(new RNAnimated.Value(300)).current;

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartOpacity.value,
  }));
  const likeAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: likeScale.value }] }));
  const pauseOverlayStyle = useAnimatedStyle(() => ({ opacity: pauseIconOpacity.value }));

  // ── Like animation ──
  const triggerLike = useCallback(() => {
    if (!post.isLiked) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      toggleLike(post.id);
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
  }, [post.isLiked, post.id, toggleLike]);

  // ── Video: toggle pause ──
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

  // ── Gestures for video (exclusive: double=like, single=pause) ──
  const videoDoubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDelay(250)
    .onEnd(() => { runOnJS(triggerLike)(); });

  const videoSingleTap = Gesture.Tap()
    .numberOfTaps(1)
    .maxDelay(250)
    .onEnd(() => { runOnJS(togglePause)(); });

  const videoTapGesture = Gesture.Exclusive(videoDoubleTap, videoSingleTap);

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    likeScale.value = withSequence(
      withTiming(1.35, { duration: 80 }),
      withTiming(1, { duration: 100 })
    );
    toggleLike(post.id);
  };

  const handleFollow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    toggleFollow(post.userHandle);
  };

  const openMemberProfile = () => {
    router.push({
      pathname: '/member-profile',
      params: {
        handle: post.userHandle,
        name: post.userName,
        initials: post.userInitials,
        color: post.userColor,
        userId: post.userId,
      },
    });
  };

  // ── More sheet ──
  const openMore = () => {
    setMoreVisible(true);
    RNAnimated.spring(sheetSlide, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeMore = (cb?: () => void) => {
    RNAnimated.timing(sheetSlide, {
      toValue: 300,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setMoreVisible(false);
      cb?.();
    });
  };

  const isWeb = Platform.OS === 'web';

  return (
    <View style={[styles.card, { borderBottomColor: colors.border }]}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={isOwnPost ? undefined : openMemberProfile} activeOpacity={isOwnPost ? 1 : 0.7}>
          <AvatarCircle initials={post.userInitials} color={post.userColor} size={38} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerInfo}
          onPress={isOwnPost ? undefined : openMemberProfile}
          activeOpacity={isOwnPost ? 1 : 0.7}
        >
          <Text style={[styles.userName, { color: colors.foreground }]}>{post.userName}</Text>
          <Text style={[styles.userHandle, { color: colors.mutedForeground }]}>
            {post.userHandle}
            {post.userHandle ? '  ·  ' : ''}{post.timestamp}
          </Text>
        </TouchableOpacity>

        {!isOwnPost && (
          <TouchableOpacity
            style={[
              styles.followBtn,
              isFollowing
                ? { backgroundColor: colors.muted, borderColor: colors.border, borderWidth: 1 }
                : { backgroundColor: colors.primary },
            ]}
            onPress={handleFollow}
            activeOpacity={0.75}
          >
            <Text style={[styles.followBtnText, { color: isFollowing ? colors.mutedForeground : '#fff' }]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.moreBtn} onPress={openMore}>
          <Feather name="more-horizontal" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* ── Image post ── */}
      {hasImage && (
        <TouchableOpacity
          activeOpacity={0.97}
          onPress={() => setDetailVisible(true)}
          style={styles.mediaWrap}
        >
          <Image source={POST_IMAGES[post.imageIndex!]} style={styles.media} contentFit="cover" />
          <View style={styles.expandBadge}>
            <Feather name="maximize-2" size={11} color="#fff" />
          </View>
        </TouchableOpacity>
      )}

      {/* ── Video post ── */}
      {isVideo && (
        <GestureDetector gesture={videoTapGesture}>
          <View style={styles.mediaWrap}>
            <VideoPlayer
              uri={post.videoUri!}
              isActive={isActive && !isPaused}
              muted={isMuted}
              style={styles.media}
            />

            {/* Double-tap like heart overlay */}
            <Animated.View style={[styles.heartOverlay, heartStyle]} pointerEvents="none">
              <Feather name="heart" size={88} color="#fff" />
            </Animated.View>

            {/* Pause/play flash */}
            <Animated.View style={[styles.pauseOverlay, pauseOverlayStyle]} pointerEvents="none">
              <View style={styles.pauseCircle}>
                <Feather name={isPaused ? 'play' : 'pause'} size={28} color="#fff" />
              </View>
            </Animated.View>

            {/* Mute toggle — bottom-left */}
            <TouchableOpacity
              style={styles.muteBtn}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setIsMuted((v) => !v);
              }}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Feather name={isMuted ? 'volume-x' : 'volume-2'} size={16} color="#fff" />
            </TouchableOpacity>

            {/* Video tag — top-right */}
            <View style={styles.videoTag} pointerEvents="none">
              <Feather name="video" size={11} color="#fff" />
              <Text style={styles.videoTagText}>Video</Text>
            </View>

            {/* Paused indicator */}
            {isPaused && (
              <View style={styles.pausedBadge} pointerEvents="none">
                <Text style={styles.pausedText}>Paused</Text>
              </View>
            )}
          </View>
        </GestureDetector>
      )}

      {/* ── Bible verse card ── */}
      {post.bibleVerse && (
        <View style={[styles.verseCard, { backgroundColor: colors.muted, borderLeftColor: colors.accent }]}>
          <Text style={[styles.verseText, { color: colors.foreground }]} numberOfLines={3}>
            "{post.bibleVerse.text}"
          </Text>
          <Text style={[styles.verseRef, { color: colors.accent }]}>— {post.bibleVerse.reference}</Text>
        </View>
      )}

      {/* ── Action bar ── */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <Animated.View style={likeAnimStyle}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
              <Feather name="heart" size={22} color={post.isLiked ? '#E53935' : colors.foreground} />
              {post.likes > 0 && (
                <Text style={[styles.actionCount, { color: post.isLiked ? '#E53935' : colors.foreground }]}>
                  {formatCount(post.likes)}
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity style={styles.actionBtn} onPress={() => setDetailVisible(true)}>
            <Feather name="message-circle" size={22} color={colors.foreground} />
            {post.comments > 0 && (
              <Text style={[styles.actionCount, { color: colors.foreground }]}>
                {formatCount(post.comments)}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              Share.share({ message: `"${post.caption}" — shared from Grace Social` });
            }}
          >
            <Feather name="send" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            toggleSave(post.id);
          }}
          style={styles.saveBtn}
        >
          <Feather name="bookmark" size={22} color={post.isSaved ? colors.primary : colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* ── Caption ── */}
      <View style={styles.caption}>
        <Text style={[styles.captionUser, { color: colors.foreground }]}>{post.userName} </Text>
        <Text style={[styles.captionText, { color: colors.foreground }]}>{post.caption}</Text>
      </View>

      {post.comments > 0 && (
        <TouchableOpacity style={styles.commentsBtn} onPress={() => setDetailVisible(true)}>
          <Text style={[styles.commentsText, { color: colors.mutedForeground }]}>
            View all {post.comments} comments
          </Text>
        </TouchableOpacity>
      )}

      {/* ── Modals ── */}
      {hasImage ? (
        <PostDetailModal visible={detailVisible} post={post} onClose={() => setDetailVisible(false)} />
      ) : (
        <CommentsModal visible={detailVisible} entityId={post.id} entityType="post" onClose={() => setDetailVisible(false)} />
      )}

      {/* ── More sheet ── */}
      <Modal transparent visible={moreVisible} animationType="fade" onRequestClose={() => closeMore()}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => closeMore()}>
          <RNAnimated.View
            style={[
              styles.sheet,
              { backgroundColor: colors.background, paddingBottom: isWeb ? 24 : insets.bottom + 8 },
              { transform: [{ translateY: sheetSlide }] },
            ]}
          >
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.mutedForeground }]}>Post options</Text>

            {[
              { icon: 'eye-off', label: 'Not Interested', action: () => closeMore() },
              { icon: 'copy', label: 'Copy Link', action: () => closeMore() },
              { icon: 'share-2', label: 'Share Post', action: () => closeMore(() => Share.share({ message: `"${post.caption}" — shared from Grace Social` })) },
              ...(!isOwnPost ? [{ icon: isFollowing ? 'user-minus' : 'user-plus', label: isFollowing ? `Unfollow ${post.userHandle}` : `Follow ${post.userHandle}`, action: () => closeMore(handleFollow) }] : []),
              { icon: 'flag', label: 'Report Post', action: () => closeMore(), danger: true },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.label}
                style={[styles.sheetRow, { borderBottomColor: colors.border }]}
                onPress={opt.action}
              >
                <View style={[styles.sheetIcon, { backgroundColor: (opt as any).danger ? '#FEE2E2' : colors.muted }]}>
                  <Feather name={opt.icon as any} size={18} color={(opt as any).danger ? '#E53935' : colors.foreground} />
                </View>
                <Text style={[styles.sheetLabel, { color: (opt as any).danger ? '#E53935' : colors.foreground }]}>
                  {opt.label}
                </Text>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.sheetCancelBtn, { backgroundColor: colors.muted }]}
              onPress={() => closeMore()}
            >
              <Text style={[styles.sheetCancelText, { color: colors.foreground }]}>Cancel</Text>
            </TouchableOpacity>
          </RNAnimated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderBottomWidth: 1, paddingBottom: 4, marginBottom: 4 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 10 },
  headerInfo: { flex: 1, gap: 2 },
  userName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  userHandle: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  followBtn: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  followBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  moreBtn: { padding: 4 },

  // Media
  mediaWrap: { width: '100%', aspectRatio: 4 / 3, position: 'relative', overflow: 'hidden' },
  media: { width: '100%', height: '100%' },
  heartOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  pauseOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  pauseCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  muteBtn: { position: 'absolute', bottom: 10, left: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  videoTag: { position: 'absolute', top: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  videoTagText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  expandBadge: { position: 'absolute', bottom: 10, right: 10, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  pausedBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  pausedText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_500Medium' },

  // Verse
  verseCard: { marginHorizontal: 12, marginTop: 10, padding: 12, borderRadius: 8, borderLeftWidth: 3 },
  verseText: { fontSize: 13, fontFamily: 'Inter_400Regular', fontStyle: 'italic', lineHeight: 19 },
  verseRef: { fontSize: 12, fontFamily: 'Inter_600SemiBold', marginTop: 5 },

  // Action bar
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  leftActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 6, paddingVertical: 4, marginRight: 4 },
  actionCount: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  saveBtn: { padding: 4 },

  // Caption
  caption: { paddingHorizontal: 12, paddingBottom: 4, flexDirection: 'row', flexWrap: 'wrap' },
  captionUser: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  captionText: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  commentsBtn: { paddingHorizontal: 12, paddingBottom: 10 },
  commentsText: { fontSize: 13, fontFamily: 'Inter_400Regular' },

  // More sheet
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 12, paddingHorizontal: 16 },
  sheetHandle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, marginBottom: 12 },
  sheetTitle: { fontSize: 12, fontFamily: 'Inter_500Medium', textAlign: 'center', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 0.5, gap: 14 },
  sheetIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sheetLabel: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium' },
  sheetCancelBtn: { marginTop: 10, marginBottom: 4, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  sheetCancelText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
