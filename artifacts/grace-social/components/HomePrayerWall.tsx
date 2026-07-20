import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AvatarCircle } from '@/components/AvatarCircle';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

const PRAYING_GREEN = '#16A085';

export function HomePrayerWall() {
  const { prayers, togglePray } = useApp();
  const colors = useColors();

  // Show top 2 prayers by prayerCount
  const topPrayers = [...prayers]
    .sort((a, b) => b.prayerCount - a.prayerCount)
    .slice(0, 2);

  return (
    <View style={[styles.section, { backgroundColor: colors.background }]}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Text style={styles.prayEmoji}>🙏</Text>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Prayer Wall</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/prayer')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.viewAll, { color: colors.primary }]}>View All →</Text>
        </TouchableOpacity>
      </View>

      {/* Prayer items */}
      <View style={styles.cardList}>
        {topPrayers.map((prayer) => (
          <TouchableOpacity
            key={prayer.id}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.85}
            onPress={() => router.push('/(tabs)/prayer')}
          >
            {/* Avatar */}
            <AvatarCircle
              initials={prayer.userInitials}
              color={prayer.userColor}
              size={44}
            />

            {/* Text */}
            <View style={styles.textBlock}>
              <Text style={[styles.prayerTitle, { color: colors.foreground }]} numberOfLines={1}>
                {prayer.title ?? prayer.request}
              </Text>
              <Text style={[styles.prayerCount, { color: colors.mutedForeground }]}>
                {prayer.prayerCount} praying
              </Text>
            </View>

            {/* I'm Praying button */}
            <TouchableOpacity
              style={[
                styles.prayBtn,
                prayer.isPraying
                  ? { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: PRAYING_GREEN }
                  : { backgroundColor: PRAYING_GREEN },
              ]}
              onPress={(e) => {
                e.stopPropagation?.();
                togglePray(prayer.id);
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.prayBtnText,
                  prayer.isPraying ? { color: PRAYING_GREEN } : { color: '#fff' },
                ]}
              >
                {prayer.isPraying ? 'Praying ✓' : "I'm Praying"}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingTop: 20,
    paddingBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  prayEmoji: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
  },
  viewAll: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  cardList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  textBlock: {
    flex: 1,
    gap: 3,
  },
  prayerTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 19,
  },
  prayerCount: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  prayBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    minWidth: 96,
    alignItems: 'center',
  },
  prayBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
});
