import { AntDesign, Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
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
  author: { name: string; initials: string; color: string };
  title: string;
  excerpt: string;
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
    author: { name: 'Sarah Mitchell', initials: 'SM', color: '#E91E8C' },
    title: 'Healed After Five Years',
    excerpt: "The doctors said it was impossible, but God had the final word. Here's how prayer carried us through...",
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
    author: { name: 'Pastor Tim', initials: 'PT', color: '#D4A843' },
    title: 'From Addiction to Purpose',
    excerpt: "I lost everything but God invited me to something greater. My story of radical redemption...",
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
    author: { name: 'Grace B.', initials: 'GB', color: '#27AE60' },
    title: 'When God Spoke in the Storm',
    excerpt: "My business failed, my marriage was tested — but faith became my foundation...",
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

// ─── Testimony Card ────────────────────────────────────────────────────────────

function TestimonyCard({
  item,
  liked,
  likeCount,
  comments,
  onLike,
  onOpenComments,
}: {
  item: Testimony;
  liked: boolean;
  likeCount: number;
  comments: TestimonyComment[];
  onLike: () => void;
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
            <AntDesign
              name={liked ? 'heart' : 'hearto'}
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

        <TouchableOpacity style={tc.readBtn} onPress={onOpenComments}>
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
          <TouchableOpacity
            style={[cc.joinBtn, community.isJoined && { borderColor: colors.border }]}
            onPress={(e) => { e.stopPropagation?.(); toggleJoin(community.id); }}
            activeOpacity={0.7}
          >
            <Text style={[cc.joinText, { color: community.isJoined ? colors.mutedForeground : CORAL }]}>
              {community.isJoined ? 'Joined ✓' : 'Join'}
            </Text>
          </TouchableOpacity>
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
                <TouchableOpacity>
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
