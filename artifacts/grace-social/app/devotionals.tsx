import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DayContent {
  day: number;
  title: string;
  verse: string;
  reference: string;
  reflection: string;
  prayer: string;
}

interface ActivePlan {
  id: string;
  title: string;
  category: string;
  description: string;
  totalDays: number;
  currentDay: number;
  completedDays: Set<number>;
  streakDays: number;
  imageUrl: string;
  days: DayContent[];
  enrolled: number;
}

interface DiscoverPlan {
  id: string;
  title: string;
  category: string;
  description: string;
  totalDays: number;
  enrolled: number;
  imageUrl: string;
  dayTitles: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  Prayer: '#4A90A4',
  Faith: '#D4A843',
  Scripture: '#9B59B6',
  Healing: '#27AE60',
  Gratitude: '#E07A54',
  Worship: '#E91E8C',
};

const CATEGORIES = ['Gratitude', 'Prayer', 'Faith', 'Scripture', 'Healing', 'Worship'];

// ─── Gratitude plan days (matching screenshots) ───────────────────────────────

const GRATITUDE_DAYS: DayContent[] = [
  {
    day: 1,
    title: 'The Foundation of Gratitude',
    verse: '"Give thanks to the Lord, for he is good; his love endures forever."',
    reference: 'Psalm 107:1',
    reflection: 'Begin this week by pausing to acknowledge the goodness of God. What has He done for you recently that you haven\'t fully thanked Him for? Take five minutes to write down three specific blessings, then lift them up in a prayer of gratitude.',
    prayer: 'Lord, thank You for Your unfailing goodness. Open my eyes to see Your blessings in the ordinary moments of today. May a spirit of thanksgiving fill my heart. Amen.',
  },
  {
    day: 2,
    title: 'Gratitude Changes Everything',
    verse: '"Give thanks in all circumstances; for this is God\'s will for you in Christ Jesus."',
    reference: '1 Thessalonians 5:18',
    reflection: 'Gratitude doesn\'t mean pretending everything is perfect. It means choosing to trust that God is working even in difficult seasons. What challenging circumstance in your life right now can you choose to be grateful through?',
    prayer: 'Father, teach me to give thanks even when I don\'t feel like it. I trust that You are working all things together for good in my life. Amen.',
  },
  {
    day: 3,
    title: 'A Grateful Heart in Community',
    verse: '"Every good and perfect gift is from above, coming down from the Father of the heavenly lights."',
    reference: 'James 1:17',
    reflection: 'Take stock of the gifts in your life — relationships, health, abilities, opportunities. All of them trace back to one Source. How does recognizing God as the giver of all good things change how you hold what you have?',
    prayer: 'Generous Father, I acknowledge that every good thing in my life is a gift from You. Help me to hold these gifts with open hands, always ready to give back to You. Amen.',
  },
  {
    day: 4,
    title: 'Gratitude as Worship',
    verse: '"Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God."',
    reference: 'Philippians 4:6–7',
    reflection: 'Anxiety and gratitude cannot fully coexist. When we bring our worries to God wrapped in thanksgiving, something supernatural happens — His peace begins to guard us. Today, identify one area of anxiety and consciously exchange it for thanksgiving.',
    prayer: 'Prince of Peace, I lay down my anxious thoughts and choose gratitude. Thank You that Your peace is not circumstantial. Guard my heart and mind today. Amen.',
  },
  {
    day: 5,
    title: 'Remembering God\'s Faithfulness',
    verse: '"I will give thanks to you, Lord, with all my heart; I will tell of all your wonderful deeds."',
    reference: 'Psalm 9:1',
    reflection: 'The psalmist chose to give thanks with his whole heart — not just in calm moments but through storms and battles. Your praise has power. Whose life could you encourage today by sharing what God has done for you?',
    prayer: 'Lord, I will praise You with all that is within me. Let my life be a testimony of Your faithfulness to those around me. Amen.',
  },
  {
    day: 6,
    title: 'The Language of Praise',
    verse: '"Do not conform to the pattern of this world, but be transformed by the renewing of your mind."',
    reference: 'Romans 12:2',
    reflection: 'Gratitude is a posture that must be cultivated. Our culture trains us to focus on what we lack. God\'s Word calls us to be transformed — to think differently. What thought patterns do you need to surrender so gratitude can flourish?',
    prayer: 'Transform my thinking, Lord. Help me to see my life through Your lens — one of abundance, purpose, and grace. Renew my mind today. Amen.',
  },
  {
    day: 7,
    title: 'Living a Thankful Life',
    verse: '"Let everything that has breath praise the Lord. Praise the Lord."',
    reference: 'Psalm 150:6',
    reflection: 'You\'ve reached the final day of this plan. Gratitude is not a practice for certain seasons — it\'s a way of life. How will you carry this spirit of thanksgiving beyond these seven days? Commit to one daily practice of gratitude going forward.',
    prayer: 'Lord, may every breath I take be an act of worship. May gratitude become the rhythm of my life. Thank You for these 7 days of drawing closer to You. Amen.',
  },
];

