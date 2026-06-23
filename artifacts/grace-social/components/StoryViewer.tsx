import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { POST_IMAGES } from '@/constants/images';
import { useApp } from '@/context/AppContext';

const STORY_ADS = [
  { network: 'facebook' as const, advertiser: 'YouVersion Bible App', headline: 'Read the Bible Daily', ctaText: 'Get it Free', iconName: 'book-open', accentColor: '#4A90A4' },
  { network: 'google' as const, advertiser: 'Hillsong Worship', headline: 'Stream Worship Music', ctaText: 'Listen Free', iconName: 'music', accentColor: '#9B59B6' },
  { network: 'facebook' as const, advertiser: 'Life Conference 2026', headline: 'Faith Life Conference · July 14', ctaText: 'Register Now', iconName: 'calendar', accentColor: '#27AE60' },
  { network: 'google' as const, advertiser: 'Proverbs 31 Ministries', headline: 'Devotionals for Women of Faith', ctaText: 'Explore Now', iconName: 'heart', accentColor: '#E91E8C' },
];

const STORY_AD_DURATION = 6000;

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const STORY_DURATION = 5000;

interface StoryViewerProps {
  visible: boolean;
  startIndex: number;
  onClose: () => void;
}

function ProgressBar({ active, done }: { active: boolean; done: boolean }) {
  const progress = useSharedValue(done ? 1 : 0);

  useEffect(() => {
    if (done) {
      progress.value = 1;
    } else if (active) {
      progress.value = 0;
      progress.value = withTiming(1, { duration: STORY_DURATION });
    } else {
      progress.value = 0;
    }
  }, [active, done]);

  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View style={styles.barTrack}>
      <Animated.View style={[styles.barFill, barStyle]} />
    </View>
  );
}

