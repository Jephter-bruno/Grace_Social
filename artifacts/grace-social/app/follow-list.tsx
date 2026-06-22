import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarCircle } from '@/components/AvatarCircle';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';

interface FollowUser {
  id: number;
  name: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  color: string;
  followers_count: number;
  following_count: number;
  is_following_back: boolean;
}

function getApiBase(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}/api`;
  return 'http://localhost:3000/api';
}

export default function FollowListScreen() {
  const { userId, type, userName } = useLocalSearchParams<{ userId: string; type: 'followers' | 'following'; userName: string }>();
  const { authToken, currentUser, followUser, unfollowUser } = useAuth();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';

  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState<Record<number, boolean>>({});

  const title = type === 'followers' ? 'Followers' : 'Following';

  const fetchList = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const base = getApiBase();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const res = await fetch(`${base}/users/${userId}/${type}`, { headers });
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [userId, type, authToken]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleToggleFollow = useCallback(async (user: FollowUser) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFollowLoading((prev) => ({ ...prev, [user.id]: true }));
    try {
      if (user.is_following_back) {
        await unfollowUser(user.id);
      } else {
        await followUser(user.id);
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, is_following_back: !u.is_following_back } : u
        )
      );
    } finally {
      setFollowLoading((prev) => ({ ...prev, [user.id]: false }));
    }
  }, [followUser, unfollowUser]);

  const renderItem = ({ item }: { item: FollowUser }) => {
    const displayName = item.display_name || item.name;
    const initials = displayName.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);
    const isMe = currentUser?.id === item.id;
    const isLoadingThis = followLoading[item.id];

    return (
      <View style={[styles.userRow, { borderBottomColor: colors.border }]}>
        <AvatarCircle initials={initials} color={item.color || '#4A90A4'} size={48} />
        <View style={styles.userInfo}>
          <Text style={[styles.displayName, { color: colors.foreground }]} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={[styles.username, { color: colors.mutedForeground }]} numberOfLines={1}>
            @{item.username}
          </Text>
          {!!item.bio && (
            <Text style={[styles.bio, { color: colors.mutedForeground }]} numberOfLines={1}>
              {item.bio}
            </Text>
          )}
        </View>
        {!isMe && (
          <TouchableOpacity
            style={[
              styles.followBtn,
              item.is_following_back
                ? { borderColor: colors.border, backgroundColor: 'transparent' }
                : { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => handleToggleFollow(item)}
            disabled={isLoadingThis}
          >
            {isLoadingThis ? (
              <ActivityIndicator size="small" color={item.is_following_back ? colors.foreground : '#fff'} />
            ) : (
              <Text
                style={[
                  styles.followBtnText,
                  { color: item.is_following_back ? colors.foreground : '#fff' },
                ]}
              >
                {item.is_following_back ? 'Following' : 'Follow'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: isWeb ? 60 : insets.top + 12,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          {userName ? (
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]} numberOfLines={1}>
              {userName}
            </Text>
          ) : null}
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{title}</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : users.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="users" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
          </Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            {type === 'followers'
              ? 'When people follow this account, they\'ll appear here.'
              : 'When this account follows people, they\'ll appear here.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: isWeb ? 24 : insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  backBtn: { padding: 8, width: 38 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  headerSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  emptySub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 0.5,
  },
  userInfo: { flex: 1, gap: 2 },
  displayName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  username: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  bio: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  followBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    minWidth: 88,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 34,
  },
  followBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
});
