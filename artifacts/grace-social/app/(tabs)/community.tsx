import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
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
import { useColors } from '@/hooks/useColors';

// ─── Testimony data ────────────────────────────────────────────────────────────

const CORAL = '#E07A54';

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
  comments: number;
}

const TESTIMONIES: Testimony[] = [
  {
    id: 't1',
    category: 'Healing',
    categoryColor: CORAL,
    imageUrl: 'https://picsum.photos/seed/testimony-healing/800/500',
    bibleVerse: 'Jeremiah 30:17',
    author: { name: 'Sarah Mitchell', initials: 'SM', color: '#E91E8C' },
    title: 'Healed After Five Years',
    excerpt: "The doctors said it was impossible, but God had the final word. Here's how prayer carried us...",
    likes: 1300,
    comments: 96,
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
    comments: 143,
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
    comments: 61,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNum(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace('.0', '')}k` : `${n}`;
}

// ─── Testimony card ───────────────────────────────────────────────────────────

function TestimonyCard({ item }: { item: Testimony }) {
  const colors = useColors();
  return (
    <View style={[styles.testimonyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Image hero */}
      <View style={styles.testimonyImageWrap}>
        <Image source={{ uri: item.imageUrl }} style={styles.testimonyImage} contentFit="cover" />
        {/* Category badge */}
        <View style={[styles.catBadge, { backgroundColor: item.categoryColor }]}>
          <Text style={styles.catBadgeText}>{item.category}</Text>
        </View>
        {/* Bible verse watermark */}
        <Text style={styles.bibleVerse}>{item.bibleVerse}</Text>
      </View>

      {/* Author row */}
      <View style={styles.testimonyAuthorRow}>
        <AvatarCircle initials={item.author.initials} color={item.author.color} size={32} />
        <Text style={[styles.testimonyAuthor, { color: colors.foreground }]}>{item.author.name}</Text>
      </View>

      {/* Title + excerpt */}
      <Text style={[styles.testimonyTitle, { color: colors.foreground }]}>{item.title}</Text>
      <Text style={[styles.testimonyExcerpt, { color: colors.mutedForeground }]} numberOfLines={2}>
        {item.excerpt}
      </Text>

      {/* Footer */}
      <View style={[styles.testimonyFooter, { borderTopColor: colors.border }]}>
        <View style={styles.testimonyStats}>
          <Feather name="heart" size={13} color={colors.mutedForeground} />
          <Text style={[styles.statText, { color: colors.mutedForeground }]}>{formatNum(item.likes)}</Text>
          <Feather name="message-circle" size={13} color={colors.mutedForeground} style={{ marginLeft: 10 }} />
          <Text style={[styles.statText, { color: colors.mutedForeground }]}>{item.comments}</Text>
        </View>
        <TouchableOpacity style={styles.readBtn}>
          <Text style={[styles.readText, { color: CORAL }]}>Read</Text>
          <Feather name="chevron-right" size={13} color={CORAL} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Community card (image-based) ─────────────────────────────────────────────

function CommunityImageCard({ community }: { community: Community }) {
  const colors = useColors();
  const { toggleJoin } = useApp();

  return (
    <TouchableOpacity
      style={styles.communityCard}
      activeOpacity={0.85}
      onPress={() => router.push({ pathname: '/community-detail', params: { id: community.id } })}
    >
      {/* Background image */}
      <Image
        source={{ uri: community.imageUrl ?? `https://picsum.photos/seed/gc-${community.id}/600/300` }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      {/* Gradient overlay */}
      <View style={styles.communityOverlay} />

      {/* Content */}
      <View style={styles.communityContent}>
        <View>
          <Text style={styles.communityName}>{community.name}</Text>
          <Text style={styles.communityMembers}>{community.members.toLocaleString()} members</Text>
        </View>
        <View style={styles.communityBottom}>
          <View style={styles.publicBadge}>
            <View style={[styles.publicDot, { backgroundColor: '#27AE60' }]} />
            <Text style={styles.publicText}>Public</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.joinCircleBtn,
              { backgroundColor: community.isJoined ? 'rgba(255,255,255,0.25)' : CORAL },
            ]}
            onPress={(e) => { e.stopPropagation?.(); toggleJoin(community.id); }}
          >
            <Feather name={community.isJoined ? 'check' : 'plus'} size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

