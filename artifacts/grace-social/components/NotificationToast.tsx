import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarCircle } from '@/components/AvatarCircle';
import { Notification, NotificationType, useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

const TYPE_META: Record<NotificationType, { icon: string; color: string }> = {
  like: { icon: 'heart', color: '#E53935' },
  comment: { icon: 'message-circle', color: '#4A90A4' },
  comment_like: { icon: 'heart', color: '#E53935' },
  follow: { icon: 'user-plus', color: '#27AE60' },
  mention: { icon: 'at-sign', color: '#8B5CF6' },
  share: { icon: 'share-2', color: '#F59E0B' },
  repost: { icon: 'repeat', color: '#3B82F6' },
  dm: { icon: 'send', color: '#06B6D4' },
  community_invite: { icon: 'users', color: '#4A90A4' },
  community_announcement: { icon: 'bell', color: '#F59E0B' },
  prayer_response: { icon: 'message-circle', color: '#D4A843' },
  prayer_pray: { icon: 'sun', color: '#D4A843' },
  verse_share: { icon: 'book-open', color: '#8B5CF6' },
};

let activeAutoClose: ReturnType<typeof setTimeout> | null = null;

export function NotificationToast() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const { notifications, markNotificationRead } = useApp();

  const [visible, setVisible] = useState(false);
  const [toast, setToast] = useState<Notification | null>(null);
  const lastIdRef = useRef<string | null>(null);
  const slideAnim = useRef(new Animated.Value(-110)).current;

  const show = (n: Notification) => {
    if (activeAutoClose) clearTimeout(activeAutoClose);
    setToast(n);
    setVisible(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 18,
      stiffness: 200,
    }).start();
    activeAutoClose = setTimeout(dismiss, 4500);
  };

  const dismiss = () => {
    if (activeAutoClose) clearTimeout(activeAutoClose);
    Animated.timing(slideAnim, {
      toValue: -110,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  const handlePress = () => {
    if (!toast) return;
    dismiss();
    markNotificationRead(toast.id);
    const tab = toast.targetTab ?? '/';
    setTimeout(() => router.replace(tab as any), 200);
  };

  useEffect(() => {
    if (!notifications.length) return;
    const newest = [...notifications].sort((a, b) => b.createdAt - a.createdAt)[0];
    if (!newest || newest.isRead) return;
    if (newest.id === lastIdRef.current) return;
    lastIdRef.current = newest.id;
    const delay = setTimeout(() => show(newest), 300);
    return () => clearTimeout(delay);
  }, [notifications]);

  if (!visible || !toast) return null;

  const meta = TYPE_META[toast.type];
  const topPad = isWeb ? 74 : insets.top + 8;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: topPad,
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: '#000',
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity style={styles.inner} onPress={handlePress} activeOpacity={0.85}>
        <View style={styles.avatarWrap}>
          <AvatarCircle initials={toast.userInitials} color={toast.userColor} size={40} />
          <View style={[styles.typeIcon, { backgroundColor: meta.color }]}>
            <Feather name={meta.icon as any} size={10} color="#fff" />
          </View>
        </View>

        <View style={styles.textWrap}>
          <Text style={[styles.text, { color: colors.foreground }]} numberOfLines={2}>
            <Text style={styles.bold}>{toast.userName}</Text>
            {'  '}
            {toast.message}
          </Text>
          <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>just now</Text>
        </View>

        <TouchableOpacity style={styles.closeBtn} onPress={dismiss}>
          <Feather name="x" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 9999,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 10,
  },
  inner: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  typeIcon: {
    position: 'absolute', bottom: -2, right: -2,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#fff',
  },
  textWrap: { flex: 1, gap: 1 },
  text: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  bold: { fontFamily: 'Inter_600SemiBold' },
  timestamp: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  closeBtn: { padding: 4, flexShrink: 0 },
});
