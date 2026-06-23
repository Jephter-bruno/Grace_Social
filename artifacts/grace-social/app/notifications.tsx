import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdCard } from '@/components/AdCard';
import { AvatarCircle } from '@/components/AvatarCircle';
import { POST_IMAGES } from '@/constants/images';
import { Notification, NotificationType, useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

type FilterKey =
  | 'all'
  | 'likes'
  | 'comments'
  | 'follows'
  | 'prayer'
  | 'community'
  | 'messages'
  | 'mentions';

const FILTERS: { key: FilterKey; label: string; icon: string; types: NotificationType[] }[] = [
  { key: 'all', label: 'All', icon: 'bell', types: [] },
  { key: 'likes', label: 'Likes', icon: 'heart', types: ['like', 'comment_like'] },
  { key: 'comments', label: 'Comments', icon: 'message-circle', types: ['comment'] },
  { key: 'follows', label: 'Follows', icon: 'user-plus', types: ['follow', 'repost', 'share'] },
  { key: 'prayer', label: 'Prayer', icon: 'sun', types: ['prayer_pray', 'prayer_response', 'verse_share'] },
  { key: 'community', label: 'Community', icon: 'users', types: ['community_invite', 'community_announcement', 'story_reply'] },
  { key: 'messages', label: 'Messages', icon: 'send', types: ['dm'] },
  { key: 'mentions', label: 'Mentions', icon: 'at-sign', types: ['mention'] },
];

const TYPE_META: Record<NotificationType, { icon: string; color: string; label: string }> = {
  like: { icon: 'heart', color: '#E53935', label: 'Liked' },
  comment: { icon: 'message-circle', color: '#4A90A4', label: 'Commented' },
  comment_like: { icon: 'heart', color: '#E53935', label: 'Liked comment' },
  follow: { icon: 'user-plus', color: '#27AE60', label: 'Followed' },
  mention: { icon: 'at-sign', color: '#8B5CF6', label: 'Mentioned' },
  share: { icon: 'share-2', color: '#F59E0B', label: 'Shared' },
  repost: { icon: 'repeat', color: '#3B82F6', label: 'Reposted' },
  dm: { icon: 'send', color: '#06B6D4', label: 'Message' },
  community_invite: { icon: 'users', color: '#4A90A4', label: 'Invited' },
  community_announcement: { icon: 'bell', color: '#F59E0B', label: 'Announcement' },
  prayer_response: { icon: 'message-circle', color: '#D4A843', label: 'Prayer response' },
  prayer_pray: { icon: 'sun', color: '#D4A843', label: 'Praying' },
  verse_share: { icon: 'book-open', color: '#8B5CF6', label: 'Verse shared' },
  story_reply: { icon: 'image', color: '#EC4899', label: 'Story reply' },
};

function TypeIcon({ type }: { type: NotificationType }) {
  const meta = TYPE_META[type];
  return (
    <View style={[styles.typeIcon, { backgroundColor: meta.color }]}>
      <Feather name={meta.icon as any} size={11} color="#fff" />
    </View>
  );
}

function NotificationRow({
  item,
  onPress,
  onDelete,
}: {
  item: Notification;
  onPress: (n: Notification) => void;
  onDelete: (id: string) => void;
}) {
  const colors = useColors();
  const meta = TYPE_META[item.type];
  const [showDelete, setShowDelete] = useState(false);

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowDelete((v) => !v);
  };

  return (
    <TouchableOpacity
      style={[
        styles.row,
        { backgroundColor: item.isRead ? 'transparent' : colors.primary + '10' },
      ]}
      onPress={() => { setShowDelete(false); onPress(item); }}
      onLongPress={handleLongPress}
      activeOpacity={0.72}
    >
      <View style={styles.avatarWrap}>
        <AvatarCircle initials={item.userInitials} color={item.userColor} size={46} />
        <TypeIcon type={item.type} />
      </View>

      <View style={styles.textBlock}>
        <Text style={[styles.rowText, { color: colors.foreground }]} numberOfLines={2}>
          <Text style={styles.bold}>{item.userName}</Text>
          {'  '}{item.message}
        </Text>
        <View style={styles.rowMeta}>
          <View style={[styles.typeBadge, { backgroundColor: meta.color + '20' }]}>
            <Text style={[styles.typeBadgeText, { color: meta.color }]}>{meta.label}</Text>
          </View>
          <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>
            {item.timestamp}
          </Text>
        </View>
      </View>

      {showDelete ? (
        <TouchableOpacity
          style={[styles.deleteBtn, { backgroundColor: '#E53935' }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onDelete(item.id); }}
        >
          <Feather name="trash-2" size={15} color="#fff" />
        </TouchableOpacity>
      ) : item.postImageIndex !== undefined ? (
        <Image
          source={POST_IMAGES[item.postImageIndex]}
          style={styles.thumb}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.thumbPlaceholder, { backgroundColor: meta.color + '18' }]}>
          <Feather name={meta.icon as any} size={18} color={meta.color} />
        </View>
      )}

      {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const { notifications, markAllRead, markNotificationRead, deleteNotification, deleteAllNotifications } = useApp();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  const filtered = useMemo(() => {
    const filter = FILTERS.find((f) => f.key === activeFilter)!;
    if (activeFilter === 'all') return notifications;
    return notifications.filter((n) => filter.types.includes(n.type));
  }, [notifications, activeFilter]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  type FlatItem =
    | { kind: 'header'; title: string; count: number }
    | { kind: 'item'; item: Notification }
    | { kind: 'ad'; adIndex: number };

  const flatData = useMemo<FlatItem[]>(() => {
    const filteredUnread = filtered.filter((n) => !n.isRead);
    const todayFiltered = filtered.filter((n) => n.isRead && !n.timestamp.includes('d ago'));
    const earlierFiltered = filtered.filter((n) => n.isRead && n.timestamp.includes('d ago'));
    const rawItems: FlatItem[] = [];
    if (filteredUnread.length) {
      rawItems.push({ kind: 'header', title: 'New', count: filteredUnread.length });
      filteredUnread.forEach((item) => rawItems.push({ kind: 'item', item }));
    }
    if (todayFiltered.length) {
      rawItems.push({ kind: 'header', title: 'Today', count: todayFiltered.length });
      todayFiltered.forEach((item) => rawItems.push({ kind: 'item', item }));
    }
    if (earlierFiltered.length) {
      rawItems.push({ kind: 'header', title: 'Earlier', count: earlierFiltered.length });
      earlierFiltered.forEach((item) => rawItems.push({ kind: 'item', item }));
    }
    // Inject an ad every 5 notification items (skip headers for counting)
    const result: FlatItem[] = [];
    let itemCount = 0;
    let adCount = 0;
    rawItems.forEach((entry) => {
      result.push(entry);
      if (entry.kind === 'item') {
        itemCount += 1;
        if (itemCount % 5 === 0) {
          result.push({ kind: 'ad', adIndex: adCount++ });
        }
      }
    });
    return result;
  }, [filtered]);

  const handlePress = useCallback(
    (notification: Notification) => {
      markNotificationRead(notification.id);
      const tab = notification.targetTab ?? '/';
      router.back();
      setTimeout(() => router.replace(tab as any), 150);
    },
    [markNotificationRead]
  );

  const handleDeleteAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'This will permanently remove all notifications. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteAllNotifications();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: isWeb ? 67 : insets.top + 8, backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: colors.foreground }]}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={[styles.headerBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.headerBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={[styles.headerBtn, { marginRight: 2 }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); markAllRead(); }}
            >
              <Feather name="check-circle" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity style={styles.headerBtn} onPress={handleDeleteAll}>
              <Feather name="trash-2" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterBar}
      >
        {FILTERS.map((f) => {
          const count = f.key === 'all'
            ? unreadCount
            : notifications.filter((n) => !n.isRead && f.types.includes(n.type)).length;
          const isActive = activeFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive ? colors.primary : colors.muted,
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}
              onPress={() => { Haptics.selectionAsync(); setActiveFilter(f.key); }}
            >
              <Feather
                name={f.icon as any}
                size={13}
                color={isActive ? '#fff' : colors.mutedForeground}
              />
              <Text style={[styles.filterText, { color: isActive ? '#fff' : colors.mutedForeground }]}>
                {f.label}
              </Text>
              {count > 0 && (
                <View style={[styles.filterBadge, { backgroundColor: isActive ? 'rgba(255,255,255,0.35)' : colors.primary }]}>
                  <Text style={styles.filterBadgeText}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {unreadCount > 0 && (
        <TouchableOpacity
          style={[styles.markAllBanner, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); markAllRead(); }}
        >
          <Feather name="check-circle" size={14} color={colors.primary} />
          <Text style={[styles.markAllText, { color: colors.primary }]}>
            Mark all {unreadCount} as read
          </Text>
          <Feather name="chevron-right" size={14} color={colors.primary} />
        </TouchableOpacity>
      )}

      <FlatList
        data={flatData}
        keyExtractor={(item, idx) => {
          if (item.kind === 'header') return `hdr-${item.title}-${idx}`;
          if (item.kind === 'ad') return `ad-${item.adIndex}-${idx}`;
          return item.item.id;
        }}
        renderItem={({ item }) => {
          if (item.kind === 'header') {
            return (
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>
                  {item.title}
                </Text>
                <View style={[styles.sectionBadge, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.sectionBadgeText, { color: colors.mutedForeground }]}>
                    {item.count}
                  </Text>
                </View>
              </View>
            );
          }
          if (item.kind === 'ad') {
            return (
              <View style={{ paddingHorizontal: 14, paddingVertical: 4 }}>
                <AdCard index={item.adIndex} compact />
              </View>
            );
          }
          return (
            <NotificationRow
              item={item.item}
              onPress={handlePress}
              onDelete={deleteNotification}
            />
          );
        }}
        contentContainerStyle={{ paddingBottom: isWeb ? 34 : insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
              <Feather name="bell-off" size={36} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {activeFilter === 'all' ? 'All caught up!' : `No ${FILTERS.find(f => f.key === activeFilter)?.label} notifications`}
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {activeFilter === 'all'
                ? 'You\'re up to date. Notifications will appear here.'
                : 'Try a different filter to see other activity.'}
            </Text>
          </View>
        }
      />

      {filtered.length > 0 && (
        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background, paddingBottom: isWeb ? 8 : insets.bottom }]}>
          <Text style={[styles.footerHint, { color: colors.mutedForeground }]}>
            Long-press any notification to delete it
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 10, borderBottomWidth: 0.5, gap: 4 },
  headerBtn: { padding: 6, width: 36, alignItems: 'center' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  headerBadge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  headerBadgeText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_700Bold' },
  headerActions: { flexDirection: 'row', alignItems: 'center', width: 72, justifyContent: 'flex-end' },
  filterBar: { paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1 },
  filterText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  filterBadge: { minWidth: 17, height: 17, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  filterBadgeText: { color: '#fff', fontSize: 10, fontFamily: 'Inter_700Bold' },
  markAllBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 14, marginBottom: 6, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 9 },
  markAllText: { flex: 1, fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  sectionHeader: { fontSize: 12, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionBadge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  sectionBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 12 },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  typeIcon: { position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff' },
  textBlock: { flex: 1, gap: 4 },
  rowText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 19 },
  bold: { fontFamily: 'Inter_600SemiBold' },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  typeBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  timestamp: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  thumb: { width: 46, height: 46, borderRadius: 8, flexShrink: 0 },
  thumbPlaceholder: { width: 46, height: 46, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  deleteBtn: { width: 46, height: 46, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, position: 'absolute', right: 14, top: '50%', marginTop: -4 },
  empty: { marginTop: 80, alignItems: 'center', gap: 14, paddingHorizontal: 32 },
  emptyIcon: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 21 },
  footer: { borderTopWidth: 0.5, paddingVertical: 10, alignItems: 'center' },
  footerHint: { fontSize: 12, fontFamily: 'Inter_400Regular' },
});
