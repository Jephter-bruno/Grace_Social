import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AvatarCircle } from '@/components/AvatarCircle';
import { CommentsModal } from '@/components/CommentsModal';
import { Prayer, useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

const CATEGORY_ICONS: Record<string, string> = {
  health: 'activity',
  family: 'users',
  work: 'briefcase',
  faith: 'heart',
  gratitude: 'star',
};

const CATEGORY_COLORS: Record<string, string> = {
  health: '#27AE60',
  family: '#2980B9',
  work: '#F39C12',
  faith: '#E91E8C',
  gratitude: '#D4A843',
};

export function PrayerCard({ prayer }: { prayer: Prayer }) {
  const colors = useColors();
  const { togglePray } = useApp();
  const [commentsVisible, setCommentsVisible] = useState(false);
  const iconName = CATEGORY_ICONS[prayer.category] ?? 'heart';
  const catColor = CATEGORY_COLORS[prayer.category] ?? colors.accent;

  const handlePray = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    togglePray(prayer.id);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <AvatarCircle initials={prayer.userInitials} color={prayer.userColor} size={40} />
        <View style={styles.headerInfo}>
          <Text style={[styles.userName, { color: colors.foreground }]}>{prayer.userName}</Text>
          <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>{prayer.timestamp}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: catColor + '20', borderColor: catColor }]}>
          <Feather name={iconName as any} size={11} color={catColor} />
          <Text style={[styles.badgeText, { color: catColor }]}>
            {prayer.category.charAt(0).toUpperCase() + prayer.category.slice(1)}
          </Text>
        </View>
      </View>

      <Text style={[styles.request, { color: colors.foreground }]}>{prayer.request}</Text>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.prayBtn, { backgroundColor: prayer.isPraying ? colors.primary + '18' : colors.muted }]}
          onPress={handlePray}
          activeOpacity={0.7}
        >
          <Feather name="heart" size={15} color={prayer.isPraying ? colors.primary : colors.mutedForeground} />
          <Text style={[styles.prayText, { color: prayer.isPraying ? colors.primary : colors.mutedForeground }]}>
            {prayer.isPraying ? 'Praying' : 'Pray'} · {prayer.prayerCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.respondBtn}
          onPress={() => setCommentsVisible(true)}
        >
          <Feather name="message-circle" size={15} color={colors.mutedForeground} />
          <Text style={[styles.respondText, { color: colors.mutedForeground }]}>
            Respond{prayer.comments > 0 ? ` · ${prayer.comments}` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      <CommentsModal
        visible={commentsVisible}
        entityId={prayer.id}
        entityType="prayer"
        title="Prayer Responses"
        onClose={() => setCommentsVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginVertical: 6, borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerInfo: { flex: 1 },
  userName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  timestamp: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  request: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21 },
  footer: { flexDirection: 'row', gap: 12, paddingTop: 12, borderTopWidth: 1, alignItems: 'center' },
  prayBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  prayText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  respondBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  respondText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
});
