import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
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
import { POST_IMAGES } from '@/constants/images';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CELL = Math.floor(SCREEN_WIDTH / 3);

// ─── Static explore grid images ───────────────────────────────────────────────
const EXPLORE_GRID = [
  { uri: 'https://picsum.photos/seed/exp-forest/400/400', isVideo: false },
  { uri: 'https://picsum.photos/seed/exp-worship/400/400', isVideo: false },
  { uri: 'https://picsum.photos/seed/exp-sunset/400/400', isVideo: false },
  { uri: 'https://picsum.photos/seed/exp-friends/400/400', isVideo: false },
  { uri: 'https://picsum.photos/seed/exp-landscape/400/400', isVideo: true },
  { uri: 'https://picsum.photos/seed/exp-portrait1/400/400', isVideo: false },
  { uri: 'https://picsum.photos/seed/exp-man1/400/400', isVideo: false },
  { uri: 'https://picsum.photos/seed/exp-man2/400/400', isVideo: false },
  { uri: 'https://picsum.photos/seed/exp-woman1/400/400', isVideo: false },
];

// ─── Trending hashtags ─────────────────────────────────────────────────────────
const TRENDING = [
  { tag: '#SundayWorship', posts: '2.4k' },
  { tag: '#DailyPrayer', posts: '1.8k' },
  { tag: '#FaithJourney', posts: '1.1k' },
  { tag: '#BibleStudy', posts: '934' },
  { tag: '#Gratitude', posts: '712' },
];

// ─── Suggested people ─────────────────────────────────────────────────────────
const SUGGESTED_PEOPLE = [
  { id: 'sp1', name: 'Pastor Timothy', handle: '@pastortimothy', followers: '12.4k', verified: true, avatar: 'https://picsum.photos/seed/pastor-tim/200/200' },
  { id: 'sp2', name: 'Sarah Mitchell', handle: '@sarahmitchell', followers: '8.9k', verified: false, avatar: 'https://picsum.photos/seed/sarah-m/200/200' },
  { id: 'sp3', name: 'Grace Ministry', handle: '@graceministry', followers: '34.2k', verified: true, avatar: 'https://picsum.photos/seed/grace-min/200/200' },
  { id: 'sp4', name: 'David Livingston', handle: '@david_l', followers: '5.1k', verified: false, avatar: 'https://picsum.photos/seed/david-l/200/200' },
];

type Tab = 'Top' | 'People' | 'Reels';

interface PersonResult {
  id: number;
  name: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  color: string;
  followers_count: number;
  following_count: number;
  is_following_back: boolean;
}

