import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';

// ─── Data ─────────────────────────────────────────────────────────────────────

const LIVE_EVENT = {
  id: 'live1',
  title: 'LIVE: Wednesday Bible Study',
  watching: 89,
  imageUrl: 'https://picsum.photos/seed/bible-study-live/800/420',
};

interface UpcomingEvent {
  id: string;
  category: string;
  categoryColor: string;
  title: string;
  date: string;
  attendees: number;
  imageUrl: string;
  rsvped: boolean;
}

const UPCOMING: UpcomingEvent[] = [
  {
    id: 'e1',
    category: 'Church Service',
    categoryColor: '#8B5CF6',
    title: 'Sunday Morning Service',
    date: 'Jul 22',
    attendees: 347,
    imageUrl: 'https://picsum.photos/seed/church-sunday/300/200',
    rsvped: false,
  },
  {
    id: 'e2',
    category: 'Worship',
    categoryColor: '#9B59B6',
    title: 'Youth Worship Night',
    date: 'Jul 25',
    attendees: 213,
    imageUrl: 'https://picsum.photos/seed/youth-worship/300/200',
    rsvped: false,
  },
  {
    id: 'e3',
    category: 'Prayer Session',
    categoryColor: '#E07A54',
    title: 'Global Prayer Session',
    date: 'Jul 23',
    attendees: 1247,
    imageUrl: 'https://picsum.photos/seed/global-prayer/300/200',
    rsvped: false,
  },
  {
    id: 'e4',
    category: 'Fellowship',
    categoryColor: '#27AE60',
    title: 'Community Potluck Dinner',
    date: 'Jul 27',
    attendees: 89,
    imageUrl: 'https://picsum.photos/seed/potluck-dinner/300/200',
    rsvped: false,
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function LiveEventsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = (isWeb ? 67 : insets.top) + 8;

  const [events, setEvents] = useState<UpcomingEvent[]>(UPCOMING);

  const toggleRsvp = (id: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, rsvped: !e.rsvped, attendees: e.rsvped ? e.attendees - 1 : e.attendees + 1 }
          : e
      )
    );
  };

  const formatAttendees = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1).replace('.0', '')}k` : `${n}`;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Live Events</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: isWeb ? 40 : insets.bottom + 40 }}
      >
        {/* Live Now section */}
        <View style={styles.section}>
          <View style={styles.liveNowRow}>
            <View style={styles.liveDot} />
            <Text style={[styles.liveNowLabel, { color: colors.foreground }]}>Live Now</Text>
          </View>

          {/* Live card */}
          <View style={[styles.liveCard, { borderColor: colors.border }]}>
            <View style={styles.liveImageWrap}>
              <Image
                source={{ uri: LIVE_EVENT.imageUrl }}
                style={styles.liveImage}
                contentFit="cover"
              />
              {/* LIVE badge */}
              <View style={styles.liveBadge}>
                <View style={styles.liveBadgeDot} />
                <Text style={styles.liveBadgeText}>LIVE</Text>
              </View>
              {/* Gradient overlay content */}
              <View style={styles.liveOverlay}>
                <Text style={styles.liveTitle}>{LIVE_EVENT.title}</Text>
                <Text style={styles.liveWatching}>{LIVE_EVENT.watching} watching</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Upcoming Events */}
        <View style={[styles.section, { paddingTop: 4 }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Upcoming Events</Text>

          {events.map((event) => (
            <View
              key={event.id}
              style={[styles.eventCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Image
                source={{ uri: event.imageUrl }}
                style={styles.eventThumb}
                contentFit="cover"
              />
              <View style={styles.eventInfo}>
                <Text style={[styles.eventCategory, { color: event.categoryColor }]}>
                  {event.category}
                </Text>
                <Text style={[styles.eventTitle, { color: colors.foreground }]}>{event.title}</Text>
                <View style={styles.eventMeta}>
                  <Feather name="calendar" size={12} color={colors.mutedForeground} />
                  <Text style={[styles.eventMetaText, { color: colors.mutedForeground }]}>
                    {event.date}
                  </Text>
                  <Feather name="users" size={12} color={colors.mutedForeground} style={{ marginLeft: 8 }} />
                  <Text style={[styles.eventMetaText, { color: colors.mutedForeground }]}>
                    {formatAttendees(event.attendees)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.rsvpBtn,
                  {
                    backgroundColor: event.rsvped ? colors.muted : colors.card,
                    borderColor: event.rsvped ? colors.border : colors.border,
                  },
                ]}
                onPress={() => toggleRsvp(event.id)}
              >
                <Feather
                  name={event.rsvped ? 'check' : 'plus'}
                  size={18}
                  color={event.rsvped ? colors.primary : colors.foreground}
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
  },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  closeBtn: { padding: 4 },

  section: { paddingHorizontal: 16, paddingTop: 20, gap: 12 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 4 },

  liveNowRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' },
  liveNowLabel: { fontSize: 16, fontFamily: 'Inter_700Bold' },

  liveCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  liveImageWrap: {
    height: 190,
    position: 'relative',
  },
  liveImage: { width: '100%', height: '100%' },
  liveBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  liveBadgeDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#fff' },
  liveBadgeText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: 0.5 },
  liveOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  liveTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
  liveWatching: { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  eventCard: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
  },
  eventThumb: { width: 100, height: 84 },
  eventInfo: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 3 },
  eventCategory: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  eventTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', lineHeight: 20 },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  eventMetaText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  rsvpBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
});