// ─── Discover plans ───────────────────────────────────────────────────────────

const DISCOVER_PLANS: DiscoverPlan[] = [
  {
    id: 'dp1',
    title: '30 Days of Prayer',
    category: 'Prayer',
    description: 'Deepen your prayer life through scripture, reflection, and guided moments of communion with God.',
    totalDays: 30,
    enrolled: 12304,
    imageUrl: 'https://picsum.photos/seed/prayer-path-autumn/600/300',
    dayTitles: ['Why We Pray', 'Praying with Expectation', "The Lord's Prayer", 'Intercession for Others', 'Praying in the Spirit', 'Gratitude as Prayer', 'Prayers of Confession'],
  },
  {
    id: 'dp2',
    title: '21 Days of Faith',
    category: 'Faith',
    description: 'Build an unshakeable faith as you explore what it means to walk confidently in God\'s promises every single day.',
    totalDays: 21,
    enrolled: 9817,
    imageUrl: 'https://picsum.photos/seed/faith-mountain-light/600/300',
    dayTitles: ['What is Faith?', 'Faith Over Fear', 'The Faith Hall of Fame', 'Mountain-Moving Faith', 'Faith in the Wilderness', "Trusting God's Timing", 'Faith and Works Together'],
  },
  {
    id: 'dp3',
    title: '14 Days of Psalms',
    category: 'Scripture',
    description: 'Journey through the Psalms and discover prayers for every human emotion — from sorrow to soaring praise.',
    totalDays: 14,
    enrolled: 7453,
    imageUrl: 'https://picsum.photos/seed/psalms-river-golden/600/300',
    dayTitles: ['Psalm of Praise', 'Lament and Hope', 'God the Shepherd', 'Praising Through Pain', 'Creation Declares His Glory', 'The Righteous Path', 'Songs of Ascent'],
  },
  {
    id: 'dp4',
    title: '30 Days of Healing',
    category: 'Healing',
    description: "Let God's word bring wholeness to body, mind, and spirit. A journey of restoration, hope, and divine healing.",
    totalDays: 30,
    enrolled: 5621,
    imageUrl: 'https://picsum.photos/seed/healing-sunrise-warm/600/300',
    dayTitles: ['God Is Our Healer', 'Healing of the Heart', 'Restoration of Hope', 'Healing Through Forgiveness', "God's Perfect Peace", 'Strength in Weakness', 'The Great Physician'],
  },
];

// ─── Day Reader Modal ─────────────────────────────────────────────────────────