function getApiBase(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}/api`;
  return 'http://localhost:3000/api';
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  const colors = useColors();
  return (
    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
  );
}

function ExploreGrid() {
  const colors = useColors();
  return (
    <View>
      <View style={styles.exploreHeader}>
        <Text style={[styles.exploreTitle, { color: colors.foreground }]}>Explore</Text>
        <Text style={[styles.exploreSub, { color: colors.mutedForeground }]}>
          Discover posts, reels, and communities
        </Text>
      </View>
      <View style={styles.grid}>
        {EXPLORE_GRID.map((item, i) => (
          <TouchableOpacity key={i} style={[styles.gridCell, { width: CELL, height: CELL }]} activeOpacity={0.88}>
            <Image source={{ uri: item.uri }} style={styles.gridImg} contentFit="cover" />
            {item.isVideo && (
              <View style={styles.playBadge}>
                <Feather name="play" size={12} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function TrendingSection({ onTagPress }: { onTagPress: (tag: string) => void }) {
  const colors = useColors();
  return (
    <View style={styles.trendingSection}>
      <SectionHeader title="Trending in Grace" />
      {TRENDING.map((item, i) => (
        <TouchableOpacity
          key={item.tag}
          style={[
            styles.trendRow,
            { borderBottomColor: colors.border },
            i === 0 && { borderTopWidth: 0.5, borderTopColor: colors.border },
          ]}
          activeOpacity={0.7}
          onPress={() => onTagPress(item.tag)}
        >
          <View style={styles.trendLeft}>
            <Text style={[styles.trendTag, { color: colors.foreground }]}>{item.tag}</Text>
            <Text style={[styles.trendCount, { color: colors.mutedForeground }]}>{item.posts} posts</Text>
          </View>
          <Feather name="search" size={17} color={colors.mutedForeground} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function SuggestedPeopleSection() {
  const colors = useColors();
  const [followed, setFollowed] = useState<Record<string, boolean>>({});

  return (
    <View style={styles.suggestedSection}>
      <SectionHeader title="Suggested People" />
      {SUGGESTED_PEOPLE.map((person, i) => (
        <View
          key={person.id}
          style={[
            styles.personRow,
            { borderBottomColor: colors.border },
            i === 0 && { borderTopWidth: 0.5, borderTopColor: colors.border },
          ]}
        >
          <Image source={{ uri: person.avatar }} style={styles.personAvatar} contentFit="cover" />
          <View style={styles.personInfo}>
            <View style={styles.personNameRow}>
              <Text style={[styles.personName, { color: colors.foreground }]}>{person.name}</Text>
              {person.verified && (
                <Text style={[styles.verifiedBadge, { color: colors.primary }]}> ✓</Text>
              )}
            </View>
            <Text style={[styles.personMeta, { color: colors.mutedForeground }]}>
              {person.handle} · {person.followers} followers
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.followBtn,
              followed[person.id]
                ? { backgroundColor: 'transparent', borderColor: colors.border }
                : { backgroundColor: 'transparent', borderColor: colors.foreground },
            ]}
            onPress={() => setFollowed((prev) => ({ ...prev, [person.id]: !prev[person.id] }))}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.followBtnText,
                { color: followed[person.id] ? colors.mutedForeground : colors.foreground },
              ]}
            >
              {followed[person.id] ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;
  const { posts, prayers, communities, reels } = useApp();
  const { authToken, currentUser, followUser, unfollowUser } = useAuth();

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('Top');
  const [people, setPeople] = useState<PersonResult[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState<Record<number, boolean>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Combined results for "Top" tab
  const topResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const postResults = posts
      .filter((p) => p.caption.toLowerCase().includes(q) || p.userName.toLowerCase().includes(q))
      .map((p) => ({ type: 'post' as const, data: p }));
    const prayerResults = prayers
      .filter((p) => (p.title ?? p.request).toLowerCase().includes(q) || p.userName.toLowerCase().includes(q))
      .map((p) => ({ type: 'prayer' as const, data: p }));
    const communityResults = communities
      .filter((c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
      .map((c) => ({ type: 'community' as const, data: c }));
    return [...communityResults, ...postResults, ...prayerResults];
  }, [query, posts, prayers, communities]);

  // Reels results
  const reelResults = useMemo(() => {
    if (!query.trim()) return reels;
    const q = query.toLowerCase();
    return reels.filter(
      (r) => r.description.toLowerCase().includes(q) || r.userName.toLowerCase().includes(q)
    );
  }, [query, reels]);

  const searchPeople = useCallback(async (q: string) => {
    if (!q.trim()) { setPeople([]); return; }
    setPeopleLoading(true);
    try {
      const base = getApiBase();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const res = await fetch(`${base}/users/search?q=${encodeURIComponent(q)}`, { headers });
      const data = await res.json();
      setPeople(data.users ?? []);
    } catch {
      setPeople([]);
    } finally {
      setPeopleLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (activeTab === 'People' && query.trim()) {
      debounceRef.current = setTimeout(() => searchPeople(query), 350);
    } else if (activeTab === 'People' && !query.trim()) {
      setPeople([]);
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, activeTab, searchPeople]);

  const handleToggleFollow = useCallback(async (person: PersonResult) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFollowLoading((prev) => ({ ...prev, [person.id]: true }));
    try {
      if (person.is_following_back) {
        await unfollowUser(person.id);
      } else {
        await followUser(person.id);
      }
      setPeople((prev) =>
        prev.map((p) => p.id === person.id ? { ...p, is_following_back: !p.is_following_back } : p)
      );
    } finally {
      setFollowLoading((prev) => ({ ...prev, [person.id]: false }));
    }
  }, [followUser, unfollowUser]);

  // ── Result renderers ──

  const renderTopResult = ({ item }: { item: typeof topResults[0] }) => {
    if (item.type === 'community') {
      const c = item.data;
      return (
        <TouchableOpacity
          style={[styles.resultRow, { borderBottomColor: colors.border }]}
          onPress={() => router.push({ pathname: '/community-detail', params: { id: c.id } })}
        >
          <View style={[styles.resultIcon, { backgroundColor: c.color + '22' }]}>
            <Feather name={c.iconName as any} size={22} color={c.color} />
          </View>
          <View style={styles.resultInfo}>
            <Text style={[styles.resultName, { color: colors.foreground }]}>{c.name}</Text>
            <Text style={[styles.resultSub, { color: colors.mutedForeground }]}>
              {c.members.toLocaleString()} members · Community
            </Text>
          </View>
          <View style={[styles.tag, { backgroundColor: '#2196F322' }]}>
            <Text style={{ color: '#2196F3', fontSize: 11, fontFamily: 'Inter_600SemiBold' }}>Community</Text>
          </View>
        </TouchableOpacity>
      );
    }
    if (item.type === 'prayer') {
      const p = item.data;
      return (
        <TouchableOpacity
          style={[styles.resultRow, { borderBottomColor: colors.border }]}
          onPress={() => router.push('/(tabs)/prayer')}
        >
          <AvatarCircle initials={p.userInitials} color={p.userColor} size={44} />
          <View style={styles.resultInfo}>
            <Text style={[styles.resultName, { color: colors.foreground }]}>{p.title ?? p.userName}</Text>
            <Text style={[styles.resultSub, { color: colors.mutedForeground }]} numberOfLines={1}>
              {p.request}
            </Text>
          </View>
          <View style={[styles.tag, { backgroundColor: '#FF980022' }]}>
            <Text style={{ color: '#FF9800', fontSize: 11, fontFamily: 'Inter_600SemiBold' }}>Prayer</Text>
          </View>
        </TouchableOpacity>
      );
    }
    const post = item.data;
    return (
      <TouchableOpacity style={[styles.resultRow, { borderBottomColor: colors.border }]}>
        {post.imageIndex !== null ? (
          <Image
            source={POST_IMAGES[post.imageIndex % POST_IMAGES.length]}
            style={styles.resultThumb}
            contentFit="cover"
          />
        ) : (
          <AvatarCircle initials={post.userInitials} color={post.userColor} size={44} />
        )}
        <View style={styles.resultInfo}>
          <Text style={[styles.resultName, { color: colors.foreground }]}>{post.userName}</Text>
          <Text style={[styles.resultSub, { color: colors.mutedForeground }]} numberOfLines={1}>
            {post.caption}
          </Text>
        </View>
        <View style={[styles.tag, { backgroundColor: '#4A90A422' }]}>
          <Text style={{ color: '#4A90A4', fontSize: 11, fontFamily: 'Inter_600SemiBold' }}>Post</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderReelResult = ({ item }: { item: typeof reelResults[0] }) => (
    <TouchableOpacity
      style={[styles.resultRow, { borderBottomColor: colors.border }]}
      onPress={() => router.push('/(tabs)/reels')}
      activeOpacity={0.8}
    >
      <View style={[styles.resultThumb, { backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }]}>
        <Image
          source={{ uri: `https://picsum.photos/seed/reel-${item.id}/200/200` }}
          style={[StyleSheet.absoluteFill, { borderRadius: 8 }]}
          contentFit="cover"
        />
        <View style={styles.reelPlayIcon}>
          <Feather name="play" size={12} color="#fff" />
        </View>
      </View>
      <View style={styles.resultInfo}>
        <Text style={[styles.resultName, { color: colors.foreground }]} numberOfLines={1}>
          {item.description}
        </Text>
        <Text style={[styles.resultSub, { color: colors.mutedForeground }]}>
          {item.userName} · {(item.views / 1000).toFixed(1)}k views
        </Text>
      </View>
      <View style={[styles.tag, { backgroundColor: '#9B59B622' }]}>
        <Text style={{ color: '#9B59B6', fontSize: 11, fontFamily: 'Inter_600SemiBold' }}>Reel</Text>
      </View>
    </TouchableOpacity>
  );

  const renderPerson = ({ item }: { item: PersonResult }) => {
    const displayName = item.display_name || item.name;
    const initials = displayName.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);
    const isMe = currentUser?.id === item.id;
    const isLoadingThis = followLoading[item.id];

    return (
      <TouchableOpacity
        style={[styles.resultRow, { borderBottomColor: colors.border }]}
        onPress={() => router.push({ pathname: '/follow-list', params: { userId: String(item.id), type: 'followers', userName: displayName } })}
        activeOpacity={0.8}
      >
        <AvatarCircle initials={initials} color={item.color || '#4A90A4'} size={46} />
        <View style={styles.resultInfo}>
          <Text style={[styles.resultName, { color: colors.foreground }]} numberOfLines={1}>{displayName}</Text>
          <Text style={[styles.resultSub, { color: colors.mutedForeground }]} numberOfLines={1}>
            @{item.username}{item.followers_count > 0 ? ` · ${item.followers_count.toLocaleString()} followers` : ''}
          </Text>
          {!!item.bio && (
            <Text style={[styles.personBio, { color: colors.mutedForeground }]} numberOfLines={1}>{item.bio}</Text>
          )}
        </View>
        {!isMe && (
          <TouchableOpacity
            style={[
              styles.followBtn,
              item.is_following_back
                ? { borderColor: colors.border, backgroundColor: 'transparent' }
                : { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => handleToggleFollow(item)}
            disabled={isLoadingThis}
          >
            {isLoadingThis ? (
              <ActivityIndicator size="small" color={item.is_following_back ? colors.foreground : '#fff'} />
            ) : (
              <Text style={[styles.followBtnText, { color: item.is_following_back ? colors.foreground : '#fff' }]}>
                {item.is_following_back ? 'Following' : 'Follow'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const isSearching = query.trim().length > 0;
  const TABS: Tab[] = ['Top', 'People', 'Reels'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Search bar ── */}
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={[styles.searchBar, { backgroundColor: colors.muted }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search people, posts, reels, verses..."
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setPeople([]); }}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Tab bar — visible when searching ── */}
      {isSearching && (
        <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={styles.tabItem}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTab(tab);
                if (tab === 'People') searchPeople(query);
              }}
            >
              <Text style={[styles.tabText, { color: activeTab === tab ? colors.foreground : colors.mutedForeground }]}>
                {tab}
              </Text>
              {activeTab === tab && (
                <View style={[styles.tabIndicator, { backgroundColor: colors.primary }]} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── Content ── */}
      {!isSearching ? (
        /* ── Idle: Explore grid + Trending + Suggested ── */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: isWeb ? 34 : insets.bottom + 20 }}
        >
          <ExploreGrid />
          <TrendingSection onTagPress={(tag) => { setQuery(tag); setActiveTab('Top'); }} />
          <SuggestedPeopleSection />
        </ScrollView>
      ) : activeTab === 'People' ? (
        peopleLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={people}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderPerson}
            contentContainerStyle={{ paddingBottom: isWeb ? 34 : insets.bottom + 20 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Feather name="users" size={40} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No people found</Text>
                <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                  Try a different name or @username
                </Text>
              </View>
            }
          />
        )
      ) : activeTab === 'Reels' ? (
        <FlatList
          data={reelResults}
          keyExtractor={(item) => item.id}
          renderItem={renderReelResult}
          contentContainerStyle={{ paddingBottom: isWeb ? 34 : insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="play-circle" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No reels found</Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>Try a different search term</Text>
            </View>
          }
        />
      ) : (
        /* Top tab */
        <FlatList
          data={topResults}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderTopResult}
          contentContainerStyle={{ paddingBottom: isWeb ? 34 : insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="search" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No results found</Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                Try People or Reels tab for more results
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  backBtn: { padding: 4 },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular' },

  // tabs
  tabBar: { flexDirection: 'row', borderBottomWidth: 0.5 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 13, position: 'relative' },
  tabText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  tabIndicator: { position: 'absolute', bottom: 0, left: 20, right: 20, height: 3, borderRadius: 3 },

  // explore
  exploreHeader: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 },
  exploreTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  exploreSub: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridCell: { position: 'relative' },
  gridImg: { width: '100%', height: '100%' },
  playBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -14,
    marginLeft: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
  },

  // section title
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 4 },

  // trending
  trendingSection: { marginBottom: 4 },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  trendLeft: { flex: 1 },
  trendTag: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  trendCount: { fontSize: 12, fontFamily: 'Inter_400Regular' },

  // suggested people
  suggestedSection: { marginBottom: 24 },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  personAvatar: { width: 46, height: 46, borderRadius: 23 },
  personInfo: { flex: 1 },
  personNameRow: { flexDirection: 'row', alignItems: 'center' },
  personName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  verifiedBadge: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  personMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  followBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 34,
  },
  followBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  // result rows
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  resultIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  resultThumb: { width: 44, height: 44, borderRadius: 8 },
  resultInfo: { flex: 1, gap: 2 },
  resultName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  resultSub: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  personBio: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  tag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  reelPlayIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 1,
  },

  // states
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  emptySub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingHorizontal: 24 },
});
