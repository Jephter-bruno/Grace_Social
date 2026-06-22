import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import React, { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarCircle } from '@/components/AvatarCircle';
import { FullScreenImageViewer } from '@/components/FullScreenImageViewer';
import { POST_IMAGES } from '@/constants/images';
import { Comment, Post, useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';

interface PostDetailModalProps {
  visible: boolean;
  post: Post | null;
  onClose: () => void;
}

function CommentRow({ comment, onLike }: { comment: Comment; onLike: (id: string) => void }) {
  const colors = useColors();
  return (
    <View style={styles.commentRow}>
      <AvatarCircle initials={comment.userInitials} color={comment.userColor} size={34} />
      <View style={styles.commentBubble}>
        <View style={[styles.bubble, { backgroundColor: colors.muted }]}>
          <Text style={[styles.commentUser, { color: colors.foreground }]}>{comment.userName}</Text>
          <Text style={[styles.commentText, { color: colors.foreground }]}>{comment.text}</Text>
        </View>
        <View style={styles.commentMeta}>
          <Text style={[styles.commentTime, { color: colors.mutedForeground }]}>{comment.timestamp}</Text>
          {comment.likes > 0 && (
            <Text style={[styles.commentLikes, { color: colors.mutedForeground }]}>
              {comment.likes} {comment.likes === 1 ? 'like' : 'likes'}
            </Text>
          )}
          <TouchableOpacity onPress={() => onLike(comment.id)}>
            <Text style={[styles.replyBtn, { color: colors.mutedForeground }]}>Reply</Text>
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity style={styles.likeCommentBtn} onPress={() => onLike(comment.id)}>
        <Feather name="heart" size={14} color={comment.isLiked ? '#E53935' : colors.mutedForeground} />
      </TouchableOpacity>
    </View>
  );
}

export function PostDetailModal({ visible, post, onClose }: PostDetailModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const {
    commentsByPost,
    toggleLike,
    toggleSave,
    toggleCommentLike,
    addComment,
  } = useApp();
  const isWeb = Platform.OS === 'web';

  const [text, setText] = useState('');
  const [fullScreen, setFullScreen] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const likeScale = useSharedValue(1);
  const likeAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: likeScale.value }] }));

  const comments: Comment[] = post ? (commentsByPost[post.id] ?? []) : [];

  const handleLike = useCallback(() => {
    if (!post) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    likeScale.value = withSequence(
      withTiming(1.35, { duration: 80 }),
      withTiming(1, { duration: 100 })
    );
    toggleLike(post.id);
  }, [post, toggleLike, likeScale]);

  const handleSave = useCallback(() => {
    if (!post) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    toggleSave(post.id);
  }, [post, toggleSave]);

  const handleShare = useCallback(() => {
    if (!post) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Share.share({ message: `"${post.caption}" — shared from Grace Social` });
  }, [post]);

  const handleCommentLike = useCallback((commentId: string) => {
    if (!post) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    toggleCommentLike(post.id, commentId);
  }, [post, toggleCommentLike]);

  const handleSubmit = useCallback(() => {
    if (!post || !text.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    addComment(post.id, text.trim());
    setText('');
  }, [post, text, addComment]);

  const handleClose = useCallback(() => {
    setText('');
    onClose();
  }, [onClose]);

  if (!post) return null;

  const hasImage = post.imageIndex !== null && post.imageIndex !== undefined;

  const ListHeader = (
    <View>
      {/* Prominent image */}
      {hasImage && (
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => setFullScreen(true)}
          style={styles.imageWrap}
        >
          <Image
            source={POST_IMAGES[post.imageIndex!]}
            style={styles.mainImage}
            contentFit="cover"
          />
          {/* Expand hint */}
          <View style={styles.expandHint}>
            <Feather name="maximize-2" size={13} color="#fff" />
            <Text style={styles.expandHintText}>Tap to expand</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Post meta */}
      <View style={[styles.metaSection, { borderBottomColor: colors.border }]}>
        <View style={styles.authorRow}>
          <AvatarCircle initials={post.userInitials} color={post.userColor} size={40} />
          <View style={styles.authorInfo}>
            <Text style={[styles.authorName, { color: colors.foreground }]}>{post.userName}</Text>
            {post.userHandle ? (
              <Text style={[styles.authorHandle, { color: colors.mutedForeground }]}>{post.userHandle}</Text>
            ) : null}
          </View>
          <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>{post.timestamp}</Text>
        </View>

        <Text style={[styles.captionText, { color: colors.foreground }]}>{post.caption}</Text>

        {post.bibleVerse && (
          <View style={[styles.verseCard, { backgroundColor: colors.muted, borderLeftColor: colors.accent }]}>
            <Feather name="book-open" size={13} color={colors.accent} />
            <View style={styles.verseBody}>
              <Text style={[styles.verseText, { color: colors.foreground }]}>"{post.bibleVerse.text}"</Text>
              <Text style={[styles.verseRef, { color: colors.accent }]}>— {post.bibleVerse.reference}</Text>
            </View>
          </View>
        )}

        {/* Action bar */}
        <View style={[styles.actionBar, { borderTopColor: colors.border }]}>
          <View style={styles.leftActions}>
            <Animated.View style={likeAnimStyle}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
                <Feather name="heart" size={22} color={post.isLiked ? '#E53935' : colors.foreground} />
                <Text style={[styles.actionCount, { color: post.isLiked ? '#E53935' : colors.mutedForeground }]}>
                  {post.likes.toLocaleString()}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity style={styles.actionBtn} onPress={() => inputRef.current?.focus()}>
              <Feather name="message-circle" size={22} color={colors.foreground} />
              <Text style={[styles.actionCount, { color: colors.mutedForeground }]}>
                {comments.length}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
              <Feather name="send" size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.actionBtn} onPress={handleSave}>
            <Feather name="bookmark" size={22} color={post.isSaved ? colors.primary : colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sticky thumbnail strip — always visible above comments */}
      {hasImage && (
        <TouchableOpacity
          style={[styles.thumbnailStrip, { backgroundColor: colors.muted, borderBottomColor: colors.border }]}
          onPress={() => setFullScreen(true)}
          activeOpacity={0.8}
        >
          <Image
            source={POST_IMAGES[post.imageIndex!]}
            style={styles.thumbImage}
            contentFit="cover"
          />
          <View style={styles.thumbMeta}>
            <Text style={[styles.thumbLabel, { color: colors.mutedForeground }]}>Commenting on</Text>
            <Text style={[styles.thumbCaption, { color: colors.foreground }]} numberOfLines={1}>
              {post.caption}
            </Text>
          </View>
          <Feather name="maximize-2" size={15} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}

      {/* Comments header */}
      <View style={[styles.commentsHeader, { borderBottomColor: colors.border }]}>
        <Text style={[styles.commentsHeaderText, { color: colors.foreground }]}>
          {comments.length === 0
            ? 'Comments'
            : `${comments.length} ${comments.length === 1 ? 'Comment' : 'Comments'}`}
        </Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={[styles.root, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Modal header */}
        <View style={[styles.modalHeader, { paddingTop: isWeb ? 16 : insets.top + 8, borderBottomColor: colors.border }]}>
          <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
          <TouchableOpacity onPress={handleClose} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>Post</Text>
          <TouchableOpacity style={styles.moreBtn} onPress={handleSave}>
            <Feather name="bookmark" size={20} color={post.isSaved ? colors.primary : colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Main scrollable content + comments */}
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CommentRow comment={item} onLike={handleCommentLike} />}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="message-circle" size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No comments yet</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Be the first to share your thoughts!
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />

        {/* Pinned comment input */}
        <View
          style={[
            styles.inputRow,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: isWeb ? 16 : insets.bottom + 8,
            },
          ]}
        >
          <AvatarCircle
            initials={currentUser?.initials || 'ME'}
            color={currentUser?.color || '#4A90A4'}
            avatarUrl={currentUser?.avatarUrl}
            size={32}
          />
          <TextInput
            ref={inputRef}
            style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground }]}
            placeholder="Add a comment…"
            placeholderTextColor={colors.mutedForeground}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={300}
          />
          <TouchableOpacity
            style={[styles.sendBtn, { opacity: text.trim() ? 1 : 0.35 }]}
            onPress={handleSubmit}
            disabled={!text.trim()}
          >
            <Feather name="send" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Full-screen image viewer */}
      {hasImage && (
        <FullScreenImageViewer
          visible={fullScreen}
          imageIndex={post.imageIndex!}
          onClose={() => setFullScreen(false)}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  /* Modal header */
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    position: 'relative',
  },
  dragHandle: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    left: '50%',
    marginLeft: -18,
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  backBtn: { padding: 4, marginRight: 8 },
  modalTitle: { flex: 1, fontSize: 16, fontFamily: 'Inter_700Bold' },
  moreBtn: { padding: 4 },

  /* Image */
  imageWrap: { width: '100%', aspectRatio: 4 / 3, position: 'relative' },
  mainImage: { width: '100%', height: '100%' },
  expandHint: {
    position: 'absolute',
    bottom: 10,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  expandHintText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_500Medium' },

  /* Meta section */
  metaSection: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4, borderBottomWidth: 0.5 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  authorInfo: { flex: 1 },
  authorName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  authorHandle: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  timestamp: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  captionText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20, marginBottom: 10 },
  verseCard: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: 10,
    borderLeftWidth: 3,
    padding: 12,
    marginBottom: 10,
  },
  verseBody: { flex: 1, gap: 4 },
  verseText: { fontSize: 13, fontFamily: 'Inter_400Regular', fontStyle: 'italic', lineHeight: 18 },
  verseRef: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  /* Action bar */
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 0.5,
    marginTop: 4,
  },
  leftActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 4, paddingRight: 10 },
  actionCount: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  /* Thumbnail strip */
  thumbnailStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  thumbImage: { width: 46, height: 46, borderRadius: 8 },
  thumbMeta: { flex: 1 },
  thumbLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', marginBottom: 2 },
  thumbCaption: { fontSize: 13, fontFamily: 'Inter_500Medium' },

  /* Comments header */
  commentsHeader: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  commentsHeaderText: { fontSize: 13, fontFamily: 'Inter_700Bold' },

  /* Comment rows */
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
  },
  commentBubble: { flex: 1, gap: 4 },
  bubble: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, gap: 2 },
  commentUser: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  commentText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 19 },
  commentMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 4 },
  commentTime: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  commentLikes: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  replyBtn: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  likeCommentBtn: { padding: 4, marginTop: 8 },

  /* Empty state */
  emptyState: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 32,
    gap: 10,
  },
  emptyTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  emptyText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 19,
  },

  /* Input row */
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 10,
    borderTopWidth: 0.5,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    maxHeight: 100,
  },
  sendBtn: { paddingBottom: 8, paddingLeft: 4 },
});