export function StoryViewer({ visible, startIndex, onClose }: StoryViewerProps) {
  const { stories, markStorySeen } = useApp();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';

  const viewableStories = stories.filter((s) => s.items.length > 0);
  const [userIdx, setUserIdx] = useState(startIndex);
  const [itemIdx, setItemIdx] = useState(0);
  const [showStoryAd, setShowStoryAd] = useState(false);
  const [storyAdIndex, setStoryAdIndex] = useState(0);
  const [pendingNextUser, setPendingNextUser] = useState<number | null>(null);
  const [adCountdown, setAdCountdown] = useState(Math.ceil(STORY_AD_DURATION / 1000));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const adTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const adCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const adProgress = useSharedValue(0);

  const currentUser = viewableStories[userIdx];

  const dismissAd = useCallback((nextUser: number) => {
    setShowStoryAd(false);
    adProgress.value = 0;
    if (adTimerRef.current) clearTimeout(adTimerRef.current);
    if (adCountdownRef.current) clearInterval(adCountdownRef.current);
    if (nextUser < viewableStories.length) {
      setUserIdx(nextUser);
      setItemIdx(0);
    } else {
      onClose();
    }
  }, [viewableStories.length, onClose, adProgress]);

  const advance = useCallback(() => {
    if (!currentUser) return;
    const nextItem = itemIdx + 1;
    if (nextItem < currentUser.items.length) {
      setItemIdx(nextItem);
    } else {
      markStorySeen(currentUser.id);
      const nextUser = userIdx + 1;
      // Show a story ad every 2 users
      if (nextUser < viewableStories.length && userIdx % 2 === 1) {
        setPendingNextUser(nextUser);
        setStoryAdIndex((i) => i + 1);
        setAdCountdown(Math.ceil(STORY_AD_DURATION / 1000));
        adProgress.value = 0;
        adProgress.value = withTiming(1, { duration: STORY_AD_DURATION });
        setShowStoryAd(true);
        if (adTimerRef.current) clearTimeout(adTimerRef.current);
        adTimerRef.current = setTimeout(() => dismissAd(nextUser), STORY_AD_DURATION);
        let rem = Math.ceil(STORY_AD_DURATION / 1000);
        if (adCountdownRef.current) clearInterval(adCountdownRef.current);
        adCountdownRef.current = setInterval(() => {
          rem -= 1;
          setAdCountdown(rem);
          if (rem <= 0 && adCountdownRef.current) clearInterval(adCountdownRef.current);
        }, 1000);
      } else if (nextUser < viewableStories.length) {
        setUserIdx(nextUser);
        setItemIdx(0);
      } else {
        onClose();
      }
    }
  }, [currentUser, itemIdx, userIdx, viewableStories.length, markStorySeen, onClose, adProgress, dismissAd]);

  const retreat = useCallback(() => {
    const prevItem = itemIdx - 1;
    if (prevItem >= 0) {
      setItemIdx(prevItem);
    } else {
      const prevUser = userIdx - 1;
      if (prevUser >= 0) {
        setUserIdx(prevUser);
        setItemIdx(0);
      }
    }
  }, [itemIdx, userIdx]);

  useEffect(() => {
    if (!visible) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => advance(), STORY_DURATION);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, userIdx, itemIdx, advance]);

  useEffect(() => {
    if (visible) {
      setUserIdx(Math.min(startIndex, Math.max(0, viewableStories.length - 1)));
      setItemIdx(0);
    }
  }, [visible, startIndex]);

  const adProgressStyle = useAnimatedStyle(() => ({
    width: `${adProgress.value * 100}%` as any,
  }));

  if (!visible || !currentUser) return null;

  const currentItem = currentUser.items[itemIdx];
  const topPad = isWeb ? 67 : insets.top;
  const isOwnStory = currentUser.isOwn;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Background */}
        {currentItem?.imageIndex !== undefined ? (
          <Image
            source={POST_IMAGES[currentItem.imageIndex]}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : (
          <LinearGradient
            colors={[currentUser.userColor, '#000']}
            style={StyleSheet.absoluteFill}
          />
        )}

        {/* Dark overlay */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.18)' }]} />

        {/* Gradient top */}
        <LinearGradient
          colors={['rgba(0,0,0,0.55)', 'transparent']}
          style={[styles.topGrad, { height: 120 + topPad }]}
        />

        {/* Progress bars */}
        <View style={[styles.barsRow, { top: topPad + 8 }]}>
          {currentUser.items.map((_, i) => (
            <ProgressBar key={i} active={i === itemIdx} done={i < itemIdx} />
          ))}
        </View>

        {/* User header */}
        <View style={[styles.userHeader, { top: topPad + 24 }]}>
          <View style={[styles.avatarRing, { borderColor: currentUser.userColor }]}>
            <View style={[styles.avatarInner, { backgroundColor: currentUser.userColor }]}>
              <Text style={styles.avatarText}>{currentUser.userInitials}</Text>
            </View>
          </View>
          <View style={styles.userMeta}>
            <Text style={styles.userName}>
              {isOwnStory ? 'Your Story' : currentUser.userName}
            </Text>
            <Text style={styles.userTime}>{currentItem?.timestamp ?? 'Just now'}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Story content overlay */}
        {currentItem?.verseText && (
          <View style={styles.verseOverlay}>
            <View style={styles.verseBox}>
              <Feather name="book-open" size={20} color="#D4A843" />
              <Text style={styles.verseText}>"{currentItem.verseText}"</Text>
              {currentItem.verseReference && (
                <Text style={styles.verseRef}>— {currentItem.verseReference}</Text>
              )}
            </View>
          </View>
        )}

        {/* Tap zones */}
        <View style={styles.tapZones}>
          <TouchableWithoutFeedback onPress={retreat}>
            <View style={styles.tapLeft} />
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback onPress={advance}>
            <View style={styles.tapRight} />
          </TouchableWithoutFeedback>
        </View>

        {/* Bottom gradient */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)']}
          style={styles.bottomGrad}
        />

        {/* Footer reply bar */}
        <View style={[styles.footer, { paddingBottom: isWeb ? 24 : insets.bottom + 12 }]}>
          {isOwnStory ? (
            <View style={styles.replyInput}>
              <Text style={styles.replyPlaceholder}>Seen by {Math.floor(Math.random() * 20) + 5} people</Text>
            </View>
          ) : (
            <View style={styles.replyInput}>
              <Text style={styles.replyPlaceholder}>Reply to {currentUser.userName.split(' ')[0]}…</Text>
            </View>
          )}
          <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
            <Feather name={isOwnStory ? 'bar-chart-2' : 'send'} size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ── Story Ad Overlay ── */}
        {showStoryAd && (() => {
          const ad = STORY_ADS[storyAdIndex % STORY_ADS.length];
          const isGoogle = ad.network === 'google';
          return (
            <View style={[StyleSheet.absoluteFill, styles.adOverlay]} pointerEvents="box-none">
              <LinearGradient
                colors={['rgba(0,0,0,0.92)', 'rgba(0,0,0,0.75)', 'rgba(0,0,0,0.92)']}
                style={StyleSheet.absoluteFill}
              />

              {/* Ad progress bar */}
              <View style={[styles.adProgressTrack, { top: topPad + 8 }]}>
                <Animated.View style={[styles.adProgressFill, adProgressStyle]} />
              </View>

              {/* Sponsored label */}
              <View style={[styles.adTopRow, { top: topPad + 20 }]}>
                <View style={[styles.adNetworkBadge, { backgroundColor: isGoogle ? '#FBBC04' : '#1877F2' }]}>
                  <Text style={styles.adNetworkText}>{isGoogle ? 'Ad' : 'Sponsored'}</Text>
                </View>
                <Text style={styles.adNetworkLabel}>
                  {isGoogle ? 'Google AdMob' : 'Facebook Audience Network'}
                </Text>
                <TouchableOpacity
                  style={styles.adSkipBtn}
                  onPress={() => pendingNextUser !== null && dismissAd(pendingNextUser)}
                >
                  <Text style={styles.adSkipText}>
                    {adCountdown > 0 ? `${adCountdown}s` : 'Skip'}
                  </Text>
                  {adCountdown <= 0 && <Feather name="chevron-right" size={12} color="rgba(255,255,255,0.8)" />}
                </TouchableOpacity>
              </View>

              {/* Ad body */}
              <View style={styles.adBody}>
                <View style={[styles.adIconWrap, { backgroundColor: ad.accentColor + '28' }]}>
                  <Feather name={ad.iconName as any} size={44} color={ad.accentColor} />
                </View>
                <Text style={styles.adAdvertiser}>{ad.advertiser}</Text>
                <Text style={styles.adHeadline}>{ad.headline}</Text>
                <TouchableOpacity
                  style={[styles.adCtaBtn, { backgroundColor: isGoogle ? '#FBBC04' : '#1877F2' }]}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.adCtaText, { color: isGoogle ? '#1a1a1a' : '#fff' }]}>
                    {ad.ctaText}
                  </Text>
                  <Feather name="external-link" size={13} color={isGoogle ? '#1a1a1a' : '#fff'} />
                </TouchableOpacity>
              </View>

              {/* Bottom CTA bar */}
              <View style={[styles.adFooter, { paddingBottom: isWeb ? 24 : insets.bottom + 12 }]}>
                <TouchableOpacity
                  style={styles.adLearnMore}
                  activeOpacity={0.85}
                  onPress={() => pendingNextUser !== null && dismissAd(pendingNextUser)}
                >
                  <Feather name="chevrons-up" size={18} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.adLearnMoreText}>Swipe up to learn more</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  topGrad: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 },
  barsRow: { position: 'absolute', left: 10, right: 10, flexDirection: 'row', gap: 4, zIndex: 10 },
  barTrack: { flex: 1, height: 2.5, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 2, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
  userHeader: { position: 'absolute', left: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 10 },
  avatarRing: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, padding: 2, alignItems: 'center', justifyContent: 'center' },
  avatarInner: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_700Bold' },
  userMeta: { flex: 1 },
  userName: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  userTime: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: 'Inter_400Regular' },
  closeBtn: { padding: 4 },
  verseOverlay: { position: 'absolute', left: 0, right: 0, top: '32%', alignItems: 'center', paddingHorizontal: 24, zIndex: 5 },
  verseBox: { backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 16, padding: 22, borderLeftWidth: 3, borderLeftColor: '#D4A843', gap: 10, width: '100%' },
  verseText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_400Regular', fontStyle: 'italic', textAlign: 'center', lineHeight: 24 },
  verseRef: { color: '#D4A843', fontSize: 13, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  tapZones: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', zIndex: 4 },
  tapLeft: { width: '40%', height: '100%' },
  tapRight: { flex: 1, height: '100%' },
  bottomGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 160, zIndex: 2 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, gap: 12, zIndex: 10 },
  replyInput: { flex: 1, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10 },
  replyPlaceholder: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontFamily: 'Inter_400Regular' },

  adOverlay: { zIndex: 20, alignItems: 'center', justifyContent: 'center' },
  adProgressTrack: { position: 'absolute', left: 10, right: 10, height: 2.5, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden', zIndex: 30 },
  adProgressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
  adTopRow: { position: 'absolute', left: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 30 },
  adNetworkBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4 },
  adNetworkText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#fff' },
  adNetworkLabel: { flex: 1, color: 'rgba(255,255,255,0.65)', fontSize: 12, fontFamily: 'Inter_400Regular' },
  adSkipBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  adSkipText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  adBody: { alignItems: 'center', gap: 14, paddingHorizontal: 28 },
  adIconWrap: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  adAdvertiser: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontFamily: 'Inter_400Regular', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' },
  adHeadline: { color: '#fff', fontSize: 22, fontFamily: 'Inter_700Bold', textAlign: 'center', lineHeight: 29 },
  adCtaBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 28, marginTop: 6 },
  adCtaText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  adFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', paddingTop: 12, zIndex: 30 },
  adLearnMore: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  adLearnMoreText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontFamily: 'Inter_400Regular' },
});
