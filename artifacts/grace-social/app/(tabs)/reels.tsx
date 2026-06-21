import React, { useCallback, useRef, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, View, ViewToken } from 'react-native';

import { ReelItem } from '@/components/ReelItem';
import { Reel, useApp } from '@/context/AppContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ReelsScreen() {
  const { reels } = useApp();
  const [activeIndex, setActiveIndex] = useState(0);

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 60,
  });

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
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
    (_: Reel[] | null | undefined, index: number) => ({
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
});
