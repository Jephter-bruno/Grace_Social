import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarCircle } from '@/components/AvatarCircle';
import { VersePickerModal } from '@/components/VersePickerModal';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

type MessageType = 'text' | 'verse' | 'prayer' | 'image' | 'announcement';

interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userInitials: string;
  userColor: string;
  isCurrentUser: boolean;
  isModerator?: boolean;
  type: MessageType;
  text?: string;
  verse?: { reference: string; text: string };
  prayerText?: string;
  imageEmoji?: string;
  timestamp: string;
  reactions: Reaction[];
  createdAt: number;
}

const REACTION_EMOJIS = ['🙏', '❤️', '🙌', '🔥', '✝️', '💙', '😭', '🕊️'];

const NOW = Date.now();
const MIN = 60000;
const HOUR = 3600000;

const BASE_MESSAGES: ChatMessage[] = [
  {
    id: 'cm_announce',
    userId: 'mod1', userName: 'Pastor James', userInitials: 'PJ', userColor: '#4A90A4',
    isCurrentUser: false, isModerator: true,
    type: 'announcement',
    text: '📢 Welcome to the group chat! This is a space to encourage one another, share scripture, and pray together. Be kind, be gracious, and always point each other to Jesus. 🙏',
    timestamp: '3d ago', reactions: [{ emoji: '🙏', count: 18, hasReacted: false }, { emoji: '❤️', count: 12, hasReacted: false }], createdAt: NOW - 3 * 24 * HOUR,
  },
  {
    id: 'cm1',
    userId: 'u1', userName: 'Sarah M.', userInitials: 'SM', userColor: '#E91E8C',
    isCurrentUser: false, isModerator: true,
    type: 'text',
    text: 'Good morning family! 🌅 Starting today with prayer. Anyone have a specific request?',
    timestamp: '2d ago', reactions: [{ emoji: '🙌', count: 8, hasReacted: false }], createdAt: NOW - 2 * 24 * HOUR,
  },
  {
    id: 'cm2',
    userId: 'u2', userName: 'David L.', userInitials: 'DL', userColor: '#27AE60',
    isCurrentUser: false,
    type: 'verse',
    verse: { reference: 'Lamentations 3:22-23', text: 'Because of the Lord\'s great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.' },
    timestamp: '2d ago', reactions: [{ emoji: '🙏', count: 14, hasReacted: false }, { emoji: '🔥', count: 6, hasReacted: false }], createdAt: NOW - 2 * 24 * HOUR + 5 * MIN,
  },
  {
    id: 'cm3',
    userId: 'u3', userName: 'Mary K.', userInitials: 'MK', userColor: '#9B59B6',
    isCurrentUser: false,
    type: 'prayer',
    prayerText: "Please pray for my mom's upcoming surgery on Friday. Believing God for complete healing. 🙏",
    timestamp: '1d ago', reactions: [{ emoji: '🙏', count: 22, hasReacted: false }, { emoji: '❤️', count: 15, hasReacted: false }], createdAt: NOW - 24 * HOUR,
  },
  {
    id: 'cm4',
    userId: 'u4', userName: 'John A.', userInitials: 'JA', userColor: '#F39C12',
    isCurrentUser: false,
    type: 'text',
    text: 'Praying right now for your mom @Mary! The Lord heals. 🙌',
    timestamp: '1d ago', reactions: [{ emoji: '❤️', count: 4, hasReacted: false }], createdAt: NOW - 24 * HOUR + 3 * MIN,
  },
  {
    id: 'cm5',
    userId: 'u5', userName: 'Ruth M.', userInitials: 'RM', userColor: '#8E44AD',
    isCurrentUser: false,
    type: 'text',
    text: 'This community blesses me every single day. Thank you all for being the hands and feet of Jesus 💙',
    timestamp: '23h ago', reactions: [{ emoji: '❤️', count: 17, hasReacted: false }, { emoji: '🙌', count: 9, hasReacted: false }], createdAt: NOW - 23 * HOUR,
  },
  {
    id: 'cm6',
    userId: 'u2', userName: 'David L.', userInitials: 'DL', userColor: '#27AE60',
    isCurrentUser: false,
    type: 'image',
    text: 'From last night\'s Bible study! 📖',
    imageEmoji: '🏛️',
    timestamp: '18h ago', reactions: [{ emoji: '🔥', count: 11, hasReacted: false }, { emoji: '🙌', count: 7, hasReacted: false }], createdAt: NOW - 18 * HOUR,
  },
  {
    id: 'cm7',
    userId: 'u1', userName: 'Sarah M.', userInitials: 'SM', userColor: '#E91E8C',
    isCurrentUser: false, isModerator: true,
    type: 'text',
    text: 'Reminder: Prayer night this Friday at 7PM 🕯️ Come ready to seek His face!',
    timestamp: '12h ago', reactions: [{ emoji: '🙏', count: 13, hasReacted: false }, { emoji: '✝️', count: 8, hasReacted: false }], createdAt: NOW - 12 * HOUR,
  },
  {
    id: 'cm8',
    userId: 'u6', userName: 'Thomas B.', userInitials: 'TB', userColor: '#E74C3C',
    isCurrentUser: false,
    type: 'verse',
    verse: { reference: 'Psalm 133:1', text: 'How good and pleasant it is when God\'s people live together in unity!' },
    timestamp: '4h ago', reactions: [{ emoji: '🙌', count: 16, hasReacted: false }, { emoji: '❤️', count: 5, hasReacted: false }], createdAt: NOW - 4 * HOUR,
  },
  {
    id: 'cm9',
    userId: 'currentUser', userName: 'You', userInitials: 'ME', userColor: '#4A90A4',
    isCurrentUser: true,
    type: 'text',
    text: 'So grateful for this community 🙏 God is moving here!',
    timestamp: '2h ago', reactions: [{ emoji: '❤️', count: 6, hasReacted: false }], createdAt: NOW - 2 * HOUR,
  },
  {
    id: 'cm10',
    userId: 'u3', userName: 'Mary K.', userInitials: 'MK', userColor: '#9B59B6',
    isCurrentUser: false,
    type: 'text',
    text: 'Update: The doctor\'s report is good! 🙌 God answered our prayers!',
    timestamp: '30m ago', reactions: [{ emoji: '🙌', count: 20, hasReacted: false }, { emoji: '🙏', count: 14, hasReacted: false }, { emoji: '🔥', count: 8, hasReacted: false }], createdAt: NOW - 30 * MIN,
  },
];

