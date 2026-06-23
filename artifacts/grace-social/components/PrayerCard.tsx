import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AvatarCircle } from '@/components/AvatarCircle';
import { CommentsModal } from '@/components/CommentsModal';
import { VersePickerModal } from '@/components/VersePickerModal';
import { Prayer, useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
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
  const { togglePray, addPrayerComment } = useApp();
  const { currentUser } = useAuth();
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [versePickerVisible, setVersePickerVisible] = useState(false);
  const [verseReactions, setVerseReactions] = useState<{ reference: string; text: string }[]>([]);
  const iconName = CATEGORY_ICONS[prayer.category] ?? 'heart';
  const catColor = CATEGORY_COLORS[prayer.category] ?? colors.accent;

  const handlePray = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    togglePray(prayer.id);
  };

  const handleVerseSelect = (verse: { reference: string; text: string }) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setVerseReactions((prev) => [...prev, verse]);
    const userInfo = currentUser
      ? { userName: currentUser.displayName || currentUser.name, userInitials: currentUser.initials, userColor: currentUser.color }
      : undefined;
    addPrayerComment(prayer.id, `📖 ${verse.reference}: "${verse.text}"`, userInfo);
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

      {verseReactions.length > 0 && (
        <View style={[styles.verseReactions, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <View style={styles.verseReactionsHeader}>
            <Feather name="book-open" size={12} color={colors.primary} />
            <Text style={[styles.verseReactionsLabel, { color: colors.primary }]}>Scripture Responses</Text>
          </View>
          {verseReactions.map((v, i) => (
            <View key={i} style={[styles.verseReactionItem, { borderLeftColor: colors.primary }]}>
              <Text style={[styles.verseReactionRef, { color: colors.primary }]}>{v.reference}</Text>
              <Text style={[styles.verseReactionText, { color: colors.foreground }]} numberOfLines={2}>"{v.text}"</Text>
            </View>
          ))}
        </View>
      )}

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

        <TouchableOpacity
          style={[styles.verseBtn, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '50' }]}
          onPress={() => setVersePickerVisible(true)}
        >
          <Feather name="book-open" size={14} color={colors.accent} />
          <Text style={[styles.verseBtnText, { color: colors.accent }]}>Verse</Text>
        </TouchableOpacity>
      </View>

      <CommentsModal
        visible={commentsVisible}
        entityId={prayer.id}
        entityType="prayer"
        title="Prayer Responses"
        onClose={() => setCommentsVisible(false)}
      />

      <VersePickerModal
        visible={versePickerVisible}
        onClose={() => setVersePickerVisible(false)}
        onSelect={handleVerseSelect}
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
  verseReactions: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 8 },
  verseReactionsHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  verseReactionsLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  verseReactionItem: { borderLeftWidth: 2.5, paddingLeft: 10, gap: 2 },
  verseReactionRef: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  verseReactionText: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  footer: { flexDirection: 'row', gap: 8, paddingTop: 12, borderTopWidth: 1, alignItems: 'center' },
  prayBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  prayText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  respondBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  respondText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  verseBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1 },
  verseBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
});
