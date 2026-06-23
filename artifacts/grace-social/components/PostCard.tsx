import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

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

export function PostCard({ post, isActive = false }: PostCardProps) {
  const colors = useColors();
  const { toggleLike, toggleSave, toggleFollow, isFollowingUser } = useApp();
  const [detailVisible, setDetailVisible] = useState(false);

  const isOwnPost = post.userId === 'currentUser';
  const isVideo = Boolean(post.videoUri);
  const hasImage = !isVideo && post.imageIndex !== null && post.imageIndex !== undefined;
  const isFollowing = isFollowingUser(post.userHandle);

  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);
  const likeScale = useSharedValue(1);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartOpacity.value,
  }));
  const likeAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: likeScale.value }] }));

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

  const videoDoubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDelay(250)
    .onEnd(() => { runOnJS(triggerLike)(); });

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

  return (
    <View style={[styles.card, { borderBottomColor: colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={isOwnPost ? undefined : openMemberProfile} activeOpacity={isOwnPost ? 1 : 0.7}>
          <AvatarCircle initials={post.userInitials} color={post.userColor} size={38} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerInfo}
          onPress={isOwnPost ? undefined : openMemberProfile}
          activeOpacity={isOwnPost ? 1 : 0.7}
        >
          <View style={styles.nameRow}>
            <Text style={[styles.userName, { color: colors.foreground }]}>{post.userName}</Text>
            {post.userHandle ? (
              <Text style={[styles.userHandle, { color: colors.mutedForeground }]}>{post.userHandle}</Text>
            ) : null}
          </View>
          <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>{post.timestamp}</Text>
        </TouchableOpacity>

        {/* Follow / Following button — only for other users */}
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
            <Text
              style={[
                styles.followBtnText,
                { color: isFollowing ? colors.mutedForeground : '#fff' },
              ]}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.moreBtn}>
          <Feather name="more-horizontal" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Image post — single tap opens detail */}
      {hasImage && (
        <TouchableOpacity
          activeOpacity={0.97}
          onPress={() => setDetailVisible(true)}
          style={styles.mediaWrap}
        >
          <Image
            source={POST_IMAGES[post.imageIndex!]}
            style={styles.media}
            contentFit="cover"
          />
          <View style={styles.expandBadge}>
            <Feather name="maximize-2" size={11} color="#fff" />
          </View>
        </TouchableOpacity>
      )}

      {/* Video post — double-tap to like */}
      {isVideo && (
        <GestureDetector gesture={videoDoubleTap}>
          <View style={styles.mediaWrap}>
            <VideoPlayer
              uri={post.videoUri!}
              isActive={isActive}
              muted
              style={styles.media}
            />
            <View style={styles.videoTag}>
              <Feather name="video" size={11} color="#fff" />
              <Text style={styles.videoTagText}>Video</Text>
            </View>
            <Animated.View style={[styles.heartOverlay, heartStyle]} pointerEvents="none">
              <Feather name="heart" size={88} color="#fff" />
            </Animated.View>
          </View>
        </GestureDetector>
      )}

      {post.bibleVerse && (
        <View style={[styles.verseCard, { backgroundColor: colors.muted, borderLeftColor: colors.accent }]}>
          <Text style={[styles.verseText, { color: colors.foreground }]} numberOfLines={3}>
            "{post.bibleVerse.text}"
          </Text>
          <Text style={[styles.verseRef, { color: colors.accent }]}>— {post.bibleVerse.reference}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <Animated.View style={likeAnimStyle}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
              <Feather name="heart" size={24} color={post.isLiked ? '#E53935' : colors.foreground} />
            </TouchableOpacity>
          </Animated.View>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setDetailVisible(true)}>
            <Feather name="message-circle" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              Share.share({ message: `"${post.caption}" — shared from Grace Social` });
            }}
          >
            <Feather name="send" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            toggleSave(post.id);
          }}
          style={styles.saveBtn}
        >
          <Feather name="bookmark" size={24} color={post.isSaved ? colors.primary : colors.foreground} />
        </TouchableOpacity>
      </View>

      <View style={styles.stats}>
        <Text style={[styles.statsText, { color: colors.foreground }]}>
          {post.likes.toLocaleString()} {post.likes === 1 ? 'like' : 'likes'}
        </Text>
      </View>

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

      {hasImage ? (
        <PostDetailModal
          visible={detailVisible}
          post={post}
          onClose={() => setDetailVisible(false)}
        />
      ) : (
        <CommentsModal
          visible={detailVisible}
          entityId={post.id}
          entityType="post"
          onClose={() => setDetailVisible(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderBottomWidth: 1, paddingBottom: 4, marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 10 },
  headerInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  userName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  userHandle: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  timestamp: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  followBtn: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  followBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  moreBtn: { padding: 4 },
  mediaWrap: { width: '100%', aspectRatio: 4 / 3, position: 'relative', overflow: 'hidden' },
  media: { width: '100%', height: '100%' },
  heartOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  videoTag: { position: 'absolute', top: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  videoTagText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  expandBadge: { position: 'absolute', bottom: 10, right: 10, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  verseCard: { marginHorizontal: 12, marginTop: 10, padding: 12, borderRadius: 8, borderLeftWidth: 3 },
  verseText: { fontSize: 13, fontFamily: 'Inter_400Regular', fontStyle: 'italic', lineHeight: 19 },
  verseRef: { fontSize: 12, fontFamily: 'Inter_600SemiBold', marginTop: 5 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  leftActions: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { padding: 4, marginRight: 12 },
  saveBtn: { padding: 4 },
  stats: { paddingHorizontal: 12, paddingBottom: 4 },
  statsText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  caption: { paddingHorizontal: 12, paddingBottom: 4, flexDirection: 'row', flexWrap: 'wrap' },
  captionUser: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  captionText: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  commentsBtn: { paddingHorizontal: 12, paddingBottom: 10 },
  commentsText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
});
