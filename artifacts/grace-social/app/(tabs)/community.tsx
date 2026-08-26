import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarCircle } from '@/components/AvatarCircle';
import { Community, useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';

// ─── Constants ────────────────────────────────────────────────────────────────

const CORAL = '#E07A54';

// ─── Testimony data ───────────────────────────────────────────────────────────

interface TestimonyComment {
  id: string;
  userName: string;
  userInitials: string;
  userColor: string;
  text: string;
  timestamp: string;
}

interface Testimony {
  id: string;
  category: string;
  categoryColor: string;
  imageUrl: string;
  bibleVerse: string;
  bibleText: string;
  author: { name: string; initials: string; color: string };
  title: string;
  excerpt: string;
  fullText: string;
  likes: number;
  comments: TestimonyComment[];
}

const SEED_TESTIMONIES: Testimony[] = [
  {
    id: 't1',
    category: 'Healing',
    categoryColor: CORAL,
    imageUrl: 'https://picsum.photos/seed/testimony-healing/800/500',
    bibleVerse: 'Jeremiah 30:17',
    bibleText: '"For I will restore health to you, and your wounds I will heal," declares the Lord.',
    author: { name: 'Sarah Mitchell', initials: 'SM', color: '#E91E8C' },
    title: 'Healed After Five Years',
    excerpt: "The doctors said it was impossible, but God had the final word. Here's how prayer carried us through...",
    fullText: `Five years. That's how long I lived with a diagnosis the doctors called irreversible.\n\nEvery specialist I visited said the same thing: "You'll need to manage this for the rest of your life." I tried every treatment. I changed my diet. I exercised. I did everything right — and nothing changed.\n\nBut something else was happening in that season. God was drawing me closer. In the waiting rooms and the late nights and the moments of deepest discouragement, I found myself praying in a way I never had before — not asking for a miracle, just asking to know Him.\n\nThen one Sunday morning during worship, something shifted. I can't explain it medically. My doctor certainly couldn't. But at my next appointment, the scans were clear. The condition was gone.\n\nI know healing doesn't always look like this. I know faithful people pray and don't receive the physical miracle. But I believe God can. And I believe He did. And I want my story to be an anchor of hope for anyone still in the waiting — because Jeremiah 30:17 is true: He restores.`,
    likes: 1300,
    comments: [
      { id: 'tc1a', userName: 'Pastor James', userInitials: 'PJ', userColor: '#D4A843', text: 'What a testimony! God is still in the healing business. 🙏', timestamp: '2h ago' },
      { id: 'tc1b', userName: 'Mary K.', userInitials: 'MK', userColor: '#E91E8C', text: 'This brought tears to my eyes. Thank you for sharing!', timestamp: '3h ago' },
      { id: 'tc1c', userName: 'David L.', userInitials: 'DL', userColor: '#27AE60', text: 'Jeremiah 30:17 is such a powerful promise. Amen!', timestamp: '4h ago' },
    ],
  },
  {
    id: 't2',
    category: 'Redemption',
    categoryColor: '#8B5CF6',
    imageUrl: 'https://picsum.photos/seed/testimony-redemption/800/500',
    bibleVerse: 'Romans 8:28',
    bibleText: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
    author: { name: 'Pastor Tim', initials: 'PT', color: '#D4A843' },
    title: 'From Addiction to Purpose',
    excerpt: "I lost everything but God invited me to something greater. My story of radical redemption...",
    fullText: `I am not proud of who I was at 28. Addiction had taken my marriage, my job, and nearly my life. I had burned every bridge. I was sleeping in my car outside a city I didn't even know.\n\nOne night I walked into a church — not because I believed, but because it was cold and the lights were on. A man handed me a cup of coffee and sat with me without asking a single question. He just sat. For two hours.\n\nThat was the beginning.\n\nRecovery wasn't instant. The road back was longer and harder than anything I'd faced going down. But Romans 8:28 became a lifeline — not a guarantee that things would be easy, but a promise that God could weave even the wreckage into something good.\n\nToday I lead a recovery ministry at our church. I sit with people in their lowest moments — sometimes without saying a word — because someone once did that for me. The very places I fell have become the exact places I now serve.\n\nAll things. Even those things. Especially those things.`,
    likes: 2100,
    comments: [
      { id: 'tc2a', userName: 'Sarah W.', userInitials: 'SW', userColor: '#9B59B6', text: 'This is the power of the gospel. So inspiring!', timestamp: '1h ago' },
      { id: 'tc2b', userName: 'Grace Ministry', userInitials: 'GM', userColor: '#F39C12', text: 'Romans 8:28 — every single time. 🙌', timestamp: '2h ago' },
    ],
  },
  {
    id: 't3',
    category: 'Faith',
    categoryColor: '#27AE60',
    imageUrl: 'https://picsum.photos/seed/testimony-faith/800/500',
    bibleVerse: 'Hebrews 11:1',
    bibleText: 'Now faith is confidence in what we hope for and assurance about what we do not see.',
    author: { name: 'Grace B.', initials: 'GB', color: '#27AE60' },
    title: 'When God Spoke in the Storm',
    excerpt: "My business failed, my marriage was tested — but faith became my foundation...",
    fullText: `The year everything collapsed started quietly enough. January: the business deal fell through. March: the investors pulled out. May: the conversations at home grew short and cold.\n\nBy August I was sitting in an empty office wondering how the same faith that felt so solid the year before could feel so far away.\n\nI didn't get a vision. No burning bush. What I got was a verse — Hebrews 11:1 — that my daughter had drawn in crayon and stuck to the fridge. "Faith is being sure of what we hope for." She was six. She had no idea what she had done.\n\nI read it every morning for three months. Not because I felt sure of anything — but because choosing to believe when you can't see is precisely the point of faith.\n\nThe business didn't come back the same way. Our marriage went through honest, painful rebuilding. But on the other side of the storm is a life I wouldn't trade — because every part of it was built on something real, not on circumstances.\n\nFaith is not the absence of storms. It is the foundation that holds when the storms come.`,
    likes: 890,
    comments: [
      { id: 'tc3a', userName: 'Thomas B.', userInitials: 'TB', userColor: '#E74C3C', text: 'Faith is the substance of things hoped for. Beautiful story!', timestamp: '5h ago' },
    ],
  },
];

function formatNum(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace('.0', '')}k` : `${n}`;
}

// ─── Testimony Comment Modal ───────────────────────────────────────────────────

function TestimonyCommentModal({
  testimony,
  comments,
  onClose,
  onAddComment,
}: {
  testimony: Testimony;
  comments: TestimonyComment[];
  onClose: () => void;
  onAddComment: (text: string) => void;
}) {
  const colors = useColors();
  const { currentUser } = useAuth();
  const [text, setText] = useState('');
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAddComment(trimmed);
    setText('');
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={[cm.overlay]}>
        <TouchableOpacity style={cm.backdrop} activeOpacity={1} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[cm.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 8 }]}
        >
          {/* Handle */}
          <View style={cm.handleWrap}>
            <View style={[cm.handle, { backgroundColor: colors.border }]} />
          </View>

          <Text style={[cm.sheetTitle, { color: colors.foreground }]}>
            {testimony.title}
          </Text>
          <Text style={[cm.sheetSubtitle, { color: colors.mutedForeground, borderBottomColor: colors.border }]}>
            {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
          </Text>

          <ScrollView style={cm.commentList} showsVerticalScrollIndicator={false}>
            {comments.length === 0 ? (
              <View style={cm.empty}>
                <Feather name="message-circle" size={32} color={colors.mutedForeground} />
                <Text style={[cm.emptyText, { color: colors.mutedForeground }]}>
                  Be the first to comment
                </Text>
              </View>
            ) : (
              comments.map((c) => (
                <View key={c.id} style={cm.commentRow}>
                  <AvatarCircle initials={c.userInitials} color={c.userColor} size={34} />
                  <View style={[cm.commentBubble, { backgroundColor: colors.background }]}>
                    <View style={cm.commentHeader}>
                      <Text style={[cm.commentName, { color: colors.foreground }]}>{c.userName}</Text>
                      <Text style={[cm.commentTime, { color: colors.mutedForeground }]}>{c.timestamp}</Text>
                    </View>
                    <Text style={[cm.commentText, { color: colors.foreground }]}>{c.text}</Text>
                  </View>
                </View>
              ))
            )}
            <View style={{ height: 12 }} />
          </ScrollView>

          {/* Input */}
          <View style={[cm.inputRow, { borderTopColor: colors.border }]}>
            <AvatarCircle
              initials={currentUser?.initials ?? 'ME'}
              color={currentUser?.color ?? '#4A90A4'}
              size={32}
            />
            <TextInput
              ref={inputRef}
              style={[cm.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
              placeholder="Add a comment..."
              placeholderTextColor={colors.mutedForeground}
              value={text}
              onChangeText={setText}
              returnKeyType="send"
              onSubmitEditing={submit}
              multiline
            />
            <TouchableOpacity
              style={[cm.sendBtn, { opacity: text.trim() ? 1 : 0.4 }]}
              onPress={submit}
              disabled={!text.trim()}
            >
              <Feather name="send" size={18} color={CORAL} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const cm = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '75%' },
  handleWrap: { alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
  handle: { width: 36, height: 4, borderRadius: 2 },
  sheetTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', paddingHorizontal: 16, paddingTop: 4 },
  sheetSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', paddingHorizontal: 16, paddingTop: 2, paddingBottom: 12, borderBottomWidth: 0.5 },
  commentList: { paddingHorizontal: 16, paddingTop: 12 },
  empty: { alignItems: 'center', paddingTop: 32, gap: 10 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  commentRow: { flexDirection: 'row', gap: 10, marginBottom: 14, alignItems: 'flex-start' },
  commentBubble: { flex: 1, borderRadius: 12, padding: 10, gap: 4 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  commentName: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  commentTime: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  commentText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 0.5 },
  input: { flex: 1, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, fontFamily: 'Inter_400Regular', maxHeight: 100 },
  sendBtn: { paddingBottom: 8 },
});

// ─── All Testimonies Modal ────────────────────────────────────────────────────

function AllTestimoniesModal({
  visible,
  testimonyLikes,
  testimonyComments,
  onClose,
  onLike,
  onRead,
  onOpenComments,
}: {
  visible: boolean;
  testimonyLikes: Record<string, { liked: boolean; count: number }>;
  testimonyComments: Record<string, TestimonyComment[]>;
  onClose: () => void;
  onLike: (id: string) => void;
  onRead: (t: Testimony) => void;
  onOpenComments: (t: Testimony) => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[al.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[al.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={al.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[al.title, { color: colors.foreground }]}>All Testimonies</Text>
          <View style={{ width: 34 }} />
        </View>

        <FlatList
          data={SEED_TESTIMONIES}
          keyExtractor={(t) => t.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 24 }}
          renderItem={({ item: t }) => (
            /* Vertical full-width testimony card */
            <TouchableOpacity
              style={[al.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.95}
              onPress={() => { onClose(); onRead(t); }}
            >
              {/* Image */}
              <View style={al.imageWrap}>
                <Image source={{ uri: t.imageUrl }} style={al.image} contentFit="cover" />
                <View style={[al.catBadge, { backgroundColor: t.categoryColor }]}>
                  <Text style={al.catText}>{t.category}</Text>
                </View>
                <Text style={al.verseWatermark}>{t.bibleVerse}</Text>
              </View>

              {/* Body */}
              <View style={al.body}>
                <View style={al.authorRow}>
                  <AvatarCircle initials={t.author.initials} color={t.author.color} size={28} />
                  <Text style={[al.authorName, { color: colors.foreground }]}>{t.author.name}</Text>
                </View>
                <Text style={[al.cardTitle, { color: colors.foreground }]}>{t.title}</Text>
                <Text style={[al.excerpt, { color: colors.mutedForeground }]} numberOfLines={2}>
                  {t.excerpt}
                </Text>

                {/* Footer */}
                <View style={[al.footer, { borderTopColor: colors.border }]}>
                  <TouchableOpacity style={al.statBtn} onPress={() => onLike(t.id)} activeOpacity={0.7}>
                    <Feather
                      name="heart"
                      size={14}
                      color={testimonyLikes[t.id]?.liked ? '#FF3B5C' : colors.mutedForeground}
                    />
                    <Text style={[al.statNum, { color: testimonyLikes[t.id]?.liked ? '#FF3B5C' : colors.mutedForeground }]}>
                      {formatNum(testimonyLikes[t.id]?.count ?? t.likes)}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[al.statBtn, { marginLeft: 14 }]} onPress={() => { onClose(); onOpenComments(t); }} activeOpacity={0.7}>
                    <Feather name="message-circle" size={14} color={colors.mutedForeground} />
                    <Text style={[al.statNum, { color: colors.mutedForeground }]}>
                      {(testimonyComments[t.id] ?? []).length}
                    </Text>
                  </TouchableOpacity>

                  <View style={{ flex: 1 }} />

                  <TouchableOpacity style={al.readBtn} onPress={() => { onClose(); onRead(t); }}>
                    <Text style={[al.readText, { color: CORAL }]}>Read</Text>
                    <Feather name="chevron-right" size={13} color={CORAL} />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
}

const al = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 0.5, gap: 8,
  },
  backBtn: { padding: 2 },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontFamily: 'Inter_700Bold' },

  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  imageWrap: { height: 200, position: 'relative' },
  image: { width: '100%', height: '100%' },
  catBadge: { position: 'absolute', top: 10, left: 10, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  catText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#fff' },
  verseWatermark: {
    position: 'absolute', bottom: 10, right: 12,
    fontSize: 12, fontFamily: 'Inter_400Regular', fontStyle: 'italic',
    color: 'rgba(255,255,255,0.88)',
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },
  body: { padding: 14, gap: 6 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  authorName: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  cardTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', lineHeight: 24 },
  excerpt: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },
  footer: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 10, borderTopWidth: 0.5, marginTop: 4,
  },
  statBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statNum: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  readBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  readText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
});

// ─── Testimony Read Modal ──────────────────────────────────────────────────────

function TestimonyReadModal({
  testimony,
  liked,
  likeCount,
  comments,
  onClose,
  onLike,
  onOpenComments,
}: {
  testimony: Testimony | null;
  liked: boolean;
  likeCount: number;
  comments: TestimonyComment[];
  onClose: () => void;
  onLike: () => void;
  onOpenComments: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  if (!testimony) return null;

  const handleShare = async () => {
    try {
      await Share.share({
        title: testimony.title,
        message: `"${testimony.title}" — ${testimony.author.name}\n\n${testimony.excerpt}\n\nShared from Grace Social`,
      });
    } catch (_) {}
  };

  return (
    <Modal
      visible={!!testimony}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[rd.container, { backgroundColor: colors.background }]}>
        {/* ── Header ── */}
        <View style={[rd.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={rd.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={[rd.catBadge, { backgroundColor: testimony.categoryColor }]}>
            <Text style={rd.catText}>{testimony.category}</Text>
          </View>
          <TouchableOpacity onPress={handleShare} style={rd.shareBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Feather name="share-2" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={rd.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
          {/* ── Hero image ── */}
          <View style={rd.imageWrap}>
            <Image
              source={{ uri: testimony.imageUrl }}
              style={rd.image}
              contentFit="cover"
            />
            <View style={rd.imageScrim} />
            <Text style={rd.verseWatermark}>{testimony.bibleVerse}</Text>
          </View>

          {/* ── Author + title ── */}
          <View style={rd.body}>
            <View style={rd.authorRow}>
              <AvatarCircle initials={testimony.author.initials} color={testimony.author.color} size={36} />
              <View style={rd.authorInfo}>
                <Text style={[rd.authorName, { color: colors.foreground }]}>{testimony.author.name}</Text>
                <Text style={[rd.authorMeta, { color: colors.mutedForeground }]}>Community member</Text>
              </View>
            </View>

            <Text style={[rd.title, { color: colors.foreground }]}>{testimony.title}</Text>

            {/* ── Bible verse callout ── */}
            <View style={[rd.bibleBox, { backgroundColor: colors.card, borderColor: testimony.categoryColor }]}>
              <Text style={[rd.bibleRef, { color: testimony.categoryColor }]}>{testimony.bibleVerse}</Text>
              <Text style={[rd.bibleText, { color: colors.foreground }]}>{testimony.bibleText}</Text>
            </View>

            {/* ── Full story text ── */}
            {testimony.fullText.split('\n\n').map((para, i) => (
              <Text key={i} style={[rd.paragraph, { color: colors.foreground }]}>{para}</Text>
            ))}
          </View>
        </ScrollView>

        {/* ── Action bar (pinned at bottom) ── */}
        <View style={[rd.actionBar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + 8 }]}>
          <TouchableOpacity style={rd.actionBtn} onPress={onLike} activeOpacity={0.7}>
            <Feather name="heart" size={22} color={liked ? '#FF3B5C' : colors.mutedForeground} />
            <Text style={[rd.actionCount, { color: liked ? '#FF3B5C' : colors.mutedForeground }]}>
              {formatNum(likeCount)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={rd.actionBtn} onPress={onOpenComments} activeOpacity={0.7}>
            <Feather name="message-circle" size={22} color={colors.mutedForeground} />
            <Text style={[rd.actionCount, { color: colors.mutedForeground }]}>{comments.length}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={rd.actionBtn} onPress={handleShare} activeOpacity={0.7}>
            <Feather name="share-2" size={22} color={colors.mutedForeground} />
            <Text style={[rd.actionCount, { color: colors.mutedForeground }]}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const rd = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 0.5,
    gap: 10,
  },
  backBtn: { padding: 2 },
  catBadge: { flex: 1, alignSelf: 'center', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, maxWidth: 120 },
  catText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#fff' },
  shareBtn: { padding: 2 },

  scroll: { flex: 1 },
  imageWrap: { height: 260, position: 'relative' },
  image: { width: '100%', height: '100%' },
  imageScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)' },
  verseWatermark: {
    position: 'absolute', bottom: 14, right: 16,
    fontSize: 13, fontFamily: 'Inter_400Regular', fontStyle: 'italic',
    color: 'rgba(255,255,255,0.9)',
    textShadowColor: 'rgba(0,0,0,0.7)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },

  body: { paddingHorizontal: 20, paddingTop: 20, gap: 16 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  authorInfo: { gap: 2 },
  authorName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  authorMeta: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold', lineHeight: 32 },

  bibleBox: {
    borderRadius: 14, borderWidth: 1, borderLeftWidth: 3,
    padding: 14, gap: 6,
  },
  bibleRef: { fontSize: 12, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  bibleText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22, fontStyle: 'italic' },

  paragraph: { fontSize: 16, fontFamily: 'Inter_400Regular', lineHeight: 28 },

  actionBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingTop: 12, borderTopWidth: 0.5,
  },
  actionBtn: { alignItems: 'center', gap: 4, paddingHorizontal: 20, paddingVertical: 4 },
  actionCount: { fontSize: 12, fontFamily: 'Inter_400Regular' },
});

// ─── Testimony Card ────────────────────────────────────────────────────────────

function TestimonyCard({
  item,
  liked,
  likeCount,
  comments,
  onLike,
  onRead,
  onOpenComments,
}: {
  item: Testimony;
  liked: boolean;
  likeCount: number;
  comments: TestimonyComment[];
  onLike: () => void;
  onRead: () => void;
  onOpenComments: () => void;
}) {
  const colors = useColors();

  return (
    <View style={[tc.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Image hero */}
      <View style={tc.imageWrap}>
        <Image source={{ uri: item.imageUrl }} style={tc.image} contentFit="cover" />
        <View style={[tc.catBadge, { backgroundColor: item.categoryColor }]}>
          <Text style={tc.catText}>{item.category}</Text>
        </View>
        <Text style={tc.verseWatermark}>{item.bibleVerse}</Text>
        {/* Gradient overlay at bottom of image */}
        <View style={tc.imageGradient} />
      </View>

      {/* Author */}
      <View style={tc.authorRow}>
        <AvatarCircle initials={item.author.initials} color={item.author.color} size={30} />
        <Text style={[tc.authorName, { color: colors.foreground }]}>{item.author.name}</Text>
      </View>

      {/* Title + excerpt */}
      <Text style={[tc.title, { color: colors.foreground }]}>{item.title}</Text>
      <Text style={[tc.excerpt, { color: colors.mutedForeground }]} numberOfLines={2}>
        {item.excerpt}
      </Text>

      {/* Footer */}
      <View style={[tc.footer, { borderTopColor: colors.border }]}>
        <View style={tc.stats}>
          {/* Like button — interactive */}
          <TouchableOpacity style={tc.statBtn} onPress={onLike} activeOpacity={0.7}>
            <Feather
              name="heart"
              size={14}
              color={liked ? '#FF3B5C' : colors.mutedForeground}
            />
            <Text style={[tc.statNum, { color: liked ? '#FF3B5C' : colors.mutedForeground }]}>
              {formatNum(likeCount)}
            </Text>
          </TouchableOpacity>

          {/* Comment button — opens modal */}
          <TouchableOpacity style={[tc.statBtn, { marginLeft: 14 }]} onPress={onOpenComments} activeOpacity={0.7}>
            <Feather name="message-circle" size={14} color={colors.mutedForeground} />
            <Text style={[tc.statNum, { color: colors.mutedForeground }]}>
              {comments.length}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={tc.readBtn} onPress={onRead}>
          <Text style={[tc.readText, { color: CORAL }]}>Read</Text>
          <Feather name="chevron-right" size={13} color={CORAL} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const tc = StyleSheet.create({
  card: { width: 300, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  imageWrap: { height: 180, position: 'relative' },
  image: { width: '100%', height: '100%' },
  imageGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
    backgroundColor: 'transparent',
  },
  catBadge: {
    position: 'absolute', top: 10, left: 10,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  catText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#fff' },
  verseWatermark: {
    position: 'absolute', bottom: 10, right: 12,
    fontSize: 12, fontFamily: 'Inter_400Regular', fontStyle: 'italic',
    color: 'rgba(255,255,255,0.88)',
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingTop: 12 },
  authorName: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  title: { fontSize: 16, fontFamily: 'Inter_700Bold', paddingHorizontal: 14, paddingTop: 6, lineHeight: 22 },
  excerpt: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19, paddingHorizontal: 14, paddingTop: 4, paddingBottom: 12 },
  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12, borderTopWidth: 0.5,
  },
  stats: { flexDirection: 'row', alignItems: 'center' },
  statBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statNum: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  readBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  readText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
});

// ─── Community Card (new design matching screenshots) ─────────────────────────

function CommunityCard({ community }: { community: Community }) {
  const colors = useColors();
  const { toggleJoin } = useApp();

  const privacyLabel = community.isPrivate ? 'Private' : 'Public';
  const privacyIcon = community.isPrivate ? 'lock' : 'globe';

  return (
    <TouchableOpacity
      style={[cc.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.9}
      onPress={() => router.push({ pathname: '/community-detail', params: { id: community.id } })}
    >
      {/* ── Image section ── */}
      <View style={cc.imageSection}>
        <Image
          source={{ uri: community.imageUrl ?? `https://picsum.photos/seed/gc-${community.id}/600/400` }}
          style={cc.image}
          contentFit="cover"
        />

        {/* Privacy badge — top right */}
        <View style={cc.privacyBadge}>
          <Feather
            name={privacyIcon as any}
            size={10}
            color="#fff"
          />
          <Text style={cc.privacyText}>{privacyLabel}</Text>
        </View>

        {/* Category label — bottom left */}
        <View style={[cc.categoryBadge, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
          <Feather name={community.iconName as any} size={12} color="#fff" />
          <Text style={cc.categoryText}>{community.category}</Text>
        </View>
      </View>

      {/* ── Content section ── */}
      <View style={cc.content}>
        {/* Name + Join row */}
        <View style={cc.nameRow}>
          <Text style={[cc.name, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">
            {community.name}
          </Text>
          {(!community.isPrivate || community.isJoined) && (
            <TouchableOpacity
              style={[cc.joinBtn, community.isJoined && { borderColor: colors.border }]}
              onPress={(e) => { e.stopPropagation?.(); toggleJoin(community.id); }}
              activeOpacity={0.7}
            >
              <Text style={[cc.joinText, { color: community.isJoined ? colors.mutedForeground : CORAL }]}>
                {community.isJoined ? 'Joined ✓' : 'Join'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Description */}
        <Text style={[cc.description, { color: colors.mutedForeground }]} numberOfLines={2}>
          {community.description}
        </Text>

        {/* Members row */}
        <View style={cc.membersRow}>
          <Feather name="users" size={13} color={colors.mutedForeground} />
          <Text style={[cc.membersText, { color: colors.mutedForeground }]}>
            {community.members.toLocaleString()} members
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const cc = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },

  // Image
  imageSection: { height: 200, position: 'relative' },
  image: { width: '100%', height: '100%' },

  // Privacy badge — top-right
  privacyBadge: {
    position: 'absolute', top: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20,
  },
  privacyText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#fff' },

  // Category label — bottom-left
  categoryBadge: {
    position: 'absolute', bottom: 12, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20,
  },
  categoryText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#fff' },

  // Content below image
  content: { padding: 14, gap: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 17, fontFamily: 'Inter_700Bold', flex: 1, marginRight: 12 },
  joinBtn: { paddingHorizontal: 0 },
  joinText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  description: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },
  membersRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  membersText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

type TabKey = 'discover' | 'mygroups';

export default function CommunityScreen() {
  const { communities } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<TabKey>('discover');

  // ── Testimony interactive state ──
  const [testimonyLikes, setTestimonyLikes] = useState<Record<string, { liked: boolean; count: number }>>(
    () => Object.fromEntries(SEED_TESTIMONIES.map((t) => [t.id, { liked: false, count: t.likes }]))
  );
  const [testimonyComments, setTestimonyComments] = useState<Record<string, TestimonyComment[]>>(
    () => Object.fromEntries(SEED_TESTIMONIES.map((t) => [t.id, t.comments]))
  );
  const [activeCommentTestimony, setActiveCommentTestimony] = useState<Testimony | null>(null);
  const [activeReadTestimony, setActiveReadTestimony] = useState<Testimony | null>(null);
  const [showAllTestimonies, setShowAllTestimonies] = useState(false);

  const toggleTestimonyLike = useCallback((id: string) => {
    setTestimonyLikes((prev) => {
      const cur = prev[id];
      return { ...prev, [id]: { liked: !cur.liked, count: cur.liked ? cur.count - 1 : cur.count + 1 } };
    });
  }, []);

  const addTestimonyComment = useCallback((id: string, text: string, user?: { userName: string; userInitials: string; userColor: string }) => {
    const newComment: TestimonyComment = {
      id: `tc-${Date.now()}`,
      userName: user?.userName ?? 'You',
      userInitials: user?.userInitials ?? 'ME',
      userColor: user?.userColor ?? '#4A90A4',
      text,
      timestamp: 'just now',
    };
    setTestimonyComments((prev) => ({ ...prev, [id]: [newComment, ...(prev[id] ?? [])] }));
  }, []);

  // ── Community filtering ──
  const searching = search.trim().length > 0;
  const discoverList = useMemo(() => {
    const base = searching
      ? communities.filter((c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.description.toLowerCase().includes(search.toLowerCase())
        )
      : communities.filter((c) => !c.isJoined);
    return base;
  }, [communities, search, searching]);

  const myGroups = useMemo(() => communities.filter((c) => c.isJoined), [communities]);
  const listData: Community[] = tab === 'mygroups' ? myGroups : discoverList;

  const { currentUser } = useAuth();

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={listData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CommunityCard community={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: isWeb ? 90 : insets.bottom + 88,
          gap: 14,
        }}
        ListHeaderComponent={
          <View>
            {/* ── Page header ── */}
            <View style={[s.header, { paddingTop: (isWeb ? 67 : insets.top) + 8 }]}>
              <Text style={[s.title, { color: colors.foreground }]}>Communities</Text>
              <TouchableOpacity
                style={[s.liveBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push('/live-events' as any)}
                activeOpacity={0.8}
              >
                <Text style={s.liveBtnIcon}>📅</Text>
                <Text style={[s.liveBtnText, { color: colors.foreground }]}>Live Events</Text>
              </TouchableOpacity>
            </View>

            {/* ── Featured Testimonies ── */}
            <View style={s.sectionWrap}>
              <View style={s.sectionRow}>
                <Text style={s.sectionEmoji}>🔥</Text>
                <Text style={[s.sectionTitle, { color: colors.foreground }]}>Featured Testimonies</Text>
                <View style={{ flex: 1 }} />
                <TouchableOpacity onPress={() => setShowAllTestimonies(true)}>
                  <Text style={[s.seeAll, { color: CORAL }]}>See all</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingRight: 4 }}
              >
                {SEED_TESTIMONIES.map((t) => (
                  <TestimonyCard
                    key={t.id}
                    item={t}
                    liked={testimonyLikes[t.id]?.liked ?? false}
                    likeCount={testimonyLikes[t.id]?.count ?? t.likes}
                    comments={testimonyComments[t.id] ?? []}
                    onLike={() => toggleTestimonyLike(t.id)}
                    onRead={() => setActiveReadTestimony(t)}
                    onOpenComments={() => setActiveCommentTestimony(t)}
                  />
                ))}
              </ScrollView>
            </View>

            {/* ── Search bar ── */}
            <View style={[s.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="search" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[s.searchInput, { color: colors.foreground }]}
                placeholder="Search communities..."
                placeholderTextColor={colors.mutedForeground}
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Feather name="x" size={15} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>

            {/* ── Tabs ── */}
            <View style={[s.tabRow, { borderBottomColor: colors.border }]}>
              {([
                { key: 'discover', label: '🌐  Discover' },
                { key: 'mygroups', label: '👥  My Groups' },
              ] as { key: TabKey; label: string }[]).map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[s.tab, tab === t.key && { borderBottomColor: CORAL, borderBottomWidth: 2.5 }]}
                  onPress={() => setTab(t.key)}
                >
                  <Text style={[s.tabText, { color: tab === t.key ? CORAL : colors.mutedForeground }]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ height: 14 }} />
          </View>
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Feather name="users" size={44} color={colors.mutedForeground} />
            <Text style={[s.emptyTitle, { color: colors.foreground }]}>
              {tab === 'mygroups' ? "You haven't joined any groups yet" : 'No communities found'}
            </Text>
            <Text style={[s.emptySub, { color: colors.mutedForeground }]}>
              {tab === 'mygroups' ? 'Explore the Discover tab to find your people' : 'Try a different search'}
            </Text>
          </View>
        }
      />

      {/* ── All testimonies modal ── */}
      <AllTestimoniesModal
        visible={showAllTestimonies}
        testimonyLikes={testimonyLikes}
        testimonyComments={testimonyComments}
        onClose={() => setShowAllTestimonies(false)}
        onLike={(id) => toggleTestimonyLike(id)}
        onRead={(t) => { setShowAllTestimonies(false); setActiveReadTestimony(t); }}
        onOpenComments={(t) => { setShowAllTestimonies(false); setActiveCommentTestimony(t); }}
      />

      {/* ── Testimony read modal ── */}
      <TestimonyReadModal
        testimony={activeReadTestimony}
        liked={testimonyLikes[activeReadTestimony?.id ?? '']?.liked ?? false}
        likeCount={testimonyLikes[activeReadTestimony?.id ?? '']?.count ?? 0}
        comments={testimonyComments[activeReadTestimony?.id ?? ''] ?? []}
        onClose={() => setActiveReadTestimony(null)}
        onLike={() => activeReadTestimony && toggleTestimonyLike(activeReadTestimony.id)}
        onOpenComments={() => {
          if (!activeReadTestimony) return;
          setActiveCommentTestimony(activeReadTestimony);
          setActiveReadTestimony(null);
        }}
      />

      {/* ── Testimony comment sheet ── */}
      {activeCommentTestimony && (
        <TestimonyCommentModal
          testimony={activeCommentTestimony}
          comments={testimonyComments[activeCommentTestimony.id] ?? []}
          onClose={() => setActiveCommentTestimony(null)}
          onAddComment={(text) => {
            addTestimonyComment(
              activeCommentTestimony.id,
              text,
              currentUser
                ? { userName: currentUser.name, userInitials: currentUser.initials, userColor: currentUser.color }
                : undefined
            );
          }}
        />
      )}
    </View>
  );
}

// ─── Screen-level Styles ──────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', paddingBottom: 16,
  },
  title: { flex: 1, fontSize: 26, fontFamily: 'Inter_700Bold' },
  liveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 22, borderWidth: 1,
  },
  liveBtnIcon: { fontSize: 14 },
  liveBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  sectionWrap: { marginBottom: 18, gap: 12 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionEmoji: { fontSize: 16 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  seeAll: { fontSize: 13, fontFamily: 'Inter_500Medium' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 11,
    gap: 8, marginBottom: 2,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },

  tabRow: { flexDirection: 'row', borderBottomWidth: 1, marginTop: 12 },
  tab: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 2.5, borderBottomColor: 'transparent',
  },
  tabText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },

  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', textAlign: 'center', paddingHorizontal: 20 },
  emptySub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
});
