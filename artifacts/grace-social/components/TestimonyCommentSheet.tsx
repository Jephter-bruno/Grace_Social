import { Feather } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { useColors } from '@/hooks/useColors';
import { Testimony, TestimonyComment, useTestimonies } from '@/hooks/useTestimonies';
import { useAuth } from '@/context/AuthContext';

const CORAL = '#E07A54';

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = diffMs / 3600000;
    if (diffH < 1) return 'just now';
    if (diffH < 24) return `${Math.floor(diffH)}h ago`;
    const diffD = Math.floor(diffH / 24);
    return diffD === 1 ? '1d ago' : `${diffD}d ago`;
  } catch {
    return '';
  }
}

interface Props {
  testimony: Testimony | null;
  visible: boolean;
  onClose: () => void;
}

export function TestimonyCommentSheet({ testimony, visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { fetchComments, addComment } = useTestimonies();
  const { currentUser, isLoggedIn } = useAuth();

  const [comments, setComments] = useState<TestimonyComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!visible || !testimony) return;
    setLoadingComments(true);
    setComments([]);
    fetchComments(testimony.id).then((c) => {
      setComments(c);
      setLoadingComments(false);
    });
  }, [visible, testimony?.id]);

  const handleSend = useCallback(async () => {
    if (!text.trim() || !testimony || submitting) return;
    setSubmitting(true);
    const newComment = await addComment(testimony.id, text.trim());
    if (newComment) {
      setComments((prev) => [...prev, newComment]);
      setText('');
    }
    setSubmitting(false);
  }, [text, testimony, submitting, addComment]);

  const renderComment = ({ item }: { item: TestimonyComment }) => (
    <View style={styles.commentRow}>
      <View style={[styles.commentAvatar, { backgroundColor: item.color }]}>
        <Text style={styles.commentAvatarText}>{initials(item.display_name)}</Text>
      </View>
      <View style={styles.commentBody}>
        <View style={styles.commentHeader}>
          <Text style={[styles.commentName, { color: colors.foreground }]}>{item.display_name}</Text>
          <Text style={[styles.commentTime, { color: colors.mutedForeground }]}>
            {formatTime(item.created_at)}
          </Text>
        </View>
        <Text style={[styles.commentText, { color: colors.mutedForeground }]}>{item.content}</Text>
      </View>
    </View>
  );

  if (!testimony) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Handle + Header */}
        <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Comments</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Testimony preview */}
        <View style={[styles.testimonyPreview, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.previewTitle, { color: colors.foreground }]} numberOfLines={1}>
            {testimony.title}
          </Text>
          <Text style={[styles.previewContent, { color: colors.mutedForeground }]} numberOfLines={2}>
            {testimony.content}
          </Text>
        </View>

        {/* Comments list */}
        {loadingComments ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={CORAL} />
          </View>
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(c) => String(c.id)}
            renderItem={renderComment}
            contentContainerStyle={[
              styles.commentsList,
              comments.length === 0 && styles.emptyList,
            ]}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>💬</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  No comments yet. Be the first to encourage!
                </Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Input bar */}
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + 8,
            },
          ]}
        >
          {isLoggedIn && currentUser ? (
            <>
              <View style={[styles.inputAvatar, { backgroundColor: currentUser.color }]}>
                <Text style={styles.inputAvatarText}>{initials(currentUser.displayName)}</Text>
              </View>
              <TextInput
                ref={inputRef}
                style={[
                  styles.input,
                  { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
                ]}
                placeholder="Add a comment..."
                placeholderTextColor={colors.mutedForeground}
                value={text}
                onChangeText={setText}
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={handleSend}
              />
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  { backgroundColor: text.trim() ? CORAL : colors.muted },
                ]}
                onPress={handleSend}
                disabled={!text.trim() || submitting}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Feather name="send" size={16} color={text.trim() ? '#fff' : colors.mutedForeground} />
                )}
              </TouchableOpacity>
            </>
          ) : (
            <Text style={[styles.loginPrompt, { color: colors.mutedForeground }]}>
              Log in to leave a comment
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sheetHeader: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    position: 'relative',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    bottom: 14,
  },
  testimonyPreview: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  previewTitle: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    marginBottom: 3,
  },
  previewContent: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentsList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyIcon: { fontSize: 36 },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    maxWidth: 240,
  },
  commentRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  commentAvatarText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  commentBody: { flex: 1 },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  commentName: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  commentTime: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  commentText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  inputAvatarText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  loginPrompt: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    paddingVertical: 12,
  },
});