function DayReaderModal({
  visible, plan, dayIndex, completedDays, onMarkComplete, onClose,
}: {
  visible: boolean; plan: ActivePlan | null; dayIndex: number;
  completedDays: Set<number>; onMarkComplete: (day: number) => void; onClose: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  if (!plan) return null;
  const dayContent = plan.days[dayIndex];
  if (!dayContent) return null;
  const isCompleted = completedDays.has(dayContent.day);
  const accentColor = CATEGORY_COLORS[plan.category] ?? '#4A90A4';

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[drStyles.container, { backgroundColor: colors.background }]}>
        <View style={[drStyles.header, { paddingTop: (isWeb ? 20 : insets.top) + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="x" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View style={drStyles.headerMeta}>
            <Text style={[drStyles.headerPlan, { color: colors.mutedForeground }]} numberOfLines={1}>{plan.title}</Text>
            <Text style={[drStyles.headerDay, { color: colors.foreground }]}>Day {dayContent.day} of {plan.totalDays}</Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[drStyles.scroll, { paddingBottom: (isWeb ? 24 : insets.bottom) + 40 }]}>
          <Text style={[drStyles.dayTitle, { color: colors.foreground }]}>{dayContent.title}</Text>
          <View style={[drStyles.verseBlock, { borderLeftColor: accentColor, backgroundColor: colors.card }]}>
            <Text style={[drStyles.verseText, { color: colors.foreground }]}>{dayContent.verse}</Text>
            <Text style={[drStyles.verseRef, { color: accentColor }]}>— {dayContent.reference}</Text>
          </View>
          <Text style={[drStyles.sectionLabel, { color: colors.mutedForeground }]}>TODAY'S REFLECTION</Text>
          <Text style={[drStyles.reflectionText, { color: colors.foreground }]}>{dayContent.reflection}</Text>
          <Text style={[drStyles.sectionLabel, { color: colors.mutedForeground }]}>CLOSING PRAYER</Text>
          <View style={[drStyles.prayerBlock, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[drStyles.prayerText, { color: colors.foreground }]}>{dayContent.prayer}</Text>
          </View>
          <TouchableOpacity
            style={[drStyles.completeBtn, { backgroundColor: isCompleted ? '#27AE60' : accentColor }]}
            activeOpacity={0.85}
            onPress={() => { if (!isCompleted) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onMarkComplete(dayContent.day); } }}
            disabled={isCompleted}
          >
            <Feather name={isCompleted ? 'check-circle' : 'check'} size={20} color="#fff" />
            <Text style={drStyles.completeBtnText}>{isCompleted ? 'Day Completed ✓' : 'Mark Day Complete'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const drStyles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingBottom: 14, borderBottomWidth: 0.5, gap: 12 },
  headerMeta: { flex: 1, alignItems: 'center' },
  headerPlan: { fontSize: 12, fontFamily: 'Inter_400Regular', textTransform: 'uppercase', letterSpacing: 0.6 },
  headerDay: { fontSize: 16, fontFamily: 'Inter_700Bold', marginTop: 2 },
  scroll: { paddingHorizontal: 20, paddingTop: 24 },
  dayTitle: { fontSize: 26, fontFamily: 'Inter_700Bold', marginBottom: 20, lineHeight: 32 },
  verseBlock: { borderLeftWidth: 4, borderRadius: 10, padding: 16, marginBottom: 28, gap: 10 },
  verseText: { fontSize: 16, fontFamily: 'Inter_400Regular', fontStyle: 'italic', lineHeight: 26 },
  verseRef: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 1.2, marginBottom: 10, textTransform: 'uppercase' },
  reflectionText: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 26, marginBottom: 28 },
  prayerBlock: { borderRadius: 12, padding: 16, marginBottom: 32, borderWidth: 1 },
  prayerText: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 25, fontStyle: 'italic' },
  completeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14 },
  completeBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});

// ─── Plan Detail Modal (day list — screenshot 2) ──────────────────────────────

