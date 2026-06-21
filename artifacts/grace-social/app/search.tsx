import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
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

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;
  const { posts, prayers, communities } = useApp();
  const [query, setQuery] = useState('');

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
              {c.members.toLocaleString()} members • Community
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
            <TouchableOpacity onPress={() => setQuery('')}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {query.trim() ? (
        <FlatList
          data={results}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderResult}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="search" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No results found</Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                Try a different search term
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: isWeb ? 34 : insets.bottom + 20 }}
        />
      ) : (
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
                  >
                    <Feather name={cat.icon as any} size={20} color="#fff" />
                    <Text style={styles.catLabel}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Trending Posts</Text>
              <View style={styles.grid}>
                {trendingPosts.map((post, i) => (
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
      )}
    </View>
  );
}

const CELL_SIZE = Platform.OS === 'web' ? 140 : 118;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingBottom: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular' },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 },
  categories: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10 },
  catCard: { width: CELL_SIZE, height: 72, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 6 },
  catLabel: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 3 },
  gridCell: { width: CELL_SIZE, height: CELL_SIZE },
  gridImg: { width: '100%', height: '100%', borderRadius: 6 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  resultIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  resultThumb: { width: 44, height: 44, borderRadius: 8 },
  resultInfo: { flex: 1, gap: 2 },
  resultName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  resultSub: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  tag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  emptySub: { fontSize: 14, fontFamily: 'Inter_400Regular' },
});
