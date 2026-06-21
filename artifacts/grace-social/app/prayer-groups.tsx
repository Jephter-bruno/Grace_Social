import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';

interface PrayerGroup {
  id: string;
  name: string;
  description: string;
  members: number;
  category: string;
  color: string;
  icon: string;
  isJoined: boolean;
  activePrayers: number;
  lastActivity: string;
}

const INITIAL_GROUPS: PrayerGroup[] = [
  {
    id: '1',
    name: 'Morning Prayer Circle',
    description: 'Start your day with intentional prayer. We gather every morning in spirit to lift requests together.',
    members: 342,
    category: 'Daily Prayer',
    color: '#F59E0B',
    icon: 'sunrise',
    isJoined: true,
    activePrayers: 28,
    lastActivity: '2m ago',
  },
  {
    id: '2',
    name: 'Healing & Restoration',
    description: 'A safe space for those seeking healing — physical, emotional, and spiritual restoration.',
    members: 215,
    category: 'Health',
    color: '#10B981',
    icon: 'heart',
    isJoined: false,
    activePrayers: 41,
    lastActivity: '15m ago',
  },
  {
    id: '3',
    name: 'Families in Faith',
    description: 'Praying for marriages, children, and households. Rooted in love and scripture.',
    members: 189,
    category: 'Family',
    color: '#8B5CF6',
    icon: 'users',
    isJoined: true,
    activePrayers: 17,
    lastActivity: '1h ago',
  },
  {
    id: '4',
    name: 'Warriors in Prayer',
    description: 'Intercession warriors standing in the gap for communities, nations, and the lost.',
    members: 527,
    category: 'Intercession',
    color: '#EF4444',
    icon: 'shield',
    isJoined: false,
    activePrayers: 63,
    lastActivity: '5m ago',
  },
  {
    id: '5',
    name: 'Youth Prayer Network',
    description: 'Young believers praying for each other, for their schools, and for the next generation.',
    members: 298,
    category: 'Youth',
    color: '#3B82F6',
    icon: 'star',
    isJoined: false,
    activePrayers: 22,
    lastActivity: '30m ago',
  },
  {
    id: '6',
    name: 'Grief & Comfort',
    description: 'Walking alongside those who grieve. Gentle prayers and a compassionate community.',
    members: 134,
    category: 'Comfort',
    color: '#6B7280',
    icon: 'wind',
    isJoined: false,
    activePrayers: 9,
    lastActivity: '3h ago',
  },
  {
    id: '7',
    name: 'Work & Purpose',
    description: 'Praying over careers, callings, and finding purpose in everyday work.',
    members: 176,
    category: 'Work',
    color: '#0EA5E9',
    icon: 'briefcase',
    isJoined: false,
    activePrayers: 14,
    lastActivity: '45m ago',
  },
];

const CATEGORIES = ['All', 'Daily Prayer', 'Health', 'Family', 'Intercession', 'Youth', 'Comfort', 'Work'];

export default function PrayerGroupsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;

  const [groups, setGroups] = useState(INITIAL_GROUPS);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = groups.filter((g) => {
    const matchCat = activeCategory === 'All' || g.category === activeCategory;
    const matchSearch = search.trim() === '' || g.name.toLowerCase().includes(search.toLowerCase()) || g.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const joinedGroups = groups.filter((g) => g.isJoined);

  const toggleJoin = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGroups((prev) =>
      prev.map((g) =>
        g.id === id
          ? { ...g, isJoined: !g.isJoined, members: g.isJoined ? g.members - 1 : g.members + 1 }
          : g
      )
    );
  };

  const renderGroup = ({ item }: { item: PrayerGroup }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.cardIconWrap, { backgroundColor: item.color + '20' }]}>
        <Feather name={item.icon as any} size={22} color={item.color} />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={[styles.cardName, { color: colors.foreground }]}>{item.name}</Text>
          <View style={[styles.catBadge, { backgroundColor: item.color + '18' }]}>
            <Text style={[styles.catBadgeText, { color: item.color }]}>{item.category}</Text>
          </View>
        </View>
        <Text style={[styles.cardDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Feather name="users" size={11} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {item.members.toLocaleString()}
            </Text>
          </View>
          <View style={styles.metaDot} />
          <View style={styles.metaItem}>
            <Feather name="message-circle" size={11} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {item.activePrayers} active
            </Text>
          </View>
          <View style={styles.metaDot} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{item.lastActivity}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.joinBtn,
            {
              backgroundColor: item.isJoined ? colors.muted : item.color,
              borderColor: item.color,
            },
          ]}
          onPress={() => toggleJoin(item.id)}
        >
          <Feather
            name={item.isJoined ? 'check' : 'plus'}
            size={14}
            color={item.isJoined ? item.color : '#fff'}
          />
          <Text style={[styles.joinText, { color: item.isJoined ? item.color : '#fff' }]}>
            {item.isJoined ? 'Joined' : 'Join Group'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: colors.foreground }]}>Prayer Groups</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {joinedGroups.length} joined
          </Text>
        </View>
        <View style={{ width: 30 }} />
      </View>

      <View style={[styles.searchBar, { backgroundColor: colors.muted, marginHorizontal: 14, marginTop: 12 }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search groups..."
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Feather name="x" size={15} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {joinedGroups.length > 0 && activeCategory === 'All' && search === '' && (
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>MY GROUPS</Text>
          <FlatList
            data={joinedGroups}
            keyExtractor={(g) => `joined-${g.id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingRight: 14 }}
            renderItem={({ item }) => (
              <View style={[styles.joinedChip, { backgroundColor: item.color + '18', borderColor: item.color + '40' }]}>
                <Feather name={item.icon as any} size={14} color={item.color} />
                <Text style={[styles.joinedChipText, { color: item.color }]}>{item.name}</Text>
                <View style={[styles.pulseDot, { backgroundColor: item.color }]} />
              </View>
            )}
          />
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(g) => g.id}
        renderItem={renderGroup}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 14, gap: 12, paddingBottom: isWeb ? 34 : insets.bottom + 20 }}
        ListHeaderComponent={
          <FlatList
            data={CATEGORIES}
            keyExtractor={(c) => c}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, marginBottom: 12 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.catChip,
                  { backgroundColor: activeCategory === item ? colors.primary : colors.muted },
                ]}
                onPress={() => { Haptics.selectionAsync(); setActiveCategory(item); }}
              >
                <Text style={[styles.catChipText, { color: activeCategory === item ? '#fff' : colors.mutedForeground }]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="users" size={44} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No groups found</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Try a different search or category
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  headerCenter: { alignItems: 'center' },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, gap: 8, marginBottom: 2 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular' },
  section: { paddingTop: 14, paddingBottom: 10, paddingLeft: 14, borderBottomWidth: 0.5, marginBottom: 2 },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0.8, marginBottom: 10 },
  joinedChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  joinedChipText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  pulseDot: { width: 7, height: 7, borderRadius: 3.5, marginLeft: 2 },
  catChip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  catChipText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, flexDirection: 'row', gap: 14 },
  cardIconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardBody: { flex: 1, gap: 6 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  cardName: { fontSize: 15, fontFamily: 'Inter_700Bold', flex: 1, flexWrap: 'wrap' },
  catBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, flexShrink: 0 },
  catBadgeText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  cardDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#ccc' },
  joinBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, alignSelf: 'flex-start', marginTop: 2 },
  joinText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  emptySub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
});