type TabKey = 'discover' | 'mygroups';

export default function CommunityScreen() {
  const { communities } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<TabKey>('discover');

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

  const myGroups = useMemo(
    () => communities.filter((c) => c.isJoined),
    [communities]
  );

  const listData = tab === 'mygroups' ? myGroups : discoverList;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={listData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CommunityImageCard community={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: isWeb ? 40 : 100, gap: 12 }}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View
              style={[
                styles.header,
                { paddingTop: (isWeb ? 67 : insets.top) + 8 },
              ]}
            >
              <Text style={[styles.title, { color: colors.foreground }]}>Communities</Text>
              <TouchableOpacity
                style={[styles.liveEventsBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push('/live-events' as any)}
                activeOpacity={0.8}
              >
                <Text style={styles.liveEventsBtnIcon}>📅</Text>
                <Text style={[styles.liveEventsBtnText, { color: colors.foreground }]}>Live Events</Text>
              </TouchableOpacity>
            </View>

            {/* Featured Testimonies */}
            <View style={styles.testimoniesSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderEmoji}>🔥</Text>
                <Text style={[styles.sectionHeaderTitle, { color: colors.foreground }]}>
                  Featured Testimonies
                </Text>
                <View style={{ flex: 1 }} />
                <TouchableOpacity>
                  <Text style={[styles.seeAll, { color: CORAL }]}>See all</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingRight: 4 }}
              >
                {TESTIMONIES.map((t) => (
                  <TestimonyCard key={t.id} item={t} />
                ))}
              </ScrollView>
            </View>

            {/* Search */}
            <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="search" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.searchInput, { color: colors.foreground }]}
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

            {/* Tabs */}
            <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
              {([
                { key: 'discover', label: '🌐  Discover' },
                { key: 'mygroups', label: '👥  My Groups' },
              ] as { key: TabKey; label: string }[]).map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[
                    styles.tab,
                    tab === t.key && { borderBottomColor: CORAL, borderBottomWidth: 2.5 },
                  ]}
                  onPress={() => setTab(t.key)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: tab === t.key ? CORAL : colors.mutedForeground },
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ height: 12 }} />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="users" size={44} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {tab === 'mygroups' ? "You haven't joined any groups yet" : 'No communities found'}
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              {tab === 'mygroups' ? 'Explore communities and tap + to join' : 'Try a different search'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  // header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 14,
  },
  title: { flex: 1, fontSize: 26, fontFamily: 'Inter_700Bold' },
  liveEventsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 1,
  },
  liveEventsBtnIcon: { fontSize: 14 },
  liveEventsBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  // testimonies section
  testimoniesSection: { marginBottom: 16, gap: 12 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionHeaderEmoji: { fontSize: 16 },
  sectionHeaderTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  seeAll: { fontSize: 13, fontFamily: 'Inter_500Medium' },

  // testimony card
  testimonyCard: {
    width: 320,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    gap: 0,
  },
  testimonyImageWrap: {
    height: 190,
    position: 'relative',
  },
  testimonyImage: { width: '100%', height: '100%' },
  catBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  catBadgeText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#fff' },
  bibleVerse: {
    position: 'absolute',
    bottom: 10,
    right: 12,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.85)',
  },
  testimonyAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  testimonyAuthor: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  testimonyTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    paddingHorizontal: 14,
    paddingTop: 6,
    lineHeight: 22,
  },
  testimonyExcerpt: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 19,
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 12,
  },
  testimonyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 0.5,
  },
  testimonyStats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  readBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  readText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  // search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 8,
    marginBottom: 2,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },

  // tabs
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginTop: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },

  // community image card
  communityCard: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  communityOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  communityContent: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  communityName: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  communityMembers: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  communityBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  publicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  publicDot: { width: 7, height: 7, borderRadius: 3.5 },
  publicText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  joinCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // empty state
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', textAlign: 'center', paddingHorizontal: 20 },
  emptySub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
});
