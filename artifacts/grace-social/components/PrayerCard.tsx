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

const CATEGORY_COLORS: Record<string, string> = {
  health: '#E91E8C',
  family: '#2980B9',
  work: '#F39C12',
  faith: '#8E44AD',
  gratitude: '#27AE60',
};

export function PrayerCard({ prayer }: { prayer: Prayer }) {
  const colors = useColors();
  const { togglePray, addPrayerComment } = useApp();
  const { currentUser } = useAuth();
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [versePickerVisible, setVersePickerVisible] = useState(false);
  const [verseReactions, setVerseReactions] = useState<{ reference: string; text: string }[]>([]);
  const catColor = CATEGORY_COLORS[prayer.category] ?? colors.accent;
  const catLabel = prayer.category.charAt(0).toUpperCase() + prayer.category.slice(1);

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
      {/* Header row: avatar + name/date + category badge */}
      <View style={styles.header}>
        <AvatarCircle initials={prayer.userInitials} color={prayer.userColor} size={42} />
        <View style={styles.headerInfo}>
          <Text style={[styles.userName, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">{prayer.userName}</Text>
          <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>{prayer.timestamp}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: catColor }]}>
          <Text style={styles.badgeText}>{catLabel}</Text>
        </View>
      </View>

      {/* Title */}
      {prayer.title ? (
        <Text style={[styles.title, { color: colors.foreground }]}>{prayer.title}</Text>
      ) : null}

      {/* Request body */}
      <Text style={[styles.request, { color: colors.mutedForeground }]}>{prayer.request}</Text>

      {/* Scripture reactions */}
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

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity style={styles.footerBtn} onPress={handlePray} activeOpacity={0.7}>
          <Text style={[styles.footerIcon]}>🕊</Text>
          <Text style={[styles.footerText, { color: prayer.isPraying ? '#E07A54' : colors.mutedForeground }]}>
            {prayer.prayerCount} Praying
          </Text>
        </TouchableOpacity>

        <View style={[styles.footerDivider, { backgroundColor: colors.border }]} />

        <TouchableOpacity
          style={styles.footerBtn}
          onPress={() => setCommentsVisible(true)}
          activeOpacity={0.7}
        >
          <Feather name="message-circle" size={15} color={colors.mutedForeground} />
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            Comment{prayer.comments > 0 ? ` (${prayer.comments})` : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.verseBtn}
          onPress={() => setVersePickerVisible(true)}
          activeOpacity={0.7}
        >
          <Feather name="book-open" size={14} color={colors.mutedForeground} />
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
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerInfo: { flex: 1, minWidth: 0 },
  userName: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  timestamp: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    flexShrink: 0,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  title: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    lineHeight: 22,
  },
  request: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
  },
  verseReactions: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 8 },
  verseReactionsHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  verseReactionsLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  verseReactionItem: { borderLeftWidth: 2.5, paddingLeft: 10, gap: 2 },
  verseReactionRef: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  verseReactionText: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerIcon: { fontSize: 15 },
  footerText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  footerDivider: {
    width: 1,
    height: 16,
  },
  verseBtn: {
    marginLeft: 'auto',
    padding: 4,
  },
});
