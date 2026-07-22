import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdCard } from '@/components/AdCard';
import { DailyVerseCard } from '@/components/DailyVerseCard';
import { HomePrayerWall } from '@/components/HomePrayerWall';
import { NewPostModal } from '@/components/NewPostModal';
import { PostCard } from '@/components/PostCard';
import { RealmSpotlight } from '@/components/RealmSpotlight';
import { StoryBar } from '@/components/StoryBar';
import { SuggestedCommunities } from '@/components/SuggestedCommunities';
import { SuggestedPeopleCard } from '@/components/SuggestedPeopleCard';
import { Post, useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { useEffect } from 'react';

type FeedItem =
  | { type: 'post'; data: Post }
  | { type: 'ad'; adIndex: number }
  | { type: 'realms' }
  | { type: 'communities' }
  | { type: 'prayerwall' };

// Inject the three discovery sections between posts at fixed positions
const SECTION_AT: Record<number, FeedItem['type']> = {
  1: 'realms',       // after 2nd post
  3: 'communities',  // after 4th post
  5: 'prayerwall',   // after 6th post
};

function buildFeed(posts: Post[], adEvery = 3): FeedItem[] {
  const result: FeedItem[] = [];
  let adCount = 0;
  posts.forEach((post, i) => {
    result.push({ type: 'post', data: post });
    // Discovery sections injected at specific post indices
    if (SECTION_AT[i]) {
      result.push({ type: SECTION_AT[i] } as FeedItem);
    } else if ((i + 1) % adEvery === 0) {
      // Skip ad on rows that already have a discovery section
      result.push({ type: 'ad', adIndex: adCount++ });
    }
  });
  return result;
}

export default function HomeScreen() {
  const { posts, stories, unreadCount, pendingVerse, setPendingVerse } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;
  const [showModal, setShowModal] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);

  useEffect(() => {
    if (pendingVerse) {
      setShowModal(true);
    }
  }, [pendingVerse]);

  const handleModalClose = () => {
    setShowModal(false);
    setPendingVerse(null);
  };

  const feedItems = useMemo(() => buildFeed(posts, 3), [posts]);

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 55 });

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const firstVideoItem = viewableItems.find(
        (v) => v.item?.type === 'post' && (v.item as FeedItem & { type: 'post' }).data.videoUri
      );
      setActivePostId(
        firstVideoItem ? (firstVideoItem.item as FeedItem & { type: 'post' }).data.id : null
      );
    }
  );

  const renderItem = useCallback(
    ({ item }: { item: FeedItem }) => {
      if (item.type === 'ad') return <AdCard index={item.adIndex} />;
      if (item.type === 'realms') return <RealmSpotlight />;
      if (item.type === 'communities') return <SuggestedCommunities />;
      if (item.type === 'prayerwall') return <HomePrayerWall />;
      return <PostCard post={item.data} isActive={item.data.id === activePostId} />;
    },
    [activePostId]
  );

  const renderHeader = useCallback(
    () => (
      <>
        <StoryBar />
        <DailyVerseCard />
        <SuggestedPeopleCard />
      </>
    ),
    [stories]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 8, backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.logoGrace, { color: colors.foreground }]}>Grace</Text>
        <Text style={[styles.logoSocial, { color: colors.accent }]}>Social</Text>
        <View style={styles.spacer} />
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/search')}>
          <Feather name="search" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/messages')}>
          <Feather name="send" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/notifications')}>
          <Feather name="bell" size={24} color={colors.foreground} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={feedItems}
        keyExtractor={(item, idx) =>
          item.type === 'ad'
            ? `ad-${item.adIndex}`
            : item.type === 'realms' || item.type === 'communities' || item.type === 'prayerwall'
            ? `${item.type}-${idx}`
            : item.data.id
        }
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: isWeb ? 90 : insets.bottom + 88 }}
        viewabilityConfig={viewabilityConfig.current}
        onViewableItemsChanged={onViewableItemsChanged.current}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, bottom: (isWeb ? 34 : insets.bottom) + 70 }]}
        onPress={() => setShowModal(true)}
        activeOpacity={0.85}
      >
        <Feather name="edit-2" size={20} color="#fff" />
      </TouchableOpacity>

      <NewPostModal visible={showModal} onClose={handleModalClose} initialVerse={pendingVerse} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5 },
  logoGrace: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  logoSocial: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  spacer: { flex: 1 },
  iconBtn: { padding: 6, marginLeft: 8, position: 'relative' },
  badge: { position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#E53935', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#fff', fontSize: 9, fontFamily: 'Inter_700Bold', lineHeight: 12 },
  fab: { position: 'absolute', right: 20, width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 6 },
});
