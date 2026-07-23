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

// ─── Day content ──────────────────────────────────────────────────────────────

const GRATITUDE_DAYS: DayContent[] = [
  {
    day: 1,
    title: 'A Heart of Thanksgiving',
    verse: '"Give thanks to the Lord, for he is good; his love endures forever."',
    reference: 'Psalm 107:1',
    reflection: 'Begin this week by pausing to acknowledge the goodness of God. What has He done for you recently that you haven\'t fully thanked Him for? Take five minutes to write down three specific blessings, then lift them up in a prayer of gratitude.',
    prayer: 'Lord, thank You for Your unfailing goodness. Open my eyes to see Your blessings in the ordinary moments of today. May a spirit of thanksgiving fill my heart. Amen.',
  },
  {
    day: 2,
    title: 'Gratitude in Every Season',
    verse: '"Give thanks in all circumstances; for this is God\'s will for you in Christ Jesus."',
    reference: '1 Thessalonians 5:18',
    reflection: 'Gratitude doesn\'t mean pretending everything is perfect. It means choosing to trust that God is working even in difficult seasons. What challenging circumstance in your life right now can you choose to be grateful through?',
    prayer: 'Father, teach me to give thanks even when I don\'t feel like it. I trust that You are working all things together for good in my life. Amen.',
  },
  {
    day: 3,
    title: 'The Source of All Good Things',
    verse: '"Every good and perfect gift is from above, coming down from the Father of the heavenly lights."',
    reference: 'James 1:17',
    reflection: 'Take stock of the gifts in your life — relationships, health, abilities, opportunities. All of them trace back to one Source. How does recognizing God as the giver of all good things change how you hold what you have?',
    prayer: 'Generous Father, I acknowledge that every good thing in my life is a gift from You. Help me to hold these gifts with open hands, always ready to give back to You. Amen.',
  },
  {
    day: 4,
    title: 'Count Your Blessings',
    verse: '"Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus."',
    reference: 'Philippians 4:6–7',
    reflection: 'Anxiety and gratitude cannot fully coexist. When we bring our worries to God wrapped in thanksgiving, something supernatural happens — His peace begins to guard us. Today, identify one area of anxiety and consciously exchange it for thanksgiving.',
    prayer: 'Prince of Peace, I lay down my anxious thoughts and choose gratitude. Thank You that Your peace is not circumstantial. Guard my heart and mind today. Amen.',
  },
  {
    day: 5,
    title: 'Praise Through the Storm',
    verse: '"I will give thanks to you, Lord, with all my heart; I will tell of all your wonderful deeds."',
    reference: 'Psalm 9:1',
    reflection: 'The psalmist chose to give thanks with his whole heart — not just in calm moments but through storms and battles. Your praise has power. Whose life could you encourage today by sharing what God has done for you?',
    prayer: 'Lord, I will praise You with all that is within me. Let my life be a testimony of Your faithfulness to those around me. Amen.',
  },
  {
    day: 6,
    title: 'A Grateful Mind',
    verse: '"Do not conform to the pattern of this world, but be transformed by the renewing of your mind."',
    reference: 'Romans 12:2',
    reflection: 'Gratitude is a posture that must be cultivated. Our culture trains us to focus on what we lack. God\'s Word calls us to be transformed — to think differently. What thought patterns do you need to surrender so gratitude can flourish?',
    prayer: 'Transform my thinking, Lord. Help me to see my life through Your lens — one of abundance, purpose, and grace. Renew my mind today. Amen.',
  },
  {
    day: 7,
    title: 'A Life of Praise',
    verse: '"Let everything that has breath praise the Lord. Praise the Lord."',
    reference: 'Psalm 150:6',
    reflection: 'You\'ve reached the final day of this plan. Gratitude is not a practice for certain seasons — it\'s a way of life. How will you carry this spirit of thanksgiving beyond these seven days? Commit to one daily practice of gratitude going forward.',
    prayer: 'Lord, may every breath I take be an act of worship. May gratitude become the rhythm of my life. Thank You for these 7 days of drawing closer to You. Amen.',
  },
];

// ─── Discover plans data ──────────────────────────────────────────────────────

