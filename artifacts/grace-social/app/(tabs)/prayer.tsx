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

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'health', label: 'Health' },
  { key: 'family', label: 'Family' },
  { key: 'faith', label: 'Faith' },
  { key: 'work', label: 'Work' },
  { key: 'gratitude', label: 'Gratitude' },
];

export default function PrayerScreen() {
  const { prayers } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const [active, setActive] = useState<FilterKey>('all');
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: (isWeb ? 67 : insets.top) + 8,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Prayer Wall</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/bible')}>
          <Feather name="book-open" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/prayer-groups')}>
          <Feather name="users" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setShowModal(true)}>
          <Feather name="plus" size={24} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <View style={[styles.filterRow, { borderBottomColor: colors.border }]}>
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
                {
                  backgroundColor: active === f.key ? colors.primary : colors.muted,
                  borderColor: active === f.key ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setActive(f.key)}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color:
                      active === f.key ? colors.primaryForeground : colors.mutedForeground,
                  },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={feedItems}
        keyExtractor={(item, idx) => item.type === 'ad' ? `ad-${item.adIndex}` : item.data.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 8, paddingBottom: isWeb ? 34 : 100 }}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, bottom: (isWeb ? 34 : insets.bottom) + 70 }]}
        onPress={() => setShowModal(true)}
        activeOpacity={0.85}
      >
        <Feather name="edit-2" size={20} color="#fff" />
      </TouchableOpacity>

      <NewPrayerModal visible={showModal} onClose={() => setShowModal(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  iconBtn: {
    padding: 6,
  },
  filterRow: {
    borderBottomWidth: 0.5,
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
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
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
});
