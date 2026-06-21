import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarCircle } from '@/components/AvatarCircle';
import { CommentsModal } from '@/components/CommentsModal';
import { VideoPlayer } from '@/components/VideoPlayer';
import { POST_IMAGES } from '@/constants/images';
import { Reel, useApp } from '@/context/AppContext';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const REEL_DURATION_MS = 30_000;

function formatCount(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
}

interface ReelItemProps {
  reel: Reel;
  isActive: boolean;
}

export function ReelItem({ reel, isActive }: ReelItemProps) {
  const insets = useSafeAreaInsets();
  const { toggleReelLike, toggleFollow } = useApp();
  const [isPaused, setIsPaused] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const isWeb = Platform.OS === 'web';
  const bottomPad = isWeb ? 84 : 60 + insets.bottom;
  const isPlaying = isActive && !isPaused;

  const progress = useSharedValue(0);
  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      progress.value = 0;
      progress.value = withTiming(1, { duration: REEL_DURATION_MS });
    } else if (!isActive) {
      cancelAnimation(progress);
      progress.value = 0;
    } else {
      cancelAnimation(progress);
    }
  }, [isPlaying, isActive]);

  useEffect(() => {
    if (!isActive) setIsPaused(false);
  }, [isActive]);

  const progressStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.value }], opacity: heartOpacity.value }));

  const triggerLike = useCallback(() => {
    if (!reel.isLiked) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      toggleReelLike(reel.id);
    }
    heartScale.value = withSequence(withSpring(1.3, { damping: 6, stiffness: 200 }), withSpring(1.0, { damping: 10 }));
    heartOpacity.value = withSequence(withTiming(1, { duration: 60 }), withTiming(1, { duration: 600 }), withTiming(0, { duration: 350 }));
  }, [reel.isLiked, reel.id, toggleReelLike]);

  const doubleTap = Gesture.Tap().numberOfTaps(2).maxDelay(250).onEnd(() => { runOnJS(triggerLike)(); });
  const singleTap = Gesture.Tap().onEnd(() => { runOnJS(setIsPaused)((prev: boolean) => !prev); });
  const tapGesture = Gesture.Exclusive(doubleTap, singleTap);

  const handleLike = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleReelLike(reel.id); };
  const handleFollow = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); toggleFollow(reel.id); };

  const topPad = isWeb ? 67 : insets.top;

  return (
    <View style={[styles.container, { height: SCREEN_HEIGHT, width: SCREEN_WIDTH }]}>
      <GestureDetector gesture={tapGesture}>
        <View style={StyleSheet.absoluteFill}>
          {reel.videoUri ? (
            <VideoPlayer uri={reel.videoUri} isActive={isPlaying} muted style={StyleSheet.absoluteFill} />
          ) : (
            <Image source={POST_IMAGES[reel.imageIndex]} style={StyleSheet.absoluteFill} contentFit="cover" />
          )}
        </View>
      </GestureDetector>

      {isActive && isPaused && (
        <View style={styles.playContainer} pointerEvents="none">
          <View style={styles.playBg}><Feather name="pause" size={30} color="#fff" /></View>
        </View>
      )}
      {!isActive && (
        <View style={styles.playContainer} pointerEvents="none">
          <View style={styles.playBg}><Feather name="play" size={30} color="#fff" /></View>
        </View>
      )}

      <Animated.View style={[styles.heartOverlay, heartStyle]} pointerEvents="none">
        <Feather name="heart" size={100} color="#fff" />
      </Animated.View>

      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.82)']} style={[StyleSheet.absoluteFill, { top: SCREEN_HEIGHT * 0.35 }]} />
      </View>

      <View style={[styles.progressTrack, { top: topPad + 10 }]}>
        <Animated.View style={[styles.progressFill, progressStyle]} />
      </View>

      <View style={[styles.bottomContent, { paddingBottom: bottomPad + 16 }]}>
        <View style={styles.verseWrap}>
          <Text style={styles.verseText}>"{reel.bibleVerse}"</Text>
        </View>
        <View style={styles.creatorRow}>
          <AvatarCircle initials={reel.userInitials} color={reel.userColor} size={36} />
          <View style={styles.creatorMeta}>
            <Text style={styles.creatorName}>{reel.userName}</Text>
            <Text style={styles.creatorHandle}>{reel.userHandle}</Text>
          </View>
          {!reel.isFollowing && (
            <TouchableOpacity style={styles.followBtn} onPress={handleFollow}>
              <Text style={styles.followBtnText}>Follow</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.description} numberOfLines={2}>{reel.description}</Text>
        <Text style={styles.durationText}>{reel.duration}</Text>
      </View>

      <View style={[styles.rightActions, { bottom: bottomPad + 80 }]}>
        <TouchableOpacity style={styles.actionItem} onPress={handleLike}>
          <Feather name="heart" size={28} color={reel.isLiked ? '#FF4444' : '#fff'} />
          <Text style={styles.actionCount}>{formatCount(reel.likes)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem} onPress={() => setCommentsVisible(true)}>
          <Feather name="message-circle" size={28} color="#fff" />
          <Text style={styles.actionCount}>{reel.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem} onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}>
          <Feather name="share-2" size={26} color="#fff" />
          <Text style={styles.actionCount}>Share</Text>
        </TouchableOpacity>
      </View>

      <CommentsModal
        visible={commentsVisible}
        entityId={reel.id}
        entityType="post"
        title="Realm Comments"
        onClose={() => setCommentsVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', overflow: 'hidden', backgroundColor: '#000' },
  playContainer: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -34 }, { translateY: -34 }], zIndex: 10 },
  playBg: { width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  heartOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 20 },
  progressTrack: { position: 'absolute', left: 16, right: 16, height: 2, backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 1, zIndex: 10 },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 1 },
  bottomContent: { position: 'absolute', left: 16, right: 72, bottom: 0, gap: 10 },
  verseWrap: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: 10, borderLeftWidth: 3, borderLeftColor: '#D4A843' },
  verseText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_400Regular', fontStyle: 'italic', lineHeight: 18 },
  creatorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  creatorMeta: { flex: 1 },
  creatorName: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  creatorHandle: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontFamily: 'Inter_400Regular' },
  followBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: '#fff' },
  followBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  description: { color: 'rgba(255,255,255,0.88)', fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  durationText: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontFamily: 'Inter_400Regular' },
  rightActions: { position: 'absolute', right: 14, gap: 22 },
  actionItem: { alignItems: 'center', gap: 4 },
  actionCount: { color: '#fff', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
});
