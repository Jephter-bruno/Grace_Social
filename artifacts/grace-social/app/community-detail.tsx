import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarCircle } from '@/components/AvatarCircle';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

const COMMUNITY_POSTS: Record<string, { id: string; userName: string; initials: string; color: string; text: string; time: string; likes: number; isPinned?: boolean }[]> = {
  default: [
    { id: 'cp1', userName: 'Pastor James', initials: 'PJ', color: '#4A90A4', text: 'Welcome to our community! This is a safe space to grow in faith together.', time: '2h ago', likes: 24, isPinned: true },
    { id: 'cp2', userName: 'Sarah M.', initials: 'SM', color: '#E91E8C', text: 'So grateful for this group. Prayer meeting tomorrow at 7pm! 🙏', time: '4h ago', likes: 18 },
    { id: 'cp3', userName: 'David L.', initials: 'DL', color: '#27AE60', text: 'Romans 8:28 has been speaking to me this week. God is working everything for good!', time: '1d ago', likes: 31 },
    { id: 'cp4', userName: 'Mary K.', initials: 'MK', color: '#9B59B6', text: 'Reminder: Bible study Thursday evening. Bring a friend!', time: '2d ago', likes: 12 },
  ],
};

const COMMUNITY_MEMBERS: Record<string, { id: string; name: string; initials: string; color: string; role?: string }[]> = {
  default: [
    { id: 'm1', name: 'Pastor James', initials: 'PJ', color: '#4A90A4', role: 'Admin' },
    { id: 'm2', name: 'Sarah Mitchell', initials: 'SM', color: '#E91E8C', role: 'Moderator' },
    { id: 'm3', name: 'David Livingston', initials: 'DL', color: '#27AE60' },
    { id: 'm4', name: 'Mary Kowalski', initials: 'MK', color: '#9B59B6' },
    { id: 'm5', name: 'John Adeyemi', initials: 'JA', color: '#F39C12' },
    { id: 'm6', name: 'Ruth Mensah', initials: 'RM', color: '#8E44AD' },
  ],
};

type Tab = 'feed' | 'members' | 'about';

