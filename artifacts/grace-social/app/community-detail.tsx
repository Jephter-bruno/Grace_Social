import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
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

import { AvatarCircle } from '@/components/AvatarCircle';
import { NewPostModal } from '@/components/NewPostModal';
import { PostCard } from '@/components/PostCard';
import { PendingMember, Post, PostMediaItem, useApp } from '@/context/AppContext';
import { POST_VIDEOS } from '@/constants/videos';
import { useColors } from '@/hooks/useColors';

// ─── Seed community posts (real Post shape so PostCard works) ────────────────
const SEED_POSTS: Post[] = [
  {
    id: 'cp_pin',
    userId: 'pj',
    userName: 'Pastor James',
    userHandle: '@pastorjames',
    userInitials: 'PJ',
    userColor: '#4A90A4',
    imageIndex: null,
    caption: 'Welcome to our community! This is a safe space to grow in faith together. Rejoice in hope, be patient in tribulation, be constant in prayer. 🙏',
    bibleVerse: { reference: 'Romans 12:12', text: 'Rejoice in hope, be patient in tribulation, be constant in prayer.' },
    likes: 24,
    comments: 8,
    shares: 4,
    reposts: 2,
    isLiked: false,
    isSaved: false,
    timestamp: '2h ago',
  },
  {
    id: 'cp2',
    userId: 'sm',
    userName: 'Sarah M.',
    userHandle: '@sarahm',
    userInitials: 'SM',
    userColor: '#E91E8C',
    imageIndex: 0,
    caption: 'So grateful for this group. Prayer meeting tomorrow at 7pm! Come ready to seek His face 🙌',
    likes: 18,
    comments: 5,
    shares: 2,
    reposts: 1,
    isLiked: false,
    isSaved: false,
    timestamp: '4h ago',
  },
  {
    id: 'cp3',
    userId: 'dl',
    userName: 'David L.',
    userHandle: '@davidl',
    userInitials: 'DL',
    userColor: '#27AE60',
    imageIndex: null,
    videoUri: POST_VIDEOS[0],
    caption: 'Romans 8:28 has been speaking to me this week. God is working everything for good! 🔥',
    likes: 31,
    comments: 12,
    shares: 7,
    reposts: 3,
    isLiked: false,
    isSaved: false,
    timestamp: '1d ago',
  },
  {
    id: 'cp4',
    userId: 'mk',
    userName: 'Mary K.',
    userHandle: '@maryk',
    userInitials: 'MK',
    userColor: '#9B59B6',
    imageIndex: 1,
    caption: 'Reminder: Bible study Thursday evening. Bring a friend and your Bible! ✝️',
    likes: 12,
    comments: 3,
    shares: 1,
    reposts: 0,
    isLiked: false,
    isSaved: false,
    timestamp: '2d ago',
  },
  {
    id: 'cp5',
    userId: 'ja',
    userName: 'John A.',
    userHandle: '@johnadeyemi',
    userInitials: 'JA',
    userColor: '#F39C12',
    imageIndex: null,
    mediaItems: [
      { uri: 'https://picsum.photos/seed/com-worship1/800/1000', type: 'image' } as PostMediaItem,
      { uri: 'https://picsum.photos/seed/com-worship2/800/1000', type: 'image' } as PostMediaItem,
      { uri: 'https://picsum.photos/seed/com-worship3/800/1000', type: 'image' } as PostMediaItem,
    ],
    caption: "Highlights from last Sunday's worship service 🎶 What a powerful time in the presence of God!",
    likes: 47,
    comments: 15,
    shares: 9,
    reposts: 5,
    isLiked: true,
    isSaved: false,
    timestamp: '3d ago',
  },
  {
    id: 'cp6',
    userId: 'rm',
    userName: 'Ruth M.',
    userHandle: '@ruthmensah',
    userInitials: 'RM',
    userColor: '#8E44AD',
    imageIndex: 2,
    caption: 'This community blesses me every single day. Thank you all for being the hands and feet of Jesus 💙',
    likes: 29,
    comments: 7,
    shares: 3,
    reposts: 1,
    isLiked: false,
    isSaved: false,
    timestamp: '4d ago',
  },
];

// ─── Member type ─────────────────────────────────────────────────────────────
interface CommunityMember {
  id: string;
  name: string;
  initials: string;
  color: string;
  role?: string;
}

