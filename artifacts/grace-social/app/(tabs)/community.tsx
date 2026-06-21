import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
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

import { router } from 'expo-router';

import { Community, useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

function CommunityCard({ community }: { community: Community }) {
  const colors = useColors();
  const { toggleJoin } = useApp();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.82}
      onPress={() => router.push({ pathname: '/community-detail', params: { id: community.id } })}
    >
      <View style={[styles.cardIcon, { backgroundColor: community.color + '22' }]}>
        <Feather name={community.iconName as any} size={22} color={community.color} />
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.cardName, { color: colors.foreground }]}>{community.name}</Text>
        <Text style={[styles.cardDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
          {community.description}
        </Text>
        <View style={styles.metaRow}>
          <Feather name="users" size={11} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            {community.members.toLocaleString()} members
          </Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <TouchableOpacity
          style={[
            styles.joinBtn,
            {
              backgroundColor: community.isJoined ? colors.muted : community.color,
              borderColor: community.color,
            },
          ]}
          onPress={(e) => { e.stopPropagation?.(); toggleJoin(community.id); }}
        >
          <Text
            style={[
              styles.joinText,
              { color: community.isJoined ? community.color : '#fff' },
            ]}
          >
            {community.isJoined ? 'Joined' : 'Join'}
          </Text>
        </TouchableOpacity>
        <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  );
}

export default function CommunityScreen() {
  const { communities } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const [search, setSearch] = useState('');

  const searching = search.trim().length > 0;

  const allFiltered = useMemo(() => {
    if (!searching) return communities;
    const q = search.toLowerCase();
    return communities.filter(
      (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    );
  }, [communities, search, searching]);

  const myGroups = useMemo(
    () => (searching ? [] : communities.filter((c) => c.isJoined)),
    [communities, searching]
  );

  const discoverGroups = useMemo(
    () => (searching ? allFiltered : communities.filter((c) => !c.isJoined)),
    [communities, allFiltered, searching]
  );

  const renderItem = ({ item }: { item: Community }) => (
    <CommunityCard community={item} />
  );

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
        <Text style={[styles.title, { color: colors.foreground }]}>Community</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/messages')}>
          <Feather name="send" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/prayer-groups')}>
          <Feather name="users" size={22} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.searchWrap,
          { backgroundColor: colors.muted, borderColor: colors.border },
        ]}
      >
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search groups..."
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={discoverGroups}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: isWeb ? 34 : 80 }}
        ListHeaderComponent={
          myGroups.length > 0 ? (
            <>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                MY GROUPS
              </Text>
              {myGroups.map((c) => (
                <CommunityCard key={c.id} community={c} />
              ))}
              <Text
                style={[
                  styles.sectionLabel,
                  { color: colors.mutedForeground, marginTop: 16 },
                ]}
              >
                DISCOVER
              </Text>
            </>
          ) : null
        }
      />
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
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  card: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    gap: 12,
  },
  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
    gap: 3,
  },
  cardName: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  cardDesc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  metaText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  cardRight: {
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  joinBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    flexShrink: 0,
  },
  joinText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
});
