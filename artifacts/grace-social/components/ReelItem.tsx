import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated as RNAnimated,
  Dimensions,
  Modal,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarCircle } from '@/components/AvatarCircle';
import { CommentsModal } from '@/components/CommentsModal';
import { DuetModal } from '@/components/DuetModal';
import { VideoPlayer } from '@/components/VideoPlayer';
import { POST_IMAGES } from '@/constants/images';
import { Reel, useApp } from '@/context/AppContext';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const REEL_DURATION_MS = 30_000;

function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

interface ReelItemProps {
  reel: Reel;
  isActive: boolean;
}

export function ReelItem({ reel, isActive }: ReelItemProps) {
  const insets = useSafeAreaInsets();
  const { toggleReelLike, toggleReelSave, toggleFollow, incrementReelShares } = useApp();
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [moreSheetVisible, setMoreSheetVisible] = useState(false);
  const [duetVisible, setDuetVisible] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [toastText, setToastText] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isWeb = Platform.OS === 'web';
  const bottomPad = isWeb ? 84 : 60 + insets.bottom;
  const isPlaying = isActive && !isPaused;

  const progress = useSharedValue(0);
  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);
  const vinylRotation = useSharedValue(0);

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
    if (isActive && !isMuted) {
      vinylRotation.value = withRepeat(withTiming(360, { duration: 3200 }), -1, false);
    } else {
      cancelAnimation(vinylRotation);
    }
  }, [isActive, isMuted]);

  useEffect(() => {
    if (!isActive) { setIsPaused(false); setDescExpanded(false); }
  }, [isActive]);

  const progressStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` as any }));
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.value }], opacity: heartOpacity.value }));
  const vinylStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${vinylRotation.value}deg` }] }));

  const showToast = useCallback((msg: string) => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setToastText(msg);
    setToastVisible(true);
    toastTimeout.current = setTimeout(() => setToastVisible(false), 2200);
  }, []);

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
  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleReelSave(reel.id);
    showToast(reel.isSaved ? 'Removed from saved' : 'Saved to collection');
  };
  const handleMute = () => {
    Haptics.selectionAsync();
    setIsMuted((v) => !v);
  };

  const handleShare = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    incrementReelShares(reel.id);
    if (isWeb) {
      showToast('Link copied!');
      return;
    }
    try {
      await Share.share({
        message: `${reel.description}\n\nWatch this Realm on Grace Social`,
        title: `${reel.userName} on Grace Social`,
      });
    } catch {}
  }, [reel, isWeb, incrementReelShares, showToast]);

  const topPad = isWeb ? 67 : insets.top;

  const sheetSlide = useRef(new RNAnimated.Value(400)).current;

  const openMoreSheet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMoreSheetVisible(true);
    RNAnimated.spring(sheetSlide, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
  };

  const closeMoreSheet = (cb?: () => void) => {
    RNAnimated.timing(sheetSlide, { toValue: 400, duration: 200, useNativeDriver: true }).start(() => {
      setMoreSheetVisible(false);
      sheetSlide.setValue(400);
      cb?.();
    });
  };

  const moreOptions = [
    { icon: 'slash', label: 'Not interested', action: () => closeMoreSheet(() => showToast('We\'ll show you less like this')) },
    { icon: 'link', label: 'Copy link', action: () => closeMoreSheet(() => showToast('Link copied to clipboard')) },
    { icon: 'download', label: 'Save video', action: () => closeMoreSheet(() => showToast('Video saved to device')) },
    { icon: 'music', label: 'View original audio', action: () => closeMoreSheet(() => showToast(`Audio: ${reel.audioName}`)) },
    { icon: 'users', label: 'Duet', action: () => closeMoreSheet(() => setDuetVisible(true)) },
    { icon: 'flag', label: 'Report', action: () => closeMoreSheet(() => showToast('Report submitted — thank you')) },
  ];

  return (
    <View style={[styles.container, { height: SCREEN_HEIGHT, width: SCREEN_WIDTH }]}>
      {/* ── Video / image background ── */}
      <GestureDetector gesture={tapGesture}>
        <View style={StyleSheet.absoluteFill}>
          {reel.videoUri ? (
            <VideoPlayer uri={reel.videoUri} isActive={isPlaying} muted={isMuted} style={StyleSheet.absoluteFill as any} />
          ) : (
            <Image source={POST_IMAGES[reel.imageIndex]} style={StyleSheet.absoluteFill} contentFit="cover" />
          )}
        </View>
      </GestureDetector>

      {/* Pause / play indicator */}
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

      {/* Double-tap heart overlay */}
      <Animated.View style={[styles.heartOverlay, heartStyle]} pointerEvents="none">
        <Feather name="heart" size={100} color="#fff" />
      </Animated.View>

      {/* Bottom gradient */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.18)', 'rgba(0,0,0,0.85)']} style={[StyleSheet.absoluteFill, { top: SCREEN_HEIGHT * 0.32 }]} />
      </View>

      {/* ── Progress bar ── */}
      <View style={[styles.progressTrack, { top: topPad + 10 }]}>
        <Animated.View style={[styles.progressFill, progressStyle]} />
      </View>

      {/* ── Top-right controls: mute ── */}
      <TouchableOpacity
        style={[styles.muteBtn, { top: topPad + 30 }]}
        onPress={handleMute}
        activeOpacity={0.8}
      >
        <Feather name={isMuted ? 'volume-x' : 'volume-2'} size={18} color="#fff" />
      </TouchableOpacity>

      {/* ── Bottom-left content ── */}
      <View style={[styles.bottomContent, { paddingBottom: bottomPad + 16 }]}>
        {reel.bibleVerse ? (
          <View style={styles.verseWrap}>
            <Text style={styles.verseText}>"{reel.bibleVerse}"</Text>
          </View>
        ) : null}

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

        <TouchableOpacity onPress={() => setDescExpanded((v) => !v)} activeOpacity={0.85}>
          <Text style={styles.description} numberOfLines={descExpanded ? 0 : 2}>{reel.description}</Text>
          {!descExpanded && reel.description.length > 60 && (
            <Text style={styles.moreText}>more</Text>
          )}
        </TouchableOpacity>

        {/* Audio info bar */}
        <View style={styles.audioBar}>
          <Animated.View style={[styles.vinylDisc, vinylStyle]}>
            <AvatarCircle initials={reel.userInitials} color={reel.userColor} size={26} />
          </Animated.View>
          <Feather name="music" size={12} color="rgba(255,255,255,0.9)" />
          <Text style={styles.audioText} numberOfLines={1}>{reel.audioName}</Text>
        </View>
      </View>

      {/* ── Right sidebar actions ── */}
      <View style={[styles.rightActions, { bottom: bottomPad + 60 }]}>
        {/* Views */}
        <View style={styles.viewsItem}>
          <Feather name="eye" size={20} color="rgba(255,255,255,0.75)" />
          <Text style={styles.viewsCount}>{formatCount(reel.views)}</Text>
        </View>

        {/* Like */}
        <TouchableOpacity style={styles.actionItem} onPress={handleLike}>
          <Feather name="heart" size={28} color={reel.isLiked ? '#FF4444' : '#fff'} />
          <Text style={styles.actionCount}>{formatCount(reel.likes)}</Text>
        </TouchableOpacity>

        {/* Comment */}
        <TouchableOpacity style={styles.actionItem} onPress={() => setCommentsVisible(true)}>
          <Feather name="message-circle" size={28} color="#fff" />
          <Text style={styles.actionCount}>{formatCount(reel.comments)}</Text>
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity style={styles.actionItem} onPress={handleShare}>
          <Feather name="send" size={26} color="#fff" />
          <Text style={styles.actionCount}>{formatCount(reel.shares)}</Text>
        </TouchableOpacity>

        {/* Save */}
        <TouchableOpacity style={styles.actionItem} onPress={handleSave}>
          <Feather name="bookmark" size={26} color={reel.isSaved ? '#D4A843' : '#fff'} />
          <Text style={[styles.actionCount, reel.isSaved && { color: '#D4A843' }]}>Save</Text>
        </TouchableOpacity>

        {/* More */}
        <TouchableOpacity style={styles.actionItem} onPress={openMoreSheet}>
          <Feather name="more-horizontal" size={26} color="#fff" />
        </TouchableOpacity>

        {/* Spinning vinyl record */}
        <Animated.View style={[styles.vinylSidebar, vinylStyle]}>
          <View style={styles.vinylRing}>
            <AvatarCircle initials={reel.userInitials} color={reel.userColor} size={36} />
          </View>
        </Animated.View>
      </View>

      {/* ── Toast ── */}
      {toastVisible && (
        <View style={[styles.toast, { bottom: bottomPad + 14 }]} pointerEvents="none">
          <Text style={styles.toastText}>{toastText}</Text>
        </View>
      )}

      {/* ── Comments modal ── */}
      <CommentsModal
        visible={commentsVisible}
        entityId={reel.id}
        entityType="post"
        title="Realm Comments"
        onClose={() => setCommentsVisible(false)}
      />

      {/* ── Duet modal ── */}
      <DuetModal
        visible={duetVisible}
        onClose={() => setDuetVisible(false)}
        originalReel={reel}
      />

      {/* ── More options bottom sheet ── */}
      {moreSheetVisible && (
        <Modal transparent animationType="none" visible={moreSheetVisible} onRequestClose={() => closeMoreSheet()}>
          <TouchableWithoutFeedback onPress={() => closeMoreSheet()}>
            <View style={styles.sheetOverlay} />
          </TouchableWithoutFeedback>
          <RNAnimated.View style={[styles.sheetContainer, { transform: [{ translateY: sheetSlide }] }]}>
            {/* Handle */}
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{reel.userName}</Text>
            {moreOptions.map((opt) => (
              <TouchableOpacity key={opt.label} style={styles.sheetRow} onPress={opt.action} activeOpacity={0.75}>
                <View style={styles.sheetIconWrap}>
                  <Feather name={opt.icon as any} size={20} color="#fff" />
                </View>
                <Text style={styles.sheetLabel}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.sheetRow, styles.sheetCancel]} onPress={() => closeMoreSheet()} activeOpacity={0.75}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </RNAnimated.View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', overflow: 'hidden', backgroundColor: '#000' },

  playContainer: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -34 }, { translateY: -34 }], zIndex: 10 },
  playBg: { width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  heartOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 20 },

  progressTrack: { position: 'absolute', left: 16, right: 16, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 1, zIndex: 10 },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 1 },

  muteBtn: {
    position: 'absolute',
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  bottomContent: { position: 'absolute', left: 16, right: 80, bottom: 0, gap: 10, zIndex: 5 },
  verseWrap: { backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 8, padding: 10, borderLeftWidth: 3, borderLeftColor: '#D4A843' },
  verseText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_400Regular', fontStyle: 'italic', lineHeight: 17 },
  creatorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  creatorMeta: { flex: 1 },
  creatorName: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  creatorHandle: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontFamily: 'Inter_400Regular' },
  followBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: '#fff' },
  followBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  description: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },
  moreText: { color: 'rgba(255,255,255,0.55)', fontSize: 13, fontFamily: 'Inter_600SemiBold', marginTop: 2 },

  audioBar: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  vinylDisc: { width: 28, height: 28, borderRadius: 14, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)' },
  audioText: { flex: 1, color: 'rgba(255,255,255,0.85)', fontSize: 12, fontFamily: 'Inter_400Regular' },

  rightActions: { position: 'absolute', right: 12, gap: 18, alignItems: 'center', zIndex: 5 },
  viewsItem: { alignItems: 'center', gap: 3 },
  viewsCount: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  actionItem: { alignItems: 'center', gap: 4 },
  actionCount: { color: '#fff', fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  vinylSidebar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.5)',
    marginTop: 6,
  },
  vinylRing: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' },

  toast: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    zIndex: 30,
  },
  toastText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
    paddingTop: 12,
  },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)', alignSelf: 'center', marginBottom: 14 },
  sheetTitle: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: 'Inter_600SemiBold', textAlign: 'center', marginBottom: 10 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingVertical: 14 },
  sheetIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  sheetLabel: { color: '#fff', fontSize: 15, fontFamily: 'Inter_400Regular' },
  sheetCancel: { marginTop: 4, borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.12)', justifyContent: 'center' },
  sheetCancelText: { color: '#FF4444', fontSize: 16, fontFamily: 'Inter_600SemiBold', flex: 1, textAlign: 'center' },
});
