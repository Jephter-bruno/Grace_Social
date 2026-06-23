import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { AvatarCircle } from '@/components/AvatarCircle';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

interface SuggestedUser {
  handle: string;
  name: string;
  initials: string;
  color: string;
  userId: string;
  bio: string;
}

const ALL_SUGGESTIONS: SuggestedUser[] = [
  { handle: '@worshiphouse', name: 'Worship House', initials: 'WH', color: '#9B59B6', userId: 'u5', bio: 'Worship ministry at Grace Church 🎶' },
  { handle: '@david_l', name: 'David Livingston', initials: 'DL', color: '#27AE60', userId: 'u3', bio: 'Testimony Tuesday host | Faith over fear' },
  { handle: '@thomas_b', name: 'Thomas B.', initials: 'TB', color: '#E74C3C', userId: 'u6', bio: 'Walking by faith, not by sight ✝️' },
  { handle: '@ruth_m', name: 'Ruth M.', initials: 'RM', color: '#8E44AD', userId: 'u7', bio: 'Intercessor | Prayer warrior 🙏' },
  { handle: '@mary_k', name: 'Mary K.', initials: 'MK', color: '#E91E8C', userId: 'u8', bio: 'His grace is sufficient for me 🕊️' },
  { handle: '@anna_p', name: 'Anna P.', initials: 'AP', color: '#2980B9', userId: 'u9', bio: 'Trusting His plan, one day at a time' },
];

export function SuggestedPeopleCard() {
  const colors = useColors();
  const { followedHandles, toggleFollow, isFollowingUser } = useApp();
  const [dismissed, setDismissed] = React.useState<Record<string, boolean>>({});

  const suggestions = ALL_SUGGESTIONS.filter(
    (u) => !followedHandles[u.handle] && !dismissed[u.handle]
  );

  if (suggestions.length === 0) return null;

  const handleFollow = (user: SuggestedUser) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    toggleFollow(user.handle);
  };

  const handleDismiss = (user: SuggestedUser) => {
    setDismissed((prev) => ({ ...prev, [user.handle]: true }));
  };

  const openProfile = (user: SuggestedUser) => {
    router.push({
      pathname: '/member-profile',
      params: {
        handle: user.handle,
        name: user.name,
        initials: user.initials,
        color: user.color,
        userId: user.userId,
      },
    });
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <View style={styles.heading}>
        <Text style={[styles.headingText, { color: colors.foreground }]}>Suggested for You</Text>
        <TouchableOpacity onPress={() => router.push('/search')}>
          <Text style={[styles.seeAll, { color: colors.accent }]}>See All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {suggestions.map((user) => {
          const following = isFollowingUser(user.handle);
          return (
            <TouchableOpacity
              key={user.handle}
              style={[styles.personCard, { backgroundColor: colors.muted, borderColor: colors.border }]}
              onPress={() => openProfile(user)}
              activeOpacity={0.85}
            >
              {/* Dismiss */}
              <TouchableOpacity
                style={styles.dismissBtn}
                onPress={() => handleDismiss(user)}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <Feather name="x" size={13} color={colors.mutedForeground} />
              </TouchableOpacity>

              <AvatarCircle initials={user.initials} color={user.color} size={54} />
              <Text style={[styles.personName, { color: colors.foreground }]} numberOfLines={1}>
                {user.name}
              </Text>
              <Text style={[styles.personHandle, { color: colors.mutedForeground }]} numberOfLines={1}>
                {user.handle}
              </Text>
              <Text style={[styles.personBio, { color: colors.mutedForeground }]} numberOfLines={2}>
                {user.bio}
              </Text>

              <TouchableOpacity
                style={[
                  styles.followBtn,
                  following
                    ? { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }
                    : { backgroundColor: colors.primary },
                ]}
                onPress={() => handleFollow(user)}
                activeOpacity={0.75}
              >
                <Text style={[styles.followBtnText, { color: following ? colors.mutedForeground : '#fff' }]}>
                  {following ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderBottomWidth: 1,
    paddingTop: 14,
    paddingBottom: 16,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  headingText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  seeAll: { fontSize: 13, fontFamily: 'Inter_500Medium' },

  scrollContent: { paddingHorizontal: 14, gap: 10 },

  personCard: {
    width: 148,
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    position: 'relative',
  },
  dismissBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personName: { fontSize: 13, fontFamily: 'Inter_600SemiBold', textAlign: 'center', marginTop: 2 },
  personHandle: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  personBio: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 15 },

  followBtn: {
    marginTop: 4,
    width: '100%',
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  followBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
});
