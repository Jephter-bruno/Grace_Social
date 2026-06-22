import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
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
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { POST_IMAGES } from '@/constants/images';
import { getDailyVerse, saveVerse, Verse } from '@/constants/verses';
import { Story, useApp } from '@/context/AppContext';

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

interface VerseActionFeedback {
  message: string;
  visible: boolean;
}

export function StoryViewer({ visible, startIndex, onClose }: StoryViewerProps) {
  const { stories, markStorySeen, setPendingVerse, addPost, userProfile } = useApp();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';

  const viewableStories = stories.filter((s) => s.items.length > 0);
  const [userIdx, setUserIdx] = useState(startIndex);
  const [itemIdx, setItemIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [dailyVerse, setDailyVerse] = useState<Verse | null>(null);
  const [verseSaved, setVerseSaved] = useState(false);
  const [feedback, setFeedback] = useState<VerseActionFeedback>({ message: '', visible: false });
  const feedbackOpacity = useRef(new RNAnimated.Value(0)).current;

  const currentUser = viewableStories[userIdx];

  useEffect(() => {
    getDailyVerse().then(setDailyVerse).catch(() => {});
  }, []);

  const showFeedback = useCallback((message: string) => {
    setFeedback({ message, visible: true });
    feedbackOpacity.setValue(1);
    RNAnimated.timing(feedbackOpacity, {
      toValue: 0,
      duration: 2000,
      delay: 800,
      useNativeDriver: false,
    }).start(() => setFeedback({ message: '', visible: false }));
  }, [feedbackOpacity]);

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

  const handleShareVerse = useCallback(async () => {
    if (!dailyVerse) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      await Share.share({
        message: `"${dailyVerse.text}" — ${dailyVerse.reference}`,
        title: 'Daily Bible Verse',
      });
    } catch {}
  }, [dailyVerse]);

  const handleSaveVerse = useCallback(async () => {
    if (!dailyVerse || verseSaved) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const saved = await saveVerse(dailyVerse);
    if (saved) {
      setVerseSaved(true);
      showFeedback('Verse saved ✓');
    } else {
      showFeedback('Already in your saved verses');
    }
  }, [dailyVerse, verseSaved, showFeedback]);

  const handleOpenChapter = useCallback(() => {
    if (!dailyVerse) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onClose();
    setTimeout(() => router.push('/bible'), 300);
  }, [dailyVerse, onClose]);

  const handlePostVerse = useCallback(() => {
    if (!dailyVerse) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setPendingVerse({ reference: dailyVerse.reference, text: dailyVerse.text });
    onClose();
    setTimeout(() => router.push('/'), 300);
  }, [dailyVerse, setPendingVerse, onClose]);

  const handleSendDM = useCallback(() => {
    if (!dailyVerse) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onClose();
    setTimeout(() => router.push('/messages'), 300);
  }, [dailyVerse, onClose]);

  if (!visible || !currentUser) return null;

  const currentItem = currentUser.items[itemIdx];
  const topPad = isWeb ? 67 : insets.top;
  const isOwnStory = currentUser.isOwn;
  const bottomPad = isWeb ? 24 : insets.bottom + 12;

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

        {/* Story verse overlay */}
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
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.bottomGrad}
        />

        {/* ── Daily Verse Panel ── */}
        {dailyVerse && (
          <View style={[styles.dailyVersePanel, { bottom: bottomPad + 72 }]}>
            {/* Header row */}
            <View style={styles.dvHeader}>
              <View style={styles.dvHeaderLeft}>
                <Feather name="book-open" size={13} color="#D4A843" />
                <Text style={styles.dvLabel}>Daily Verse</Text>
              </View>
              <View style={styles.dvDot} />
            </View>

            {/* Verse text */}
            <Text style={styles.dvText} numberOfLines={3}>
              "{dailyVerse.text}"
            </Text>
            <Text style={styles.dvRef}>— {dailyVerse.reference}</Text>

            {/* Divider */}
            <View style={styles.dvDivider} />

            {/* Action buttons */}
            <View style={styles.dvActions}>
              <TouchableOpacity style={styles.dvAction} onPress={handleShareVerse}>
                <Feather name="share-2" size={17} color="#fff" />
                <Text style={styles.dvActionLabel}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.dvAction} onPress={handleSaveVerse}>
                <Feather
                  name={verseSaved ? 'bookmark' : 'bookmark'}
                  size={17}
                  color={verseSaved ? '#D4A843' : '#fff'}
                />
                <Text style={[styles.dvActionLabel, verseSaved && { color: '#D4A843' }]}>
                  {verseSaved ? 'Saved' : 'Save'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.dvAction} onPress={handleOpenChapter}>
                <Feather name="book" size={17} color="#fff" />
                <Text style={styles.dvActionLabel}>Chapter</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.dvAction} onPress={handlePostVerse}>
                <Feather name="edit-3" size={17} color="#fff" />
                <Text style={styles.dvActionLabel}>Post</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.dvAction} onPress={handleSendDM}>
                <Feather name="send" size={17} color="#fff" />
                <Text style={styles.dvActionLabel}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Feedback toast */}
        {feedback.visible && (
          <RNAnimated.View style={[styles.feedbackToast, { opacity: feedbackOpacity }]}>
            <Text style={styles.feedbackText}>{feedback.message}</Text>
          </RNAnimated.View>
        )}

        {/* Footer reply bar */}
        <View style={[styles.footer, { paddingBottom: bottomPad }]}>
          {isOwnStory ? (
            <View style={styles.replyInput}>
              <Text style={styles.replyPlaceholder}>
                Seen by {Math.floor(Math.random() * 20) + 5} people
              </Text>
            </View>
          ) : (
            <View style={styles.replyInput}>
              <Text style={styles.replyPlaceholder}>
                Reply to {currentUser.userName.split(' ')[0]}…
              </Text>
            </View>
          )}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
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
  barsRow: {
    position: 'absolute',
    left: 10,
    right: 10,
    flexDirection: 'row',
    gap: 4,
    zIndex: 10,
  },
  barTrack: {
    flex: 1,
    height: 2.5,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
  userHeader: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 10,
  },
  avatarRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_700Bold' },
  userMeta: { flex: 1 },
  userName: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  userTime: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: 'Inter_400Regular' },
  closeBtn: { padding: 4 },
  verseOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '32%',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 5,
  },
  verseBox: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
    padding: 22,
    borderLeftWidth: 3,
    borderLeftColor: '#D4A843',
    gap: 10,
    width: '100%',
  },
  verseText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
  },
  verseRef: {
    color: '#D4A843',
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  tapZones: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', zIndex: 4 },
  tapLeft: { width: '40%', height: '100%' },
  tapRight: { flex: 1, height: '100%' },
  bottomGrad: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 260,
    zIndex: 2,
  },

  /* Daily Verse Panel */
  dailyVersePanel: {
    position: 'absolute',
    left: 14,
    right: 14,
    backgroundColor: 'rgba(10,10,10,0.72)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(212,168,67,0.35)',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    zIndex: 10,
    gap: 6,
  },
  dvHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  dvHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dvLabel: {
    color: '#D4A843',
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  dvDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },
  dvText: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
    lineHeight: 19,
  },
  dvRef: {
    color: '#D4A843',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  dvDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginVertical: 6,
  },
  dvActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dvAction: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
    flex: 1,
  },
  dvActionLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
  },

  /* Feedback toast */
  feedbackToast: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 20,
  },
  feedbackText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },

  /* Footer */
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
    zIndex: 10,
  },
  replyInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  replyPlaceholder: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
});
