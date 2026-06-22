import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
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

const CATEGORIES = [
  { id: 'faith', label: 'Faith', icon: 'heart', color: '#E91E8C' },
  { id: 'worship', label: 'Worship', icon: 'music', color: '#9C27B0' },
  { id: 'prayer', label: 'Prayer', icon: 'sun', color: '#FF9800' },
  { id: 'community', label: 'Community', icon: 'users', color: '#2196F3' },
  { id: 'bible', label: 'Bible', icon: 'book-open', color: '#4CAF50' },
  { id: 'testimony', label: 'Testimony', icon: 'star', color: '#F59E0B' },
  { id: 'youth', label: 'Youth', icon: 'zap', color: '#EF4444' },
  { id: 'missions', label: 'Missions', icon: 'globe', color: '#06B6D4' },
];

type Tab = 'Top' | 'People';

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

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;
  const { posts, prayers, communities } = useApp();
  const { authToken, currentUser, followUser, unfollowUser } = useAuth();

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('Top');
  const [people, setPeople] = useState<PersonResult[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState<Record<number, boolean>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const postResults = posts
      .filter((p) => p.caption.toLowerCase().includes(q) || p.userName.toLowerCase().includes(q))
      .map((p) => ({ type: 'post' as const, data: p }));
    const prayerResults = prayers
      .filter((p) => p.request.toLowerCase().includes(q) || p.userName.toLowerCase().includes(q))
      .map((p) => ({ type: 'prayer' as const, data: p }));
    const communityResults = communities
      .filter((c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
      .map((c) => ({ type: 'community' as const, data: c }));
    return [...communityResults, ...postResults, ...prayerResults];
  }, [query, posts, prayers, communities]);

  const trendingPosts = useMemo(() => posts.slice(0, 9), [posts]);

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
        prev.map((p) =>
          p.id === person.id ? { ...p, is_following_back: !p.is_following_back } : p
        )
      );
    } finally {
      setFollowLoading((prev) => ({ ...prev, [person.id]: false }));
    }
  }, [followUser, unfollowUser]);

  const renderResult = ({ item }: { item: typeof results[0] }) => {
    if (item.type === 'community') {
      const c = item.data;
      return (
        <TouchableOpacity style={[styles.resultRow, { borderBottomColor: colors.border }]}>
          <View style={[styles.resultIcon, { backgroundColor: c.color + '22' }]}>
            <Feather name={c.iconName as any} size={22} color={c.color} />
          </View>
          <View style={styles.resultInfo}>
            <Text style={[styles.resultName, { color: colors.foreground }]}>{c.name}</Text>
            <Text style={[styles.resultSub, { color: colors.mutedForeground }]}>
              {c.members.toLocaleString()} members · Community
            </Text>
          </View>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      );
    }
    if (item.type === 'prayer') {
      const p = item.data;
      return (
        <TouchableOpacity style={[styles.resultRow, { borderBottomColor: colors.border }]}>
          <AvatarCircle initials={p.userInitials} color={p.userColor} size={44} />
          <View style={styles.resultInfo}>
            <Text style={[styles.resultName, { color: colors.foreground }]}>{p.userName}</Text>
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

  const renderPerson = ({ item }: { item: PersonResult }) => {
    const displayName = item.display_name || item.name;
    const initials = displayName.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);
    const isMe = currentUser?.id === item.id;
    const isLoadingThis = followLoading[item.id];

    return (
      <TouchableOpacity
        style={[styles.resultRow, { borderBottomColor: colors.border }]}
        onPress={() => {
          router.push({
            pathname: '/follow-list',
            params: { userId: String(item.id), type: 'followers', userName: displayName },
          });
        }}
        activeOpacity={0.8}
      >
        <AvatarCircle initials={initials} color={item.color || '#4A90A4'} size={46} />
        <View style={styles.resultInfo}>
          <Text style={[styles.resultName, { color: colors.foreground }]} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={[styles.resultSub, { color: colors.mutedForeground }]} numberOfLines={1}>
            @{item.username}
            {item.followers_count > 0 ? ` · ${item.followers_count.toLocaleString()} followers` : ''}
          </Text>
          {!!item.bio && (
            <Text style={[styles.personBio, { color: colors.mutedForeground }]} numberOfLines={1}>
              {item.bio}
            </Text>
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

  const showTabs = query.trim().length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={[styles.searchBar, { backgroundColor: colors.muted }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search people, posts, communities..."
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

      {/* Tab bar — only shown when searching */}
      {showTabs && (
        <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
          {(['Top', 'People'] as Tab[]).map((tab) => (
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

      {/* Content */}
      {!query.trim() ? (
        /* Explore / trending when no query */
        <FlatList
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: isWeb ? 34 : insets.bottom + 20 }}
          data={[{ key: 'content' }]}
          renderItem={() => (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Explore Topics</Text>
              <View style={styles.categories}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.catCard, { backgroundColor: cat.color }]}
                    activeOpacity={0.8}
                    onPress={() => { setQuery(cat.label); setActiveTab('Top'); }}
                  >
                    <Feather name={cat.icon as any} size={20} color="#fff" />
                    <Text style={styles.catLabel}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Trending Posts</Text>
              <View style={styles.grid}>
                {trendingPosts.map((post) => (
                  <TouchableOpacity key={post.id} style={styles.gridCell} activeOpacity={0.85}>
                    {post.imageIndex !== null ? (
                      <Image
                        source={POST_IMAGES[post.imageIndex % POST_IMAGES.length]}
                        style={styles.gridImg}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={[styles.gridImg, { backgroundColor: post.userColor + '44', alignItems: 'center', justifyContent: 'center' }]}>
                        <Feather name="file-text" size={24} color={post.userColor} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        />
      ) : activeTab === 'People' ? (
        /* People tab */
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
                  Try searching a different name or username
                </Text>
              </View>
            }
          />
        )
      ) : (
        /* Top tab — posts, prayers, communities */
        <FlatList
          data={results}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderResult}
          contentContainerStyle={{ paddingBottom: isWeb ? 34 : insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="search" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No results found</Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                Try searching in People for user accounts
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const CELL_SIZE = Platform.OS === 'web' ? 140 : 118;

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 13,
    position: 'relative',
  },
  tabText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    height: 3,
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  categories: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10 },
  catCard: {
    width: CELL_SIZE,
    height: 72,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  catLabel: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 3 },
  gridCell: { width: CELL_SIZE, height: CELL_SIZE },
  gridImg: { width: '100%', height: '100%', borderRadius: 6 },
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
  followBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    minWidth: 84,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 34,
  },
  followBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  emptySub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingHorizontal: 24 },
});