const DISCOVER_PLANS: DiscoverPlan[] = [
  {
    id: 'dp1',
    title: '30 Days of Prayer',
    category: 'Prayer',
    description: 'Deepen your prayer life through scripture, reflection, and guided moments of communion with God.',
    totalDays: 30,
    enrolled: 12304,
    imageUrl: 'https://picsum.photos/seed/prayer-path-autumn/600/300',
    dayTitles: [
      'Why We Pray', 'Praying with Expectation', 'The Lord\'s Prayer', 'Intercession for Others',
      'Praying in the Spirit', 'Gratitude as Prayer', 'Prayers of Confession',
    ],
  },
  {
    id: 'dp2',
    title: '21 Days of Faith',
    category: 'Faith',
    description: 'Build an unshakeable faith as you explore what it means to walk confidently in God\'s promises every single day.',
    totalDays: 21,
    enrolled: 9817,
    imageUrl: 'https://picsum.photos/seed/faith-mountain-light/600/300',
    dayTitles: [
      'What is Faith?', 'Faith Over Fear', 'The Faith Hall of Fame', 'Mountain-Moving Faith',
      'Faith in the Wilderness', 'Trusting God\'s Timing', 'Faith and Works Together',
    ],
  },
  {
    id: 'dp3',
    title: '14 Days of Psalms',
    category: 'Scripture',
    description: 'Journey through the Psalms and discover prayers for every human emotion — from sorrow to soaring praise.',
    totalDays: 14,
    enrolled: 7453,
    imageUrl: 'https://picsum.photos/seed/psalms-river-golden/600/300',
    dayTitles: [
      'Psalm of Praise', 'Lament and Hope', 'God the Shepherd', 'Praising Through Pain',
      'Creation Declares His Glory', 'The Righteous Path', 'Songs of Ascent',
    ],
  },
  {
    id: 'dp4',
    title: '30 Days of Healing',
    category: 'Healing',
    description: 'Let God\'s word bring wholeness to body, mind, and spirit. A journey of restoration, hope, and divine healing.',
    totalDays: 30,
    enrolled: 5621,
    imageUrl: 'https://picsum.photos/seed/healing-sunrise-warm/600/300',
    dayTitles: [
      'God Is Our Healer', 'Healing of the Heart', 'Restoration of Hope', 'Healing Through Forgiveness',
      'God\'s Perfect Peace', 'Strength in Weakness', 'The Great Physician',
    ],
  },
];

// ─── Category accent colours ──────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  Prayer: '#4A90A4',
  Faith: '#D4A843',
  Scripture: '#9B59B6',
  Healing: '#27AE60',
  Gratitude: '#E07A54',
};

// ─── Day Reader Modal ─────────────────────────────────────────────────────────

