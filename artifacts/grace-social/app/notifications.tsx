import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import {
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
import { Notification, useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

function NotificationIcon({ type }: { type: Notification['type'] }) {
  const map: Record<Notification['type'], { name: string; color: string }> = {
    like: { name: 'heart', color: '#E53935' },
    comment: { name: 'message-circle', color: '#4A90A4' },
    prayer: { name: 'sun', color: '#D4A843' },
    follow: { name: 'user-plus', color: '#27AE60' },
  };
  const { name, color } = map[type];
  return (
    <View style={[styles.typeIcon, { backgroundColor: color }]}>
      <Feather name={name as any} size={11} color="#fff" />
    </View>
  );
}

function NotificationRow({ item, onPress }: { item: Notification; onPress: (n: Notification) => void }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[
        styles.row,
        { backgroundColor: item.isRead ? 'transparent' : colors.muted + 'CC' },
      ]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      {/* Avatar + type badge */}
      <View style={styles.avatarWrap}>
        <AvatarCircle initials={item.userInitials} color={item.userColor} size={44} />
        <NotificationIcon type={item.type} />
      </View>

      {/* Text */}
      <View style={styles.textBlock}>
        <Text style={[styles.rowText, { color: colors.foreground }]} numberOfLines={2}>
          <Text style={styles.bold}>{item.userName}</Text>{' '}{item.message}
        </Text>
        <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>
          {item.timestamp}
        </Text>
      </View>

      {/* Post thumbnail */}
      {item.postImageIndex !== undefined ? (
        <Image
          source={POST_IMAGES[item.postImageIndex]}
          style={styles.thumb}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.thumbPlaceholder, { backgroundColor: colors.muted }]}>
          <Feather
            name={item.type === 'follow' ? 'user' : item.type === 'prayer' ? 'sun' : 'heart'}
            size={18}
            color={colors.mutedForeground}
          />
        </View>
      )}

      {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { notifications, markAllRead, markNotificationRead } = useApp();
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    const timer = setTimeout(() => markAllRead(), 3000);
    return () => clearTimeout(timer);
  }, [markAllRead]);

  const handlePress = useCallback((notification: Notification) => {
    markNotificationRead(notification.id);
    const tab = notification.targetTab ?? '/';
    router.back();
    setTimeout(() => router.replace(tab as any), 150);
  }, [markNotificationRead]);

  const sections: { title: string; data: Notification[] }[] = [];
  const newItems = notifications.filter((n) => !n.isRead);
  const todayItems = notifications.filter((n) => n.isRead && !n.timestamp.includes('d ago'));
  const earlierItems = notifications.filter((n) => n.isRead && n.timestamp.includes('d ago'));
  if (newItems.length) sections.push({ title: 'New', data: newItems });
  if (todayItems.length) sections.push({ title: 'Today', data: todayItems });
  if (earlierItems.length) sections.push({ title: 'Earlier', data: earlierItems });

  const flatData: Array<{ type: 'header'; title: string } | { type: 'item'; item: Notification }> = [];
  for (const section of sections) {
    flatData.push({ type: 'header', title: section.title });
    for (const item of section.data) flatData.push({ type: 'item', item });
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: isWeb ? 67 : insets.top, backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Notifications</Text>
        <TouchableOpacity style={styles.backBtn} onPress={markAllRead}>
          <Feather name="check-circle" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={flatData}
        keyExtractor={(item, idx) =>
          item.type === 'header' ? `header-${item.title}` : item.item.id
        }
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>
                {item.title}
              </Text>
            );
          }
          return <NotificationRow item={item.item} onPress={handlePress} />;
        }}
        contentContainerStyle={{ paddingBottom: isWeb ? 34 : insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="bell-off" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>All caught up!</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No new notifications right now.
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
  backBtn: { padding: 4, width: 36 },
  title: { flex: 1, fontSize: 18, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  sectionHeader: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 6, fontSize: 13, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 12 },
  avatarWrap: { position: 'relative' },
  typeIcon: { position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff' },
  textBlock: { flex: 1, gap: 2 },
  rowText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 19 },
  bold: { fontFamily: 'Inter_600SemiBold' },
  timestamp: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  thumb: { width: 46, height: 46, borderRadius: 8 },
  thumbPlaceholder: { width: 46, height: 46, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, position: 'absolute', right: 14, top: '50%', marginTop: -4 },
  empty: { marginTop: 80, alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingHorizontal: 40 },
});
