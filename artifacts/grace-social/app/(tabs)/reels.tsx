import { Feather } from '@expo/vector-icons';
import React, { useCallback, useRef, useState } from 'react';
import { Dimensions, FlatList, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NewReelModal } from '@/components/NewReelModal';
import { ReelItem } from '@/components/ReelItem';
import { Reel, useApp } from '@/context/AppContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ReelsScreen() {
  const { reels } = useApp();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const [activeIndex, setActiveIndex] = useState(0);
  const [showNewReel, setShowNewReel] = useState(false);

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
    ({ item, index }: { item: Reel; index: number }) => (
      <ReelItem reel={item} isActive={index === activeIndex} />
    ),
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
        data={reels}
        keyExtractor={(item) => item.id}
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