function PlanDetailModal({
  visible, plan, onOpenDay, onClose,
}: {
  visible: boolean; plan: ActivePlan | null; onOpenDay: (dayIndex: number) => void; onClose: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  if (!plan) return null;

  const accent = CATEGORY_COLORS[plan.category] ?? '#4A90A4';
  const completedCount = plan.completedDays.size;
  const initial = plan.title.charAt(0).toUpperCase();

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[pdStyles.container, { backgroundColor: colors.background }]}>

        {/* ── Hero image ── */}
        <View style={pdStyles.hero}>
          <Image source={{ uri: plan.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient colors={['rgba(0,0,0,0.22)', 'rgba(0,0,0,0.68)']} style={StyleSheet.absoluteFill} />

          {/* Header row */}
          <View style={[pdStyles.heroHeader, { paddingTop: isWeb ? 20 : insets.top }]}>
            <View style={pdStyles.initialBadge}>
              <Text style={pdStyles.initialText}>{initial}</Text>
            </View>
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={onClose} style={pdStyles.backBtn}>
              <Feather name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Plan info */}
          <View style={pdStyles.heroInfo}>
            <Text style={pdStyles.heroCat}>{plan.category}</Text>
            <Text style={pdStyles.heroTitle}>{plan.title}</Text>
          </View>
        </View>

        {/* ── Streak row ── */}
        <View style={[pdStyles.streakRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={pdStyles.streakLeft}>
            <Text style={pdStyles.streakFire}>🔥</Text>
            <Text style={[pdStyles.streakLabel, { color: colors.foreground }]}>
              {plan.streakDays} day streak
            </Text>
          </View>
          <Text style={[pdStyles.streakProgress, { color: colors.mutedForeground }]}>
            {completedCount} / {plan.totalDays} days
          </Text>
        </View>

        {/* ── Day list ── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[pdStyles.dayList, { paddingBottom: (isWeb ? 24 : insets.bottom) + 20 }]}
        >
          {plan.days.map((dayContent, i) => {
            const isCompleted = plan.completedDays.has(dayContent.day);
            const isCurrent = dayContent.day === plan.currentDay;
            const isFuture = !isCompleted && !isCurrent;

            return (
              <TouchableOpacity
                key={dayContent.day}
                style={[pdStyles.dayCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={isFuture ? 0.6 : 0.82}
                onPress={() => {
                  if (!isFuture) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onOpenDay(i);
                  }
                }}
              >
                {/* Left badge */}
                {(isCompleted || isCurrent) ? (
                  <View style={pdStyles.checkCircle}>
                    <Feather name="check" size={14} color="#fff" />
                  </View>
                ) : (
                  <View style={[pdStyles.numCircle, { backgroundColor: colors.muted }]}>
                    <Text style={[pdStyles.numText, { color: colors.mutedForeground }]}>{dayContent.day}</Text>
                  </View>
                )}

                {/* Title area */}
                <View style={pdStyles.dayCardContent}>
                  <Text
                    style={[
                      pdStyles.dayCardTitle,
                      { color: isCurrent ? accent : isFuture ? colors.mutedForeground : colors.foreground },
                    ]}
                    numberOfLines={1}
                  >
                    {dayContent.title}
                  </Text>
                  {isCurrent && (
                    <Text style={[pdStyles.todayLabel, { color: accent }]}>Today's reading</Text>
                  )}
                </View>

                {/* Right icon */}
                {isFuture ? (
                  <Text style={pdStyles.lockIcon}>🔒</Text>
                ) : (
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const pdStyles = StyleSheet.create({
  container: { flex: 1 },
  hero: { height: 190, position: 'relative', justifyContent: 'flex-end' },
  heroHeader: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingBottom: 0, zIndex: 10,
  },
  initialBadge: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  initialText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroInfo: { paddingHorizontal: 16, paddingBottom: 16, zIndex: 2 },
  heroCat: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 4 },
  heroTitle: { color: '#fff', fontSize: 22, fontFamily: 'Inter_700Bold', lineHeight: 28 },
  streakRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 14, marginTop: 14, marginBottom: 8,
    borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14,
  },
  streakLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  streakFire: { fontSize: 20 },
  streakLabel: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  streakProgress: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  dayList: { paddingHorizontal: 14, paddingTop: 8, gap: 10 },
  dayCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  checkCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#27AE60',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  numCircle: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  numText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  dayCardContent: { flex: 1, gap: 2 },
  dayCardTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', lineHeight: 20 },
  todayLabel: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  lockIcon: { fontSize: 16 },
});

// ─── Plan Preview Modal (Discover → Preview) ──────────────────────────────────

function PlanPreviewModal({
  visible, plan, onStartPlan, onClose,
}: {
  visible: boolean; plan: DiscoverPlan | null;
  onStartPlan: (plan: DiscoverPlan) => void; onClose: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  if (!plan) return null;
  const accent = CATEGORY_COLORS[plan.category] ?? '#4A90A4';

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[pvStyles.container, { backgroundColor: colors.background }]}>
        <View style={pvStyles.heroWrap}>
          <Image source={{ uri: plan.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.72)']} style={StyleSheet.absoluteFill} />
          <TouchableOpacity style={[pvStyles.closeBtn, { top: (isWeb ? 16 : insets.top) + 10 }]} onPress={onClose}>
            <Feather name="x" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={[pvStyles.heroCat, { backgroundColor: accent }]}>
            <Text style={pvStyles.heroCatText}>{plan.category}</Text>
          </View>
          <View style={pvStyles.heroBottom}>
            <Text style={pvStyles.heroTitle}>{plan.title}</Text>
            <View style={pvStyles.heroStats}>
              <Feather name="book-open" size={13} color="rgba(255,255,255,0.8)" />
              <Text style={pvStyles.heroStatsText}>{plan.totalDays} days · {plan.enrolled.toLocaleString()} enrolled</Text>
            </View>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[pvStyles.scroll, { paddingBottom: (isWeb ? 24 : insets.bottom) + 80 }]}>
          <Text style={[pvStyles.desc, { color: colors.foreground }]}>{plan.description}</Text>
          <Text style={[pvStyles.overviewLabel, { color: colors.mutedForeground }]}>PLAN OVERVIEW</Text>
          {plan.dayTitles.map((title, i) => (
            <View key={i} style={[pvStyles.dayRow, { borderBottomColor: colors.border }]}>
              <View style={[pvStyles.dayNum, { backgroundColor: accent + '22' }]}>
                <Text style={[pvStyles.dayNumText, { color: accent }]}>{i + 1}</Text>
              </View>
              <Text style={[pvStyles.dayRowTitle, { color: colors.foreground }]}>{title}</Text>
              <Feather name="lock" size={14} color={colors.mutedForeground} />
            </View>
          ))}
          {plan.totalDays > plan.dayTitles.length && (
            <Text style={[pvStyles.moreDays, { color: colors.mutedForeground }]}>
              + {plan.totalDays - plan.dayTitles.length} more days unlocked as you progress
            </Text>
          )}
        </ScrollView>

        <View style={[pvStyles.ctaWrap, { paddingBottom: isWeb ? 24 : insets.bottom + 12, backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[pvStyles.ctaBtn, { backgroundColor: accent }]}
            activeOpacity={0.85}
            onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onStartPlan(plan); onClose(); }}
          >
            <Text style={pvStyles.ctaBtnText}>Start This Plan</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const pvStyles = StyleSheet.create({
  container: { flex: 1 },
  heroWrap: { height: 240, position: 'relative' },
  closeBtn: {
    position: 'absolute', right: 16, zIndex: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroCat: { position: 'absolute', top: 16, left: 16, zIndex: 10, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  heroCatText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_700Bold' },
  heroBottom: { position: 'absolute', bottom: 16, left: 16, right: 16 },
  heroTitle: { color: '#fff', fontSize: 24, fontFamily: 'Inter_700Bold', lineHeight: 30, marginBottom: 6 },
  heroStats: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroStatsText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: 'Inter_400Regular' },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },
  desc: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 24, marginBottom: 24 },
  overviewLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 1.2, marginBottom: 12, textTransform: 'uppercase' },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: 0.5 },
  dayNum: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  dayNumText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  dayRowTitle: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  moreDays: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingVertical: 16, fontStyle: 'italic' },
  ctaWrap: { paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 0.5 },
  ctaBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  ctaBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});

