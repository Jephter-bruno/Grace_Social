import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Community, useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

const CARD_WIDTH = 200;

const BANNER_IMAGES: Record<string, string> = {
  c1: 'https://picsum.photos/seed/comm-youth/400/300',
  c2: 'https://picsum.photos/seed/comm-worship/400/300',
  c3: 'https://picsum.photos/seed/comm-bible/400/300',
  c4: 'https://picsum.photos/seed/comm-women/400/300',
  c5: 'https://picsum.photos/seed/comm-men/400/300',
  c6: 'https://picsum.photos/seed/comm-prayer/400/300',
};

function CommunityCard({ community }: { community: Community }) {
  const colors = useColors();
  const { toggleJoin } = useApp();
  const banner =
    BANNER_IMAGES[community.id] ??
    `https://picsum.photos/seed/comm-${community.id}/400/300`;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.88}
      onPress={() =>
        router.push({ pathname: '/community-detail', params: { id: community.id } })
      }
    >
      {/* Banner image */}
      <View style={styles.imageWrap}>
        <Image source={{ uri: banner }} style={styles.bannerImage} contentFit="cover" />
        {/* Category pill */}
        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>{community.category}</Text>
        </View>
      </View>

      {/* Info below image */}
      <View style={styles.infoBlock}>
        <Text style={[styles.communityName, { color: colors.foreground }]} numberOfLines={1}>
          {community.name}
        </Text>
        <View style={styles.membersRow}>
          <Feather name="users" size={11} color={colors.mutedForeground} />
          <Text style={[styles.membersText, { color: colors.mutedForeground }]}>
            {community.members.toLocaleString()} members
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.joinBtn,
            community.isJoined
              ? { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border }
              : { backgroundColor: 'transparent', borderWidth: 0 },
          ]}
          onPress={(e) => {
            e.stopPropagation?.();
            toggleJoin(community.id);
          }}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.joinText,
              community.isJoined
                ? { color: colors.mutedForeground }
                : { color: colors.primary },
            ]}
          >
            {community.isJoined ? 'Joined ✓' : 'Join'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export function SuggestedCommunities() {
  const { communities } = useApp();
  const colors = useColors();
  const TEAL = colors.primary;

  // Show all not-yet-joined communities horizontally
  const suggested = communities.filter((c) => !c.isJoined);

  if (suggested.length === 0) return null;

  return (
    <View style={[styles.section, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Communities for You 🏘️
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/community')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.browseAll, { color: TEAL }]}>Browse All</Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {suggested.map((c) => (
          <CommunityCard key={c.id} community={c} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
  },
  browseAll: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  scroll: {
    paddingLeft: 16,
    paddingRight: 8,
    gap: 10,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageWrap: {
    height: 110,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  categoryPill: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  categoryText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  infoBlock: {
    padding: 10,
    gap: 4,
  },
  communityName: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    lineHeight: 18,
  },
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  membersText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  joinBtn: {
    paddingHorizontal: 0,
    paddingVertical: 2,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  joinText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
});
