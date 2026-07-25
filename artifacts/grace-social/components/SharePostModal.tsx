import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Modal,
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
import { Post, useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';

// ── Static DM contacts (mirrors messages.tsx INITIAL_CONVERSATIONS) ──────────
const DM_CONTACTS = [
  { id: '1', name: 'Pastor James',    initials: 'PJ', color: '#4A90A4', avatarUrl: 'https://i.pravatar.cc/150?img=12', status: 'Active now' },
  { id: '2', name: 'Grace Community', initials: 'GC', color: '#27AE60', avatarUrl: 'https://i.pravatar.cc/150?img=32', status: 'Active yesterday' },
  { id: '3', name: 'Sarah M.',        initials: 'SM', color: '#E91E8C', avatarUrl: 'https://i.pravatar.cc/150?img=47', status: 'Active 2h ago' },
  { id: '4', name: 'Youth Group',     initials: 'YG', color: '#9C27B0', avatarUrl: 'https://i.pravatar.cc/150?img=60', status: 'Active 5h ago' },
];

const ACCENT = '#9B30E8';

interface Props {
  visible: boolean;
  post: Post;
  onClose: () => void;
  onShareCountIncrement: () => void;
}

// ── Recipient row ─────────────────────────────────────────────────────────────
interface RecipientRowProps {
  avatar: React.ReactNode;
  name: string;
  subtitle: string;
  sent: boolean;
  onSend: () => void;
}

function RecipientRow({ avatar, name, subtitle, sent, onSend }: RecipientRowProps) {
  return (
    <View style={r.row}>
      <View style={r.avatarWrap}>{avatar}</View>
      <View style={r.meta}>
        <Text style={r.name} numberOfLines={1}>{name}</Text>
        <Text style={r.sub} numberOfLines={1}>{subtitle}</Text>
      </View>
      <TouchableOpacity
        style={[r.btn, sent && r.btnSent]}
        onPress={onSend}
        disabled={sent}
        activeOpacity={0.75}
      >
        {sent ? (
          <View style={r.sentInner}>
            <Feather name="check" size={13} color={ACCENT} />
            <Text style={r.sentLabel}>Sent</Text>
          </View>
        ) : (
          <Text style={r.sendLabel}>Send</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const r = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10, gap: 12,
  },
  avatarWrap: { width: 46, height: 46, borderRadius: 23, overflow: 'hidden' },
  meta: { flex: 1, gap: 2 },
  name: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  sub:  { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.45)' },
  btn: {
    backgroundColor: ACCENT,
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7,
    minWidth: 60, alignItems: 'center', justifyContent: 'center',
  },
  btnSent: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  sendLabel: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  sentInner: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sentLabel: { color: ACCENT, fontSize: 13, fontFamily: 'Inter_600SemiBold' },
});

// ── Section header ─────────────────────────────────────────────────────────────
function Section({ title }: { title: string }) {
  return (
    <Text style={sec.title}>{title}</Text>
  );
}
const sec = StyleSheet.create({
  title: {
    fontSize: 12, fontFamily: 'Inter_600SemiBold',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: 16, paddingTop: 18, paddingBottom: 6,
  },
});

// ── Community icon ─────────────────────────────────────────────────────────────
function CommunityAvatar({ color, iconName }: { color: string; iconName: string }) {
  return (
    <View style={[ca.wrap, { backgroundColor: color + '33', borderColor: color + '55' }]}>
      <Feather name={iconName as any} size={20} color={color} />
    </View>
  );
}
const ca = StyleSheet.create({
  wrap: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
});

// ── Main modal ────────────────────────────────────────────────────────────────
export function SharePostModal({ visible, post, onClose, onShareCountIncrement }: Props) {
  const insets = useSafeAreaInsets();
  const { communities } = useApp();
  const { currentUser } = useAuth();

  const [query, setQuery] = useState('');
  const [sentSet, setSentSet] = useState<Set<string>>(new Set());
  const [sharedOnce, setSharedOnce] = useState(false);

  const markSent = (key: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setSentSet((prev) => new Set([...prev, key]));
    if (!sharedOnce) {
      setSharedOnce(true);
      onShareCountIncrement();
    }
  };

  const handleClose = () => {
    setQuery('');
    setSentSet(new Set());
    setSharedOnce(false);
    onClose();
  };

  const q = query.toLowerCase();

  const filteredDMs = useMemo(
    () => DM_CONTACTS.filter((c) => !q || c.name.toLowerCase().includes(q)),
    [q]
  );

  const joinedCommunities = useMemo(
    () => communities.filter((c) => c.isJoined && (!q || c.name.toLowerCase().includes(q))),
    [communities, q]
  );

  const allCommunities = useMemo(
    () => communities.filter((c) => !q || c.name.toLowerCase().includes(q)),
    [communities, q]
  );

  const captionPreview = post.caption.length > 80
    ? post.caption.slice(0, 77) + '…'
    : post.caption;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[s.root, { paddingBottom: insets.bottom + 12 }]}>

        {/* ── Handle + header ── */}
        <View style={s.topBar}>
          <View style={s.handle} />
        </View>
        <View style={s.header}>
          <Text style={s.headerTitle}>Share post</Text>
          <TouchableOpacity style={s.closeBtn} onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Feather name="x" size={20} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>

        {/* ── Post preview ── */}
        <View style={s.postPreview}>
          <AvatarCircle
            initials={post.userInitials}
            color={post.userColor}
            size={34}
          />
          <View style={s.previewText}>
            <Text style={s.previewHandle} numberOfLines={1}>
              {post.userHandle.replace('@', '')}
            </Text>
            <Text style={s.previewCaption} numberOfLines={2}>
              {captionPreview}
            </Text>
          </View>
          {/* Thumbnail */}
          {(post.localImageUri || (post.mediaItems && post.mediaItems[0]?.type === 'image')) && (
            <Image
              source={{ uri: post.localImageUri ?? post.mediaItems?.[0]?.uri }}
              style={s.previewThumb}
              contentFit="cover"
            />
          )}
        </View>

        {/* ── Search ── */}
        <View style={s.searchWrap}>
          <Feather name="search" size={16} color="rgba(255,255,255,0.4)" style={s.searchIcon} />
          <TextInput
            style={s.searchInput}
            placeholder="Search people and communities…"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x-circle" size={16} color="rgba(255,255,255,0.35)" />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Scrollable recipient list ── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={s.list}
        >
          {/* Direct Messages */}
          {filteredDMs.length > 0 && (
            <>
              <Section title="Direct Messages" />
              {filteredDMs.map((contact) => (
                <RecipientRow
                  key={`dm-${contact.id}`}
                  avatar={
                    <Image
                      source={{ uri: contact.avatarUrl }}
                      style={{ width: 46, height: 46, borderRadius: 23 }}
                      contentFit="cover"
                    />
                  }
                  name={contact.name}
                  subtitle={contact.status}
                  sent={sentSet.has(`dm-${contact.id}`)}
                  onSend={() => markSent(`dm-${contact.id}`)}
                />
              ))}
            </>
          )}

          {/* Community Chats */}
          {joinedCommunities.length > 0 && (
            <>
              <Section title="Community Chats" />
              {joinedCommunities.map((comm) => (
                <RecipientRow
                  key={`chat-${comm.id}`}
                  avatar={<CommunityAvatar color={comm.color} iconName={comm.iconName} />}
                  name={comm.name}
                  subtitle={`${comm.members.toLocaleString()} members · Chat`}
                  sent={sentSet.has(`chat-${comm.id}`)}
                  onSend={() => {
                    markSent(`chat-${comm.id}`);
                  }}
                />
              ))}
            </>
          )}

          {/* Community Pages */}
          {allCommunities.length > 0 && (
            <>
              <Section title="Community Pages" />
              {allCommunities.map((comm) => (
                <RecipientRow
                  key={`page-${comm.id}`}
                  avatar={<CommunityAvatar color={comm.color} iconName={comm.iconName} />}
                  name={comm.name}
                  subtitle={`${comm.members.toLocaleString()} members · Page`}
                  sent={sentSet.has(`page-${comm.id}`)}
                  onSend={() => {
                    markSent(`page-${comm.id}`);
                  }}
                />
              ))}
            </>
          )}

          {/* Empty state */}
          {filteredDMs.length === 0 && joinedCommunities.length === 0 && allCommunities.length === 0 && (
            <View style={s.empty}>
              <Feather name="search" size={32} color="rgba(255,255,255,0.2)" />
              <Text style={s.emptyText}>No results for "{query}"</Text>
            </View>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* ── Done button — appears once at least one recipient has been sent to ── */}
        {sentSet.size > 0 && (
          <TouchableOpacity style={s.doneBtn} onPress={handleClose} activeOpacity={0.85}>
            <Text style={s.doneBtnText}>
              Done · Sent to {sentSet.size} {sentSet.size === 1 ? 'recipient' : 'recipients'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  topBar: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: 'Inter_700Bold', color: '#fff' },
  closeBtn: { padding: 4 },

  // Post preview
  postPreview: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    margin: 16,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)',
  },
  previewText: { flex: 1, gap: 2 },
  previewHandle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#fff' },
  previewCaption: { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.55)', lineHeight: 17 },
  previewThumb: { width: 44, height: 44, borderRadius: 8 },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 4,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    gap: 8,
  },
  searchIcon: {},
  searchInput: {
    flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', color: '#fff',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },

  list: { flex: 1 },

  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 10 },
  emptyText: { color: 'rgba(255,255,255,0.3)', fontSize: 14, fontFamily: 'Inter_400Regular' },

  // Done CTA
  doneBtn: {
    margin: 16, marginTop: 8,
    backgroundColor: ACCENT,
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  doneBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
});