const SIMULATED_INCOMING: Omit<ChatMessage, 'id' | 'createdAt'>[] = [
  { userId: 'u4', userName: 'John A.', userInitials: 'JA', userColor: '#F39C12', isCurrentUser: false, type: 'text', text: 'Amen and amen! 🙌 His mercies are truly new every morning!', timestamp: 'just now', reactions: [] },
  { userId: 'u5', userName: 'Ruth M.', userInitials: 'RM', userColor: '#8E44AD', isCurrentUser: false, type: 'verse', verse: { reference: 'Isaiah 41:10', text: 'So do not fear, for I am with you; do not be dismayed, for I am your God.' }, timestamp: 'just now', reactions: [] },
  { userId: 'u1', userName: 'Sarah M.', userInitials: 'SM', userColor: '#E91E8C', isCurrentUser: false, isModerator: true, type: 'text', text: 'Praying for everyone in this group right now. You are loved! 💙', timestamp: 'just now', reactions: [] },
  { userId: 'u6', userName: 'Thomas B.', userInitials: 'TB', userColor: '#E74C3C', isCurrentUser: false, type: 'prayer', prayerText: 'Asking for prayer for strength at work this week. Facing some challenges but trusting God.', timestamp: 'just now', reactions: [] },
  { userId: 'u2', userName: 'David L.', userInitials: 'DL', userColor: '#27AE60', isCurrentUser: false, type: 'text', text: 'That scripture just spoke to my heart. Thank you for sharing! 🙏', timestamp: 'just now', reactions: [] },
];

type AttachmentMode = null | 'verse' | 'prayer' | 'image';

