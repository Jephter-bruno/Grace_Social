import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarCircle } from '@/components/AvatarCircle';
import { EditProfileModal } from '@/components/EditProfileModal';
import { POST_IMAGES } from '@/constants/images';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useColors } from '@/hooks/useColors';
import { router } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_ITEM = (SCREEN_WIDTH - 6) / 3;

type Tab = 'Posts' | 'Realms' | 'Saved' | 'Likes';
const TABS: Tab[] = ['Posts', 'Realms', 'Saved', 'Likes'];

function TwitterPost({ post, colors }: { post: any; colors: any }) {
  return (
    <View style={[styles.tweetRow, { borderBottomColor: colors.border }]}>
      <AvatarCircle initials={post.userInitials ?? 'ME'} color={post.userColor ?? '#4A90A4'} size={42} />
      <View style={styles.tweetBody}>
        <View style={styles.tweetHeader}>
          <Text style={[styles.tweetName, { color: colors.foreground }]}>{post.userName ?? 'Grace Member'}</Text>
          <Text style={[styles.tweetHandle, { color: colors.mutedForeground }]}>{post.userHandle ?? '@gracemember'}</Text>
          <Text style={[styles.tweetDot, { color: colors.mutedForeground }]}>·</Text>
          <Text style={[styles.tweetTime, { color: colors.mutedForeground }]}>{post.timestamp}</Text>
        </View>
        <Text style={[styles.tweetText, { color: colors.foreground }]}>{post.caption}</Text>
        {post.bibleVerse && (
          <View style={[styles.tweetVerse, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Text style={[styles.tweetVerseText, { color: colors.mutedForeground }]} numberOfLines={2}>
              "{post.bibleVerse.text}" — {post.bibleVerse.reference}
            </Text>
          </View>
        )}
        {post.imageIndex !== null && (
          <Image source={POST_IMAGES[post.imageIndex]} style={styles.tweetImage} contentFit="cover" />
        )}
        <View style={styles.tweetActions}>
          <TouchableOpacity style={styles.tweetAction}>
            <Feather name="message-circle" size={16} color={colors.mutedForeground} />
            <Text style={[styles.tweetActionCount, { color: colors.mutedForeground }]}>{post.comments}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tweetAction}>
            <Feather name="repeat" size={16} color={colors.mutedForeground} />
            <Text style={[styles.tweetActionCount, { color: colors.mutedForeground }]}>{Math.floor(post.likes / 4)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tweetAction}>
            <Feather name="heart" size={16} color={post.isLiked ? '#E53935' : colors.mutedForeground} />
            <Text style={[styles.tweetActionCount, { color: post.isLiked ? '#E53935' : colors.mutedForeground }]}>{post.likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tweetAction}>
            <Feather name="share-2" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { posts, reels } = useApp();
  const { currentUser, logout } = useAuth();
  const colors = useColors();
  const { isDark, toggleDark } = useTheme();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const [activeTab, setActiveTab] = useState<Tab>('Posts');
  const [editVisible, setEditVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const name = currentUser?.displayName || currentUser?.name || 'Grace Member';
  const handle = currentUser?.handle || '@gracemember';
  const bio = currentUser?.bio || '';
  const avatarUrl = currentUser?.avatarUrl || null;
  const initials = currentUser?.initials || name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2) || 'ME';
  const color = currentUser?.color || '#4A90A4';
  const followersCount = currentUser?.followersCount ?? 0;
  const followingCount = currentUser?.followingCount ?? 0;

  const myPosts = useMemo(() => posts.filter((p) => p.userId === 'currentUser'), [posts]);
  const savedPosts = useMemo(() => posts.filter((p) => p.isSaved), [posts]);
  const likedPosts = useMemo(() => posts.filter((p) => p.isLiked), [posts]);
  const mediaPosts = useMemo(() => myPosts.filter((p) => p.imageIndex !== null), [myPosts]);

  const handleToggleDark = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleDark();
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await logout();
          },
        },
      ]
    );
  };

  const renderTabContent = () => {
    if (activeTab === 'Posts') {
      if (myPosts.length === 0) return <EmptyTab icon="edit-2" message="You haven't posted yet" sub="Share your faith journey!" colors={colors} />;
      return myPosts.map((p) => <TwitterPost key={p.id} post={p} colors={colors} />);
    }
    if (activeTab === 'Realms') {
      if (reels.length === 0) return <EmptyTab icon="play-circle" message="No Realms yet" sub="Create your first Realm!" colors={colors} />;
      return (
        <View style={styles.mediaGrid}>
          {reels.slice(0, 6).map((r) => (
            <TouchableOpacity key={r.id} style={styles.mediaCell}>
              <View style={[styles.mediaImg, { backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }]}>
                <Feather name="play-circle" size={30} color="rgba(255,255,255,0.8)" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      );
    }
    if (activeTab === 'Saved') {
      if (savedPosts.length === 0) return <EmptyTab icon="bookmark" message="No saved posts yet" sub="Save posts to see them here!" colors={colors} />;
      return (
        <View style={styles.mediaGrid}>
          {savedPosts.map((p) => (
            <TouchableOpacity key={p.id} style={styles.mediaCell}>
              {p.imageIndex !== null ? (
                <Image source={POST_IMAGES[p.imageIndex]} style={styles.mediaImg} contentFit="cover" />
              ) : (
                <View style={[styles.mediaImg, { backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' }]}>
                  <Feather name="file-text" size={22} color={colors.mutedForeground} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      );
    }
    if (activeTab === 'Likes') {
      if (likedPosts.length === 0) return <EmptyTab icon="heart" message="No likes yet" sub="Like posts to see them here!" colors={colors} />;
      return likedPosts.map((p) => <TwitterPost key={p.id} post={p} colors={colors} />);
    }
    return null;
  };

  if (showSettings) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.settingsHeader, { paddingTop: isWeb ? 60 : insets.top + 16, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setShowSettings(false)} style={styles.settingsBack}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.settingsTitle, { color: colors.foreground }]}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {[
            { icon: 'user', label: 'Account', sub: 'Username, email, phone' },
            { icon: 'lock', label: 'Privacy', sub: 'Who can see your content' },
            { icon: 'shield', label: 'Security', sub: 'Password, two-factor auth' },
            { icon: 'bell', label: 'Notifications', sub: 'Push, email, SMS' },
            { icon: 'book-open', label: 'Bible', sub: 'Verses, books & daily reading' },
            { icon: 'bookmark', label: 'Saved', sub: 'Your saved posts' },
            { icon: 'archive', label: 'Archive', sub: 'Archived posts and stories' },
            { icon: 'moon', label: 'Theme', sub: isDark ? 'Dark mode' : 'Light mode', rightNode: (
              <Switch value={isDark} onValueChange={handleToggleDark} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#fff" ios_backgroundColor={colors.border} />
            )},
            { icon: 'globe', label: 'Language', sub: 'English' },
            { icon: 'help-circle', label: 'Help & Support', sub: 'FAQs, contact us' },
            { icon: 'info', label: 'About', sub: 'Version, terms, privacy' },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.settingsItem, { borderBottomColor: colors.border }]}
              onPress={() => {
                if (item.label === 'Theme') { handleToggleDark(); return; }
                if (item.label === 'Bible') { setShowSettings(false); router.push('/bible'); return; }
                Alert.alert(item.label, `${item.label} settings coming soon.`);
              }}
            >
              <View style={[styles.settingsItemIcon, { backgroundColor: colors.muted }]}>
                <Feather name={item.icon as any} size={18} color={colors.foreground} />
              </View>
              <View style={styles.settingsItemText}>
                <Text style={[styles.settingsItemLabel, { color: colors.foreground }]}>{item.label}</Text>
                <Text style={[styles.settingsItemSub, { color: colors.mutedForeground }]}>{item.sub}</Text>
              </View>
              {item.rightNode ? item.rightNode : <Feather name="chevron-right" size={18} color={colors.mutedForeground} />}
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.logoutBtn, { borderColor: '#E53935' }]} onPress={handleLogout}>
            <Feather name="log-out" size={18} color="#E53935" />
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: isWeb ? 34 : 90 }}
      >
        {/* Cover */}
        <LinearGradient
          colors={isDark ? ['#1A3040', '#0D1A10'] : [colors.primary, colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.cover, { paddingTop: isWeb ? 67 : insets.top }]}
        >
          <TouchableOpacity style={styles.settingsBtn} onPress={() => setShowSettings(true)}>
            <Feather name="settings" size={22} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>

        {/* Profile section */}
        <View style={[styles.profileSection, { backgroundColor: colors.background }]}>
          {/* Avatar + follow button row */}
          <View style={styles.avatarFollowRow}>
            <View style={[styles.avatarRing, { borderColor: colors.background }]}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={{ width: 82, height: 82, borderRadius: 41 }} contentFit="cover" />
              ) : (
                <AvatarCircle initials={initials} color={color} size={82} />
              )}
            </View>
            <TouchableOpacity style={[styles.editBtn, { borderColor: colors.border }]} onPress={() => setEditVisible(true)}>
              <Text style={[styles.editBtnText, { color: colors.foreground }]}>Edit profile</Text>
            </TouchableOpacity>
          </View>

          {/* Name + handle */}
          <Text style={[styles.name, { color: colors.foreground }]}>{name}</Text>
          <Text style={[styles.handle, { color: colors.mutedForeground }]}>{handle}</Text>

          {/* Bio */}
          {!!bio && <Text style={[styles.bio, { color: colors.foreground }]}>{bio}</Text>}

          {/* Meta row */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Feather name="calendar" size={13} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                Joined {new Date(currentUser ? Date.now() : Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{followingCount}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}> Following</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{followersCount}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}> Followers</Text>
            </TouchableOpacity>
          </View>

          {/* Dark mode toggle */}
          <View style={[styles.appearanceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.appearanceIcon, { backgroundColor: isDark ? '#3A3025' : colors.muted }]}>
              <Feather name={isDark ? 'moon' : 'sun'} size={18} color={isDark ? '#E8B94A' : '#D4A843'} />
            </View>
            <View style={styles.appearanceText}>
              <Text style={[styles.appearanceTitle, { color: colors.foreground }]}>Appearance</Text>
              <Text style={[styles.appearanceSub, { color: colors.mutedForeground }]}>{isDark ? 'Dark mode on' : 'Light mode on'}</Text>
            </View>
            <Switch value={isDark} onValueChange={handleToggleDark} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#fff" ios_backgroundColor={colors.border} />
          </View>
        </View>

        {/* Tab bar */}
        <View style={[styles.tabBar, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === tab ? colors.foreground : colors.mutedForeground },
                ]}
              >
                {tab}
              </Text>
              {activeTab === tab && (
                <View style={[styles.tabIndicator, { backgroundColor: colors.primary }]} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        <View>{renderTabContent()}</View>
      </ScrollView>

      <EditProfileModal visible={editVisible} onClose={() => setEditVisible(false)} />
    </View>
  );
}

function EmptyTab({ icon, message, sub, colors }: { icon: string; message: string; sub: string; colors: any }) {
  return (
    <View style={styles.emptyTab}>
      <Feather name={icon as any} size={36} color={colors.mutedForeground} />
      <Text style={[styles.emptyTabTitle, { color: colors.foreground }]}>{message}</Text>
      <Text style={[styles.emptyTabSub, { color: colors.mutedForeground }]}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cover: { height: 150, alignItems: 'flex-end', padding: 16 },
  settingsBtn: { padding: 8 },
  profileSection: { paddingHorizontal: 16, paddingBottom: 0 },
  avatarFollowRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: -46, marginBottom: 12 },
  avatarRing: { width: 88, height: 88, borderRadius: 44, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  editBtn: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  editBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  name: { fontSize: 20, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  handle: { fontSize: 14, fontFamily: 'Inter_400Regular', marginBottom: 10 },
  bio: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 22, marginBottom: 12 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  statsRow: { flexDirection: 'row', gap: 20, marginBottom: 16 },
  statItem: { flexDirection: 'row', alignItems: 'baseline' },
  statValue: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  appearanceCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  appearanceIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  appearanceText: { flex: 1, gap: 2 },
  appearanceTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  appearanceSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 0.5, marginTop: 2 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 14, position: 'relative' },
  tabText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  tabIndicator: { position: 'absolute', bottom: 0, left: 16, right: 16, height: 3, borderRadius: 3 },
  tweetRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14, gap: 12, borderBottomWidth: 0.5 },
  tweetBody: { flex: 1, gap: 6 },
  tweetHeader: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  tweetName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  tweetHandle: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  tweetDot: { fontSize: 13 },
  tweetTime: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  tweetText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  tweetVerse: { borderWidth: 1, borderRadius: 10, padding: 10 },
  tweetVerseText: { fontSize: 12, fontFamily: 'Inter_400Regular', fontStyle: 'italic', lineHeight: 18 },
  tweetImage: { width: '100%', height: 180, borderRadius: 12, marginTop: 4 },
  tweetActions: { flexDirection: 'row', gap: 24, marginTop: 4 },
  tweetAction: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  tweetActionCount: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, padding: 2 },
  mediaCell: { width: GRID_ITEM, height: GRID_ITEM },
  mediaImg: { width: '100%', height: '100%' },
  emptyTab: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40, gap: 12 },
  emptyTabTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  emptyTabSub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  settingsHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 0.5 },
  settingsBack: { padding: 8, width: 40 },
  settingsTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  settingsItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14, borderBottomWidth: 0.5 },
  settingsItemIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingsItemText: { flex: 1, gap: 2 },
  settingsItemLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  settingsItemSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginHorizontal: 24, marginTop: 32, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5 },
  logoutBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#E53935' },
});
