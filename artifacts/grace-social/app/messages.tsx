import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarCircle } from '@/components/AvatarCircle';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';

interface Message {
  id: string;
  text: string;
  fromMe: boolean;
  time: string;
}

interface Conversation {
  id: string;
  userName: string;
  userInitials: string;
  userColor: string;
  lastMessage: string;
  time: string;
  unread: number;
  messages: Message[];
}

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    userName: 'Pastor James',
    userInitials: 'PJ',
    userColor: '#4A90A4',
    lastMessage: 'Blessings! See you Sunday 🙏',
    time: '9:32 AM',
    unread: 2,
    messages: [
      { id: 'm1', text: 'Hello, how are you doing today?', fromMe: false, time: '9:20 AM' },
      { id: 'm2', text: 'Doing great, thank you!', fromMe: true, time: '9:25 AM' },
      { id: 'm3', text: 'Blessings! See you Sunday 🙏', fromMe: false, time: '9:32 AM' },
    ],
  },
  {
    id: '2',
    userName: 'Grace Community',
    userInitials: 'GC',
    userColor: '#27AE60',
    lastMessage: 'Prayer meeting tonight at 7pm',
    time: 'Yesterday',
    unread: 0,
    messages: [
      { id: 'm1', text: 'Welcome to Grace Community!', fromMe: false, time: 'Mon' },
      { id: 'm2', text: 'Prayer meeting tonight at 7pm', fromMe: false, time: 'Yesterday' },
    ],
  },
  {
    id: '3',
    userName: 'Sarah M.',
    userInitials: 'SM',
    userColor: '#E91E8C',
    lastMessage: 'Amen! 🙌',
    time: 'Monday',
    unread: 0,
    messages: [
      { id: 'm1', text: 'Your prayer was so moving today', fromMe: false, time: 'Monday' },
      { id: 'm2', text: 'Thank you so much!', fromMe: true, time: 'Monday' },
      { id: 'm3', text: 'Amen! 🙌', fromMe: false, time: 'Monday' },
    ],
  },
  {
    id: '4',
    userName: 'Youth Group',
    userInitials: 'YG',
    userColor: '#9C27B0',
    lastMessage: "Don't forget the retreat next weekend!",
    time: 'Sunday',
    unread: 1,
    messages: [
      { id: 'm1', text: "Don't forget the retreat next weekend!", fromMe: false, time: 'Sunday' },
    ],
  },
];

