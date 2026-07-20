import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarCircle } from '@/components/AvatarCircle';
import { useColors } from '@/hooks/useColors';

// ─── Data model ────────────────────────────────────────────────────────────────

interface CircleMember {
  id: string;
  displayName: string;  // full name shown below avatar
  initials: string;
  color: string;
  streakDays: number;
  prayedToday: boolean;
  isYou?: boolean;
}

interface PrayerCircle {
  id: string;
  name: string;
  streakDays: number;
  members: CircleMember[];
  myPrayedToday: boolean;   // whether the current user has prayed today
  groupPrayerList: string[];
}

const INITIAL_CIRCLES: PrayerCircle[] = [
  {
    id: 'c1',
    name: 'Morning Warriors',
    streakDays: 14,
    myPrayedToday: false,
    groupPrayerList: [
      "Healing for Sarah's mom",
      "Strength for James's job search",
      'Peace over Mark's family situation',
    ],
    members: [
      { id: 'm0', displayName: 'You',        initials: 'Y',  color: '#4A90A4', streakDays: 14, prayedToday: false, isYou: true },
      { id: 'm1', displayName: 'Sarah M.',   initials: 'SM', color: '#E91E8C', streakDays: 12, prayedToday: true },
      { id: 'm2', displayName: 'Pastor Tim', initials: 'PT', color: '#D4A843', streakDays: 14, prayedToday: true },
      { id: 'm3', displayName: 'James K.',   initials: 'JK', color: '#2980B9', streakDays: 10, prayedToday: false },
      { id: 'm4', displayName: 'Grace B.',   initials: 'GB', color: '#27AE60', streakDays: 14, prayedToday: true },
      { id: 'm5', displayName: 'Mark L.',    initials: 'ML', color: '#8E44AD', streakDays:  8, prayedToday: true },
      { id: 'm6', displayName: 'Hope W.',    initials: 'HW', color: '#E74C3C', streakDays: 11, prayedToday: false },
    ],
  },
];

const CORAL = '#E07A54';

