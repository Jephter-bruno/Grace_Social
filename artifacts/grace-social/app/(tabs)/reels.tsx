import { Feather } from '@expo/vector-icons';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NewReelModal } from '@/components/NewReelModal';
import { ReelAdItem } from '@/components/ReelAdItem';
import { ReelItem } from '@/components/ReelItem';
import { Reel, useApp } from '@/context/AppContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const AD_EVERY = 3;

type FeedEntry =
  | { kind: 'reel'; data: Reel }
  | { kind: 'ad'; adIndex: number };

function buildReelFeed(reels: Reel[]): FeedEntry[] {
  const result: FeedEntry[] = [];
  let adCount = 0;
  reels.forEach((reel, i) => {
    result.push({ kind: 'reel', data: reel });
    if ((i + 1) % AD_EVERY === 0) {
      result.push({ kind: 'ad', adIndex: adCount++ });
    }
  });
  return result;
}

export default function ReelsScreen() {
  const { reels } = useApp();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const [activeIndex, setActiveIndex] = useState(0);
  const [showNewReel, setShowNewReel] = useState(false);

  const feed = useMemo(() => buildReelFeed(reels), [reels]);

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 60,
  });

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: any[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  );

  const renderItem = useCallback(
    ({ item, index }: { item: FeedEntry; index: number }) => {
      if (item.kind === 'ad') {
        return <ReelAdItem adIndex={item.adIndex} isActive={index === activeIndex} />;
      }
      return <ReelItem reel={item.data} isActive={index === activeIndex} />;
    },
    [activeIndex]
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: SCREEN_HEIGHT,
      offset: SCREEN_HEIGHT * index,
      index,
    }),
    []
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={feed}
        keyExtractor={(item, idx) =>
          item.kind === 'ad' ? `ad-${item.adIndex}-${idx}` : item.data.id
        }
        renderItem={renderItem}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        getItemLayout={getItemLayout}
        decelerationRate="fast"
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        style={styles.list}
        viewabilityConfig={viewabilityConfig.current}
        onViewableItemsChanged={onViewableItemsChanged.current}
      />

      <TouchableOpacity
        style={[styles.uploadFab, { top: (isWeb ? 67 : insets.top) + 12 }]}
        onPress={() => setShowNewReel(true)}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={20} color="#fff" />
      </TouchableOpacity>

      <NewReelModal visible={showNewReel} onClose={() => setShowNewReel(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  list: {
    flex: 1,
  },
  uploadFab: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
});