export default function CommunityChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { communities } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 8 : insets.bottom;
  const flatListRef = useRef<FlatList>(null);

  const community = communities.find((c) => c.id === id);

  const [messages, setMessages] = useState<ChatMessage[]>(BASE_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [prayerText, setPrayerText] = useState('');
  const [attachMode, setAttachMode] = useState<AttachmentMode>(null);
  const [versePickerOpen, setVersePickerOpen] = useState(false);
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null);
  const [onlineCount] = useState(Math.floor(Math.random() * 18) + 8);
  const simIdx = useRef(0);

  const communityColor = community?.color ?? '#4A90A4';

  const scrollToBottom = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const injectSimulated = useCallback(() => {
    const base = SIMULATED_INCOMING[simIdx.current % SIMULATED_INCOMING.length];
    simIdx.current++;
    const msg: ChatMessage = { ...base, id: `sim_${Date.now()}`, createdAt: Date.now() };
    setMessages((prev) => [...prev, msg]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scrollToBottom();
  }, [scrollToBottom]);

  useEffect(() => {
    const first = setTimeout(injectSimulated, 14000);
    const interval = setInterval(injectSimulated, 28000);
    return () => { clearTimeout(first); clearInterval(interval); };
  }, [injectSimulated]);

  const sendText = () => {
    if (!inputText.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const msg: ChatMessage = {
      id: `m_${Date.now()}`, userId: 'currentUser', userName: 'You',
      userInitials: 'ME', userColor: '#4A90A4', isCurrentUser: true,
      type: 'text', text: inputText.trim(),
      timestamp: 'just now', reactions: [], createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, msg]);
    setInputText('');
    scrollToBottom();
  };

  const sendPrayer = () => {
    if (!prayerText.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const msg: ChatMessage = {
      id: `m_${Date.now()}`, userId: 'currentUser', userName: 'You',
      userInitials: 'ME', userColor: '#4A90A4', isCurrentUser: true,
      type: 'prayer', prayerText: prayerText.trim(),
      timestamp: 'just now', reactions: [], createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, msg]);
    setPrayerText('');
    setAttachMode(null);
    scrollToBottom();
  };

  const sendVerse = (verse: { reference: string; text: string }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const msg: ChatMessage = {
      id: `m_${Date.now()}`, userId: 'currentUser', userName: 'You',
      userInitials: 'ME', userColor: '#4A90A4', isCurrentUser: true,
      type: 'verse', verse,
      timestamp: 'just now', reactions: [], createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, msg]);
    setVersePickerOpen(false);
    setAttachMode(null);
    scrollToBottom();
  };

  const sendImage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const imageEmojis = ['🌅', '⛪', '📖', '🕊️', '🌿'];
    const msg: ChatMessage = {
      id: `m_${Date.now()}`, userId: 'currentUser', userName: 'You',
      userInitials: 'ME', userColor: '#4A90A4', isCurrentUser: true,
      type: 'image', imageEmoji: imageEmojis[Math.floor(Math.random() * imageEmojis.length)],
      text: inputText.trim() || undefined,
      timestamp: 'just now', reactions: [], createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, msg]);
    setInputText('');
    setAttachMode(null);
    scrollToBottom();
  };

  const toggleReaction = (msgId: string, emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId) return m;
        const existing = m.reactions.find((r) => r.emoji === emoji);
        if (existing) {
          return {
            ...m, reactions: m.reactions.map((r) =>
              r.emoji === emoji
                ? { ...r, count: r.hasReacted ? r.count - 1 : r.count + 1, hasReacted: !r.hasReacted }
                : r
            ).filter((r) => r.count > 0),
          };
        }
        return { ...m, reactions: [...m.reactions, { emoji, count: 1, hasReacted: true }] };
      })
    );
    setReactionPickerFor(null);
  };

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const prev = index > 0 ? messages[index - 1] : null;
    const showAvatar = !item.isCurrentUser && (prev?.userId !== item.userId || prev?.type === 'announcement');
    const showName = showAvatar;

    if (item.type === 'announcement') {
      return (
        <View style={[styles.announcement, { backgroundColor: communityColor + '15', borderColor: communityColor + '40' }]}>
          <Text style={[styles.announcementText, { color: colors.foreground }]}>{item.text}</Text>
          <View style={styles.announcementMeta}>
            <Feather name="shield" size={11} color={communityColor} />
            <Text style={[styles.announcementAuthor, { color: communityColor }]}>
              {item.userName} • {item.timestamp}
            </Text>
          </View>
          {item.reactions.length > 0 && (
            <View style={styles.reactionRow}>
              {item.reactions.map((r) => (
                <TouchableOpacity key={r.emoji} style={[styles.reactionChip, { backgroundColor: colors.muted, borderColor: colors.border }]} onPress={() => toggleReaction(item.id, r.emoji)}>
                  <Text style={styles.reactionEmoji}>{r.emoji}</Text>
                  <Text style={[styles.reactionCount, { color: colors.mutedForeground }]}>{r.count}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      );
    }

    const isRight = item.isCurrentUser;

    return (
      <View style={[styles.msgWrapper, isRight && styles.msgWrapperRight]}>
        {!isRight && (
          <View style={styles.avatarCol}>
            {showAvatar ? (
              <AvatarCircle initials={item.userInitials} color={item.userColor} size={32} />
            ) : (
              <View style={{ width: 32 }} />
            )}
          </View>
        )}

        <View style={[styles.msgContent, isRight && styles.msgContentRight]}>
          {showName && !isRight && (
            <View style={styles.nameLine}>
              <Text style={[styles.senderName, { color: item.userColor }]}>{item.userName}</Text>
              {item.isModerator && (
                <View style={[styles.modBadge, { backgroundColor: communityColor }]}>
                  <Feather name="shield" size={9} color="#fff" />
                  <Text style={styles.modText}>MOD</Text>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity
            onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setReactionPickerFor(item.id); }}
            activeOpacity={0.85}
          >
            {item.type === 'text' && (
              <View style={[styles.bubble, isRight ? [styles.bubbleRight, { backgroundColor: communityColor }] : [styles.bubbleLeft, { backgroundColor: colors.card, borderColor: colors.border }]]}>
                <Text style={[styles.bubbleText, { color: isRight ? '#fff' : colors.foreground }]}>{item.text}</Text>
              </View>
            )}

            {item.type === 'verse' && item.verse && (
              <View style={[styles.verseBubble, { backgroundColor: '#8B5CF615', borderColor: '#8B5CF640', borderLeftColor: '#8B5CF6' }]}>
                <View style={styles.verseHeader}>
                  <Feather name="book-open" size={13} color="#8B5CF6" />
                  <Text style={[styles.verseRef, { color: '#8B5CF6' }]}>{item.verse.reference}</Text>
                </View>
                <Text style={[styles.verseBody, { color: colors.foreground }]}>"{item.verse.text}"</Text>
                <Text style={[styles.verseSender, { color: colors.mutedForeground }]}>
                  — {isRight ? 'You' : item.userName}
                </Text>
              </View>
            )}

            {item.type === 'prayer' && item.prayerText && (
              <View style={[styles.prayerBubble, { backgroundColor: '#D4A84315', borderColor: '#D4A84340' }]}>
                <View style={styles.prayerHeader}>
                  <Text style={styles.prayerIcon}>🙏</Text>
                  <Text style={[styles.prayerLabel, { color: '#D4A843' }]}>Prayer Request</Text>
                </View>
                <Text style={[styles.prayerText, { color: colors.foreground }]}>{item.prayerText}</Text>
                <Text style={[styles.prayerSender, { color: colors.mutedForeground }]}>— {isRight ? 'You' : item.userName}</Text>
              </View>
            )}

            {item.type === 'image' && (
              <View>
                <View style={[styles.imagePlaceholder, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  <Text style={styles.imagePlaceholderEmoji}>{item.imageEmoji ?? '🖼️'}</Text>
                  <Text style={[styles.imagePlaceholderText, { color: colors.mutedForeground }]}>Photo shared</Text>
                </View>
                {item.text ? (
                  <View style={[styles.bubble, isRight ? [styles.bubbleRight, { backgroundColor: communityColor }] : [styles.bubbleLeft, { backgroundColor: colors.card, borderColor: colors.border }], { marginTop: 4 }]}>
                    <Text style={[styles.bubbleText, { color: isRight ? '#fff' : colors.foreground }]}>{item.text}</Text>
                  </View>
                ) : null}
              </View>
            )}
          </TouchableOpacity>

          {item.reactions.length > 0 && (
            <View style={[styles.reactionRow, isRight && styles.reactionRowRight]}>
              {item.reactions.map((r) => (
                <TouchableOpacity
                  key={r.emoji}
                  style={[styles.reactionChip, { backgroundColor: r.hasReacted ? communityColor + '20' : colors.muted, borderColor: r.hasReacted ? communityColor + '60' : colors.border }]}
                  onPress={() => toggleReaction(item.id, r.emoji)}
                >
                  <Text style={styles.reactionEmoji}>{r.emoji}</Text>
                  <Text style={[styles.reactionCount, { color: r.hasReacted ? communityColor : colors.mutedForeground }]}>{r.count}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={[styles.addReactionBtn, { backgroundColor: colors.muted }]} onPress={() => setReactionPickerFor(item.id)}>
                <Feather name="smile" size={12} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          )}

          <Text style={[styles.msgTime, { color: colors.mutedForeground }, isRight && { textAlign: 'right' }]}>
            {item.timestamp}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>

        <View style={[styles.headerIconWrap, { backgroundColor: communityColor + '20' }]}>
          <Feather name={(community?.iconName as any) ?? 'users'} size={18} color={communityColor} />
        </View>

        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
            {community?.name ?? 'Community Chat'}
          </Text>
          <View style={styles.onlineRow}>
            <View style={[styles.onlineDot, { backgroundColor: '#27AE60' }]} />
            <Text style={[styles.onlineText, { color: colors.mutedForeground }]}>
              {onlineCount} online
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.headerBtn}>
          <Feather name="more-vertical" size={20} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 12, gap: 6, paddingBottom: 12 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollToBottom()}
        />

        {attachMode === 'prayer' && (
          <View style={[styles.prayerInputPanel, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <View style={styles.prayerPanelHeader}>
              <Text style={styles.prayerIcon}>🙏</Text>
              <Text style={[styles.prayerPanelTitle, { color: '#D4A843' }]}>Share Prayer Request</Text>
              <TouchableOpacity onPress={() => setAttachMode(null)}>
                <Feather name="x" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.prayerInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
              placeholder="Share your prayer request with the group..."
              placeholderTextColor={colors.mutedForeground}
              value={prayerText}
              onChangeText={setPrayerText}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              autoFocus
            />
            <TouchableOpacity
              style={[styles.prayerSendBtn, { backgroundColor: prayerText.trim() ? '#D4A843' : colors.muted }]}
              onPress={sendPrayer}
              disabled={!prayerText.trim()}
            >
              <Feather name="send" size={15} color={prayerText.trim() ? '#fff' : colors.mutedForeground} />
              <Text style={[styles.prayerSendText, { color: prayerText.trim() ? '#fff' : colors.mutedForeground }]}>
                Share Prayer
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.inputBar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: bottomPad }]}>
          <View style={styles.attachRow}>
            <TouchableOpacity
              style={[styles.attachBtn, attachMode === 'verse' ? { backgroundColor: '#8B5CF620', borderColor: '#8B5CF6' } : { backgroundColor: colors.muted, borderColor: colors.border }]}
              onPress={() => { setAttachMode(null); setVersePickerOpen(true); }}
            >
              <Feather name="book-open" size={14} color={attachMode === 'verse' ? '#8B5CF6' : colors.mutedForeground} />
              <Text style={[styles.attachText, { color: attachMode === 'verse' ? '#8B5CF6' : colors.mutedForeground }]}>Verse</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.attachBtn, attachMode === 'prayer' ? { backgroundColor: '#D4A84320', borderColor: '#D4A843' } : { backgroundColor: colors.muted, borderColor: colors.border }]}
              onPress={() => setAttachMode((m) => m === 'prayer' ? null : 'prayer')}
            >
              <Text style={styles.prayerIcon2}>🙏</Text>
              <Text style={[styles.attachText, { color: attachMode === 'prayer' ? '#D4A843' : colors.mutedForeground }]}>Prayer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.attachBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
              onPress={sendImage}
            >
              <Feather name="image" size={14} color={colors.mutedForeground} />
              <Text style={[styles.attachText, { color: colors.mutedForeground }]}>Photo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.textRow}>
            <View style={[styles.textInputWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <TextInput
                style={[styles.textInput, { color: colors.foreground }]}
                placeholder="Message the group..."
                placeholderTextColor={colors.mutedForeground}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                onSubmitEditing={sendText}
                blurOnSubmit={false}
              />
            </View>
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: inputText.trim() ? communityColor : colors.muted }]}
              onPress={sendText}
              disabled={!inputText.trim()}
            >
              <Feather name="send" size={18} color={inputText.trim() ? '#fff' : colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {reactionPickerFor && (
        <Modal transparent animationType="fade" onRequestClose={() => setReactionPickerFor(null)}>
          <TouchableOpacity style={styles.reactionOverlay} activeOpacity={1} onPress={() => setReactionPickerFor(null)}>
            <View style={[styles.reactionPicker, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.reactionPickerTitle, { color: colors.mutedForeground }]}>Add Reaction</Text>
              <View style={styles.reactionPickerGrid}>
                {REACTION_EMOJIS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[styles.reactionPickerItem, { backgroundColor: colors.muted }]}
                    onPress={() => toggleReaction(reactionPickerFor, emoji)}
                  >
                    <Text style={styles.reactionPickerEmoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      <VersePickerModal
        visible={versePickerOpen}
        onClose={() => setVersePickerOpen(false)}
        onSelect={sendVerse}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 12, borderBottomWidth: 0.5, gap: 10 },
  headerBtn: { padding: 4 },
  headerIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  onlineText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  announcement: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8, marginVertical: 4 },
  announcementText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21 },
  announcementMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  announcementAuthor: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  msgWrapper: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginVertical: 2 },
  msgWrapperRight: { flexDirection: 'row-reverse' },
  avatarCol: { flexShrink: 0, marginBottom: 18 },
  msgContent: { flex: 1, maxWidth: '80%', gap: 3 },
  msgContentRight: { alignItems: 'flex-end' },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  senderName: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  modBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
  modText: { fontSize: 9, color: '#fff', fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, maxWidth: '100%' },
  bubbleLeft: { borderRadius: 4, borderTopLeftRadius: 18, borderBottomLeftRadius: 18, borderTopRightRadius: 18, borderBottomRightRadius: 18, borderWidth: 1 },
  bubbleRight: { borderRadius: 18, borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 21 },
  verseBubble: { borderRadius: 14, borderWidth: 1, borderLeftWidth: 3.5, padding: 12, gap: 6, maxWidth: '100%' },
  verseHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  verseRef: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  verseBody: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21, fontStyle: 'italic' },
  verseSender: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  prayerBubble: { borderRadius: 14, borderWidth: 1, padding: 12, gap: 6, maxWidth: '100%' },
  prayerHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  prayerIcon: { fontSize: 14 },
  prayerIcon2: { fontSize: 13 },
  prayerLabel: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  prayerText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21 },
  prayerSender: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  imagePlaceholder: { width: 160, height: 120, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  imagePlaceholderEmoji: { fontSize: 36 },
  imagePlaceholderText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  reactionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  reactionRowRight: { justifyContent: 'flex-end' },
  reactionChip: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 12, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1 },
  reactionEmoji: { fontSize: 13 },
  reactionCount: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  addReactionBtn: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  msgTime: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  prayerInputPanel: { borderTopWidth: 0.5, padding: 14, gap: 10 },
  prayerPanelHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  prayerPanelTitle: { flex: 1, fontSize: 14, fontFamily: 'Inter_700Bold' },
  prayerInput: { borderRadius: 12, borderWidth: 1, padding: 12, minHeight: 72, fontSize: 14, fontFamily: 'Inter_400Regular', textAlignVertical: 'top' },
  prayerSendBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  prayerSendText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  inputBar: { borderTopWidth: 0.5, paddingHorizontal: 12, paddingTop: 8, gap: 8 },
  attachRow: { flexDirection: 'row', gap: 8 },
  attachBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  attachText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  textRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  textInputWrap: { flex: 1, borderRadius: 24, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 8, maxHeight: 100 },
  textInput: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  reactionOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  reactionPicker: { borderRadius: 20, borderWidth: 1, padding: 20, margin: 20, minWidth: 280, gap: 12 },
  reactionPickerTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  reactionPickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  reactionPickerItem: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  reactionPickerEmoji: { fontSize: 26 },
});
