import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AddStoryModal } from '@/components/AddStoryModal';
import { AvatarCircle } from '@/components/AvatarCircle';
import { Story, useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';

export function StoryBar() {
  const colors = useColors();
  const { currentUser } = useAuth();
  const { stories } = useApp();

  const [addStoryVisible, setAddStoryVisible] = useState(false);

  const ownStory = stories.find((s) => s.isOwn);
  const hasOwnStory = (ownStory?.items?.length ?? 0) > 0;

  const handleStoryPress = (item: Story) => {
    if (item.isOwn) {
      setAddStoryVisible(true);
    }
    // Tapping other users' story rings has no action (viewing removed)
  };

  return (
    <>
      <FlatList
        data={stories}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.container, { borderBottomColor: colors.border }]}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.story}
            activeOpacity={item.isOwn ? 0.75 : 1}
            onPress={() => handleStoryPress(item)}
          >
            {item.isOwn ? (
              <View style={styles.ownWrap}>
                <View
                  style={[
                    styles.ownRing,
                    hasOwnStory
                      ? { borderColor: colors.accent, borderWidth: 2.5 }
                      : { borderColor: 'transparent', borderWidth: 0 },
                  ]}
                >
                  <AvatarCircle
                    initials={currentUser?.initials || 'ME'}
                    color={currentUser?.color || colors.primary}
                    avatarUrl={currentUser?.avatarUrl}
                    size={52}
                  />
                </View>
                <View style={[styles.addBadge, { backgroundColor: colors.primary }]}>
                  <Feather name="plus" size={10} color="#fff" />
                </View>
              </View>
            ) : (
              <View
                style={[
                  styles.ring,
                  {
                    borderColor: item.seen ? colors.border : colors.accent,
                    borderWidth: item.seen ? 1.5 : 2.5,
                  },
                ]}
              >
                <AvatarCircle initials={item.userInitials} color={item.userColor} size={52} />
                {!item.seen && (
                  <View style={[styles.unseenDot, { backgroundColor: colors.accent }]} />
                )}
              </View>
            )}
            <Text
              style={[styles.name, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {item.isOwn ? 'Add Story' : item.userName.split(' ')[0]}
            </Text>
          </TouchableOpacity>
        )}
      />

      <AddStoryModal
        visible={addStoryVisible}
        onClose={() => setAddStoryVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12, paddingVertical: 12,
    gap: 14, borderBottomWidth: 0.5,
  },
  story: { alignItems: 'center', width: 70, gap: 5 },
  ownWrap: {
    position: 'relative', width: 60, height: 60,
    alignItems: 'center', justifyContent: 'center',
  },
  ownRing: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center', padding: 2,
  },
  addBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  ring: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
    padding: 2, position: 'relative',
  },
  unseenDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 10, height: 10, borderRadius: 5,
    borderWidth: 1.5, borderColor: '#fff',
  },
  name: {
    fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center',
  },
});