function DayReaderModal({
  visible,
  plan,
  dayIndex,
  completedDays,
  onMarkComplete,
  onClose,
}: {
  visible: boolean;
  plan: ActivePlan | null;
  dayIndex: number;
  completedDays: Set<number>;
  onMarkComplete: (day: number) => void;
  onClose: () => void;
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
        {/* Header */}
        <View
          style={[
            drStyles.header,
            { paddingTop: (isWeb ? 20 : insets.top) + 8, backgroundColor: colors.background, borderBottomColor: colors.border },
          ]}
        >
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="x" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View style={drStyles.headerMeta}>
            <Text style={[drStyles.headerPlan, { color: colors.mutedForeground }]} numberOfLines={1}>
              {plan.title}
            </Text>
            <Text style={[drStyles.headerDay, { color: colors.foreground }]}>
              Day {dayContent.day} of {plan.totalDays}
            </Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[drStyles.scroll, { paddingBottom: (isWeb ? 24 : insets.bottom) + 40 }]}
        >
          {/* Day title */}
          <Text style={[drStyles.dayTitle, { color: colors.foreground }]}>{dayContent.title}</Text>

          {/* Scripture block */}
          <View style={[drStyles.verseBlock, { borderLeftColor: accentColor, backgroundColor: colors.card }]}>
            <Text style={[drStyles.verseText, { color: colors.foreground }]}>{dayContent.verse}</Text>
            <Text style={[drStyles.verseRef, { color: accentColor }]}>— {dayContent.reference}</Text>
          </View>

          {/* Reflection */}
          <Text style={[drStyles.sectionLabel, { color: colors.mutedForeground }]}>TODAY'S REFLECTION</Text>
          <Text style={[drStyles.reflectionText, { color: colors.foreground }]}>{dayContent.reflection}</Text>

          {/* Prayer */}
          <Text style={[drStyles.sectionLabel, { color: colors.mutedForeground }]}>CLOSING PRAYER</Text>
          <View style={[drStyles.prayerBlock, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[drStyles.prayerText, { color: colors.foreground }]}>{dayContent.prayer}</Text>
          </View>

          {/* Mark Complete */}
          <TouchableOpacity
            style={[
              drStyles.completeBtn,
              { backgroundColor: isCompleted ? '#27AE60' : accentColor },
            ]}
            activeOpacity={0.85}
            onPress={() => {
              if (!isCompleted) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onMarkComplete(dayContent.day);
              }
            }}
            disabled={isCompleted}
          >
            {isCompleted ? (
              <Feather name="check-circle" size={20} color="#fff" />
            ) : (
              <Feather name="check" size={20} color="#fff" />
            )}
            <Text style={drStyles.completeBtnText}>
              {isCompleted ? 'Day Completed ✓' : 'Mark Day Complete'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const drStyles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  headerMeta: { flex: 1, alignItems: 'center' },
  headerPlan: { fontSize: 12, fontFamily: 'Inter_400Regular', textTransform: 'uppercase', letterSpacing: 0.6 },
  headerDay: { fontSize: 16, fontFamily: 'Inter_700Bold', marginTop: 2 },
  scroll: { paddingHorizontal: 20, paddingTop: 24 },
  dayTitle: { fontSize: 26, fontFamily: 'Inter_700Bold', marginBottom: 20, lineHeight: 32 },
  verseBlock: {
    borderLeftWidth: 4, borderRadius: 10,
    padding: 16, marginBottom: 28, gap: 10,
  },
  verseText: {
    fontSize: 16, fontFamily: 'Inter_400Regular', fontStyle: 'italic', lineHeight: 26,
  },
  verseRef: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  sectionLabel: {
    fontSize: 11, fontFamily: 'Inter_700Bold',
    letterSpacing: 1.2, marginBottom: 10, textTransform: 'uppercase',
  },
  reflectionText: {
    fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 26, marginBottom: 28,
  },
  prayerBlock: {
    borderRadius: 12, padding: 16, marginBottom: 32, borderWidth: 1,
  },
  prayerText: {
    fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 25, fontStyle: 'italic',
  },
  completeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, borderRadius: 14,
  },
  completeBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});

// ─── Plan Preview Modal ───────────────────────────────────────────────────────