// ─── Add Devotional Modal ─────────────────────────────────────────────────────

function AddDevotionalModal({
  visible, onAdd, onClose,
}: {
  visible: boolean; onAdd: (plan: ActivePlan) => void; onClose: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Prayer');
  const [totalDays, setTotalDays] = useState('7');

  const canCreate = title.trim().length > 0 && parseInt(totalDays, 10) > 0;

  const handleCreate = () => {
    if (!canCreate) return;
    const days = Math.min(Math.max(1, parseInt(totalDays, 10) || 7), 90);
    const newPlan: ActivePlan = {
      id: `custom-${Date.now()}`,
      title: title.trim(),
      category: selectedCategory,
      description: description.trim() || `A ${days}-day devotional journey of ${selectedCategory.toLowerCase()}.`,
      totalDays: days,
      currentDay: 1,
      completedDays: new Set<number>(),
      streakDays: 0,
      imageUrl: `https://picsum.photos/seed/${title.trim().replace(/\s+/g, '-').toLowerCase()}/600/350`,
      enrolled: 0,
      days: GRATITUDE_DAYS.slice(0, Math.min(days, GRATITUDE_DAYS.length)).map((d, i) => ({
        ...d, day: i + 1, title: i < GRATITUDE_DAYS.length ? d.title : `Day ${i + 1}`,
      })),
    };
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAdd(newPlan);
    setTitle(''); setDescription(''); setSelectedCategory('Prayer'); setTotalDays('7');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[adStyles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[adStyles.header, { paddingTop: isWeb ? 24 : insets.top + 10, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={adStyles.cancelBtn}>
            <Text style={[adStyles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[adStyles.headerTitle, { color: colors.foreground }]}>New Devotional</Text>
          <TouchableOpacity
            onPress={handleCreate}
            disabled={!canCreate}
            style={[adStyles.createBtn, { backgroundColor: canCreate ? colors.primary : colors.muted }]}
          >
            <Text style={[adStyles.createBtnText, { color: canCreate ? '#fff' : colors.mutedForeground }]}>Create</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={adStyles.body}>
          {/* Title */}
          <Text style={[adStyles.fieldLabel, { color: colors.mutedForeground }]}>Plan Title *</Text>
          <TextInput
            style={[adStyles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
            placeholder="e.g. 7 Days of Peace"
            placeholderTextColor={colors.mutedForeground}
            value={title}
            onChangeText={setTitle}
            maxLength={60}
          />

          {/* Category */}
          <Text style={[adStyles.fieldLabel, { color: colors.mutedForeground }]}>Category</Text>
          <View style={adStyles.categoryGrid}>
            {CATEGORIES.map((cat) => {
              const accent = CATEGORY_COLORS[cat];
              const selected = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={[adStyles.catBtn, { borderColor: selected ? accent : colors.border, backgroundColor: selected ? accent + '20' : colors.card }]}
                >
                  <Text style={[adStyles.catBtnText, { color: selected ? accent : colors.foreground }]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Days */}
          <Text style={[adStyles.fieldLabel, { color: colors.mutedForeground }]}>Number of Days</Text>
          <View style={adStyles.daysRow}>
            {['7', '14', '21', '30'].map((d) => (
              <TouchableOpacity
                key={d}
                onPress={() => setTotalDays(d)}
                style={[adStyles.dayBtn, { borderColor: totalDays === d ? colors.primary : colors.border, backgroundColor: totalDays === d ? colors.primary + '20' : colors.card }]}
              >
                <Text style={[adStyles.dayBtnText, { color: totalDays === d ? colors.primary : colors.foreground }]}>{d}</Text>
              </TouchableOpacity>
            ))}
            <TextInput
              style={[adStyles.dayInput, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
              placeholder="Custom"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="number-pad"
              value={['7', '14', '21', '30'].includes(totalDays) ? '' : totalDays}
              onChangeText={(v) => { const n = v.replace(/\D/g, ''); setTotalDays(n || ''); }}
              maxLength={2}
            />
          </View>

          {/* Description */}
          <Text style={[adStyles.fieldLabel, { color: colors.mutedForeground }]}>Description (optional)</Text>
          <TextInput
            style={[adStyles.textArea, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
            placeholder="Describe what this plan covers..."
            placeholderTextColor={colors.mutedForeground}
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={200}
          />

          <Text style={[adStyles.noteText, { color: colors.mutedForeground }]}>
            Your custom plan will use curated readings for each day. You can read and mark days complete as you go.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const adStyles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 0.5 },
  cancelBtn: { minWidth: 60 },
  cancelText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontFamily: 'Inter_700Bold' },
  createBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, minWidth: 60, alignItems: 'center' },
  createBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  body: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 40, gap: 8 },
  fieldLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6, marginTop: 14 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: 'Inter_400Regular' },
  textArea: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: 'Inter_400Regular', minHeight: 90, textAlignVertical: 'top' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  catBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  daysRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dayBtn: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  dayBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  dayInput: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 10, fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  noteText: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20, marginTop: 16, fontStyle: 'italic' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DevotionalsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;

  const [myPlans, setMyPlans] = useState<ActivePlan[]>([
    {
      id: 'ap1',
      title: '7 Days of Gratitude',
      category: 'Gratitude',
      description: 'Cultivate a heart of gratitude through seven days of scripture and reflection.',
      totalDays: 7,
      currentDay: 4,
      completedDays: new Set([1, 2, 3]),
      streakDays: 4,
      imageUrl: 'https://picsum.photos/seed/gratitude-worship-sunrise/600/350',
      enrolled: 8234,
      days: GRATITUDE_DAYS,
    },
  ]);

  const [discoverPlans, setDiscoverPlans] = useState<DiscoverPlan[]>(DISCOVER_PLANS);

  // Modal state
  const [detailPlan, setDetailPlan] = useState<ActivePlan | null>(null);
  const [readerPlan, setReaderPlan] = useState<ActivePlan | null>(null);
  const [readerDayIndex, setReaderDayIndex] = useState(0);
  const [previewPlan, setPreviewPlan] = useState<DiscoverPlan | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const openPlanDetail = (plan: ActivePlan) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDetailPlan(plan);
  };

  const openDayReader = (dayIndex: number) => {
    if (!detailPlan) return;
    setReaderPlan(detailPlan);
    setReaderDayIndex(dayIndex);
  };

  const handleMarkComplete = (day: number) => {
    const updatePlan = (p: ActivePlan): ActivePlan => {
      if (p.id !== readerPlan?.id) return p;
      const newCompleted = new Set(p.completedDays);
      newCompleted.add(day);
      const newStreak = newCompleted.size >= p.streakDays ? p.streakDays + 1 : p.streakDays;
      const nextDay = Math.min(day + 1, p.totalDays);
      return { ...p, completedDays: newCompleted, currentDay: nextDay, streakDays: newStreak };
    };
    setMyPlans((prev) => prev.map(updatePlan));
    // Also update detailPlan so the day list refreshes
    setDetailPlan((prev) => prev ? updatePlan(prev) : prev);
  };

  const handleStartPlan = (discover: DiscoverPlan) => {
    if (myPlans.some((p) => p.id === discover.id)) return;
    const newPlan: ActivePlan = {
      id: discover.id,
      title: discover.title,
      category: discover.category,
      description: discover.description,
      totalDays: discover.totalDays,
      currentDay: 1,
      completedDays: new Set<number>(),
      streakDays: 0,
      imageUrl: discover.imageUrl,
      enrolled: discover.enrolled,
      days: GRATITUDE_DAYS.map((d, i) => ({ ...d, day: i + 1 })),
    };
    setMyPlans((prev) => [...prev, newPlan]);
    setDiscoverPlans((prev) => prev.filter((p) => p.id !== discover.id));
  };

  const handleAddCustomPlan = (plan: ActivePlan) => {
    setMyPlans((prev) => [...prev, plan]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.backBtn}>
          <Feather name="chevron-left" size={26} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Devotionals</Text>
        <TouchableOpacity
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAddModal(true); }}
          style={styles.addBtn}
        >
          <Feather name="plus" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: isWeb ? 40 : insets.bottom + 40 }]}
      >

        {/* ── My Reading Plans ── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionIcon}>🔥</Text>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>My Reading Plans</Text>
        </View>

        {myPlans.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="bookmark" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No active plans</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Start a reading plan below to begin your journey
            </Text>
          </View>
        ) : (
          myPlans.map((plan) => {
            const completedCount = plan.completedDays.size;
            const accentColor = CATEGORY_COLORS[plan.category] ?? '#4A90A4';

            return (
              <TouchableOpacity
                key={plan.id}
                activeOpacity={0.88}
                style={[styles.myPlanCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => openPlanDetail(plan)}
              >
                {/* Image with overlays */}
                <View style={styles.myPlanImageWrap}>
                  <Image source={{ uri: plan.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  <LinearGradient colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.68)']} style={StyleSheet.absoluteFill} />

                  {/* Streak badge top-left */}
                  <View style={styles.streakBadge}>
                    <Text style={styles.streakBadgeText}>🔥 {plan.streakDays} day streak</Text>
                  </View>

                  {/* Plan title + day label overlaid at bottom */}
                  <View style={styles.myPlanOverlay}>
                    <Text style={styles.myPlanTitle}>{plan.title}</Text>
                    <Text style={styles.myPlanDayLabel}>Day {plan.currentDay} of {plan.totalDays}</Text>
                  </View>
                </View>

                {/* Progress row below image */}
                <View style={[styles.myPlanFooter, { borderTopColor: colors.border }]}>
                  <View style={[styles.progressBarTrack, { backgroundColor: colors.muted }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { backgroundColor: accentColor, width: `${Math.round((completedCount / plan.totalDays) * 100)}%` as any },
                      ]}
                    />
                  </View>
                  <Text style={[styles.progressText, { color: colors.mutedForeground }]}>
                    {completedCount} of {plan.totalDays} days complete
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* ── Discover Plans ── */}
        <View style={[styles.sectionRow, { marginTop: 28 }]}>
          <Text style={styles.sectionIcon}>💬</Text>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Discover Plans</Text>
        </View>

        {discoverPlans.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="check-circle" size={28} color="#27AE60" />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>All plans started!</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Check your active plans above to continue reading
            </Text>
          </View>
        ) : (
          discoverPlans.map((plan) => {
            const accent = CATEGORY_COLORS[plan.category] ?? '#4A90A4';
            return (
              <View key={plan.id} style={[styles.discoverCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* Hero image with category badge */}
                <View style={styles.discoverImageWrap}>
                  <Image source={{ uri: plan.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{plan.category}</Text>
                  </View>
                </View>

                {/* Content */}
                <View style={styles.discoverContent}>
                  <Text style={[styles.discoverTitle, { color: colors.foreground }]}>{plan.title}</Text>
                  <Text style={[styles.discoverDesc, { color: colors.mutedForeground }]} numberOfLines={3}>
                    {plan.description}
                  </Text>

                  {/* Footer row */}
                  <View style={styles.discoverFooter}>
                    <View style={styles.discoverStats}>
                      <Feather name="book-open" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.discoverStatsText, { color: colors.mutedForeground }]}>
                        {plan.totalDays} days · {plan.enrolled.toLocaleString()} enrolled
                      </Text>
                    </View>
                    <View style={styles.discoverActions}>
                      <TouchableOpacity
                        style={[styles.previewBtn, { borderColor: colors.foreground }]}
                        activeOpacity={0.75}
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPreviewPlan(plan); }}
                      >
                        <Text style={[styles.previewBtnText, { color: colors.foreground }]}>Preview</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); handleStartPlan(plan); }}
                      >
                        <Text style={[styles.startPlanText, { color: accent }]}>Start{'\n'}Plan</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ── Plan Detail Modal (day list) ── */}
      <PlanDetailModal
        visible={!!detailPlan}
        plan={detailPlan}
        onOpenDay={openDayReader}
        onClose={() => setDetailPlan(null)}
      />

      {/* ── Day Reader Modal ── */}
      <DayReaderModal
        visible={!!readerPlan}
        plan={readerPlan}
        dayIndex={readerDayIndex}
        completedDays={readerPlan?.completedDays ?? new Set()}
        onMarkComplete={handleMarkComplete}
        onClose={() => setReaderPlan(null)}
      />

      {/* ── Plan Preview Modal ── */}
      <PlanPreviewModal
        visible={!!previewPlan}
        plan={previewPlan}
        onStartPlan={handleStartPlan}
        onClose={() => setPreviewPlan(null)}
      />

      {/* ── Add Devotional Modal ── */}
      <AddDevotionalModal
        visible={showAddModal}
        onAdd={handleAddCustomPlan}
        onClose={() => setShowAddModal(false)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 14, borderBottomWidth: 0.5 },
  backBtn: { padding: 4, width: 34 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontFamily: 'Inter_700Bold' },
  addBtn: { width: 34, alignItems: 'flex-end', padding: 4 },

  scroll: { paddingHorizontal: 16, paddingTop: 20 },

  // Section header
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionIcon: { fontSize: 18 },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },

  // ── My plan card ─────────────────────────────────────────────────────────────
  myPlanCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 14 },
  myPlanImageWrap: { height: 190, position: 'relative' },
  streakBadge: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, zIndex: 2,
  },
  streakBadgeText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_700Bold' },
  myPlanOverlay: { position: 'absolute', bottom: 14, left: 14, right: 14, zIndex: 2 },
  myPlanTitle: { color: '#fff', fontSize: 20, fontFamily: 'Inter_700Bold', lineHeight: 26 },
  myPlanDayLabel: { color: 'rgba(255,255,255,0.78)', fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 3 },
  myPlanFooter: {
    paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: 0.5, gap: 8,
  },
  progressBarTrack: { height: 3, borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 2 },
  progressText: { fontSize: 13, fontFamily: 'Inter_400Regular' },

  // ── Discover card ─────────────────────────────────────────────────────────────
  discoverCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 18 },
  discoverImageWrap: { height: 160, position: 'relative' },
  categoryBadge: {
    position: 'absolute', bottom: 10, left: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 14, zIndex: 2,
  },
  categoryBadgeText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  discoverContent: { padding: 14, gap: 8 },
  discoverTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', lineHeight: 24 },
  discoverDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  discoverFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 },
  discoverStats: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  discoverStatsText: { fontSize: 12, fontFamily: 'Inter_400Regular', flexShrink: 1 },
  discoverActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  previewBtn: { borderWidth: 1.5, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 8 },
  previewBtnText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  startPlanText: { fontSize: 13, fontFamily: 'Inter_700Bold', textAlign: 'center', lineHeight: 18 },

  // ── Empty states ──────────────────────────────────────────────────────────────
  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 28, alignItems: 'center', gap: 10, marginBottom: 14 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  emptySub: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
});
