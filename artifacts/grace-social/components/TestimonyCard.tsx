import { Feather } from '@expo/vector-icons';
import React, { useCallback } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Testimony } from '@/hooks/useTestimonies';

const CORAL = '#E07A54';

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = diffMs / 3600000;
    if (diffH < 1) return 'just now';
    if (diffH < 24) return `${Math.floor(diffH)}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) {
      const month = d.toLocaleString('en-US', { month: 'short' });
      return `${month} ${d.getDate()}`;
    }
    const month = d.toLocaleString('en-US', { month: 'short' });
    return `${month} ${d.getDate()}`;
  } catch {
    return '';
  }
}

interface TestimonyCardProps {
  testimony: Testimony;
  onLike: (id: number) => void;
  onComment: (testimony: Testimony) => void;
}

export function TestimonyCard({ testimony, onLike, onComment }: TestimonyCardProps) {
  const colors = useColors();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handleLike = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.35, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    onLike(testimony.id);
  }, [onLike, testimony.id, scaleAnim]);

  const avatarInits = initials(testimony.display_name);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: testimony.color }]}>
          <Text style={styles.avatarText}>{avatarInits}</Text>
        </View>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {testimony.display_name}
        </Text>
        <View style={[styles.badge, { backgroundColor: colors.muted }]}>
          <Text style={[styles.badgeText, { color: colors.foreground }]}>✨ Answered</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Title */}
      <Text style={[styles.title, { color: colors.foreground }]}>{testimony.title}</Text>

      {/* Content */}
      <Text style={[styles.content, { color: colors.mutedForeground }]}>{testimony.content}</Text>

      {/* Footer */}
      <View style={styles.footer}>
        {/* Like */}
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.75}>
          <Animated.Text
            style={[styles.heartIcon, { transform: [{ scale: scaleAnim }] }]}
          >
            {testimony.is_liked ? '❤️' : '🤍'}
          </Animated.Text>
          <Text style={[styles.actionCount, { color: colors.mutedForeground }]}>
            {testimony.likes_count}
          </Text>
        </TouchableOpacity>

        {/* Comment */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onComment(testimony)}
          activeOpacity={0.75}
        >
          <Feather name="message-circle" size={17} color={colors.mutedForeground} />
          <Text style={[styles.actionLabel, { color: colors.mutedForeground }]}>Comment</Text>
        </TouchableOpacity>

        {/* Date */}
        <Text style={[styles.date, { color: colors.mutedForeground }]}>
          {formatDate(testimony.created_at)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    marginBottom: 6,
    lineHeight: 22,
  },
  content: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 21,
    marginBottom: 14,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heartIcon: {
    fontSize: 17,
  },
  actionCount: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  actionLabel: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  date: {
    marginLeft: 'auto',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
});