function PlanPreviewModal({
  visible,
  plan,
  onStartPlan,
  onClose,
}: {
  visible: boolean;
  plan: DiscoverPlan | null;
  onStartPlan: (plan: DiscoverPlan) => void;
  onClose: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  if (!plan) return null;
  const accent = CATEGORY_COLORS[plan.category] ?? '#4A90A4';

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[pvStyles.container, { backgroundColor: colors.background }]}>
        {/* Hero image */}
        <View style={pvStyles.heroWrap}>
          <Image source={{ uri: plan.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient
            colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.72)']}
            style={StyleSheet.absoluteFill}
          />
          {/* Close */}
          <TouchableOpacity
            style={[pvStyles.closeBtn, { top: (isWeb ? 16 : insets.top) + 10 }]}
            onPress={onClose}
          >
            <Feather name="x" size={20} color="#fff" />
          </TouchableOpacity>
          {/* Category */}
          <View style={[pvStyles.heroCat, { backgroundColor: accent }]}>
            <Text style={pvStyles.heroCatText}>{plan.category}</Text>
          </View>
          {/* Title */}
          <View style={pvStyles.heroBottom}>
            <Text style={pvStyles.heroTitle}>{plan.title}</Text>
            <View style={pvStyles.heroStats}>
              <Feather name="book-open" size={13} color="rgba(255,255,255,0.8)" />
              <Text style={pvStyles.heroStatsText}>
                {plan.totalDays} days · {plan.enrolled.toLocaleString()} enrolled
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[pvStyles.scroll, { paddingBottom: (isWeb ? 24 : insets.bottom) + 80 }]}
        >
          <Text style={[pvStyles.desc, { color: colors.foreground }]}>{plan.description}</Text>

          <Text style={[pvStyles.overviewLabel, { color: colors.mutedForeground }]}>PLAN OVERVIEW</Text>

          {plan.dayTitles.map((title, i) => (
            <View
              key={i}
              style={[pvStyles.dayRow, { borderBottomColor: colors.border }]}
            >
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

        {/* CTA */}
        <View
          style={[
            pvStyles.ctaWrap,
            { paddingBottom: isWeb ? 24 : insets.bottom + 12, backgroundColor: colors.background, borderTopColor: colors.border },
          ]}
        >
          <TouchableOpacity
            style={[pvStyles.ctaBtn, { backgroundColor: accent }]}
            activeOpacity={0.85}
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onStartPlan(plan);
              onClose();
            }}
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
  heroCat: {
    position: 'absolute', top: 16, left: 16, zIndex: 10,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  heroCatText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_700Bold' },
  heroBottom: { position: 'absolute', bottom: 16, left: 16, right: 16 },
  heroTitle: { color: '#fff', fontSize: 24, fontFamily: 'Inter_700Bold', lineHeight: 30, marginBottom: 6 },
  heroStats: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroStatsText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: 'Inter_400Regular' },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },
  desc: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 24, marginBottom: 24 },
  overviewLabel: {
    fontSize: 11, fontFamily: 'Inter_700Bold',
    letterSpacing: 1.2, marginBottom: 12, textTransform: 'uppercase',
  },
  dayRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, paddingVertical: 13, borderBottomWidth: 0.5,
  },
  dayNum: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  dayNumText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  dayRowTitle: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  moreDays: {
    fontSize: 13, fontFamily: 'Inter_400Regular',
    textAlign: 'center', paddingVertical: 16, fontStyle: 'italic',
  },
  ctaWrap: { paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 0.5 },
  ctaBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  ctaBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DevotionalsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;

  // Active plans state
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

  // Discover plans state (remove when user starts a plan)
  const [discoverPlans, setDiscoverPlans] = useState<DiscoverPlan[]>(DISCOVER_PLANS);

  // Modal states
  const [readerPlan, setReaderPlan] = useState<ActivePlan | null>(null);
  const [readerDayIndex, setReaderDayIndex] = useState(0);
  const [previewPlan, setPreviewPlan] = useState<DiscoverPlan | null>(null);

  const openDayReader = (plan: ActivePlan, dayIndex: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReaderPlan(plan);
    setReaderDayIndex(dayIndex);
  };

  const handleMarkComplete = (day: number) => {
    setMyPlans((prev) =>
      prev.map((p) => {
        if (p.id !== readerPlan?.id) return p;
        const newCompleted = new Set(p.completedDays);
        newCompleted.add(day);
        const newStreak = newCompleted.size >= p.streakDays ? p.streakDays + 1 : p.streakDays;
        const nextDay = Math.min(day + 1, p.totalDays);
        return { ...p, completedDays: newCompleted, currentDay: nextDay, streakDays: newStreak };
      })
    );
  };

  const handleStartPlan = (discover: DiscoverPlan) => {
    // Add to my plans if not already there
    const alreadyAdded = myPlans.some((p) => p.id === discover.id);
    if (alreadyAdded) return;

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
      days: GRATITUDE_DAYS.map((d, i) => ({ ...d, day: i + 1 })), // reuse structure
    };
    setMyPlans((prev) => [...prev, newPlan]);
    setDiscoverPlans((prev) => prev.filter((p) => p.id !== discover.id));
  };

  const handleOpenPreview = (plan: DiscoverPlan) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPreviewPlan(plan);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 8,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.backBtn}
        >
          <Feather name="chevron-left" size={26} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Devotionals</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: isWeb ? 40 : insets.bottom + 40 },
        ]}
      >
        {/* ── My Reading Plans ───────────────────────────────────────────── */}
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
            const currentDayIndex = plan.currentDay - 1;

            return (
              <TouchableOpacity
                key={plan.id}
                activeOpacity={0.88}
                style={[styles.myPlanCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => openDayReader(plan, currentDayIndex)}
              >
                {/* Image area */}
                <View style={styles.myPlanImageWrap}>
                  <Image
                    source={{ uri: plan.imageUrl }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.72)']}
                    style={StyleSheet.absoluteFill}
                  />
                  {/* Streak badge */}
                  <View style={styles.streakBadge}>
                    <Text style={styles.streakBadgeText}>🔥 {plan.streakDays} day streak</Text>
                  </View>
                  {/* Plan info overlay */}
                  <View style={styles.myPlanOverlay}>
                    <Text style={styles.myPlanTitle}>{plan.title}</Text>
                    <Text style={styles.myPlanDayLabel}>Day {plan.currentDay} of {plan.totalDays}</Text>
                  </View>
                </View>

                {/* Progress row */}
                <View style={[styles.myPlanProgressRow, { borderTopColor: colors.border }]}>
                  <View style={styles.myPlanProgressLeft}>
                    <View style={[styles.progressBarTrack, { backgroundColor: colors.muted }]}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            backgroundColor: accentColor,
                            width: `${Math.round((completedCount / plan.totalDays) * 100)}%` as any,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.progressText, { color: colors.mutedForeground }]}>
                      {completedCount} of {plan.totalDays} days complete
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* ── Discover Plans ─────────────────────────────────────────────── */}
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
              <View
                key={plan.id}
                style={[styles.discoverCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                {/* Image */}
                <View style={styles.discoverImageWrap}>
                  <Image
                    source={{ uri: plan.imageUrl }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                  />
                  {/* Category badge overlaid on image bottom-left */}
                  <View style={[styles.categoryBadge, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
                    <Text style={styles.categoryBadgeText}>{plan.category}</Text>
                  </View>
                </View>

                {/* Content */}
                <View style={styles.discoverContent}>
                  <Text style={[styles.discoverTitle, { color: colors.foreground }]}>{plan.title}</Text>
                  <Text style={[styles.discoverDesc, { color: colors.mutedForeground }]} numberOfLines={3}>
                    {plan.description}
                  </Text>

                  {/* Footer: stats + actions */}
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
                        onPress={() => handleOpenPreview(plan)}
                      >
                        <Text style={[styles.previewBtnText, { color: colors.foreground }]}>Preview</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          handleStartPlan(plan);
                        }}
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
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
  },
  backBtn: { padding: 4, width: 34 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontFamily: 'Inter_700Bold' },

  scroll: { paddingHorizontal: 16, paddingTop: 20 },

  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionIcon: { fontSize: 18 },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },

  // ── My plan card ──────────────────────────────────────────────────────────
  myPlanCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
  },
  myPlanImageWrap: {
    height: 190,
    position: 'relative',
  },
  streakBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    zIndex: 2,
  },
  streakBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  myPlanOverlay: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    zIndex: 2,
  },
  myPlanTitle: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    lineHeight: 26,
  },
  myPlanDayLabel: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 3,
  },
  myPlanProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    gap: 10,
  },
  myPlanProgressLeft: { flex: 1, gap: 6 },
  progressBarTrack: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', borderRadius: 2 },
  progressText: { fontSize: 13, fontFamily: 'Inter_400Regular' },

  // ── Discover card ─────────────────────────────────────────────────────────
  discoverCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 18,
  },
  discoverImageWrap: {
    height: 160,
    position: 'relative',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    zIndex: 2,
  },
  categoryBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  discoverContent: {
    padding: 14,
    gap: 8,
  },
  discoverTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    lineHeight: 24,
  },
  discoverDesc: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
  },
  discoverFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  discoverStats: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  discoverStatsText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    flexShrink: 1,
  },
  discoverActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  previewBtn: {
    borderWidth: 1.5,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  previewBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  startPlanText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    lineHeight: 18,
  },

  // ── Empty states ──────────────────────────────────────────────────────────
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  emptySub: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
});
