import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  text: string;
  fromMe: boolean;
  time: string;
  replyTo?: string; // original message text this is a reply to
}

interface Conversation {
  id: string;
  userName: string;
  userInitials: string;
  userColor: string;
  avatarUrl?: string;
  status: string;
  lastMessage: string;
  time: string;
  unread: number;
  messages: Message[];
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    userName: 'Pastor James',
    userInitials: 'PJ',
    userColor: '#4A90A4',
    avatarUrl: 'https://i.pravatar.cc/150?img=12',
    status: 'Active now',
    lastMessage: 'Blessings! See you Sunday 🙏',
    time: '9:32 AM',
    unread: 2,
    messages: [
      { id: 'm1', text: 'Hello, how are you doing today?', fromMe: false, time: '9:20 AM' },
      { id: 'm2', text: 'Doing great, thank you Pastor!', fromMe: true, time: '9:25 AM' },
      { id: 'm3', text: 'Praise the Lord! Keep the faith strong 🙏', fromMe: false, time: '9:28 AM' },
      { id: 'm4', text: 'Always do!', fromMe: true, time: '9:30 AM', replyTo: 'Praise the Lord! Keep the faith strong 🙏' },
      { id: 'm5', text: 'Blessings! See you Sunday 🙏', fromMe: false, time: '9:32 AM' },
    ],
  },
  {
    id: '2',
    userName: 'Grace Community',
    userInitials: 'GC',
    userColor: '#27AE60',
    avatarUrl: 'https://i.pravatar.cc/150?img=32',
    status: 'Active yesterday',
    lastMessage: 'Prayer meeting tonight at 7pm',
    time: 'Yesterday',
    unread: 0,
    messages: [
      { id: 'm1', text: 'Welcome to Grace Community!', fromMe: false, time: 'Mon' },
      { id: 'm2', text: 'Thank you, glad to be here!', fromMe: true, time: 'Mon' },
      { id: 'm3', text: 'Prayer meeting tonight at 7pm', fromMe: false, time: 'Yesterday' },
      { id: 'm4', text: 'I will be there 🙏', fromMe: true, time: 'Yesterday', replyTo: 'Prayer meeting tonight at 7pm' },
    ],
  },
  {
    id: '3',
    userName: 'Sarah M.',
    userInitials: 'SM',
    userColor: '#E91E8C',
    avatarUrl: 'https://i.pravatar.cc/150?img=47',
    status: 'Active 2 hours ago',
    lastMessage: 'Amen! 🙌',
    time: 'Monday',
    unread: 0,
    messages: [
      { id: 'm1', text: 'Your prayer was so moving today', fromMe: false, time: 'Monday' },
      { id: 'm2', text: 'Thank you so much! It came from the heart ❤️', fromMe: true, time: 'Monday' },
      { id: 'm3', text: 'You could tell! Really touched my soul', fromMe: false, time: 'Monday' },
      { id: 'm4', text: 'Amen! 🙌', fromMe: false, time: 'Monday' },
    ],
  },
  {
    id: '4',
    userName: 'Youth Group',
    userInitials: 'YG',
    userColor: '#9C27B0',
    avatarUrl: 'https://i.pravatar.cc/150?img=60',
    status: 'Active 5 hours ago',
    lastMessage: "Don't forget the retreat next weekend!",
    time: 'Sunday',
    unread: 1,
    messages: [
      { id: 'm1', text: "Don't forget the retreat next weekend!", fromMe: false, time: 'Sunday' },
      { id: 'm2', text: "Can't wait, already packed! 🏕️", fromMe: true, time: 'Sunday', replyTo: "Don't forget the retreat next weekend!" },
    ],
  },
];

// ─── Colours ──────────────────────────────────────────────────────────────────

const C = {
  bg: '#0D0D0D',
  surface: '#1A1A1A',
  inputBg: '#1C1C1E',
  border: '#2A2A2A',
  sentBubble: '#9B30E8',     // purple (Messenger-style)
  recvBubble: '#2C2C2E',     // dark grey
  replyBg: '#1E1E20',        // darker quote bubble
  text: '#FFFFFF',
  sub: '#8E8E93',
  placeholder: '#636366',
  headerIcon: '#EBEBF5',
  cameraBtn: '#3A8DFF',
};

// ─── Conversation view ────────────────────────────────────────────────────────

