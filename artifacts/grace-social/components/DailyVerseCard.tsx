import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { getDailyVerse, Verse } from '@/constants/verses';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

export function DailyVerseCard() {
  const { setPendingVerse } = useApp();
  const colors = useColors();
  const [verse, setVerse] = useState<Verse | null>(null);

  useEffect(() => {
    getDailyVerse().then(setVerse).catch(() => {});
  }, []);

  const handleShare = useCallback(async () => {
    if (!verse) return;
    try {
      await Share.share({
        message: `"${verse.text}" — ${verse.reference}`,
        title: 'Daily Bible Verse',
      });
    } catch {}
  }, [verse]);

  const handlePost = useCallback(() => {
    if (!verse) return;
    setPendingVerse({ reference: verse.reference, text: verse.text });
  }, [verse, setPendingVerse]);

  const handleChapter = useCallback(() => {
    router.push('/bible');
  }, []);

  if (!verse) return null;

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={['#1a1208', '#0d1a12']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { borderColor: colors.border }]}
      >
        {/* Gold left accent */}
        <View style={styles.accent} />

        <View style={styles.body}>
          {/* Label row */}
          <View style={styles.labelRow}>
            <Feather name="sun" size={12} color="#D4A843" />
            <Text style={styles.labelText}>VERSE OF THE DAY</Text>
          </View>

          {/* Verse text */}
          <Text style={styles.verseText}>"{verse.text}"</Text>

          {/* Reference */}
          <Text style={styles.refText}>— {verse.reference}</Text>

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleShare} activeOpacity={0.75}>
              <Feather name="share-2" size={14} color="#D4A843" />
              <Text style={styles.actionLabel}>Share</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.actionBtn} onPress={handlePost} activeOpacity={0.75}>
              <Feather name="edit-3" size={14} color="#D4A843" />
              <Text style={styles.actionLabel}>Post</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.actionBtn} onPress={handleChapter} activeOpacity={0.75}>
              <Feather name="book-open" size={14} color="#D4A843" />
              <Text style={styles.actionLabel}>Open {verse.book}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  accent: {
    width: 4,
    backgroundColor: '#D4A843',
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  labelText: {
    color: '#D4A843',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.2,
  },
  verseText: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
    lineHeight: 23,
  },
  refText: {
    color: '#D4A843',
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  actionLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
});
