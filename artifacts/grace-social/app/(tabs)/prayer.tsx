import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { router } from 'expo-router';

import { AdCard } from '@/components/AdCard';
import { NewPrayerModal } from '@/components/NewPrayerModal';
import { PrayerCard } from '@/components/PrayerCard';
import { Prayer, PrayerCategory, useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

type FilterKey = 'all' | PrayerCategory;
type TabKey = 'wall' | 'testimonies';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'health', label: 'Health' },
  { key: 'family', label: 'Family' },
  { key: 'faith', label: 'Faith' },
  { key: 'work', label: 'Work' },
  { key: 'gratitude', label: 'Gratitude' },
];

const QUICK_CARDS = [
  { id: 'bible', icon: 'book-open', label: 'Bible', sub: 'Read Scripture', onPress: () => router.push('/bible') },
  { id: 'devotionals', icon: 'bookmark', label: 'Devotionals', sub: 'Daily reading', onPress: () => {} },
];

export default function PrayerScreen() {
  const { prayers } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const [active, setActive] = useState<FilterKey>('all');
  const [tab, setTab] = useState<TabKey>('wall');
  const [showModal, setShowModal] = useState(false);

  const filtered = useMemo(
    () => (active === 'all' ? prayers : prayers.filter((p) => p.category === active)),
    [prayers, active]
  );

  type PrayerFeedItem = { type: 'prayer'; data: Prayer } | { type: 'ad'; adIndex: number };

  const feedItems = useMemo((): PrayerFeedItem[] => {
    const result: PrayerFeedItem[] = [];
    let adCount = 0;
    filtered.forEach((prayer, i) => {
      result.push({ type: 'prayer', data: prayer });
      if ((i + 1) % 3 === 0) result.push({ type: 'ad', adIndex: adCount++ });
    });
    return result;
  }, [filtered]);

  const renderItem = ({ item }: { item: PrayerFeedItem }) => {
    if (item.type === 'ad') return <AdCard index={item.adIndex + 2} />;
    return <PrayerCard prayer={item.data} />;
  };

  const CORAL = '#E07A54';

  const ListHeader = (
    <View>
      {/* Quick access cards */}
      <View style={styles.quickRow}>
        {QUICK_CARDS.map((card) => (
          <TouchableOpacity
            key={card.id}
            style={[styles.quickCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={card.onPress}
            activeOpacity={0.75}
          >
            <View style={[styles.quickIcon, { backgroundColor: colors.muted }]}>
              <Feather name={card.icon as any} size={20} color={colors.foreground} />
            </View>
            <View>
              <Text style={[styles.quickLabel, { color: colors.foreground }]}>{card.label}</Text>
              <Text style={[styles.quickSub, { color: colors.mutedForeground }]}>{card.sub}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Reminders full-width card */}
      <TouchableOpacity
        style={[styles.reminderCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        activeOpacity={0.75}
      >
        <View style={[styles.quickIcon, { backgroundColor: colors.muted }]}>
          <Feather name="bell-off" size={20} color={colors.foreground} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.quickLabel, { color: colors.foreground }]}>Devotional Reminders</Text>
          <Text style={[styles.quickSub, { color: colors.mutedForeground }]}>Get a daily nudge to read</Text>
        </View>
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
      </TouchableOpacity>

      {/* Tabs */}
      <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
        {([
          { key: 'wall', label: '🙏  Prayer Wall' },
          { key: 'testimonies', label: '✨  Testimonies' },
        ] as { key: TabKey; label: string }[]).map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && { borderBottomColor: CORAL, borderBottomWidth: 2.5 }]}
            onPress={() => setTab(t.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, { color: tab === t.key ? CORAL : colors.mutedForeground }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Filter chips */}
      {tab === 'wall' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.chip,
                active === f.key
                  ? { backgroundColor: CORAL }
                  : { backgroundColor: 'transparent' },
              ]}
              onPress={() => setActive(f.key)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: active === f.key ? '#fff' : colors.mutedForeground },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  if (tab === 'testimonies') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            {
              paddingTop: (isWeb ? 67 : insets.top) + 8,
              backgroundColor: colors.background,
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.foreground }]}>Prayer</Text>
          <TouchableOpacity
            style={[styles.circlesBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/prayer-groups')}
            activeOpacity={0.8}
          >
            <Text style={styles.circlesBtnText}>🔥  My Circles</Text>
          </TouchableOpacity>
        </View>

        {ListHeader}

        <View style={styles.emptyState}>
          <Text style={[styles.emptyIcon]}>✨</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Testimonies coming soon</Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            Share how God has moved in your life
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={feedItems}
        keyExtractor={(item) => item.type === 'ad' ? `ad-${item.adIndex}` : item.data.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: isWeb ? 34 : 100 }}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View
              style={[
                styles.header,
                {
                  paddingTop: (isWeb ? 67 : insets.top) + 8,
                  backgroundColor: colors.background,
                },
              ]}
            >
              <Text style={[styles.title, { color: colors.foreground }]}>Prayer</Text>
              <TouchableOpacity
                style={[styles.circlesBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push('/prayer-groups')}
                activeOpacity={0.8}
              >
                <Text style={styles.circlesBtnText}>🔥  My Circles</Text>
              </TouchableOpacity>
            </View>
            {ListHeader}
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: CORAL, bottom: (isWeb ? 34 : insets.bottom) + 70 }]}
        onPress={() => setShowModal(true)}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={24} color="#fff" />
      </TouchableOpacity>

      <NewPrayerModal visible={showModal} onClose={() => setShowModal(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  title: {
    flex: 1,
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
  },
  circlesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 1,
  },
  circlesBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#F5F0E8',
  },
  quickRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 10,
  },
  quickCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  quickSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  filterContent: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  emptySub: { fontSize: 14, fontFamily: 'Inter_400Regular' },
});
