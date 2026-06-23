import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const SKIP_AFTER_MS = 5000;

interface ReelAdData {
  network: 'google' | 'facebook';
  advertiser: string;
  headline: string;
  description: string;
  ctaText: string;
  bgColors: [string, string, string];
  iconName: string;
  iconColor: string;
}

const REEL_ADS: ReelAdData[] = [
  {
    network: 'google',
    advertiser: 'YouVersion',
    headline: 'Read the Bible Every Day',
    description: 'Join 500M+ people reading God\'s word daily. Free reading plans for every season of life.',
    ctaText: 'Download Free',
    bgColors: ['#1a3a5c', '#2d6a9f', '#1a3a5c'],
    iconName: 'book-open',
    iconColor: '#6DB3F2',
  },
  {
    network: 'facebook',
    advertiser: 'Hillsong Music',
    headline: 'Worship Without Limits',
    description: 'Stream 10,000+ worship songs and full albums. The music that moves your soul, anytime.',
    ctaText: 'Start Free Trial',
    bgColors: ['#2d1b4e', '#5c3498', '#2d1b4e'],
    iconName: 'music',
    iconColor: '#C084FC',
  },
  {
    network: 'google',
    advertiser: 'Life Conference 2026',
    headline: 'Faith Life Conference',
    description: 'Three days of worship, community, and teaching. July 14–16. 40+ speakers. Don\'t miss it.',
    ctaText: 'Register Today',
    bgColors: ['#1a4030', '#276749', '#1a4030'],
    iconName: 'calendar',
    iconColor: '#6EE7B7',
  },
  {
    network: 'facebook',
    advertiser: 'Proverbs 31 Ministries',
    headline: 'Grow Deeper in Faith',
    description: 'Bible studies, devotionals, and podcasts for women of faith. New content every week.',
    ctaText: 'Explore Now',
    bgColors: ['#4a1942', '#8B1A6B', '#4a1942'],
    iconName: 'heart',
    iconColor: '#F9A8D4',
  },
];

interface ReelAdItemProps {
  adIndex: number;
  isActive: boolean;
}

export function ReelAdItem({ adIndex, isActive }: ReelAdItemProps) {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const bottomPad = isWeb ? 84 : 60 + insets.bottom;
  const topPad = isWeb ? 67 : insets.top;

  const ad = REEL_ADS[adIndex % REEL_ADS.length];
  const isGoogle = ad.network === 'google';

  const [canSkip, setCanSkip] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [skipCountdown, setSkipCountdown] = useState(Math.ceil(SKIP_AFTER_MS / 1000));
  const progressAnim = useRef(new Animated.Value(0)).current;
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!isActive) {
      setCanSkip(false);
      setSkipped(false);
      setSkipCountdown(Math.ceil(SKIP_AFTER_MS / 1000));
      progressAnim.setValue(0);
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (animRef.current) animRef.current.stop();
      return;
    }

    setCanSkip(false);
    setSkipped(false);
    progressAnim.setValue(0);
    setSkipCountdown(Math.ceil(SKIP_AFTER_MS / 1000));

    animRef.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: SKIP_AFTER_MS,
      useNativeDriver: false,
    });
    animRef.current.start();

    let remaining = Math.ceil(SKIP_AFTER_MS / 1000);
    countdownRef.current = setInterval(() => {
      remaining -= 1;
      setSkipCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(countdownRef.current!);
        setCanSkip(true);
      }
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (animRef.current) animRef.current.stop();
    };
  }, [isActive]);

  if (skipped) return null;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { height: SCREEN_HEIGHT, width: SCREEN_WIDTH }]}>
      <LinearGradient colors={ad.bgColors} style={StyleSheet.absoluteFill} />

      <View style={[styles.progressTrack, { top: topPad + 10 }]}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>

      <View style={[styles.topBar, { top: topPad + 26 }]}>
        <View style={[styles.networkBadge, { backgroundColor: isGoogle ? '#FBBC04' : '#1877F2' }]}>
          <Text style={styles.networkBadgeText}>{isGoogle ? 'Ad' : 'Sponsored'}</Text>
        </View>
        <Text style={styles.networkLabel}>
          {isGoogle ? 'Google AdMob' : 'Facebook Audience Network'}
        </Text>
      </View>

      <View style={[styles.adIcon, { backgroundColor: ad.iconColor + '28' }]}>
        <Feather name={ad.iconName as any} size={72} color={ad.iconColor} />
      </View>

      <View style={[styles.content, { paddingBottom: bottomPad + 16 }]}>
        <Text style={styles.advertiser}>{ad.advertiser}</Text>
        <Text style={styles.headline}>{ad.headline}</Text>
        <Text style={styles.description}>{ad.description}</Text>

        <TouchableOpacity
          style={[styles.ctaBtn, { backgroundColor: isGoogle ? '#FBBC04' : '#1877F2' }]}
          activeOpacity={0.85}
        >
          <Text style={[styles.ctaText, { color: isGoogle ? '#1a1a1a' : '#fff' }]}>
            {ad.ctaText}
          </Text>
          <Feather name="external-link" size={15} color={isGoogle ? '#1a1a1a' : '#fff'} />
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Sponsored · Tap to learn more · {isGoogle ? 'Ads by Google' : 'Ads by Meta'}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.skipBtn,
          {
            bottom: bottomPad + 120,
            backgroundColor: canSkip ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.4)',
            borderColor: canSkip ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)',
          },
        ]}
        onPress={() => canSkip && setSkipped(true)}
        activeOpacity={canSkip ? 0.75 : 1}
      >
        <Text style={[styles.skipText, { color: canSkip ? '#fff' : 'rgba(255,255,255,0.5)' }]}>
          {canSkip ? 'Skip Ad' : `Skip in ${skipCountdown}s`}
        </Text>
        {canSkip && <Feather name="chevron-right" size={14} color="#fff" />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1,
    zIndex: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
  },
  networkBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  networkBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  networkLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  adIcon: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  content: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 0,
    gap: 12,
  },
  advertiser: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headline: {
    color: '#fff',
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    lineHeight: 34,
  },
  description: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 28,
    marginTop: 4,
  },
  ctaText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  disclaimer: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginBottom: 8,
  },
  skipBtn: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    zIndex: 10,
  },
  skipText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
});