function ConversationView({
  conv,
  onBack,
}: {
  conv: Conversation;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 56 : insets.top;
  const botPad = isWeb ? 16 : insets.bottom;
  const { currentUser } = useAuth();

  const [messages, setMessages] = useState<Message[]>(conv.messages);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), text: t, fromMe: true, time: 'Now' },
    ]);
    setText('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.cvRoot, { backgroundColor: C.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* ── Header ── */}
      <View style={[styles.cvHeader, { paddingTop: topPad + 6 }]}>
        <TouchableOpacity onPress={onBack} style={styles.cvBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={24} color={C.text} />
        </TouchableOpacity>

        <View style={styles.cvHeaderCenter}>
          {conv.avatarUrl ? (
            <Image source={{ uri: conv.avatarUrl }} style={styles.cvAvatar} contentFit="cover" />
          ) : (
            <View style={[styles.cvAvatarFallback, { backgroundColor: conv.userColor }]}>
              <Text style={styles.cvAvatarText}>{conv.userInitials}</Text>
            </View>
          )}
          <View style={styles.cvHeaderMeta}>
            <Text style={styles.cvHeaderName}>{conv.userName}</Text>
            <Text style={styles.cvHeaderStatus}>{conv.status}</Text>
          </View>
        </View>

        <View style={styles.cvHeaderActions}>
          <TouchableOpacity style={styles.cvActionBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <MaterialCommunityIcons name="sticker-emoji" size={22} color={C.headerIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.cvActionBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Feather name="video" size={22} color={C.headerIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.cvActionBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Ionicons name="flag-outline" size={22} color={C.headerIcon} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Messages ── */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ paddingHorizontal: 10, paddingTop: 12, paddingBottom: 12, gap: 2 }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item, index }) => {
          const prevItem = messages[index - 1];
          const showAvatar = !item.fromMe && (index === 0 || messages[index - 1]?.fromMe);
          const clusterFirst = !item.fromMe && (index === 0 || prevItem?.fromMe);
          const clusterLast =
            item.fromMe || index === messages.length - 1 || messages[index + 1]?.fromMe;

          return (
            <View style={{ marginBottom: clusterLast ? 6 : 2 }}>
              {/* Reply thread */}
              {item.replyTo && item.fromMe && (
                <View style={styles.replyThread}>
                  <Text style={styles.replyLabel}>You replied</Text>
                  <View style={styles.replyQuote}>
                    <Text style={styles.replyQuoteText} numberOfLines={1}>{item.replyTo}</Text>
                  </View>
                </View>
              )}

              <View style={[styles.msgRow, item.fromMe ? styles.msgRowRight : styles.msgRowLeft]}>
                {/* Avatar placeholder column (keeps alignment) */}
                {!item.fromMe && (
                  <View style={styles.senderAvatarCol}>
                    {showAvatar ? (
                      conv.avatarUrl ? (
                        <Image source={{ uri: conv.avatarUrl }} style={styles.senderAvatar} contentFit="cover" />
                      ) : (
                        <View style={[styles.senderAvatarFallback, { backgroundColor: conv.userColor }]}>
                          <Text style={styles.senderAvatarText}>{conv.userInitials[0]}</Text>
                        </View>
                      )
                    ) : (
                      <View style={styles.senderAvatarSpacer} />
                    )}
                  </View>
                )}

                <View
                  style={[
                    styles.bubble,
                    item.fromMe
                      ? [styles.bubbleSent, { borderBottomRightRadius: clusterLast ? 4 : 18 }]
                      : [styles.bubbleRecv, { borderBottomLeftRadius: clusterLast ? 4 : 18 }],
                  ]}
                >
                  <Text style={[styles.bubbleText, { color: item.fromMe ? '#fff' : C.text }]}>
                    {item.text}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* ── Input toolbar ── */}
      <View style={[styles.toolbar, { paddingBottom: botPad + 8 }]}>
        {/* Camera button */}
        <TouchableOpacity style={[styles.cameraBtn, { backgroundColor: C.cameraBtn }]}>
          <Ionicons name="camera" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Message input */}
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder="Message..."
            placeholderTextColor={C.placeholder}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
            returnKeyType="default"
          />
          {/* Toolbar icons inside / beside input */}
          <View style={styles.inputIcons}>
            <TouchableOpacity hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Feather name="mic" size={20} color={C.sub} />
            </TouchableOpacity>
            <TouchableOpacity hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Feather name="image" size={20} color={C.sub} />
            </TouchableOpacity>
            <TouchableOpacity hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <MaterialCommunityIcons name="sticker-emoji" size={20} color={C.sub} />
            </TouchableOpacity>
            {text.trim() ? (
              <TouchableOpacity onPress={send} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <View style={styles.sendCircle}>
                  <Feather name="send" size={15} color="#fff" />
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Feather name="plus-circle" size={22} color={C.sub} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Conversations list ────────────────────────────────────────────────────────

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;

  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [search, setSearch] = useState('');
  const [showNewConv, setShowNewConv] = useState(false);
  const [newName, setNewName] = useState('');

  const openConversation = (conv: Conversation) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unread: 0 } : c))
    );
    setActiveConv(conv);
  };

  if (activeConv) {
    return (
      <ConversationView
        conv={activeConv}
        onBack={() => setActiveConv(null)}
      />
    );
  }

  const filteredConvs = search.trim()
    ? conversations.filter(
        (c) =>
          c.userName.toLowerCase().includes(search.toLowerCase()) ||
          c.lastMessage.toLowerCase().includes(search.toLowerCase())
      )
    : conversations;

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);

  const startNewConversation = () => {
    if (!newName.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const palette = ['#9B30E8', '#3A8DFF', '#27AE60', '#E91E8C', '#FF5722', '#FF9800'];
    const initials = newName
      .trim()
      .split(' ')
      .map((w: string) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    const newConv: Conversation = {
      id: Date.now().toString(),
      userName: newName.trim(),
      userInitials: initials,
      userColor: palette[Math.floor(Math.random() * palette.length)],
      status: 'Active now',
      lastMessage: '',
      time: 'Now',
      unread: 0,
      messages: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    setNewName('');
    setShowNewConv(false);
    setActiveConv(newConv);
  };

  return (
    <View style={[styles.listRoot, { backgroundColor: C.bg }]}>
      {/* Header */}
      <View style={[styles.listHeader, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.listBack}>
          <Feather name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.listTitle}>Messages</Text>
          {totalUnread > 0 && (
            <Text style={[styles.listUnread, { color: C.sentBubble }]}>
              {totalUnread} unread
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.newBtn, { backgroundColor: C.sentBubble }]}
          onPress={() => setShowNewConv(true)}
        >
          <Feather name="edit-2" size={14} color="#fff" />
          <Text style={styles.newBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: C.inputBg }]}>
        <Feather name="search" size={16} color={C.sub} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Messenger"
          placeholderTextColor={C.placeholder}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Feather name="x" size={15} color={C.sub} />
          </TouchableOpacity>
        )}
      </View>

      {/* New conversation form */}
      {showNewConv && (
        <View style={[styles.newConvCard, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={styles.newConvTitle}>New Conversation</Text>
          <View style={[styles.newConvRow, { backgroundColor: C.inputBg }]}>
            <Feather name="user" size={16} color={C.sub} />
            <TextInput
              style={styles.newConvInput}
              placeholder="Enter name..."
              placeholderTextColor={C.placeholder}
              value={newName}
              onChangeText={setNewName}
              autoFocus
              onSubmitEditing={startNewConversation}
            />
          </View>
          <View style={styles.newConvBtns}>
            <TouchableOpacity
              style={[styles.newConvCancel, { borderColor: C.border }]}
              onPress={() => { setShowNewConv(false); setNewName(''); }}
            >
              <Text style={[styles.newConvCancelTxt, { color: C.sub }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.newConvStart, { backgroundColor: newName.trim() ? C.sentBubble : C.border }]}
              onPress={startNewConversation}
              disabled={!newName.trim()}
            >
              <Text style={[styles.newConvStartTxt, { color: newName.trim() ? '#fff' : C.sub }]}>
                Start
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Conversation rows */}
      <FlatList
        data={filteredConvs}
        keyExtractor={(c) => c.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: isWeb ? 34 : insets.bottom + 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.convRow, { borderBottomColor: C.border }]}
            onPress={() => openConversation(item)}
            activeOpacity={0.75}
          >
            {/* Avatar */}
            <View style={styles.convAvatarWrap}>
              {item.avatarUrl ? (
                <Image source={{ uri: item.avatarUrl }} style={styles.convAvatar} contentFit="cover" />
              ) : (
                <View style={[styles.convAvatarFallback, { backgroundColor: item.userColor }]}>
                  <Text style={styles.convAvatarText}>{item.userInitials}</Text>
                </View>
              )}
              {/* Online dot */}
              {item.status === 'Active now' && <View style={styles.onlineDot} />}
              {item.unread > 0 && (
                <View style={[styles.unreadBadge, { backgroundColor: C.sentBubble }]}>
                  <Text style={styles.unreadText}>{item.unread}</Text>
                </View>
              )}
            </View>

            {/* Body */}
            <View style={styles.convBody}>
              <Text style={styles.convName}>{item.userName}</Text>
              <Text
                style={[
                  styles.convLast,
                  { color: item.unread > 0 ? C.text : C.sub, fontWeight: item.unread > 0 ? '600' : '400' },
                ]}
                numberOfLines={1}
              >
                {item.lastMessage || 'Say hello 👋'}
              </Text>
            </View>

            {/* Time */}
            <View style={styles.convRight}>
              <Text style={[styles.convTime, { color: item.unread > 0 ? C.sentBubble : C.sub }]}>
                {item.time}
              </Text>
              {item.unread > 0 && (
                <View style={[styles.unreadDot, { backgroundColor: C.sentBubble }]} />
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="message-circle" size={48} color={C.sub} />
            <Text style={styles.emptyTitle}>
              {search.trim() ? 'No results found' : 'No Messages Yet'}
            </Text>
            <Text style={styles.emptySub}>
              {search.trim() ? 'Try a different search' : 'Connect with your faith community'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Conversation view
  cvRoot: { flex: 1 },
  cvHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2A2A2A',
    backgroundColor: '#0D0D0D',
  },
  cvBack: { padding: 6 },
  cvHeaderCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 6, gap: 10 },
  cvAvatar: { width: 40, height: 40, borderRadius: 20 },
  cvAvatarFallback: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  cvAvatarText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cvHeaderMeta: { flex: 1 },
  cvHeaderName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cvHeaderStatus: { color: '#8E8E93', fontSize: 12, marginTop: 1 },
  cvHeaderActions: { flexDirection: 'row', gap: 4 },
  cvActionBtn: { padding: 8 },

  // ── Bubbles
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 1 },
  msgRowLeft: { justifyContent: 'flex-start' },
  msgRowRight: { justifyContent: 'flex-end' },
  senderAvatarCol: { width: 36, marginRight: 6, alignItems: 'center' },
  senderAvatar: { width: 30, height: 30, borderRadius: 15 },
  senderAvatarFallback: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  senderAvatarText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  senderAvatarSpacer: { width: 30, height: 30 },
  bubble: { maxWidth: '72%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9 },
  bubbleSent: { backgroundColor: '#9B30E8', borderBottomRightRadius: 4 },
  bubbleRecv: { backgroundColor: '#2C2C2E', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 21 },

  // ── Reply thread
  replyThread: { alignItems: 'flex-end', marginBottom: 3, marginRight: 4 },
  replyLabel: { color: '#636366', fontSize: 11, marginBottom: 3 },
  replyQuote: {
    backgroundColor: '#1E1E20',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxWidth: '65%',
  },
  replyQuoteText: { color: '#8E8E93', fontSize: 13 },

  // ── Toolbar
  toolbar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingTop: 8,
    gap: 8,
    backgroundColor: '#0D0D0D',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#2A2A2A',
  },
  cameraBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 6,
    minHeight: 40,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    maxHeight: 110,
    paddingTop: 4,
    paddingBottom: 4,
  },
  inputIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 2,
    marginLeft: 6,
  },
  sendCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#9B30E8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── List view
  listRoot: { flex: 1 },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2A2A2A',
  },
  listBack: { padding: 4 },
  listTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  listUnread: { fontSize: 12, marginTop: 1 },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  newBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 14,
    marginVertical: 10,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 15 },

  // ── New conversation form
  newConvCard: {
    marginHorizontal: 14,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 10,
  },
  newConvTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  newConvRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  newConvInput: { flex: 1, color: '#fff', fontSize: 15 },
  newConvBtns: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  newConvCancel: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1 },
  newConvCancelTxt: { fontSize: 14, fontWeight: '500' },
  newConvStart: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  newConvStartTxt: { fontSize: 14, fontWeight: '600' },

  // ── Conversation rows
  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  convAvatarWrap: { position: 'relative' },
  convAvatar: { width: 54, height: 54, borderRadius: 27 },
  convAvatarFallback: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  convAvatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#31C48D',
    borderWidth: 2,
    borderColor: '#0D0D0D',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#0D0D0D',
  },
  unreadText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  convBody: { flex: 1, gap: 3 },
  convName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  convLast: { fontSize: 13 },
  convRight: { alignItems: 'flex-end', gap: 6 },
  convTime: { fontSize: 11 },
  unreadDot: { width: 10, height: 10, borderRadius: 5 },

  // ── Empty
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  emptySub: { color: '#8E8E93', fontSize: 14 },
});
