import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Community, useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

// Curated banner images for community cards — ordered to match community list
const BANNER_IMAGES: Record<string, string> = {
  c1: 'https://picsum.photos/seed/comm-youth/600/250',
  c2: 'https://picsum.photos/seed/comm-worship/600/250',
  c3: 'https://picsum.photos/seed/comm-bible/600/250',
  c4: 'https://picsum.photos/seed/comm-women/600/250',
  c5: 'https://picsum.photos/seed/comm-men/600/250',
  c6: 'https://picsum.photos/seed/comm-prayer/600/250',
};

// Category colors matching the screenshot (dark pill, slightly transparent)
const CATEGORY_BG = 'rgba(0,0,0,0.65)';

function CommunityRow({ community }: { community: Community }) {
  const colors = useColors();
  const { toggleJoin } = useApp();
  const banner =
    BANNER_IMAGES[community.id] ??
    `https://picsum.photos/seed/comm-${community.id}/600/250`;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Banner image */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() =>
          router.push({ pathname: '/community-detail', params: { id: community.id } })
        }
      >
        <View style={styles.imageWrap}>
          <Image source={{ uri: banner }} style={styles.bannerImage} contentFit="cover" />
          {/* Category pill on the image */}
          <View style={[styles.categoryPill, { backgroundColor: CATEGORY_BG }]}>
            <Text style={styles.categoryText}>{community.category}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Info row below image */}
      <View style={styles.infoRow}>
        <View style={styles.infoLeft}>
          <Text style={[styles.communityName, { color: colors.foreground }]}>
            {community.name}
          </Text>
          <View style={styles.membersRow}>
            <Feather name="users" size={12} color={colors.mutedForeground} />
            <Text style={[styles.membersText, { color: colors.mutedForeground }]}>
              {community.members.toLocaleString()} members
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.joinBtn,
            community.isJoined && { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
          ]}
          onPress={() => toggleJoin(community.id)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.joinText,
              community.isJoined
                ? { color: colors.mutedForeground }
                : { color: colors.foreground },
            ]}
          >
            {community.isJoined ? 'Joined' : 'Join'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function SuggestedCommunities() {
  const { communities } = useApp();
  const colors = useColors();
  const TEAL = colors.primary;

  // Show up to 2 not-yet-joined communities
  const suggested = communities.filter((c) => !c.isJoined).slice(0, 2);

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

      {/* Cards */}
      <View style={styles.cardList}>
        {suggested.map((c) => (
          <CommunityRow key={c.id} community={c} />
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
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
  },
  browseAll: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  cardList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageWrap: {
    height: 120,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  categoryPill: {
    position: 'absolute',
    bottom: 9,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  infoLeft: {
    flex: 1,
    gap: 3,
  },
  communityName: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    lineHeight: 20,
  },
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  membersText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  joinBtn: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
  },
  joinText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});
