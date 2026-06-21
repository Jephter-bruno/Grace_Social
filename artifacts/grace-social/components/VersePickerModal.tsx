import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';

interface Verse {
  reference: string;
  text: string;
  category: string;
}

const ALL_VERSES: Verse[] = [
  { reference: 'John 3:16', text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.', category: 'salvation' },
  { reference: 'Psalm 23:1', text: 'The Lord is my shepherd; I shall not want.', category: 'comfort' },
  { reference: 'Romans 8:28', text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.', category: 'faith' },
  { reference: 'Philippians 4:13', text: 'I can do all things through Christ who strengthens me.', category: 'strength' },
  { reference: 'Isaiah 40:31', text: 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles.', category: 'strength' },
  { reference: 'Matthew 11:28', text: 'Come to me, all you who are weary and burdened, and I will give you rest.', category: 'rest' },
  { reference: 'Jeremiah 29:11', text: '"For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, plans to give you hope and a future."', category: 'hope' },
  { reference: 'Psalm 46:1', text: 'God is our refuge and strength, an ever-present help in trouble.', category: 'strength' },
  { reference: 'Proverbs 3:5-6', text: 'Trust in the Lord with all your heart and lean not on your own understanding.', category: 'wisdom' },
  { reference: '2 Corinthians 12:9', text: 'My grace is sufficient for you, for my power is made perfect in weakness.', category: 'grace' },
  { reference: 'Psalm 34:18', text: 'The Lord is close to the brokenhearted and saves those who are crushed in spirit.', category: 'comfort' },
  { reference: 'Romans 15:13', text: 'May the God of hope fill you with all joy and peace as you trust in him.', category: 'hope' },
  { reference: 'James 5:16', text: 'The prayer of a righteous person is powerful and effective.', category: 'prayer' },
  { reference: 'Matthew 18:20', text: 'For where two or three gather in my name, there am I with them.', category: 'prayer' },
  { reference: '1 John 5:14-15', text: 'This is the confidence we have in approaching God: that if we ask anything according to his will, he hears us.', category: 'prayer' },
  { reference: 'Philippians 4:6-7', text: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.', category: 'prayer' },
  { reference: 'Isaiah 41:10', text: 'So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you.', category: 'comfort' },
  { reference: 'Psalm 121:2', text: 'My help comes from the Lord, the Maker of heaven and earth.', category: 'help' },
  { reference: '1 Peter 5:7', text: 'Cast all your anxiety on him because he cares for you.', category: 'comfort' },
  { reference: 'Hebrews 11:1', text: 'Now faith is confidence in what we hope for and assurance about what we do not see.', category: 'faith' },
];

const CATEGORIES = ['All', 'prayer', 'comfort', 'strength', 'hope', 'faith', 'wisdom'];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (verse: { reference: string; text: string }) => void;
}

export function VersePickerModal({ visible, onClose, onSelect }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = ALL_VERSES.filter((v) => {
    const matchCat = activeCategory === 'All' || v.category === activeCategory;
    const matchSearch = !search.trim() || v.text.toLowerCase().includes(search.toLowerCase()) || v.reference.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleSelect = (verse: Verse) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect({ reference: verse.reference, text: verse.text });
    setSearch('');
    setActiveCategory('All');
    onClose();
  };

  const handleClose = () => {
    setSearch('');
    setActiveCategory('All');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ marginTop: isWeb ? 16 : insets.top + 8, alignItems: 'center' }}>
          <View style={[styles.handleBar, { backgroundColor: colors.border }]} />
        </View>

        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Feather name="book-open" size={18} color={colors.primary} />
            <Text style={[styles.title, { color: colors.foreground }]}>Share a Verse</Text>
          </View>
          <View style={{ width: 30 }} />
        </View>

        <View style={[styles.searchBar, { backgroundColor: colors.muted, margin: 14 }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search verses..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x" size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={CATEGORIES}
          keyExtractor={(c) => c}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 14, gap: 8, marginBottom: 6 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.catChip, { backgroundColor: activeCategory === item ? colors.primary : colors.muted }]}
              onPress={() => setActiveCategory(item)}
            >
              <Text style={[styles.catChipText, { color: activeCategory === item ? '#fff' : colors.mutedForeground }]}>
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </Text>
            </TouchableOpacity>
          )}
        />

        <FlatList
          data={filtered}
          keyExtractor={(v) => v.reference}
          contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: isWeb ? 34 : insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.verseCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleSelect(item)}
              activeOpacity={0.75}
            >
              <Text style={[styles.verseRef, { color: colors.primary }]}>{item.reference}</Text>
              <Text style={[styles.verseText, { color: colors.foreground }]} numberOfLines={3}>
                {item.text}
              </Text>
              <View style={styles.verseFooter}>
                <View style={[styles.catBadge, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.catBadgeText, { color: colors.mutedForeground }]}>
                    {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                  </Text>
                </View>
                <View style={[styles.selectBtn, { backgroundColor: colors.primary }]}>
                  <Feather name="send" size={12} color="#fff" />
                  <Text style={styles.selectBtnText}>Use this verse</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="search" size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No verses found</Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  handleBar: { width: 36, height: 4, borderRadius: 2, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 0.5 },
  closeBtn: { padding: 4 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, gap: 8 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular' },
  catChip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  catChipText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  verseCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  verseRef: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  verseText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21 },
  verseFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  catBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  catBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  selectBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  selectBtnText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
});