export default function CommunityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { communities, toggleJoin } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;

  const community = communities.find((c) => c.id === id);
  const [activeTab, setActiveTab] = useState<Tab>('feed');
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  if (!community) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { marginTop: topPad + 8, marginLeft: 16 }]}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.centered}>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Community not found</Text>
        </View>
      </View>
    );
  }

  const posts = COMMUNITY_POSTS.default;
  const members = COMMUNITY_MEMBERS.default;

  const toggleLike = (postId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  const handleJoin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleJoin(community.id);
  };

  const pinnedPost = posts.find((p) => p.isPinned);
  const feedPosts = posts.filter((p) => !p.isPinned);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
          {community.name}
        </Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Feather name="more-horizontal" size={22} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.heroSection, { backgroundColor: community.color + '15', borderBottomColor: community.color + '30', borderBottomWidth: 1 }]}>
          <View style={[styles.communityIcon, { backgroundColor: community.color + '25' }]}>
            <Feather name={community.iconName as any} size={36} color={community.color} />
          </View>
          <Text style={[styles.communityName, { color: colors.foreground }]}>{community.name}</Text>
          <Text style={[styles.communityDesc, { color: colors.mutedForeground }]}>{community.description}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: colors.foreground }]}>{community.members.toLocaleString()}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Members</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: colors.foreground }]}>{posts.length * 7}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Posts</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: colors.foreground }]}>Active</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Status</Text>
            </View>
          </View>

          <View style={styles.heroButtons}>
            <TouchableOpacity
              style={[
                styles.joinBtn,
                { backgroundColor: community.isJoined ? colors.muted : community.color, borderColor: community.color },
              ]}
              onPress={handleJoin}
            >
              <Feather
                name={community.isJoined ? 'check' : 'plus'}
                size={16}
                color={community.isJoined ? community.color : '#fff'}
              />
              <Text style={[styles.joinText, { color: community.isJoined ? community.color : '#fff' }]}>
                {community.isJoined ? 'Joined' : 'Join Community'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chatBtn, { borderColor: community.color, backgroundColor: community.color + '15' }]}
              onPress={() => router.push({ pathname: '/community-chat' as any, params: { id: community.id } })}
            >
              <Feather name="message-circle" size={16} color={community.color} />
              <Text style={[styles.chatBtnText, { color: community.color }]}>Group Chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
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
        </View>

        {activeTab === 'feed' && (
          <View style={styles.feedSection}>
            {pinnedPost && (
              <View style={[styles.pinnedBanner, { backgroundColor: community.color + '12', borderColor: community.color + '40' }]}>
                <View style={styles.pinnedHeader}>
                  <Feather name="bookmark" size={13} color={community.color} />
                  <Text style={[styles.pinnedLabel, { color: community.color }]}>PINNED</Text>
                </View>
                <View style={styles.postRow}>
                  <AvatarCircle initials={pinnedPost.initials} color={pinnedPost.color} size={34} />
                  <View style={styles.postContent}>
                    <Text style={[styles.postUser, { color: colors.foreground }]}>{pinnedPost.userName}</Text>
                    <Text style={[styles.postText, { color: colors.foreground }]}>{pinnedPost.text}</Text>
                    <Text style={[styles.postTime, { color: colors.mutedForeground }]}>{pinnedPost.time}</Text>
                  </View>
                </View>
              </View>
            )}

            {feedPosts.map((post) => (
              <View key={post.id} style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.postRow}>
                  <AvatarCircle initials={post.initials} color={post.color} size={38} />
                  <View style={styles.postContent}>
                    <View style={styles.postTopRow}>
                      <Text style={[styles.postUser, { color: colors.foreground }]}>{post.userName}</Text>
                      <Text style={[styles.postTime, { color: colors.mutedForeground }]}>{post.time}</Text>
                    </View>
                    <Text style={[styles.postText, { color: colors.foreground }]}>{post.text}</Text>
                  </View>
                </View>
                <View style={[styles.postActions, { borderTopColor: colors.border }]}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => toggleLike(post.id)}>
                    <Feather
                      name="heart"
                      size={15}
                      color={likedPosts.has(post.id) ? '#E91E8C' : colors.mutedForeground}
                    />
                    <Text style={[styles.actionText, { color: colors.mutedForeground }]}>
                      {post.likes + (likedPosts.has(post.id) ? 1 : 0)}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn}>
                    <Feather name="message-circle" size={15} color={colors.mutedForeground} />
                    <Text style={[styles.actionText, { color: colors.mutedForeground }]}>Reply</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn}>
                    <Feather name="share-2" size={15} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'members' && (
          <View style={styles.membersSection}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              {community.members.toLocaleString()} MEMBERS
            </Text>
            {members.map((member) => (
              <View key={member.id} style={[styles.memberRow, { borderBottomColor: colors.border }]}>
                <AvatarCircle initials={member.initials} color={member.color} size={44} />
                <View style={styles.memberInfo}>
                  <Text style={[styles.memberName, { color: colors.foreground }]}>{member.name}</Text>
                  {member.role && (
                    <View style={[styles.roleBadge, { backgroundColor: community.color + '18' }]}>
                      <Text style={[styles.roleText, { color: community.color }]}>{member.role}</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity>
                  <Feather name="message-circle" size={20} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            ))}
            <Text style={[styles.moreMembersHint, { color: colors.mutedForeground }]}>
              +{(community.members - members.length).toLocaleString()} more members
            </Text>
          </View>
        )}

        {activeTab === 'about' && (
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
              {['Be kind and respectful', 'Keep discussions faith-centered', 'No spam or self-promotion', 'Pray for one another'].map((rule, i) => (
                <View key={i} style={styles.ruleRow}>
                  <View style={[styles.ruleNum, { backgroundColor: community.color + '20' }]}>
                    <Text style={[styles.ruleNumText, { color: community.color }]}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.ruleText, { color: colors.foreground }]}>{rule}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: isWeb ? 34 : insets.bottom + 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: 'Inter_700Bold', marginLeft: 10 },
  iconBtn: { padding: 4 },
  heroSection: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20, gap: 8 },
  communityIcon: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  communityName: { fontSize: 22, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  communityDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20, textAlign: 'center' },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 0 },
  statItem: { alignItems: 'center', paddingHorizontal: 24 },
  statNum: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  statDivider: { width: 1, height: 32 },
  heroButtons: { flexDirection: 'row', gap: 10, marginTop: 8 },
  joinBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 11, borderWidth: 1.5 },
  joinText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  chatBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 11, borderWidth: 1.5 },
  chatBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  tabs: { flexDirection: 'row', borderBottomWidth: 0.5 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 13 },
  tabText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  feedSection: { padding: 14, gap: 12 },
  pinnedBanner: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  pinnedHeader: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  pinnedLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0.8 },
  postCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  postRow: { flexDirection: 'row', gap: 10 },
  postContent: { flex: 1, gap: 4 },
  postTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  postUser: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  postText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  postTime: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  postActions: { flexDirection: 'row', gap: 20, paddingTop: 10, borderTopWidth: 0.5 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  membersSection: { padding: 14 },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0.8, marginBottom: 12 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 0.5 },
  memberInfo: { flex: 1, gap: 4 },
  memberName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  roleBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  roleText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  moreMembersHint: { textAlign: 'center', fontSize: 13, fontFamily: 'Inter_400Regular', paddingTop: 16 },
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
});