export default function MessagesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;
  const { currentUser } = useAuth();

  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState('');
  const [search, setSearch] = useState('');
  const [showNewConv, setShowNewConv] = useState(false);
  const [newName, setNewName] = useState('');
  const inputRef = useRef<TextInput>(null);

  const openConversation = (conv: Conversation) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unread: 0 } : c))
    );
    setActiveConv(conv);
  };

  const sendMessage = () => {
    if (!messageText.trim() || !activeConv) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newMsg: Message = {
      id: Date.now().toString(),
      text: messageText.trim(),
      fromMe: true,
      time: 'Now',
    };
    const updatedConv = {
      ...activeConv,
      messages: [...activeConv.messages, newMsg],
      lastMessage: messageText.trim(),
      time: 'Now',
    };
    setActiveConv(updatedConv);
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConv.id ? updatedConv : c))
    );
    setMessageText('');
  };

  if (activeConv) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.convHeader, { paddingTop: topPad + 8, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
          <TouchableOpacity onPress={() => setActiveConv(null)} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <AvatarCircle initials={activeConv.userInitials} color={activeConv.userColor} size={36} />
          <Text style={[styles.convName, { color: colors.foreground }]}>{activeConv.userName}</Text>
          <View style={styles.spacer} />
          <TouchableOpacity style={styles.iconBtn}>
            <Feather name="more-vertical" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={activeConv.messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 10 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[styles.bubbleWrap, item.fromMe ? styles.bubbleRight : styles.bubbleLeft]}>
              {!item.fromMe && (
                <AvatarCircle initials={activeConv.userInitials} color={activeConv.userColor} size={28} />
              )}
              <View
                style={[
                  styles.bubble,
                  item.fromMe
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: colors.muted },
                ]}
              >
                <Text style={[styles.bubbleText, { color: item.fromMe ? '#fff' : colors.foreground }]}>
                  {item.text}
                </Text>
                <Text style={[styles.bubbleTime, { color: item.fromMe ? 'rgba(255,255,255,0.7)' : colors.mutedForeground }]}>
                  {item.time}
                </Text>
              </View>
            </View>
          )}
        />

        <View
          style={[
            styles.inputRow,
            { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: isWeb ? 16 : insets.bottom + 8 },
          ]}
        >
          <AvatarCircle
            initials={currentUser?.initials || 'ME'}
            color={currentUser?.color || '#4A90A4'}
            avatarUrl={currentUser?.avatarUrl}
            size={32}
          />
          <TextInput
            ref={inputRef}
            style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground }]}
            placeholder="Message..."
            placeholderTextColor={colors.mutedForeground}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: colors.primary, opacity: messageText.trim() ? 1 : 0.5 }]}
            onPress={sendMessage}
            disabled={!messageText.trim()}
          >
            <Feather name="send" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  const filteredConvs = search.trim()
    ? conversations.filter((c) =>
        c.userName.toLowerCase().includes(search.toLowerCase()) ||
        c.lastMessage.toLowerCase().includes(search.toLowerCase())
      )
    : conversations;

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);

  const startNewConversation = () => {
    if (!newName.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const colors_arr = ['#4A90A4', '#E91E8C', '#27AE60', '#9C27B0', '#FF5722', '#FF9800'];
    const initials = newName.trim().split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
    const newConv: Conversation = {
      id: Date.now().toString(),
      userName: newName.trim(),
      userInitials: initials,
      userColor: colors_arr[Math.floor(Math.random() * colors_arr.length)],
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Messages</Text>
          {totalUnread > 0 && (
            <Text style={[styles.unreadHint, { color: colors.primary }]}>
              {totalUnread} unread
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.newMsgBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowNewConv(true)}
        >
          <Feather name="edit" size={15} color="#fff" />
          <Text style={styles.newMsgText}>New</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.searchBar, { backgroundColor: colors.muted, marginHorizontal: 14, marginVertical: 10 }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search messages..."
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Feather name="x" size={15} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {showNewConv && (
        <View style={[styles.newConvBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.newConvLabel, { color: colors.foreground }]}>New Conversation</Text>
          <View style={[styles.newConvRow, { backgroundColor: colors.muted }]}>
            <Feather name="user" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.newConvInput, { color: colors.foreground }]}
              placeholder="Enter name..."
              placeholderTextColor={colors.mutedForeground}
              value={newName}
              onChangeText={setNewName}
              autoFocus
              onSubmitEditing={startNewConversation}
            />
          </View>
          <View style={styles.newConvBtns}>
            <TouchableOpacity
              style={[styles.newConvCancel, { borderColor: colors.border }]}
              onPress={() => { setShowNewConv(false); setNewName(''); }}
            >
              <Text style={[styles.newConvCancelText, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.newConvStart, { backgroundColor: newName.trim() ? colors.primary : colors.muted }]}
              onPress={startNewConversation}
              disabled={!newName.trim()}
            >
              <Text style={[styles.newConvStartText, { color: newName.trim() ? '#fff' : colors.mutedForeground }]}>
                Start
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={filteredConvs}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: isWeb ? 34 : insets.bottom + 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.convRow, { borderBottomColor: colors.border }]}
            onPress={() => openConversation(item)}
            activeOpacity={0.7}
          >
            <View style={styles.convAvatar}>
              <AvatarCircle initials={item.userInitials} color={item.userColor} size={52} />
              {item.unread > 0 && (
                <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.unreadText}>{item.unread}</Text>
                </View>
              )}
            </View>
            <View style={styles.convBody}>
              <View style={styles.convTop}>
                <Text style={[styles.convName, { color: colors.foreground }]}>{item.userName}</Text>
                <Text style={[styles.convTime, { color: colors.mutedForeground }]}>{item.time}</Text>
              </View>
              {item.lastMessage ? (
                <Text
                  style={[
                    styles.convLast,
                    { color: item.unread > 0 ? colors.foreground : colors.mutedForeground },
                    item.unread > 0 && { fontFamily: 'Inter_600SemiBold' },
                  ]}
                  numberOfLines={1}
                >
                  {item.lastMessage}
                </Text>
              ) : (
                <Text style={[styles.convLast, { color: colors.primary, fontFamily: 'Inter_500Medium' }]}>
                  Say hello 👋
                </Text>
              )}
            </View>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="message-circle" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {search.trim() ? 'No results found' : 'No Messages Yet'}
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              {search.trim() ? 'Try a different search term' : 'Connect with your faith community'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5 },
  convHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingBottom: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  unreadHint: { fontSize: 12, fontFamily: 'Inter_500Medium', marginTop: 1 },
  iconBtn: { padding: 4 },
  spacer: { flex: 1 },
  newMsgBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  newMsgText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, gap: 8 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular' },
  newConvBanner: { marginHorizontal: 14, marginBottom: 8, borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  newConvLabel: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  newConvRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  newConvInput: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular' },
  newConvBtns: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  newConvCancel: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1 },
  newConvCancelText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  newConvStart: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  newConvStartText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  convRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  convAvatar: { position: 'relative' },
  unreadBadge: { position: 'absolute', top: -2, right: -2, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff' },
  unreadText: { color: '#fff', fontSize: 10, fontFamily: 'Inter_700Bold' },
  convBody: { flex: 1, gap: 3 },
  convTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  convTime: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  convLast: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  bubbleWrap: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', marginBottom: 2 },
  bubbleLeft: { justifyContent: 'flex-start' },
  bubbleRight: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '75%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, gap: 3 },
  bubbleText: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 21 },
  bubbleTime: { fontSize: 11, fontFamily: 'Inter_400Regular', alignSelf: 'flex-end' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingTop: 10, gap: 10, borderTopWidth: 0.5 },
  input: { flex: 1, borderRadius: 22, paddingHorizontal: 14, paddingVertical: 9, fontSize: 15, fontFamily: 'Inter_400Regular', maxHeight: 120 },
  sendBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  emptySub: { fontSize: 14, fontFamily: 'Inter_400Regular' },
});