// ─── Helper: ring-wrapped avatar ───────────────────────────────────────────────
function ChainAvatar({ member, size = 58 }: { member: CircleMember; size?: number }) {
  const ringSize = size + 6;
  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <View
        style={{
          width: ringSize,
          height: ringSize,
          borderRadius: ringSize / 2,
          borderWidth: member.prayedToday ? 2.5 : 0,
          borderColor: '#E8B94A',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AvatarCircle initials={member.initials} color={member.color} size={size} />
      </View>
      <Text style={styles.chainName}>{member.displayName}</Text>
      <Text style={styles.chainStreak}>🔥 {member.streakDays}</Text>
    </View>
  );
}

// ─── Detail screen ─────────────────────────────────────────────────────────────
function CircleDetail({
  circle,
  onBack,
  onTogglePrayed,
}: {
  circle: PrayerCircle;
  onBack: () => void;
  onTogglePrayed: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = (isWeb ? 67 : insets.top) + 8;

  const allMembers = circle.members.map((m) =>
    m.isYou ? { ...m, prayedToday: circle.myPrayedToday } : m
  );
  const prayedCount = allMembers.filter((m) => m.prayedToday).length;

  // Split into rows of 4 and 3
  const row1 = allMembers.slice(0, 4);
  const row2 = allMembers.slice(4);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>{circle.name}</Text>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: isWeb ? 40 : insets.bottom + 40 }}
      >
        {/* Streak card */}
        <View style={[styles.streakCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.streakLeft}>
            <Text style={styles.streakFlame}>🔥</Text>
            <Text style={[styles.streakText, { color: colors.foreground }]}>
              {circle.streakDays} Day Group Streak
            </Text>
          </View>
          <View style={styles.streakRight}>
            <Feather name="users" size={14} color={colors.mutedForeground} />
            <Text style={[styles.streakMembers, { color: colors.mutedForeground }]}>
              {circle.members.length} members
            </Text>
          </View>
        </View>

        {/* Prayer chain */}
        <View style={[styles.chainCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.chainLabel, { color: colors.mutedForeground }]}>PRAYER CHAIN</Text>

          {/* Row 1 */}
          <View style={styles.chainRow}>
            {row1.map((m, i) => (
              <React.Fragment key={m.id}>
                <ChainAvatar member={m} />
                {i < row1.length - 1 && (
                  <View style={[styles.chainLine, { backgroundColor: colors.border }]} />
                )}
              </React.Fragment>
            ))}
          </View>

          {/* Row 2 */}
          {row2.length > 0 && (
            <View style={styles.chainRow}>
              {row2.map((m, i) => (
                <React.Fragment key={m.id}>
                  <ChainAvatar member={m} />
                  {i < row2.length - 1 && (
                    <View style={[styles.chainLine, { backgroundColor: colors.border }]} />
                  )}
                </React.Fragment>
              ))}
            </View>
          )}

          <Text style={[styles.prayedCount, { color: colors.mutedForeground }]}>
            {prayedCount} of {circle.members.length} prayed today
          </Text>
        </View>

        {/* I Prayed button */}
        <TouchableOpacity
          style={[
            styles.prayedBtn,
            {
              backgroundColor: circle.myPrayedToday
                ? '#2D4A3E'
                : CORAL,
              borderColor: circle.myPrayedToday ? '#3D6B58' : 'transparent',
            },
          ]}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onTogglePrayed();
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.prayedBtnText}>
            {circle.myPrayedToday
              ? '✓  Prayer logged for today  ✓'
              : '🔥  I Prayed Today'}
          </Text>
        </TouchableOpacity>

        {/* Group prayer list */}
        <View style={[styles.prayerListCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.prayerListHeader}>
            <Text style={styles.prayerListEmoji}>🙏</Text>
            <Text style={[styles.prayerListLabel, { color: colors.foreground }]}>GROUP PRAYER LIST</Text>
          </View>
          {circle.groupPrayerList.map((item, i) => (
            <View key={i} style={[styles.prayerListItem, { borderTopColor: colors.border }]}>
              <Text style={[styles.prayerListIcon, { color: CORAL }]}>✝</Text>
              <Text style={[styles.prayerListText, { color: colors.foreground }]}>{item}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── List screen ──────────────────────────────────────────────────────────────
function CircleList({
  circles,
  onSelect,
}: {
  circles: PrayerCircle[];
  onSelect: (id: string) => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = (isWeb ? 67 : insets.top) + 8;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Prayer Circles</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          {/* invisible spacer on left, back nav via device */}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: isWeb ? 40 : insets.bottom + 40 }}
      >
        {/* Description */}
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          Small private groups committed to praying for each other every day. Stay accountable with streak tracking.
        </Text>

        {/* Circle cards */}
        {circles.map((circle) => {
          const allMembers = circle.members.map((m) =>
            m.isYou ? { ...m, prayedToday: circle.myPrayedToday } : m
          );
          const prayedCount = allMembers.filter((m) => m.prayedToday).length;
          // Show up to 5 avatars + overflow
          const shown = allMembers.slice(0, 5);
          const overflow = allMembers.length - shown.length;

          return (
            <TouchableOpacity
              key={circle.id}
              style={[styles.circleCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => onSelect(circle.id)}
              activeOpacity={0.8}
            >
              <View style={styles.circleCardTop}>
                <View>
                  <Text style={[styles.circleName, { color: colors.foreground }]}>{circle.name}</Text>
                  <Text style={[styles.circleMembers, { color: colors.mutedForeground }]}>
                    {circle.members.length} members
                  </Text>
                </View>
                <View style={[styles.streakBadge, { backgroundColor: colors.muted }]}>
                  <Text style={styles.streakBadgeFlame}>🔥</Text>
                  <Text style={[styles.streakBadgeNum, { color: colors.foreground }]}>
                    {circle.streakDays}
                  </Text>
                </View>
              </View>

              <View style={styles.circleCardBottom}>
                <View style={styles.avatarRow}>
                  {shown.map((m) => (
                    <View
                      key={m.id}
                      style={[
                        styles.avatarRingWrap,
                        {
                          borderColor: m.prayedToday ? '#E8B94A' : colors.border,
                          borderWidth: 2,
                        },
                      ]}
                    >
                      <AvatarCircle initials={m.initials} color={m.color} size={36} />
                    </View>
                  ))}
                  {overflow > 0 && (
                    <View style={[styles.avatarRingWrap, styles.overflowBubble, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                      <Text style={[styles.overflowText, { color: colors.mutedForeground }]}>+{overflow}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.prayedTodayText, { color: colors.mutedForeground }]}>
                  {prayedCount}/{circle.members.length} prayed{'\n'}today
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Create circle card */}
        <TouchableOpacity
          style={[styles.createCard, { borderColor: CORAL + '80', backgroundColor: colors.card }]}
          activeOpacity={0.8}
        >
          <View style={[styles.createPlus, { backgroundColor: colors.muted }]}>
            <Feather name="plus" size={24} color={colors.foreground} />
          </View>
          <Text style={[styles.createTitle, { color: CORAL }]}>Create a Prayer Circle</Text>
          <Text style={[styles.createSub, { color: colors.mutedForeground }]}>
            Invite 3-12 friends to pray together
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ─── Root screen ──────────────────────────────────────────────────────────────
export default function PrayerGroupsScreen() {
  const [circles, setCircles] = useState<PrayerCircle[]>(INITIAL_CIRCLES);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = circles.find((c) => c.id === selectedId) ?? null;

  const handleTogglePrayed = () => {
    if (!selectedId) return;
    setCircles((prev) =>
      prev.map((c) =>
        c.id === selectedId ? { ...c, myPrayedToday: !c.myPrayedToday } : c
      )
    );
  };

  if (selected) {
    return (
      <CircleDetail
        circle={selected}
        onBack={() => setSelectedId(null)}
        onTogglePrayed={handleTogglePrayed}
      />
    );
  }

  return (
    <CircleList
      circles={circles}
      onSelect={(id) => setSelectedId(id)}
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  // shared header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
  },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  backBtn: { padding: 4 },

  // list
  description: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 21,
  },
  circleCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  circleCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  circleName: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  circleMembers: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  streakBadgeFlame: { fontSize: 13 },
  streakBadgeNum: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  circleCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarRow: { flexDirection: 'row', gap: 4 },
  avatarRingWrap: {
    borderRadius: 22,
    padding: 1,
  },
  overflowBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  overflowText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  prayedTodayText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'right',
    lineHeight: 18,
  },

  // create card
  createCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    padding: 28,
    alignItems: 'center',
    gap: 10,
  },
  createPlus: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  createSub: { fontSize: 13, fontFamily: 'Inter_400Regular' },

  // detail — streak
  streakCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  streakFlame: { fontSize: 20 },
  streakText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  streakRight: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  streakMembers: { fontSize: 13, fontFamily: 'Inter_400Regular' },

  // detail — prayer chain
  chainCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 16,
  },
  chainLabel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  chainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  chainLine: {
    width: 20,
    height: 2,
    borderRadius: 1,
    marginHorizontal: 2,
    alignSelf: 'center',
    marginBottom: 32,  // offset to align with avatar center, not name/streak
  },
  chainName: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: '#9D9188',
    textAlign: 'center',
    maxWidth: 64,
  },
  chainStreak: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#9D9188',
    textAlign: 'center',
  },
  prayedCount: {
    textAlign: 'center',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },

  // detail — prayed button
  prayedBtn: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'transparent',
  },
  prayedBtnText: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    letterSpacing: 0.2,
  },

  // detail — prayer list
  prayerListCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  prayerListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    paddingBottom: 10,
  },
  prayerListEmoji: { fontSize: 16 },
  prayerListLabel: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  prayerListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderTopWidth: 0.5,
  },
  prayerListIcon: { fontSize: 14 },
  prayerListText: { fontSize: 14, fontFamily: 'Inter_400Regular', flex: 1 },
});
