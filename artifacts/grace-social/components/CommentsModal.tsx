import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import React, { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarCircle } from '@/components/AvatarCircle';
import { FullScreenImageViewer } from '@/components/FullScreenImageViewer';
import { POST_IMAGES } from '@/constants/images';
import { Comment, useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';

interface CommentsModalProps {
  visible: boolean;
  entityId: string;
  entityType: 'post' | 'prayer';
  title?: string;
  imageIndex?: number | null;
  onClose: () => void;
}

function CommentRow({
  comment,
  onLike,
}: {
  comment: Comment;
  onLike: (id: string) => void;
}) {
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
      <TouchableOpacity style={styles.likeBtn} onPress={() => onLike(comment.id)}>
        <Feather name="heart" size={14} color={comment.isLiked ? '#E53935' : colors.mutedForeground} />
      </TouchableOpacity>
    </View>
  );
}

export function CommentsModal({ visible, entityId, entityType, title, imageIndex, onClose }: CommentsModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const { commentsByPost, prayerCommentsByPrayer, addComment, addPrayerComment, toggleCommentLike, togglePrayerCommentLike } = useApp();
  const [text, setText] = useState('');
  const [fullScreen, setFullScreen] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const isWeb = Platform.OS === 'web';

  const comments = entityType === 'post'
    ? (commentsByPost[entityId] ?? [])
    : (prayerCommentsByPrayer[entityId] ?? []);

  const handleLike = (commentId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (entityType === 'post') {
      toggleCommentLike(entityId, commentId);
    } else {
      togglePrayerCommentLike(entityId, commentId);
    }
  };

  const handleSubmit = () => {
    if (!text.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (entityType === 'post') {
      addComment(entityId, text.trim());
    } else {
      addPrayerComment(entityId, text.trim());
    }
    setText('');
  };

  const placeholder = entityType === 'prayer' ? 'Share a word of encouragement...' : 'Add a comment...';
  const headerTitle = title ?? (entityType === 'prayer' ? 'Responses' : 'Comments');
  const hasImage = imageIndex !== null && imageIndex !== undefined;

  const ListHeader = hasImage ? (
    <TouchableOpacity
      style={[styles.imageThumbnailStrip, { backgroundColor: colors.muted, borderBottomColor: colors.border }]}
      onPress={() => setFullScreen(true)}
      activeOpacity={0.8}
    >
      <Image
        source={POST_IMAGES[imageIndex!]}
        style={styles.thumbImage}
        contentFit="cover"
      />
      <View style={styles.thumbMeta}>
        <Text style={[styles.thumbLabel, { color: colors.mutedForeground }]}>Image post</Text>
        <Text style={[styles.thumbHint, { color: colors.foreground }]}>Tap to view full screen</Text>
      </View>
      <Feather name="maximize-2" size={15} color={colors.mutedForeground} />
    </TouchableOpacity>
  ) : null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.title, { color: colors.foreground }]}>{headerTitle}</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CommentRow comment={item} onLike={handleLike} />}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={[styles.list, comments.length === 0 && styles.emptyList]}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="message-circle" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {entityType === 'prayer' ? 'No responses yet' : 'No comments yet'}
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {entityType === 'prayer' ? 'Be the first to offer encouragement!' : 'Be the first to share your thoughts!'}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />

        <View
          style={[
            styles.inputRow,
            { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: isWeb ? 16 : insets.bottom + 8 },
          ]}
        >
          <AvatarCircle
            initials={currentUser?.initials || 'ME'}
            color={currentUser?.color || '#4A90A4'}
            avatarUrl={currentUser?.avatarUrl}
            size={34}
          />
          <TextInput
            ref={inputRef}
            style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground }]}
            placeholder={placeholder}
            placeholderTextColor={colors.mutedForeground}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={300}
          />
          <TouchableOpacity style={[styles.sendBtn, { opacity: text.trim() ? 1 : 0.4 }]} onPress={handleSubmit} disabled={!text.trim()}>
            <Feather name="send" size={20} color="#4A90A4" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {hasImage && (
        <FullScreenImageViewer
          visible={fullScreen}
          imageIndex={imageIndex!}
          onClose={() => setFullScreen(false)}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 0.5 },
  dragHandle: { position: 'absolute', top: 8, left: '50%', width: 36, height: 4, borderRadius: 2, marginLeft: -18 },
  title: { flex: 1, textAlign: 'center', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  closeBtn: { padding: 4 },

  /* Image thumbnail strip */
  imageThumbnailStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  thumbImage: { width: 46, height: 46, borderRadius: 8 },
  thumbMeta: { flex: 1 },
  thumbLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', marginBottom: 2 },
  thumbHint: { fontSize: 13, fontFamily: 'Inter_500Medium' },

  list: { paddingVertical: 8 },
  emptyList: { flexGrow: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingHorizontal: 32 },
  commentRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, gap: 10 },
  commentBubble: { flex: 1, gap: 4 },
  bubble: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, gap: 2 },
  commentUser: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  commentText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 19 },
  commentMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 4 },
  commentTime: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  commentLikes: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  replyBtn: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  likeBtn: { padding: 4, marginTop: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingTop: 10, gap: 10, borderTopWidth: 0.5 },
  input: { flex: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, fontSize: 14, fontFamily: 'Inter_400Regular', maxHeight: 100 },
  sendBtn: { paddingBottom: 8, paddingLeft: 4 },
});
