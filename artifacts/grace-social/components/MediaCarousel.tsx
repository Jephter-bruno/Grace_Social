import { AntDesign, Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { VideoPlayer } from '@/components/VideoPlayer';
import { PostMediaItem } from '@/context/AppContext';

interface Props {
  items: PostMediaItem[];
  isActive?: boolean;
  onDoubleTap?: () => void;
}

const { width: SCREEN_W } = Dimensions.get('window');
// Instagram portrait ratio: 4:5
const SLIDE_HEIGHT = SCREEN_W * (5 / 4);

// ── Per-slide video slide with its own mute/pause state ─────────────────────
function VideoSlide({ uri, isActive }: { uri: string; isActive: boolean }) {
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);

  const pauseOpacity = useSharedValue(0);
  const pauseStyle = useAnimatedStyle(() => ({ opacity: pauseOpacity.value }));

  const togglePause = useCallback(() => {
    setPaused((prev) => {
      pauseOpacity.value = withSequence(
        withTiming(1, { duration: 80 }),
        withTiming(1, { duration: 500 }),
        withTiming(0, { duration: 300 })
      );
      return !prev;
    });
  }, []);

  return (
    <View style={vs.root}>
      <VideoPlayer
        uri={uri}
        isActive={isActive && !paused}
        muted={muted}
        contentFit="contain"
        style={vs.video}
        loop
      />

      {/* Tap overlay — single tap = pause, gesture layer */}
      <TouchableOpacity
        activeOpacity={1}
        style={vs.tapLayer}
        onPress={togglePause}
      />

      {/* Pause/play flash */}
      <Animated.View style={[vs.pauseOverlay, pauseStyle]} pointerEvents="none">
        <View style={vs.pauseCircle}>
          <Feather name={paused ? 'play' : 'pause'} size={32} color="#fff" />
        </View>
      </Animated.View>

      {/* Mute button — bottom-right, exactly like Instagram */}
      <TouchableOpacity
        style={vs.muteBtn}
        onPress={() => setMuted((v) => !v)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Feather name={muted ? 'volume-x' : 'volume-2'} size={16} color="#fff" />
      </TouchableOpacity>

      {/* Video type badge — top-left */}
      <View style={vs.badge} pointerEvents="none">
        <Feather name="film" size={11} color="#fff" />
        <Text style={vs.badgeText}>VIDEO</Text>
      </View>
    </View>
  );
}

const vs = StyleSheet.create({
  root: { width: SCREEN_W, height: SLIDE_HEIGHT, backgroundColor: '#000', position: 'relative' },
  video: { width: '100%', height: '100%' },
  tapLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  pauseOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    pointerEvents: 'none',
  },
  pauseCircle: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  muteBtn: {
    position: 'absolute', bottom: 14, right: 14,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    position: 'absolute', top: 12, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
});

// ── Main carousel ────────────────────────────────────────────────────────────
export function MediaCarousel({ items, isActive = false, onDoubleTap }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // Double-tap heart
  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);
  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartOpacity.value,
  }));

  const triggerHeart = useCallback(() => {
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
  }, [onDoubleTap]);

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDelay(250)
    .onEnd(() => { runOnJS(triggerHeart)(); });

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setActiveIndex(idx);
  };

  // Clamp visible dots to 5 max (Instagram shows at most 5 dots)
  const totalDots = Math.min(items.length, 5);
  const dotIndex = Math.min(activeIndex, totalDots - 1);

  return (
    <View style={s.root}>
      {/* Counter badge — top-right */}
      {items.length > 1 && (
        <View style={s.counter} pointerEvents="none">
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
          // Stop double-tap gesture from conflicting with scroll
          decelerationRate="fast"
        >
          {items.map((item, i) => (
            item.type === 'video' ? (
              <VideoSlide key={i} uri={item.uri} isActive={isActive && activeIndex === i} />
            ) : (
              <View key={i} style={s.slide}>
                <Image
                  source={{ uri: item.uri }}
                  style={s.media}
                  contentFit="contain"
                />
              </View>
            )
          ))}
        </ScrollView>
      </GestureDetector>

      {/* Heart overlay — sits above everything */}
      <Animated.View style={[s.heartOverlay, heartStyle]} pointerEvents="none">
        <AntDesign name="heart" size={90} color="#fff" />
      </Animated.View>

      {/* Dot indicators — bottom center */}
      {items.length > 1 && (
        <View style={s.dots} pointerEvents="none">
          {Array.from({ length: totalDots }).map((_, i) => (
            <Animated.View
              key={i}
              style={[
                s.dot,
                i === dotIndex ? s.dotActive : s.dotInactive,
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
    height: SLIDE_HEIGHT,
    backgroundColor: '#000',
    position: 'relative',
    overflow: 'hidden',
  },
  scroll: { flex: 1 },
  slide: {
    width: SCREEN_W,
    height: SLIDE_HEIGHT,
    backgroundColor: '#000',
  },
  media: { width: '100%', height: '100%' },
  heartOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    pointerEvents: 'none',
  },
  counter: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  counterText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  dots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    zIndex: 20,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 20,
    backgroundColor: '#fff',
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
});
