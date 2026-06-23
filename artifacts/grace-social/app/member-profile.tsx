import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useRef } from 'react';
import {
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarCircle } from '@/components/AvatarCircle';
import { POST_IMAGES } from '@/constants/images';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 1.5;
const GRID_ITEM = (SCREEN_WIDTH - GRID_GAP * 2) / 3;

const MEMBER_BIOS: Record<string, string> = {
  '@pastorjames': 'Senior Pastor at Grace Community Church 🕊️\nWalking in faith and sharing the Word daily. Eph 2:8',
  '@sarahw': 'Daughter of the King 👑 | Worship leader\nMorning devotions every day. Phil 4:13',
  '@david_l': 'Testimony Tuesday host | Faith over fear\n"In all things God works for good." Rom 8:28',
  '@graceministry': 'Official Grace Community Church account\nEquipping believers to live out their faith 🙌',
  '@worshiphouse': 'Worship ministry at Grace Church 🎶\nHis mercies are new every morning.',
  '@thomas_b': 'Walking by faith, not by sight ✝️\nMen\'s Brotherhood leader | Prayer warrior',
  '@ruth_m': 'Intercessor | Prayer warrior 🙏\nStanding on the promises of God',
  '@mary_k': 'His grace is sufficient for me 🕊️\nWomen\'s Fellowship member',
  '@anna_p': 'Trusting His plan, one day at a time\n"For I know the plans I have for you." Jer 29:11',
};

const MEMBER_STATS: Record<string, { followers: number; following: number; posts: number }> = {
  '@pastorjames': { followers: 1842, following: 147, posts: 94 },
  '@sarahw': { followers: 534, following: 218, posts: 31 },
  '@david_l': { followers: 703, following: 192, posts: 48 },
  '@graceministry': { followers: 2410, following: 89, posts: 132 },
  '@worshiphouse': { followers: 1120, following: 65, posts: 57 },
  '@thomas_b': { followers: 289, following: 143, posts: 22 },
  '@ruth_m': { followers: 416, following: 208, posts: 37 },
  '@mary_k': { followers: 352, following: 181, posts: 29 },
  '@anna_p': { followers: 178, following: 95, posts: 14 },
};

// Which handles were followed from the very start (seeded in AppContext)
const INITIALLY_FOLLOWED = new Set(['@pastorjames', '@graceministry', '@sarahw']);

export default function MemberProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;
  const { posts, toggleFollow, isFollowingUser } = useApp();

  const params = useLocalSearchParams<{
    handle: string;
    name: string;
    initials: string;
    color: string;
    userId: string;
  }>();

  const { handle, name, initials, color, userId } = params;
  const isFollowing = isFollowingUser(handle);
  const bio = MEMBER_BIOS[handle] ?? 'Member of Grace Social community 🙏';
  const stats = MEMBER_STATS[handle] ?? { followers: 128, following: 74, posts: 12 };

  // Track follow state at mount so we can accurately adjust the displayed count
  const wasFollowingAtMount = useRef(isFollowingUser(handle)).current;
  const wasInitiallyFollowed = INITIALLY_FOLLOWED.has(handle);

  // Followers count logic:
  // - If was seeded as followed: base = stats.followers (already counted)
  //   → unfollowing = stats.followers - 1, re-following = stats.followers
  // - If NOT seeded as followed: base = stats.followers (you not counted)
  //   → following = stats.followers + 1, unfollowing = stats.followers
  const displayedFollowers = (() => {
    if (wasInitiallyFollowed) {
      return isFollowing ? stats.followers : stats.followers - 1;
    }
    return isFollowing ? stats.followers + 1 : stats.followers;
  })();

  const handleFollow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    toggleFollow(handle);
  };

  const memberPosts = useMemo(
    () => posts.filter((p) => p.userId === userId && p.imageIndex !== null),
    [posts, userId]
  );

  const renderPost = ({ item }: { item: typeof memberPosts[0] }) => (
    <View style={styles.gridItem}>
      <Image
        source={POST_IMAGES[item.imageIndex!]}
        style={styles.gridImage}
        contentFit="cover"
      />
    </View>
  );

  const ListHeader = (
    <View style={[styles.profileSection, { backgroundColor: colors.background }]}>
      {/* Avatar + stats row */}
      <View style={styles.avatarStatsRow}>
        <AvatarCircle initials={initials} color={color} size={80} />
        <View style={styles.statsGroup}>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.foreground }]}>{stats.posts}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Posts</Text>
          </View>
          <TouchableOpacity style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.foreground }]}>
              {displayedFollowers >= 1000
                ? `${(displayedFollowers / 1000).toFixed(1)}K`
                : displayedFollowers}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.foreground }]}>{stats.following}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Following</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Name + handle + bio */}
      <Text style={[styles.displayName, { color: colors.foreground }]}>{name}</Text>
      <Text style={[styles.handleText, { color: colors.mutedForeground }]}>{handle}</Text>
      {bio ? <Text style={[styles.bio, { color: colors.foreground }]}>{bio}</Text> : null}

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[
            styles.followBtn,
            isFollowing
              ? { backgroundColor: colors.muted, borderColor: colors.border, borderWidth: 1 }
              : { backgroundColor: colors.primary },
          ]}
          onPress={handleFollow}
          activeOpacity={0.75}
        >
          <Text style={[styles.followBtnText, { color: isFollowing ? colors.mutedForeground : '#fff' }]}>
            {isFollowing ? 'Following ✓' : 'Follow'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.messageBtn, { backgroundColor: colors.muted, borderColor: colors.border, borderWidth: 1 }]}
          onPress={() => router.push('/messages')}
          activeOpacity={0.75}
        >
          <Feather name="send" size={15} color={colors.foreground} />
          <Text style={[styles.messageBtnText, { color: colors.foreground }]}>Message</Text>
        </TouchableOpacity>
      </View>

      {/* Posts grid header */}
      {memberPosts.length > 0 && (
        <View style={[styles.postsHeader, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
          <Feather name="grid" size={16} color={colors.foreground} />
          <Text style={[styles.postsHeaderText, { color: colors.foreground }]}>Posts</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Navigation header */}
      <View style={[styles.navBar, { paddingTop: topPad + 4, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]} numberOfLines={1}>{name}</Text>
        <TouchableOpacity style={styles.moreBtn}>
          <Feather name="more-horizontal" size={22} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={memberPosts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        numColumns={memberPosts.length > 0 ? 3 : 1}
        key={memberPosts.length > 0 ? 'grid' : 'list'}
        columnWrapperStyle={memberPosts.length > 0 ? styles.row : undefined}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="image" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No posts yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {name} hasn't shared any image posts yet.
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: isWeb ? 24 : insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  backBtn: { padding: 6 },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  moreBtn: { padding: 6 },

  profileSection: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  avatarStatsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  statsGroup: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', paddingLeft: 24 },
  statItem: { alignItems: 'center', gap: 2 },
  statNum: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 12, fontFamily: 'Inter_400Regular' },

  displayName: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  handleText: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 8 },
  bio: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19, marginBottom: 16 },

  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  followBtn: { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  followBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  messageBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  messageBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },

  postsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    marginTop: 4,
  },
  postsHeaderText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  row: { gap: GRID_GAP },
  gridItem: { width: GRID_ITEM, height: GRID_ITEM, marginBottom: GRID_GAP },
  gridImage: { width: '100%', height: '100%' },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
});
