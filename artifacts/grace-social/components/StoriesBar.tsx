import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Story } from '@/hooks/useStories';

interface StoriesBarProps {
  stories: Story[];
  onPress: (storyIndex: number) => void;
}

const UNSEEN_GRADIENT: [string, string, string] = ['#E07A54', '#D4A843', '#E07A54'];
const SEEN_GRADIENT: [string, string, string] = ['#555', '#444', '#555'];

export function StoriesBar({ stories, onPress }: StoriesBarProps) {
  const colors = useColors();

  const renderItem = ({ item, index }: { item: Story; index: number }) => {
    const isOwn = item.isOwn;
    const hasStory = item.items.length > 0;
    const ringColors = !hasStory || item.seen ? SEEN_GRADIENT : UNSEEN_GRADIENT;
    const showRing = !isOwn || hasStory;

    return (
      <TouchableOpacity
        style={styles.storyItem}
        onPress={() => onPress(index)}
        activeOpacity={0.8}
      >
        {/* Ring gradient border */}
        {showRing ? (
          <LinearGradient
            colors={ringColors}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={styles.ring}
          >
            <View style={[styles.ringInner, { backgroundColor: colors.background }]}>
              <AvatarBubble item={item} colors={colors} />
            </View>
          </LinearGradient>
        ) : (
          <View style={[styles.ring, styles.ringPlain, { borderColor: colors.border }]}>
            <View style={[styles.ringInner, { backgroundColor: colors.background }]}>
              <AvatarBubble item={item} colors={colors} />
            </View>
          </View>
        )}

        {/* "+" badge for own story with no story yet */}
        {isOwn && !hasStory && (
          <View style={[styles.addBadge, { backgroundColor: '#E07A54', borderColor: colors.background }]}>
            <Feather name="plus" size={11} color="#fff" />
          </View>
        )}

        {/* Label */}
        <Text style={[styles.label, { color: colors.mutedForeground }]} numberOfLines={1}>
          {isOwn ? 'Your Story' : item.displayName.split(' ')[0]}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={stories}
      keyExtractor={(s) => s.id}
      renderItem={renderItem}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
      style={[styles.container, { borderBottomColor: colors.border }]}
    />
  );
}

function AvatarBubble({ item, colors }: { item: Story; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.avatar, { backgroundColor: item.color }]}>
      <Text style={styles.avatarText}>{item.initials}</Text>
    </View>
  );
}

const BUBBLE = 62;
const RING = BUBBLE + 6;

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 0.5,
  },
  list: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },
  storyItem: {
    alignItems: 'center',
    width: 72,
    position: 'relative',
  },
  ring: {
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  ringPlain: {
    borderWidth: 1.5,
  },
  ringInner: {
    width: BUBBLE + 2,
    height: BUBBLE + 2,
    borderRadius: (BUBBLE + 2) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: BUBBLE,
    height: BUBBLE,
    borderRadius: BUBBLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  addBadge: {
    position: 'absolute',
    top: RING - 18,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    maxWidth: 68,
  },
});
