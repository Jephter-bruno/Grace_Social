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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentUser = viewableStories[userIdx];

  const advance = useCallback(() => {
    if (!currentUser) return;
    const nextItem = itemIdx + 1;
    if (nextItem < currentUser.items.length) {
      setItemIdx(nextItem);
    } else {
      markStorySeen(currentUser.id);
      const nextUser = userIdx + 1;
      if (nextUser < viewableStories.length) {
        setUserIdx(nextUser);
        setItemIdx(0);
      } else {
        onClose();
      }
    }
  }, [currentUser, itemIdx, userIdx, viewableStories.length, markStorySeen, onClose]);

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
});
