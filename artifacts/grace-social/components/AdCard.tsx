import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface AdData {
  network: 'google' | 'facebook';
  headline: string;
  description: string;
  advertiser: string;
  ctaText: string;
  iconName: string;
  iconColor: string;
}

const MOCK_ADS: AdData[] = [
  { network: 'google', headline: 'YouVersion Bible App', description: 'Read the Bible daily with thousands of reading plans. Free forever on any device.', advertiser: 'YouVersion', ctaText: 'Get it Free', iconName: 'book-open', iconColor: '#4A90A4' },
  { network: 'facebook', headline: 'Hillsong Worship Music', description: 'Stream 10,000+ worship songs and albums anytime, anywhere. 30-day free trial.', advertiser: 'Hillsong Music', ctaText: 'Listen Free', iconName: 'music', iconColor: '#9B59B6' },
  { network: 'google', headline: 'Faith Life Conference 2026', description: 'Join thousands of believers July 14-16 for worship, teaching & community. Register now.', advertiser: 'Life Conference', ctaText: 'Register Now', iconName: 'calendar', iconColor: '#27AE60' },
  { network: 'facebook', headline: 'DevoTime — Daily Devotionals', description: "Start each morning with God's word. Short, powerful daily devotionals for every believer.", advertiser: 'DevoTime App', ctaText: 'Try for Free', iconName: 'sun', iconColor: '#D4A843' },
  { network: 'google', headline: 'Proverbs 31 Ministries', description: "Encouragement for today's woman of faith. Bible studies, podcasts, books & more.", advertiser: 'Proverbs 31', ctaText: 'Explore Now', iconName: 'heart', iconColor: '#E91E8C' },
];

interface AdCardProps {
  index?: number;
  compact?: boolean;
}

export function AdCard({ index = 0, compact = false }: AdCardProps) {
  const colors = useColors();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const ad = MOCK_ADS[index % MOCK_ADS.length];
  const isGoogle = ad.network === 'google';

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Network header */}
      <View style={styles.topRow}>
        <View style={[styles.adBadge, { backgroundColor: isGoogle ? '#FBBC04' : '#1877F2' }]}>
          <Text style={styles.adBadgeText}>{isGoogle ? 'Ad' : 'Sponsored'}</Text>
        </View>
        <Text style={[styles.networkLabel, { color: colors.mutedForeground }]}>
          {isGoogle ? '• Google AdMob' : '• Facebook Audience'}
        </Text>
        <TouchableOpacity onPress={() => setDismissed(true)} style={styles.closeBtn}>
          <Feather name="x" size={14} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Ad content */}
      <View style={styles.body}>
        <View style={[styles.iconWrap, { backgroundColor: ad.iconColor + '18' }]}>
          <Feather name={ad.iconName as any} size={22} color={ad.iconColor} />
        </View>
        <View style={styles.textBlock}>
          <Text style={[styles.advertiser, { color: colors.mutedForeground }]}>{ad.advertiser}</Text>
          <Text style={[styles.headline, { color: colors.foreground }]}>{ad.headline}</Text>
          {!compact && (
            <Text style={[styles.description, { color: colors.mutedForeground }]} numberOfLines={2}>
              {ad.description}
            </Text>
          )}
        </View>
      </View>

      {/* CTA */}
      <TouchableOpacity style={[styles.ctaBtn, { backgroundColor: isGoogle ? '#4A90A4' : '#1877F2' }]}>
        <Text style={styles.ctaText}>{ad.ctaText}</Text>
        <Feather name="external-link" size={13} color="#fff" />
      </TouchableOpacity>

      {/* Disclaimer */}
      <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
        Tap to learn more. Sponsored content.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginHorizontal: 0, marginVertical: 2, borderTopWidth: 0.5, borderBottomWidth: 0.5, padding: 14, gap: 10 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  adBadge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 },
  adBadgeText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: '#fff' },
  networkLabel: { flex: 1, fontSize: 11, fontFamily: 'Inter_400Regular' },
  closeBtn: { padding: 4 },
  body: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  iconWrap: { width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  textBlock: { flex: 1, gap: 2 },
  advertiser: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  headline: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  description: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, paddingHorizontal: 18, borderRadius: 22, alignSelf: 'flex-start' },
  ctaText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  disclaimer: { fontSize: 10, fontFamily: 'Inter_400Regular' },
});
