import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 1.5;
const GRID_ITEM = (SCREEN_WIDTH - GRID_GAP * 2) / 3;

type Tab = 'Posts' | 'Realms' | 'Saved' | 'Liked' | 'Communities';

const TAB_ICONS: Record<Tab, string> = {
  Posts: 'grid',
  Realms: 'play-circle',
  Saved: 'bookmark',
  Liked: 'heart',
  Communities: 'users',
};

const COVER_PHOTO = 'https://picsum.photos/seed/grace-cover-faith/800/400';

type SettingsSection =
  | null
  | 'account'
  | 'privacy'
  | 'security'
  | 'notifications'
  | 'language'
  | 'help'
  | 'livechat'
  | 'about';

function SectionHeader({ title, onBack, colors }: { title: string; onBack: () => void; colors: any }) {
  return (
    <View style={[styles.subHeader, { borderBottomColor: colors.border }]}>
      <TouchableOpacity onPress={onBack} style={styles.subBackBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Feather name="arrow-left" size={22} color={colors.foreground} />
      </TouchableOpacity>
      <Text style={[styles.subTitle, { color: colors.foreground }]}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

function SettingsRow({
  icon,
  label,
  value,
  colors,
  onPress,
  rightNode,
  danger,
}: {
  icon: string;
  label: string;
  value?: string;
  colors: any;
  onPress?: () => void;
  rightNode?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.sRow, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.sRowIcon, { backgroundColor: danger ? '#E5393520' : colors.muted }]}>
        <Feather name={icon as any} size={18} color={danger ? '#E53935' : colors.foreground} />
      </View>
      <View style={styles.sRowText}>
        <Text style={[styles.sRowLabel, { color: danger ? '#E53935' : colors.foreground }]}>{label}</Text>
        {value ? <Text style={[styles.sRowValue, { color: colors.mutedForeground }]}>{value}</Text> : null}
      </View>
      {rightNode ?? (onPress ? <Feather name="chevron-right" size={18} color={colors.mutedForeground} /> : null)}
    </TouchableOpacity>
  );
}

function ToggleRow({
  icon,
  label,
  sub,
  value,
  onToggle,
  colors,
}: {
  icon: string;
  label: string;
  sub?: string;
  value: boolean;
  onToggle: () => void;
  colors: any;
}) {
  return (
    <View style={[styles.sRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.sRowIcon, { backgroundColor: colors.muted }]}>
        <Feather name={icon as any} size={18} color={colors.foreground} />
      </View>
      <View style={styles.sRowText}>
        <Text style={[styles.sRowLabel, { color: colors.foreground }]}>{label}</Text>
        {sub ? <Text style={[styles.sRowValue, { color: colors.mutedForeground }]}>{sub}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={() => { Haptics.selectionAsync(); onToggle(); }}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#fff"
        ios_backgroundColor={colors.border}
      />
    </View>
  );
}

function IgGridItem({ post, colors }: { post: any; colors: any }) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={[styles.gridCell, { backgroundColor: colors.muted }]}>
      {post.imageIndex !== null ? (
        <Image source={POST_IMAGES[post.imageIndex]} style={styles.gridCellImg} contentFit="cover" />
      ) : (
        <View style={[styles.gridCellText, { backgroundColor: colors.card }]}>
          <Feather name="align-left" size={18} color={colors.mutedForeground} style={{ marginBottom: 4 }} />
          <Text style={[styles.gridCellCaption, { color: colors.foreground }]} numberOfLines={3}>
            {post.caption}
          </Text>
        </View>
      )}
      {post.isLiked && (
        <View style={styles.gridHeartBadge}>
          <Feather name="heart" size={10} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
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

export default function ProfileScreen() {
  const { posts, reels, communities, followingCount, userProfile } = useApp();
  const { currentUser, logout } = useAuth();
  const colors = useColors();
  const { isDark, toggleDark } = useTheme();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const [activeTab, setActiveTab] = useState<Tab>('Posts');
  const joinedCommunities = communities.filter((c) => c.isJoined);
  const [editVisible, setEditVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsSection, setSettingsSection] = useState<SettingsSection>(null);

  const name = currentUser?.displayName || currentUser?.name || 'Grace Member';
  const handle = currentUser?.handle || '@gracemember';
  const bio = currentUser?.bio || '';
  const avatarUrl = currentUser?.avatarUrl || null;
  const initials = currentUser?.initials || name.split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2) || 'ME';
  const color = currentUser?.color || '#4A90A4';
  const followersCount = currentUser?.followersCount ?? 0;
  // followingCount comes from AppContext and reflects all local follows in real time

  const myPosts = useMemo(() => posts.filter((p) => p.userId === 'currentUser'), [posts]);
  const savedPosts = useMemo(() => posts.filter((p) => p.isSaved), [posts]);
  const likedPosts = useMemo(() => posts.filter((p) => p.isLiked), [posts]);
  const myReels = reels.slice(0, 9);

  const [privacy, setPrivacy] = useState({
    privateAccount: false,
    allowComments: true,
    allowMessages: true,
    showActivity: true,
    allowTags: true,
  });

  const [notifs, setNotifs] = useState({
    likes: true,
    comments: true,
    followers: true,
    prayerRequests: true,
    communityUpdates: false,
    emailDigest: false,
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<{ id: number; text: string; fromUser: boolean; time: string }[]>([
    { id: 0, text: 'Hi there! 👋 Welcome to Grace Social support. How can we help you today?', fromUser: false, time: 'just now' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatTyping, setChatTyping] = useState(false);

  const handleToggleDark = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleDark();
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await logout();
        },
      },
    ]);
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Missing fields', 'Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Too short', 'Password must be at least 8 characters.');
      return;
    }
    Alert.alert('Password updated', 'Your password has been changed successfully.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const goSettings = () => { setShowSettings(true); setSettingsSection(null); };
  const goSection = (s: SettingsSection) => { Haptics.selectionAsync(); setSettingsSection(s); };
  const backToSettings = () => setSettingsSection(null);
  const closeSettings = () => { setShowSettings(false); setSettingsSection(null); };

  const topPad = isWeb ? 60 : insets.top + 16;

  const renderTabContent = () => {
    if (activeTab === 'Posts') {
      if (myPosts.length === 0) return <EmptyTab icon="camera" message="No posts yet" sub="Share your faith journey!" colors={colors} />;
      return (
        <View style={styles.igGrid}>
          {myPosts.map((p) => <IgGridItem key={p.id} post={p} colors={colors} />)}
        </View>
      );
    }
    if (activeTab === 'Realms') {
      if (myReels.length === 0) return <EmptyTab icon="play-circle" message="No Realms yet" sub="Create your first Realm!" colors={colors} />;
      return (
        <View style={styles.igGrid}>
          {myReels.map((r) => (
            <TouchableOpacity key={r.id} style={[styles.gridCell, { backgroundColor: '#000' }]}>
              <View style={styles.gridCellImg}>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' }}>
                  <Feather name="play" size={26} color="rgba(255,255,255,0.9)" />
                </View>
              </View>
              <View style={styles.reelViewsBadge}>
                <Feather name="play" size={10} color="#fff" />
                <Text style={styles.reelViewsText}>{r.views >= 1000 ? `${(r.views / 1000).toFixed(1)}k` : r.views}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      );
    }
    if (activeTab === 'Saved') {
      if (savedPosts.length === 0) return <EmptyTab icon="bookmark" message="No saved posts yet" sub="Save posts to see them here!" colors={colors} />;
      return (
        <View style={styles.igGrid}>
          {savedPosts.map((p) => <IgGridItem key={p.id} post={p} colors={colors} />)}
        </View>
      );
    }
    if (activeTab === 'Liked') {
      if (likedPosts.length === 0) return <EmptyTab icon="heart" message="No liked posts yet" sub="Like posts to see them here!" colors={colors} />;
      return (
        <View style={styles.igGrid}>
          {likedPosts.map((p) => <IgGridItem key={p.id} post={p} colors={colors} />)}
        </View>
      );
    }
    if (activeTab === 'Communities') {
      if (joinedCommunities.length === 0) return <EmptyTab icon="users" message="No communities yet" sub="Join a community to connect with others!" colors={colors} />;
      return (
        <View style={{ paddingHorizontal: 12, paddingTop: 8, gap: 10 }}>
          {joinedCommunities.map((c) => (
            <TouchableOpacity
              key={c.id}
              activeOpacity={0.8}
              style={[styles.communityCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => Alert.alert(c.name, c.description)}
            >
              <View style={[styles.communityIconCircle, { backgroundColor: c.color + '22' }]}>
                <Feather name={c.iconName as any} size={22} color={c.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.communityName, { color: colors.foreground }]}>{c.name}</Text>
                <Text style={[styles.communitySub, { color: colors.mutedForeground }]} numberOfLines={1}>{c.description}</Text>
                <Text style={[styles.communityMembers, { color: colors.mutedForeground }]}>
                  <Feather name="users" size={11} /> {c.members.toLocaleString()} members
                </Text>
              </View>
              <View style={[styles.communityJoinedBadge, { backgroundColor: c.color + '22' }]}>
                <Text style={[styles.communityJoinedText, { color: c.color }]}>Joined</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      );
    }
    return null;
  };

  if (showSettings) {
    const headerPad = topPad;

    if (settingsSection === 'account') {
      return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.settingsHeader, { paddingTop: headerPad, borderBottomColor: colors.border }]}>
            <SectionHeader title="Account" onBack={backToSettings} colors={colors} />
          </View>
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>PROFILE INFO</Text>
            <SettingsRow icon="user" label="Display Name" value={name} colors={colors} onPress={() => { closeSettings(); setEditVisible(true); }} />
            <SettingsRow icon="at-sign" label="Username" value={handle} colors={colors} onPress={() => { closeSettings(); setEditVisible(true); }} />
            <SettingsRow icon="mail" label="Email" value={currentUser?.email || 'Not set'} colors={colors} onPress={() => Alert.alert('Change Email', 'Email change coming soon.')} />
            <SettingsRow icon="phone" label="Phone" value="Not linked" colors={colors} onPress={() => Alert.alert('Link Phone', 'Phone verification coming soon.')} />
            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>ACCOUNT</Text>
            <SettingsRow icon="download" label="Download Your Data" colors={colors} onPress={() => Alert.alert('Data Export', 'Your data export will be emailed to you within 48 hours.')} />
            <SettingsRow icon="trash-2" label="Delete Account" colors={colors} danger onPress={() =>
              Alert.alert('Delete Account', 'This will permanently delete your account and all your data. This cannot be undone.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Contact Support', 'Please contact support@gracesocial.app to complete account deletion.') },
              ])
            } />
          </ScrollView>
        </View>
      );
    }

    if (settingsSection === 'privacy') {
      return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.settingsHeader, { paddingTop: headerPad, borderBottomColor: colors.border }]}>
            <SectionHeader title="Privacy" onBack={backToSettings} colors={colors} />
          </View>
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>ACCOUNT VISIBILITY</Text>
            <ToggleRow icon="lock" label="Private Account" sub="Only approved followers can see your posts" value={privacy.privateAccount} onToggle={() => setPrivacy((p) => ({ ...p, privateAccount: !p.privateAccount }))} colors={colors} />
            <ToggleRow icon="eye" label="Show Activity Status" sub="Let others see when you were last active" value={privacy.showActivity} onToggle={() => setPrivacy((p) => ({ ...p, showActivity: !p.showActivity }))} colors={colors} />
            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>INTERACTIONS</Text>
            <ToggleRow icon="message-circle" label="Allow Comments" sub="Others can comment on your posts" value={privacy.allowComments} onToggle={() => setPrivacy((p) => ({ ...p, allowComments: !p.allowComments }))} colors={colors} />
            <ToggleRow icon="mail" label="Allow Messages" sub="Others can send you direct messages" value={privacy.allowMessages} onToggle={() => setPrivacy((p) => ({ ...p, allowMessages: !p.allowMessages }))} colors={colors} />
            <ToggleRow icon="tag" label="Allow Tags" sub="Others can mention you in posts" value={privacy.allowTags} onToggle={() => setPrivacy((p) => ({ ...p, allowTags: !p.allowTags }))} colors={colors} />
            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>DATA</Text>
            <SettingsRow icon="shield" label="Blocked Accounts" value="None blocked" colors={colors} onPress={() => Alert.alert('Blocked Accounts', 'No accounts are currently blocked.')} />
            <SettingsRow icon="slash" label="Restricted Accounts" value="None restricted" colors={colors} onPress={() => Alert.alert('Restricted Accounts', 'No accounts are currently restricted.')} />
          </ScrollView>
        </View>
      );
    }

    if (settingsSection === 'security') {
      return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.settingsHeader, { paddingTop: headerPad, borderBottomColor: colors.border }]}>
            <SectionHeader title="Security" onBack={backToSettings} colors={colors} />
          </View>
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>CHANGE PASSWORD</Text>
            <View style={[styles.pwForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.pwFieldWrap, { borderBottomColor: colors.border }]}>
                <TextInput
                  style={[styles.pwField, { color: colors.foreground }]}
                  placeholder="Current password"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showCurrentPw}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowCurrentPw((v) => !v)} style={styles.pwEye}>
                  <Feather name={showCurrentPw ? 'eye-off' : 'eye'} size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
              <View style={[styles.pwFieldWrap, { borderBottomColor: colors.border }]}>
                <TextInput
                  style={[styles.pwField, { color: colors.foreground }]}
                  placeholder="New password"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showNewPw}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowNewPw((v) => !v)} style={styles.pwEye}>
                  <Feather name={showNewPw ? 'eye-off' : 'eye'} size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
              <View style={styles.pwFieldWrap}>
                <TextInput
                  style={[styles.pwField, { color: colors.foreground }]}
                  placeholder="Confirm new password"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showNewPw}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoCapitalize="none"
                />
              </View>
            </View>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              onPress={handleChangePassword}
            >
              <Text style={styles.actionBtnText}>Update Password</Text>
            </TouchableOpacity>
            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>LOGIN SECURITY</Text>
            <SettingsRow icon="smartphone" label="Two-Factor Authentication" value="Not enabled" colors={colors} onPress={() => Alert.alert('2FA', 'Two-factor authentication coming soon.')} />
            <SettingsRow icon="list" label="Login Activity" value="View recent logins" colors={colors} onPress={() => Alert.alert('Login Activity', 'No suspicious activity detected.\n\nLast login: just now')} />
          </ScrollView>
        </View>
      );
    }

    if (settingsSection === 'notifications') {
      return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.settingsHeader, { paddingTop: headerPad, borderBottomColor: colors.border }]}>
            <SectionHeader title="Notifications" onBack={backToSettings} colors={colors} />
          </View>
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>PUSH NOTIFICATIONS</Text>
            <ToggleRow icon="heart" label="Likes" sub="When someone likes your post" value={notifs.likes} onToggle={() => setNotifs((n) => ({ ...n, likes: !n.likes }))} colors={colors} />
            <ToggleRow icon="message-circle" label="Comments" sub="When someone comments on your post" value={notifs.comments} onToggle={() => setNotifs((n) => ({ ...n, comments: !n.comments }))} colors={colors} />
            <ToggleRow icon="user-plus" label="New Followers" sub="When someone follows you" value={notifs.followers} onToggle={() => setNotifs((n) => ({ ...n, followers: !n.followers }))} colors={colors} />
            <ToggleRow icon="sun" label="Prayer Requests" sub="New prayer requests from your community" value={notifs.prayerRequests} onToggle={() => setNotifs((n) => ({ ...n, prayerRequests: !n.prayerRequests }))} colors={colors} />
            <ToggleRow icon="users" label="Community Updates" sub="Activity in communities you joined" value={notifs.communityUpdates} onToggle={() => setNotifs((n) => ({ ...n, communityUpdates: !n.communityUpdates }))} colors={colors} />
            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>EMAIL</Text>
            <ToggleRow icon="mail" label="Weekly Digest" sub="A summary of activity sent every week" value={notifs.emailDigest} onToggle={() => setNotifs((n) => ({ ...n, emailDigest: !n.emailDigest }))} colors={colors} />
          </ScrollView>
        </View>
      );
    }

    if (settingsSection === 'language') {
      const LANGUAGES = ['English', 'Spanish', 'French', 'Portuguese', 'Swahili', 'Arabic', 'Chinese (Simplified)', 'German'];
      return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.settingsHeader, { paddingTop: headerPad, borderBottomColor: colors.border }]}>
            <SectionHeader title="Language" onBack={backToSettings} colors={colors} />
          </View>
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>APP LANGUAGE</Text>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[styles.sRow, { borderBottomColor: colors.border }]}
                onPress={() => { Haptics.selectionAsync(); setSelectedLanguage(lang); }}
              >
                <View style={styles.sRowText}>
                  <Text style={[styles.sRowLabel, { color: colors.foreground }]}>{lang}</Text>
                </View>
                {selectedLanguage === lang && <Feather name="check" size={20} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      );
    }

    if (settingsSection === 'help') {
      const FAQS = [
        { q: 'How do I share a Bible verse?', a: 'When creating a post, tap "Add a Bible verse" to attach a verse from your reading.' },
        { q: 'How do I join a prayer group?', a: 'Go to the Prayer tab, tap "Prayer Groups" and browse or search for groups to join.' },
        { q: 'Can I make my account private?', a: 'Yes! Go to Settings → Privacy and enable "Private Account".' },
        { q: 'How do I follow someone?', a: 'Search for people in the Search tab → People, then tap the Follow button.' },
        { q: 'What are Realms?', a: 'Realms are short video posts — your faith journey in 60 seconds or less.' },
      ];
      return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.settingsHeader, { paddingTop: headerPad, borderBottomColor: colors.border }]}>
            <SectionHeader title="Help & Support" onBack={backToSettings} colors={colors} />
          </View>
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>FREQUENTLY ASKED</Text>
            {FAQS.map((faq, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.faqItem, { borderBottomColor: colors.border, backgroundColor: colors.background }]}
                onPress={() => { Haptics.selectionAsync(); setExpandedFaq(expandedFaq === i ? null : i); }}
              >
                <View style={styles.faqHeader}>
                  <Text style={[styles.faqQ, { color: colors.foreground }]}>{faq.q}</Text>
                  <Feather name={expandedFaq === i ? 'chevron-up' : 'chevron-down'} size={18} color={colors.mutedForeground} />
                </View>
                {expandedFaq === i && (
                  <Text style={[styles.faqA, { color: colors.mutedForeground }]}>{faq.a}</Text>
                )}
              </TouchableOpacity>
            ))}
            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>CONTACT</Text>
            <SettingsRow icon="mail" label="Email Support" value="support@gracesocial.app" colors={colors} onPress={() => Alert.alert('Email Support', 'Copy address: support@gracesocial.app')} />
            <SettingsRow icon="message-square" label="Live Chat" value="Mon–Fri, 9am–5pm EST" colors={colors} onPress={() => goSection('livechat')} />
            <SettingsRow icon="book" label="Community Guidelines" colors={colors} onPress={() => Alert.alert('Community Guidelines', 'Grace Social is a place of love, respect, and faith. Be kind, be encouraging, and honour God in all you share.')} />
          </ScrollView>
        </View>
      );
    }

    if (settingsSection === 'livechat') {
      const AUTO_REPLIES: Record<string, string> = {
        default: "Thanks for reaching out! A member of our support team will review your message shortly. In the meantime, you can check our FAQs in Help & Support.",
        prayer: "We'd love to pray with you! You can join a prayer group in the Prayer tab, or post a prayer request on your feed.",
        account: "For account issues, please go to Settings → Account where you can update your profile, email, and password.",
        verse: "You can share Bible verses in any post or Realm! Tap 'Add a Bible verse' when composing, then browse our verse library.",
        follow: "To follow someone, visit the Search tab → People, search for their name or handle, and tap Follow.",
        delete: "To delete a post, tap the '···' menu on the post and choose Delete. This action cannot be undone.",
        privacy: "Your privacy settings are in Settings → Privacy. You can set your account to Private or control who can message you.",
      };

      const handleSendChat = () => {
        if (!chatInput.trim()) return;
        const userMsg = {
          id: chatMessages.length,
          text: chatInput.trim(),
          fromUser: true,
          time: 'just now',
        };
        setChatMessages((prev) => [...prev, userMsg]);
        const q = chatInput.toLowerCase();
        setChatInput('');
        setChatTyping(true);

        setTimeout(() => {
          const replyKey = Object.keys(AUTO_REPLIES).find(
            (k) => k !== 'default' && q.includes(k)
          ) ?? 'default';
          const botMsg = {
            id: chatMessages.length + 1,
            text: AUTO_REPLIES[replyKey],
            fromUser: false,
            time: 'just now',
          };
          setChatMessages((prev) => [...prev, botMsg]);
          setChatTyping(false);
        }, 1400);
      };

      return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.settingsHeader, { paddingTop: headerPad, borderBottomColor: colors.border }]}>
            <SectionHeader title="Live Chat" onBack={() => goSection('help')} colors={colors} />
          </View>
          <View style={[styles.chatStatusBar, { backgroundColor: colors.primary + '12', borderBottomColor: colors.border }]}>
            <View style={styles.chatAgentDot} />
            <Text style={[styles.chatStatusText, { color: colors.primary }]}>
              Support is online · Mon–Fri, 9am–5pm EST
            </Text>
          </View>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {chatMessages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.chatBubbleWrap,
                  msg.fromUser ? styles.chatBubbleWrapUser : styles.chatBubbleWrapBot,
                ]}
              >
                {!msg.fromUser && (
                  <View style={[styles.chatAvatar, { backgroundColor: colors.primary }]}>
                    <Feather name="headphones" size={14} color="#fff" />
                  </View>
                )}
                <View
                  style={[
                    styles.chatBubble,
                    {
                      backgroundColor: msg.fromUser ? colors.primary : colors.card,
                      borderColor: msg.fromUser ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.chatBubbleText, { color: msg.fromUser ? '#fff' : colors.foreground }]}>
                    {msg.text}
                  </Text>
                </View>
              </View>
            ))}
            {chatTyping && (
              <View style={[styles.chatBubbleWrap, styles.chatBubbleWrapBot]}>
                <View style={[styles.chatAvatar, { backgroundColor: colors.primary }]}>
                  <Feather name="headphones" size={14} color="#fff" />
                </View>
                <View style={[styles.chatBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.chatBubbleText, { color: colors.mutedForeground, fontStyle: 'italic' }]}>
                    Support is typing…
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={[styles.chatInputRow, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
              <TextInput
                style={[styles.chatInput, { backgroundColor: colors.muted, color: colors.foreground }]}
                placeholder="Type your message…"
                placeholderTextColor={colors.mutedForeground}
                value={chatInput}
                onChangeText={setChatInput}
                onSubmitEditing={handleSendChat}
                returnKeyType="send"
                multiline
              />
              <TouchableOpacity
                style={[styles.chatSendBtn, { backgroundColor: chatInput.trim() ? colors.primary : colors.muted }]}
                onPress={handleSendChat}
                disabled={!chatInput.trim()}
              >
                <Feather name="send" size={18} color={chatInput.trim() ? '#fff' : colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      );
    }

    if (settingsSection === 'about') {
      return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.settingsHeader, { paddingTop: headerPad, borderBottomColor: colors.border }]}>
            <SectionHeader title="About" onBack={backToSettings} colors={colors} />
          </View>
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={[styles.aboutHero, { backgroundColor: colors.muted }]}>
              <View style={[styles.aboutIconWrap, { backgroundColor: colors.primary }]}>
                <Feather name="heart" size={34} color="#fff" />
              </View>
              <Text style={[styles.aboutAppName, { color: colors.foreground }]}>Grace Social</Text>
              <Text style={[styles.aboutVersion, { color: colors.mutedForeground }]}>Version 1.0.0</Text>
            </View>
            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>LEGAL</Text>
            <SettingsRow icon="file-text" label="Terms of Service" colors={colors} onPress={() => Alert.alert('Terms of Service', 'By using Grace Social you agree to use it with love, respect and integrity, honouring God and others.')} />
            <SettingsRow icon="shield" label="Privacy Policy" colors={colors} onPress={() => Alert.alert('Privacy Policy', 'We never sell your data. Your information is used solely to provide and improve Grace Social. Faith-first, always.')} />
            <SettingsRow icon="file" label="Open Source Licences" colors={colors} onPress={() => Alert.alert('Open Source', 'Grace Social is built with React Native, Expo, PostgreSQL, and many open-source libraries. Thank you to all contributors!')} />
            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>SUPPORT</Text>
            <SettingsRow icon="star" label="Rate Grace Social" colors={colors} onPress={() => Alert.alert('Rate Us', 'Thank you! Your review helps us grow the community. ⭐⭐⭐⭐⭐')} />
            <SettingsRow icon="share-2" label="Share the App" colors={colors} onPress={() => Alert.alert('Share', 'Share link: https://gracesocial.app')} />
            <Text style={[styles.aboutFooter, { color: colors.mutedForeground }]}>
              Made with ❤️ for the faith community.{'\n'}© 2026 Grace Social. All rights reserved.
            </Text>
          </ScrollView>
        </View>
      );
    }

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.settingsHeader, { paddingTop: topPad, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={closeSettings} style={styles.settingsBack}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.settingsTitle, { color: colors.foreground }]}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>PROFILE</Text>
          {[
            { icon: 'user', label: 'Account', sub: 'Username, email, phone', section: 'account' as SettingsSection },
            { icon: 'lock', label: 'Privacy', sub: 'Who can see your content', section: 'privacy' as SettingsSection },
            { icon: 'shield', label: 'Security', sub: 'Password, two-factor auth', section: 'security' as SettingsSection },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.settingsItem, { borderBottomColor: colors.border }]}
              onPress={() => goSection(item.section)}
            >
              <View style={[styles.settingsItemIcon, { backgroundColor: colors.muted }]}>
                <Feather name={item.icon as any} size={18} color={colors.foreground} />
              </View>
              <View style={styles.settingsItemText}>
                <Text style={[styles.settingsItemLabel, { color: colors.foreground }]}>{item.label}</Text>
                <Text style={[styles.settingsItemSub, { color: colors.mutedForeground }]}>{item.sub}</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}

          <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>CONTENT</Text>
          {[
            { icon: 'bell', label: 'Notifications', sub: 'Push, email, SMS', section: 'notifications' as SettingsSection },
            { icon: 'book-open', label: 'Bible', sub: 'Verses, books & daily reading', section: null as SettingsSection, action: () => { closeSettings(); router.push('/bible'); } },
            { icon: 'bookmark', label: 'Saved', sub: 'Your saved posts', section: null as SettingsSection, action: () => { closeSettings(); setActiveTab('Saved'); } },
            { icon: 'archive', label: 'Archive', sub: 'Archived posts and stories', section: null as SettingsSection, action: () => Alert.alert('Archive', 'You have no archived posts.') },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.settingsItem, { borderBottomColor: colors.border }]}
              onPress={item.action ?? (() => goSection(item.section))}
            >
              <View style={[styles.settingsItemIcon, { backgroundColor: colors.muted }]}>
                <Feather name={item.icon as any} size={18} color={colors.foreground} />
              </View>
              <View style={styles.settingsItemText}>
                <Text style={[styles.settingsItemLabel, { color: colors.foreground }]}>{item.label}</Text>
                <Text style={[styles.settingsItemSub, { color: colors.mutedForeground }]}>{item.sub}</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}

          <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>PREFERENCES</Text>
          <TouchableOpacity
            style={[styles.settingsItem, { borderBottomColor: colors.border }]}
            onPress={handleToggleDark}
          >
            <View style={[styles.settingsItemIcon, { backgroundColor: colors.muted }]}>
              <Feather name="moon" size={18} color={colors.foreground} />
            </View>
            <View style={styles.settingsItemText}>
              <Text style={[styles.settingsItemLabel, { color: colors.foreground }]}>Theme</Text>
              <Text style={[styles.settingsItemSub, { color: colors.mutedForeground }]}>{isDark ? 'Dark mode' : 'Light mode'}</Text>
            </View>
            <Switch value={isDark} onValueChange={handleToggleDark} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#fff" ios_backgroundColor={colors.border} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.settingsItem, { borderBottomColor: colors.border }]}
            onPress={() => goSection('language')}
          >
            <View style={[styles.settingsItemIcon, { backgroundColor: colors.muted }]}>
              <Feather name="globe" size={18} color={colors.foreground} />
            </View>
            <View style={styles.settingsItemText}>
              <Text style={[styles.settingsItemLabel, { color: colors.foreground }]}>Language</Text>
              <Text style={[styles.settingsItemSub, { color: colors.mutedForeground }]}>English</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>

          <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>MORE</Text>
          <TouchableOpacity
            style={[styles.settingsItem, { borderBottomColor: colors.border }]}
            onPress={() => goSection('help')}
          >
            <View style={[styles.settingsItemIcon, { backgroundColor: colors.muted }]}>
              <Feather name="help-circle" size={18} color={colors.foreground} />
            </View>
            <View style={styles.settingsItemText}>
              <Text style={[styles.settingsItemLabel, { color: colors.foreground }]}>Help & Support</Text>
              <Text style={[styles.settingsItemSub, { color: colors.mutedForeground }]}>FAQs, contact us</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.settingsItem, { borderBottomColor: colors.border }]}
            onPress={() => goSection('about')}
          >
            <View style={[styles.settingsItemIcon, { backgroundColor: colors.muted }]}>
              <Feather name="info" size={18} color={colors.foreground} />
            </View>
            <View style={styles.settingsItemText}>
              <Text style={[styles.settingsItemLabel, { color: colors.foreground }]}>About</Text>
              <Text style={[styles.settingsItemSub, { color: colors.mutedForeground }]}>Version 1.0.0, terms, privacy</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.logoutBtn, { borderColor: '#E53935' }]} onPress={handleLogout}>
            <Feather name="log-out" size={18} color="#E53935" />
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Info chips derived from userProfile
  const churchChip = userProfile.location || 'Grace City Church';
  const faithYear = userProfile.joined
    ? userProfile.joined.replace(/\D+/g, '').slice(0, 4) || '2024'
    : '2024';
  const verseChip = bio.match(/([1-3]?\s?[A-Z][a-z]+\.?\s?\d+:\d+)/)?.[0] ?? 'Phil 4:13';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Header bar: Profile + gear ── */}
      <View style={[styles.profileHeader, { paddingTop: isWeb ? 16 : insets.top, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.profileHeaderTitle, { color: colors.foreground }]}>Profile</Text>
        <TouchableOpacity onPress={goSettings} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="settings" size={22} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: isWeb ? 34 : 100 }}>

        {/* ── Cover photo ── */}
        <View style={styles.coverContainer}>
          <Image
            source={{ uri: COVER_PHOTO }}
            style={styles.coverImage}
            contentFit="cover"
          />
        </View>

        {/* ── Avatar + action buttons (overlapping cover) ── */}
        <View style={styles.avatarActionRow}>
          {/* Avatar circle with camera badge */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setEditVisible(true)}
            style={[styles.avatarOuterRing, { borderColor: colors.background, backgroundColor: color }]}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={{ width: 84, height: 84, borderRadius: 42 }} contentFit="cover" />
            ) : (
              <AvatarCircle initials={initials} color={color} size={84} />
            )}
            {/* Camera badge */}
            <View style={[styles.cameraBadge, { borderColor: colors.background }]}>
              <Feather name="camera" size={11} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Edit + Share buttons */}
          <View style={styles.profileActionBtns}>
            <TouchableOpacity
              style={styles.editProfileBtn}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setEditVisible(true); }}
            >
              <Text style={[styles.editProfileBtnText, { color: colors.foreground }]}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.shareProfileBtn, { borderColor: colors.foreground }]}
              onPress={() => Alert.alert('Share Profile', `Profile link: https://gracesocial.app/${handle.replace('@', '')}`)}
            >
              <Text style={[styles.shareProfileBtnText, { color: colors.foreground }]}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Name + handle + bio ── */}
        <View style={styles.profileInfoSection}>
          <Text style={[styles.profileFullName, { color: colors.foreground }]}>{name}</Text>
          <Text style={[styles.profileHandle, { color: colors.mutedForeground }]}>{handle}</Text>
          {!!bio ? (
            <Text style={[styles.profileBio, { color: colors.foreground }]}>{bio}</Text>
          ) : (
            <Text style={[styles.profileBioPlaceholder, { color: colors.mutedForeground }]}>
              Add a bio to tell your faith story…
            </Text>
          )}
        </View>

        {/* ── Stats row ── */}
        <View style={[styles.statsRow, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.foreground }]}>{myPosts.length}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Posts</Text>
          </TouchableOpacity>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <TouchableOpacity
            style={styles.statItem}
            onPress={() => {
              if (!currentUser) return;
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({ pathname: '/follow-list', params: { userId: String(currentUser.id), type: 'followers', userName: name } });
            }}
          >
            <Text style={[styles.statNumber, { color: colors.foreground }]}>
              {followersCount >= 1000 ? `${(followersCount / 1000).toFixed(1)}k` : followersCount}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Followers</Text>
          </TouchableOpacity>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <TouchableOpacity
            style={styles.statItem}
            onPress={() => {
              if (!currentUser) return;
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({ pathname: '/follow-list', params: { userId: String(currentUser.id), type: 'following', userName: name } });
            }}
          >
            <Text style={[styles.statNumber, { color: colors.foreground }]}>
              {followingCount >= 1000 ? `${(followingCount / 1000).toFixed(1)}k` : followingCount}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Following</Text>
          </TouchableOpacity>
        </View>

        {/* ── Info chips row ── */}
        <View style={styles.chipsRow}>
          <View style={[styles.chip, { backgroundColor: colors.muted }]}>
            <Feather name="map-pin" size={11} color={colors.mutedForeground} />
            <Text style={[styles.chipText, { color: colors.foreground }]}>{churchChip}</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: colors.muted }]}>
            <Feather name="calendar" size={11} color={colors.mutedForeground} />
            <Text style={[styles.chipText, { color: colors.foreground }]}>Faith since {faithYear}</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: colors.muted }]}>
            <Feather name="book-open" size={11} color={colors.mutedForeground} />
            <Text style={[styles.chipText, { color: colors.foreground }]}>{verseChip}</Text>
          </View>
        </View>

        {/* ── Tab bar: Posts | Realms | Saved | Liked | Communities ── */}
        <View style={[styles.profileTabBar, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
          {(['Posts', 'Realms', 'Saved', 'Liked', 'Communities'] as Tab[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={styles.profileTabItem}
                onPress={() => { Haptics.selectionAsync(); setActiveTab(tab); }}
                activeOpacity={0.7}
              >
                <Feather
                  name={TAB_ICONS[tab] as any}
                  size={18}
                  color={isActive ? colors.primary : colors.mutedForeground}
                />
                <Text style={[styles.profileTabLabel, { color: isActive ? colors.primary : colors.mutedForeground, fontFamily: isActive ? 'Inter_600SemiBold' : 'Inter_400Regular' }]}>
                  {tab}
                </Text>
                {isActive && <View style={[styles.profileTabIndicator, { backgroundColor: colors.primary }]} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Tab Content ── */}
        <View style={{ minHeight: 200 }}>{renderTabContent()}</View>
      </ScrollView>

      <EditProfileModal visible={editVisible} onClose={() => setEditVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── Header ──
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  profileHeaderTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },

  // ── Cover photo ──
  coverContainer: {
    width: '100%',
    height: 170,
    backgroundColor: '#1a2535',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },

  // ── Avatar + action buttons row ──
  avatarActionRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginTop: -46,
    marginBottom: 14,
  },
  avatarOuterRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 3.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    position: 'relative',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E8724A',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileActionBtns: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 6,
    paddingLeft: 12,
  },
  editProfileBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  editProfileBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  shareProfileBtn: {
    paddingVertical: 7,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  shareProfileBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },

  // ── Name / handle / bio ──
  profileInfoSection: {
    paddingHorizontal: 16,
    gap: 3,
    marginBottom: 16,
  },
  profileFullName: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    lineHeight: 24,
  },
  profileHandle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 4,
  },
  profileBio: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 21,
  },
  profileBioPlaceholder: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 21,
    fontStyle: 'italic',
  },

  // ── Stats row ──
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    marginHorizontal: 16,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statNumber: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    lineHeight: 26,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  statDivider: {
    width: 0.5,
    height: 32,
  },

  // ── Info chips ──
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },

  // ── Profile tab bar (5 tabs with labels) ──
  profileTabBar: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
  },
  profileTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 3,
    position: 'relative',
  },
  profileTabLabel: {
    fontSize: 10,
    lineHeight: 13,
  },
  profileTabIndicator: {
    position: 'absolute',
    top: 0,
    left: 8,
    right: 8,
    height: 2,
    borderRadius: 2,
  },

  // ── Communities tab ──
  communityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 0.5,
  },
  communityIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  communityName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 1,
  },
  communitySub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 17,
  },
  communityMembers: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  communityJoinedBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    flexShrink: 0,
  },
  communityJoinedText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },

  igGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    padding: 0,
  },
  gridCell: {
    width: GRID_ITEM,
    height: GRID_ITEM,
    overflow: 'hidden',
    position: 'relative',
  },
  gridCellImg: {
    width: '100%',
    height: '100%',
  },
  gridCellText: {
    width: '100%',
    height: '100%',
    padding: 10,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  gridCellCaption: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
  },
  gridHeartBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(229,57,53,0.85)',
    borderRadius: 8,
    padding: 3,
  },
  reelViewsBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  reelViewsText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },

  emptyTab: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40, gap: 12 },
  emptyTabTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  emptyTabSub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },

  settingsHeader: { borderBottomWidth: 0.5 },
  settingsBack: { padding: 8, width: 40 },
  settingsTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  settingsItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14, borderBottomWidth: 0.5 },
  settingsItemIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingsItemText: { flex: 1, gap: 2 },
  settingsItemLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  settingsItemSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginHorizontal: 24, marginTop: 32, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5 },
  logoutBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#E53935' },
  subHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 0.5 },
  subBackBtn: { padding: 4, width: 40 },
  subTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  groupLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8, paddingHorizontal: 16, paddingTop: 22, paddingBottom: 6 },
  sRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14, borderBottomWidth: 0.5 },
  sRowIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sRowText: { flex: 1, gap: 2 },
  sRowLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  sRowValue: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  pwForm: { marginHorizontal: 16, borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginTop: 4 },
  pwFieldWrap: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 0.5 },
  pwField: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', paddingHorizontal: 14, paddingVertical: 13 },
  pwEye: { paddingHorizontal: 14 },
  actionBtn: { marginHorizontal: 16, marginTop: 14, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  faqItem: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5 },
  faqHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  faqQ: { flex: 1, fontSize: 14, fontFamily: 'Inter_600SemiBold', lineHeight: 20 },
  faqA: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20, marginTop: 8 },
  chatStatusBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 0.5 },
  chatAgentDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#27AE60' },
  chatStatusText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  chatBubbleWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  chatBubbleWrapUser: { justifyContent: 'flex-end' },
  chatBubbleWrapBot: { justifyContent: 'flex-start' },
  chatAvatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  chatBubble: { maxWidth: '78%', borderRadius: 18, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  chatBubbleText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21 },
  chatInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12, borderTopWidth: 0.5 },
  chatInput: { flex: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, fontFamily: 'Inter_400Regular', maxHeight: 100 },
  chatSendBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  aboutHero: { alignItems: 'center', paddingVertical: 32, gap: 10, marginBottom: 8 },
  aboutIconWrap: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  aboutAppName: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  aboutVersion: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  aboutFooter: { textAlign: 'center', fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20, paddingHorizontal: 32, paddingTop: 32 },
});
