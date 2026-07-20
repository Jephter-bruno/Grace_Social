import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Reel, useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

const CARD_WIDTH = 160;
const CARD_HEIGHT = 200;

function formatViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}k`;
  return `${n}`;
}

const REEL_IMAGES = [
  'https://picsum.photos/seed/reel-worship/400/500',
  'https://picsum.photos/seed/reel-morning/400/500',
  'https://picsum.photos/seed/reel-creation/400/500',
  'https://picsum.photos/seed/reel-testimony/400/500',
  'https://picsum.photos/seed/reel-prayer/400/500',
];

function ReelCard({ reel, index }: { reel: Reel; index: number }) {
  const colors = useColors();
  const imageUri = REEL_IMAGES[index % REEL_IMAGES.length];

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={() => router.push('/(tabs)/reels')}
    >
      {/* Full card image */}
      <Image source={{ uri: imageUri }} style={styles.cardImage} contentFit="cover" />

      {/* Dark gradient overlay at bottom */}
      <View style={styles.cardOverlay} />

      {/* Play button — centred */}
      <View style={styles.playWrap}>
        <View style={styles.playBtn}>
          <Feather name="play" size={16} color="#fff" />
        </View>
      </View>

      {/* Bottom info inside the image */}
      <View style={styles.cardBottom}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {reel.description}
        </Text>
        <View style={styles.viewsRow}>
          <Feather name="eye" size={11} color="rgba(255,255,255,0.75)" />
          <Text style={styles.viewsText}>{formatViews(reel.views)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function RealmSpotlight() {
  const { reels } = useApp();
  const colors = useColors();
  const TEAL = colors.primary;

  return (
    <View style={[styles.section, { backgroundColor: colors.background }]}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Realms Spotlight</Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
            Trending faith videos in your community
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/reels')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={[styles.seeAll, { color: TEAL }]}>See All</Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {reels.map((reel, i) => (
          <View key={reel.id}>
            <ReelCard reel={reel} index={i} />
            {/* Creator name below the card */}
            <Text style={[styles.creatorName, { color: colors.mutedForeground }]}>
              {reel.userName}
            </Text>
          </View>
        ))}
      </ScrollView>
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    lineHeight: 22,
  },
  sectionSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
    lineHeight: 16,
  },
  seeAll: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 2,
  },
  scroll: {
    paddingLeft: 16,
    paddingRight: 8,
    gap: 10,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#111',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  // stronger gradient at bottom
  playWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    paddingLeft: 2,
  },
  cardBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  cardTitle: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
    lineHeight: 15,
    marginBottom: 4,
  },
  viewsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewsText: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.75)',
  },
  creatorName: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginTop: 5,
    textAlign: 'center',
    width: CARD_WIDTH,
  },
});
