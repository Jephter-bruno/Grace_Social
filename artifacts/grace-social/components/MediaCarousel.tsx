import { AntDesign } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import { VideoPlayer } from '@/components/VideoPlayer';
import { PostMediaItem } from '@/context/AppContext';

interface Props {
  items: PostMediaItem[];
  isActive?: boolean;
  onDoubleTap?: () => void;
}

const { width: SCREEN_W } = Dimensions.get('window');

export function MediaCarousel({ items, isActive = false, onDoubleTap }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);
  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartOpacity.value,
  }));

  const triggerHeart = () => {
    heartScale.value = withSequence(
      withSpring(1.25, { damping: 6, stiffness: 200 }),
      withSpring(1.0, { damping: 10 })
    );
    heartOpacity.value = withSequence(
      withTiming(1, { duration: 60 }),
      withTiming(1, { duration: 600 }),
      withTiming(0, { duration: 350 })
    );
    onDoubleTap?.();
  };

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDelay(250)
    .onEnd(() => { runOnJS(triggerHeart)(); });

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setActiveIndex(idx);
  };

  return (
    <View style={s.root}>
      {/* Counter badge — top right (Instagram-style) */}
      {items.length > 1 && (
        <View style={s.counter}>
          <Text style={s.counterText}>{activeIndex + 1}/{items.length}</Text>
        </View>
      )}

      <GestureDetector gesture={doubleTap}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={handleScroll}
          style={s.scroll}
        >
          {items.map((item, i) => (
            <View key={i} style={s.slide}>
              {item.type === 'image' ? (
                <Image source={{ uri: item.uri }} style={s.media} contentFit="cover" />
              ) : (
                <VideoPlayer
                  uri={item.uri}
                  isActive={isActive && activeIndex === i}
                  muted
                  style={s.media}
                />
              )}
            </View>
          ))}
        </ScrollView>
      </GestureDetector>

      {/* Heart overlay */}
      <Animated.View style={[s.heartOverlay, heartStyle]} pointerEvents="none">
        <AntDesign name="heart" size={80} color="#fff" />
      </Animated.View>

      {/* Dot indicators */}
      {items.length > 1 && (
        <View style={s.dots}>
          {items.map((_, i) => (
            <View
              key={i}
              style={[
                s.dot,
                i === activeIndex ? s.dotActive : s.dotInactive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    width: '100%',
    aspectRatio: 4 / 3,
    position: 'relative',
    backgroundColor: '#111',
    overflow: 'hidden',
  },
  scroll: { flex: 1 },
  slide: {
    width: SCREEN_W,
    aspectRatio: 4 / 3,
  },
  media: { width: '100%', height: '100%' },
  heartOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    pointerEvents: 'none',
  },
  counter: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  counterText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  dots: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 18,
    borderRadius: 3,
  },
  dotInactive: {
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
});