const SEED_MEMBERS: CommunityMember[] = [
  { id: 'm1', name: 'Pastor James', initials: 'PJ', color: '#4A90A4', role: 'Admin' },
  { id: 'm2', name: 'Sarah Mitchell', initials: 'SM', color: '#E91E8C', role: 'Moderator' },
  { id: 'm3', name: 'David Livingston', initials: 'DL', color: '#27AE60' },
  { id: 'm4', name: 'Mary Kowalski', initials: 'MK', color: '#9B59B6' },
  { id: 'm5', name: 'John Adeyemi', initials: 'JA', color: '#F39C12' },
  { id: 'm6', name: 'Ruth Mensah', initials: 'RM', color: '#8E44AD' },
];

// ─── FlatList item types ──────────────────────────────────────────────────────
type ListItem =
  | { type: 'post'; data: Post }
  | { type: 'member'; data: CommunityMember }
  | { type: 'pendingMember'; data: PendingMember }
  | { type: 'about' };

type Tab = 'feed' | 'members' | 'about' | 'requests';

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function CommunityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { communities, toggleJoin, requestJoin, startOrOpenConversation, approveJoinRequest, declineJoinRequest } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;

  const community = communities.find((c) => c.id === id);

  const [activeTab, setActiveTab] = useState<Tab>('feed');
  const [showModal, setShowModal] = useState(false);
  const [communityPosts, setCommunityPosts] = useState<Post[]>(SEED_POSTS);
  const [activePostId, setActivePostId] = useState<string | null>(null);

  // Video viewability tracking — same pattern as home feed
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 55 });
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const firstVideo = viewableItems.find(
        (v) => v.item?.type === 'post' && (v.item.data as Post).videoUri
      );
      setActivePostId(firstVideo ? (firstVideo.item.data as Post).id : null);
    }
  );

  if (!community) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { marginTop: topPad + 8, marginLeft: 16 }]}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.centered}>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Community not found</Text>
        </View>
      </View>
    );
  }

  const isLocked = !!community.isPrivate && !community.isJoined;

  // ── Join / request handlers ─────────────────────────────────────────────
  const handleJoin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (community.isPrivate) {
      requestJoin(community.id);
    } else {
      toggleJoin(community.id);
    }
  };

  const handleLeave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleJoin(community.id);
  };

  // ── Join button state ────────────────────────────────────────────────────
  const joinLabel = community.isJoined
    ? 'Joined'
    : community.isPrivate
      ? community.joinRequested ? 'Requested' : 'Request to Join'
      : 'Join Community';
  const joinIcon = community.isJoined
    ? 'check'
    : community.isPrivate
      ? community.joinRequested ? 'clock' : 'lock'
      : 'plus';
  const joinBg = community.isJoined || community.joinRequested ? colors.muted : community.color;
  const joinFg = community.isJoined || community.joinRequested ? community.color : '#fff';

  // ── New post handler ─────────────────────────────────────────────────────
  const handleNewPost = useCallback((post: Omit<Post, 'id'>) => {
    const newPost: Post = { ...post, id: `cp_${Date.now()}` };
    setCommunityPosts((prev) => [newPost, ...prev]);
  }, []);

  const pendingMembers = community?.pendingMembers ?? [];
  const pendingCount = pendingMembers.length;

  // ── List data ─────────────────────────────────────────────────────────────
  const listData = useMemo<ListItem[]>(() => {
    if (isLocked || activeTab !== 'feed') {
      if (activeTab === 'members' && !isLocked) {
        return SEED_MEMBERS.map((m) => ({ type: 'member', data: m }));
      }
      if (activeTab === 'about') {
        return [{ type: 'about' }];
      }
      if (activeTab === 'requests') {
        return pendingMembers.map((m) => ({ type: 'pendingMember', data: m }));
      }
      return [];
    }
    return communityPosts.map((p) => ({ type: 'post', data: p }));
  }, [activeTab, isLocked, communityPosts, pendingMembers]);

  // ── Shared Hero + Tabs rendered as FlatList header ────────────────────────
  const ListHeader = useCallback(() => (
    <>
      {/* Hero section */}
      <View style={[styles.heroSection, { backgroundColor: community.color + '15', borderBottomColor: community.color + '30', borderBottomWidth: 1 }]}>
        <View style={[styles.communityIcon, { backgroundColor: community.color + '25' }]}>
          <Feather name={community.iconName as any} size={36} color={community.color} />
        </View>

        <View style={styles.nameBadgeRow}>
          <Text style={[styles.communityName, { color: colors.foreground }]}>{community.name}</Text>
          {community.isPrivate && (
            <View style={[styles.privateBadge, { backgroundColor: community.color + '20', borderColor: community.color + '40' }]}>
              <Feather name="lock" size={11} color={community.color} />
              <Text style={[styles.privateBadgeText, { color: community.color }]}>Private</Text>
            </View>
          )}
        </View>

        <Text style={[styles.communityDesc, { color: colors.mutedForeground }]}>{community.description}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.foreground }]}>{community.members.toLocaleString()}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Members</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.foreground }]}>{isLocked ? '—' : communityPosts.length}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Posts</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.foreground }]}>Active</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Status</Text>
          </View>
        </View>

        <View style={styles.heroButtons}>
          {community.isJoined ? (
            <TouchableOpacity
              style={[styles.joinBtn, { backgroundColor: colors.muted, borderColor: community.color }]}
              onPress={handleLeave}
            >
              <Feather name="check" size={16} color={community.color} />
              <Text style={[styles.joinText, { color: community.color }]}>Joined</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.joinBtn, { backgroundColor: joinBg, borderColor: community.color }]}
              onPress={handleJoin}
            >
              <Feather name={joinIcon as any} size={16} color={joinFg} />
              <Text style={[styles.joinText, { color: joinFg }]}>{joinLabel}</Text>
            </TouchableOpacity>
          )}

          {!isLocked ? (
            <TouchableOpacity
              style={[styles.chatBtn, { borderColor: community.color, backgroundColor: community.color + '15' }]}
              onPress={() => router.push({ pathname: '/community-chat' as any, params: { id: community.id } })}
            >
              <Feather name="message-circle" size={16} color={community.color} />
              <Text style={[styles.chatBtnText, { color: community.color }]}>Group Chat</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.chatBtn, { borderColor: colors.border, backgroundColor: colors.muted, opacity: 0.5 }]}>
              <Feather name="lock" size={16} color={colors.mutedForeground} />
              <Text style={[styles.chatBtnText, { color: colors.mutedForeground }]}>Group Chat</Text>
            </View>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        {(['feed', 'members', 'about'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && { borderBottomColor: community.color, borderBottomWidth: 2.5 }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? community.color : colors.mutedForeground }]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
        {/* Requests tab — only visible to admins of private communities */}
        {community.isAdmin && community.isPrivate && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'requests' && { borderBottomColor: community.color, borderBottomWidth: 2.5 }]}
            onPress={() => setActiveTab('requests')}
          >
            <View style={styles.tabLabelRow}>
              <Text style={[styles.tabText, { color: activeTab === 'requests' ? community.color : colors.mutedForeground }]}>
                Requests
              </Text>
              {pendingCount > 0 && (
                <View style={[styles.tabBadge, { backgroundColor: '#EF4444' }]}>
                  <Text style={styles.tabBadgeText}>{pendingCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Private gate */}
      {isLocked && (activeTab === 'feed' || activeTab === 'members') && (
        <View style={styles.gateSection}>
          <View style={[styles.gateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.gateIconWrap, { backgroundColor: community.color + '18' }]}>
              <Feather name="lock" size={32} color={community.color} />
            </View>
            <Text style={[styles.gateTitle, { color: colors.foreground }]}>
              {activeTab === 'feed' ? 'Members-Only Feed' : 'Members-Only Directory'}
            </Text>
            <Text style={[styles.gateDesc, { color: colors.mutedForeground }]}>
              {activeTab === 'feed'
                ? "The posts in this private community are only visible to approved members. Request to join to see what's being shared."
                : 'The member list for this private community is only visible to approved members. Request to join to connect with the community.'}
            </Text>
            {!community.joinRequested ? (
              <TouchableOpacity
                style={[styles.gateBtn, { backgroundColor: community.color }]}
                onPress={handleJoin}
              >
                <Feather name="user-plus" size={16} color="#fff" />
                <Text style={styles.gateBtnText}>Request to Join</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.gateBtn, { backgroundColor: colors.muted, borderWidth: 1.5, borderColor: community.color }]}>
                <Feather name="clock" size={16} color={community.color} />
                <Text style={[styles.gateBtnText, { color: community.color }]}>Request Sent — Pending Approval</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Members section label */}
      {activeTab === 'members' && !isLocked && (
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, paddingHorizontal: 16, paddingTop: 16 }]}>
          {community.members.toLocaleString()} MEMBERS
        </Text>
      )}

      {/* Requests section label */}
      {activeTab === 'requests' && (
        <View style={styles.requestsHeader}>
          <Feather name="users" size={15} color={colors.mutedForeground} />
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            {pendingCount === 0 ? 'NO PENDING REQUESTS' : `${pendingCount} PENDING REQUEST${pendingCount !== 1 ? 'S' : ''}`}
          </Text>
        </View>
      )}
    </>
  ), [activeTab, isLocked, community, colors, communityPosts.length, handleJoin, handleLeave, joinBg, joinFg, joinIcon, joinLabel]);

  // ── About content (rendered as single FlatList item) ───────────────────────
  const renderAbout = () => (
    <View style={styles.aboutSection}>
      <View style={[styles.aboutCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.aboutCardTitle, { color: colors.foreground }]}>About this Community</Text>
        <Text style={[styles.aboutCardDesc, { color: colors.mutedForeground }]}>{community.description}</Text>
      </View>
      <View style={[styles.aboutCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.aboutCardTitle, { color: colors.foreground }]}>Category</Text>
        <View style={[styles.catBadge, { backgroundColor: community.color + '18' }]}>
          <Feather name={community.iconName as any} size={14} color={community.color} />
          <Text style={[styles.catBadgeText, { color: community.color }]}>{community.category}</Text>
        </View>
      </View>
      <View style={[styles.aboutCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.aboutCardTitle, { color: colors.foreground }]}>Community Rules</Text>
        {['Be kind and respectful', 'Keep discussions faith-centered', 'No spam or self-promotion', 'Pray for one another'].map(
          (rule, i) => (
            <View key={i} style={styles.ruleRow}>
              <View style={[styles.ruleNum, { backgroundColor: community.color + '20' }]}>
                <Text style={[styles.ruleNumText, { color: community.color }]}>{i + 1}</Text>
              </View>
              <Text style={[styles.ruleText, { color: colors.foreground }]}>{rule}</Text>
            </View>
          )
        )}
      </View>
    </View>
  );

  // ── renderItem ─────────────────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === 'post') {
        return <PostCard post={item.data} isActive={item.data.id === activePostId} />;
      }
      if (item.type === 'member') {
        const member = item.data;
        return (
          <View style={[styles.memberRow, { borderBottomColor: colors.border }]}>
            <AvatarCircle initials={member.initials} color={member.color} size={44} />
            <View style={styles.memberInfo}>
              <Text style={[styles.memberName, { color: colors.foreground }]}>{member.name}</Text>
              {member.role && (
                <View style={[styles.roleBadge, { backgroundColor: community.color + '18' }]}>
                  <Text style={[styles.roleText, { color: community.color }]}>{member.role}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={() => {
                const convId = startOrOpenConversation({
                  id: member.id,
                  name: member.name,
                  initials: member.initials,
                  color: member.color,
                });
                router.push({ pathname: '/messages' as any, params: { openConvId: convId } });
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="message-circle" size={20} color={community.color} />
            </TouchableOpacity>
          </View>
        );
      }
      if (item.type === 'pendingMember') {
        const pm = item.data;
        return (
          <View style={[styles.pendingRow, { borderBottomColor: colors.border }]}>
            <AvatarCircle initials={pm.initials} color={pm.color} size={46} />
            <View style={styles.pendingInfo}>
              <Text style={[styles.memberName, { color: colors.foreground }]}>{pm.name}</Text>
              <Text style={[styles.pendingTime, { color: colors.mutedForeground }]}>Requested {pm.requestedAt}</Text>
            </View>
            <View style={styles.pendingActions}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#22C55E' }]}
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  approveJoinRequest(community.id, pm.id);
                }}
              >
                <Feather name="check" size={16} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  declineJoinRequest(community.id, pm.id);
                }}
              >
                <Feather name="x" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>
        );
      }
      // about
      return renderAbout();
    },
    [activePostId, colors, community, approveJoinRequest, declineJoinRequest]
  );

  const keyExtractor = useCallback((item: ListItem, idx: number) => {
    if (item.type === 'post') return item.data.id;
    if (item.type === 'member') return item.data.id;
    if (item.type === 'pendingMember') return `pending-${item.data.id}`;
    return `about-${idx}`;
  }, []);

  const ListFooter = useCallback(() => {
    if (activeTab === 'members' && !isLocked) {
      return (
        <Text style={[styles.moreMembersHint, { color: colors.mutedForeground }]}>
          +{(community.members - SEED_MEMBERS.length).toLocaleString()} more members
        </Text>
      );
    }
    if (activeTab === 'requests' && pendingCount === 0) {
      return (
        <View style={styles.emptyRequests}>
          <View style={[styles.emptyRequestsIcon, { backgroundColor: colors.muted }]}>
            <Feather name="check-circle" size={28} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyRequestsTitle, { color: colors.foreground }]}>All caught up!</Text>
          <Text style={[styles.emptyRequestsDesc, { color: colors.mutedForeground }]}>
            No pending join requests right now.
          </Text>
        </View>
      );
    }
    return <View style={{ height: isWeb ? 90 : insets.bottom + 88 }} />;
  }, [activeTab, isLocked, colors, community.members, isWeb, insets.bottom, pendingCount]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Sticky nav header */}
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBackBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
          {community.name}
        </Text>
        <TouchableOpacity style={styles.navIconBtn}>
          <Feather name="more-horizontal" size={22} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Main FlatList — drives the whole screen */}
      <FlatList
        data={listData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        showsVerticalScrollIndicator={false}
        viewabilityConfig={viewabilityConfig.current}
        onViewableItemsChanged={onViewableItemsChanged.current}
      />

      {/* FAB — only when feed tab is accessible */}
      {activeTab === 'feed' && !isLocked && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: community.color, bottom: (isWeb ? 34 : insets.bottom) + 70 }]}
          onPress={() => setShowModal(true)}
          activeOpacity={0.85}
        >
          <Feather name="edit-2" size={20} color="#fff" />
        </TouchableOpacity>
      )}

      {/* New Post modal — posts go into community-local state, not global feed */}
      <NewPostModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onPost={handleNewPost}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },

  // Nav header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  navBackBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: 'Inter_700Bold', marginLeft: 10 },
  navIconBtn: { padding: 4 },

  // Hero
  heroSection: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20, gap: 8 },
  communityIcon: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  nameBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  communityName: { fontSize: 22, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  privateBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  privateBadgeText: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0.3 },
  communityDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20, textAlign: 'center' },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  statItem: { alignItems: 'center', paddingHorizontal: 24 },
  statNum: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  statDivider: { width: 1, height: 32 },
  heroButtons: { flexDirection: 'row', gap: 10, marginTop: 8 },
  joinBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 11, borderWidth: 1.5 },
  joinText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  chatBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 11, borderWidth: 1.5 },
  chatBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold' },

  // Tabs
  tabs: { flexDirection: 'row', borderBottomWidth: 0.5 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 13 },
  tabText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },

  // Private gate
  gateSection: { padding: 20 },
  gateCard: { borderRadius: 20, borderWidth: 1, padding: 28, alignItems: 'center', gap: 14 },
  gateIconWrap: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  gateTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  gateDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21, textAlign: 'center' },
  gateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 24, paddingHorizontal: 24, paddingVertical: 13, marginTop: 4, minWidth: 220 },
  gateBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },

  // Members
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 0.5 },
  memberInfo: { flex: 1, gap: 4 },
  memberName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  roleBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  roleText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0.8, marginBottom: 4 },
  moreMembersHint: { textAlign: 'center', fontSize: 13, fontFamily: 'Inter_400Regular', paddingVertical: 16 },

  // About
  aboutSection: { padding: 14, gap: 12 },
  aboutCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  aboutCardTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  aboutCardDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21 },
  catBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' },
  catBadgeText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ruleNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  ruleNumText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  ruleText: { fontSize: 14, fontFamily: 'Inter_400Regular', flex: 1 },

  // FAB
  fab: { position: 'absolute', right: 20, width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 6 },

  // Requests tab badge
  tabLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  tabBadge: { minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tabBadgeText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_700Bold' },

  // Pending join requests
  requestsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 0.5 },
  pendingInfo: { flex: 1 },
  pendingTime: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  pendingActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  // Empty requests state
  emptyRequests: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32, gap: 12 },
  emptyRequestsIcon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyRequestsTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  emptyRequestsDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },

  // Unused — kept for compat
  backBtn: { padding: 4 },
});
