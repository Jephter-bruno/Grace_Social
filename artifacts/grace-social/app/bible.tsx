import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

interface Verse {
  reference: string;
  text: string;
  book: string;
  category: string;
}

const DAILY_VERSE: Verse = {
  reference: 'Philippians 4:13',
  text: 'I can do all things through Christ who strengthens me.',
  book: 'Philippians',
  category: 'strength',
};

const VERSES: Verse[] = [
  { reference: 'John 3:16', text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.', book: 'John', category: 'salvation' },
  { reference: 'Psalm 23:1', text: 'The Lord is my shepherd; I shall not want.', book: 'Psalms', category: 'comfort' },
  { reference: 'Romans 8:28', text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.', book: 'Romans', category: 'faith' },
  { reference: 'Proverbs 3:5-6', text: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.', book: 'Proverbs', category: 'wisdom' },
  { reference: 'Isaiah 40:31', text: 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.', book: 'Isaiah', category: 'strength' },
  { reference: 'Matthew 11:28', text: 'Come to me, all you who are weary and burdened, and I will give you rest.', book: 'Matthew', category: 'rest' },
  { reference: 'Jeremiah 29:11', text: '"For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, plans to give you hope and a future."', book: 'Jeremiah', category: 'hope' },
  { reference: 'Psalm 46:1', text: 'God is our refuge and strength, an ever-present help in trouble.', book: 'Psalms', category: 'strength' },
  { reference: 'Matthew 6:33', text: 'But seek first his kingdom and his righteousness, and all these things will be given to you as well.', book: 'Matthew', category: 'faith' },
  { reference: '1 Corinthians 13:4-5', text: 'Love is patient, love is kind. It does not envy, it does not boast, it is not proud. It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs.', book: '1 Corinthians', category: 'love' },
  { reference: 'Psalm 119:105', text: 'Your word is a lamp for my feet, a light on my path.', book: 'Psalms', category: 'guidance' },
  { reference: 'Galatians 5:22-23', text: 'But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control.', book: 'Galatians', category: 'spirit' },
  { reference: 'Romans 12:2', text: 'Do not conform to the pattern of this world, but be transformed by the renewing of your mind.', book: 'Romans', category: 'transformation' },
  { reference: 'James 1:17', text: 'Every good and perfect gift is from above, coming down from the Father of the heavenly lights, who does not change like shifting shadows.', book: 'James', category: 'gratitude' },
  { reference: 'Psalm 27:1', text: 'The Lord is my light and my salvation — whom shall I fear? The Lord is the stronghold of my life — of whom shall I be afraid?', book: 'Psalms', category: 'courage' },
];

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'faith', label: 'Faith' },
  { id: 'strength', label: 'Strength' },
  { id: 'hope', label: 'Hope' },
  { id: 'love', label: 'Love' },
  { id: 'comfort', label: 'Comfort' },
  { id: 'wisdom', label: 'Wisdom' },
  { id: 'salvation', label: 'Salvation' },
];

const BOOKS = [
  { name: 'Genesis', chapters: 50, testament: 'Old' },
  { name: 'Psalms', chapters: 150, testament: 'Old' },
  { name: 'Proverbs', chapters: 31, testament: 'Old' },
  { name: 'Isaiah', chapters: 66, testament: 'Old' },
  { name: 'Jeremiah', chapters: 52, testament: 'Old' },
  { name: 'Matthew', chapters: 28, testament: 'New' },
  { name: 'John', chapters: 21, testament: 'New' },
  { name: 'Romans', chapters: 16, testament: 'New' },
  { name: '1 Corinthians', chapters: 16, testament: 'New' },
  { name: 'Galatians', chapters: 6, testament: 'New' },
  { name: 'Philippians', chapters: 4, testament: 'New' },
  { name: 'James', chapters: 5, testament: 'New' },
];

type TabKey = 'verses' | 'books' | 'search';

export default function BibleScreen() {
  const colors = useColors();
  const { setPendingVerse } = useApp();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;
  const [activeTab, setActiveTab] = useState<TabKey>('verses');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQ, setSearchQ] = useState('');
  const [savedVerses, setSavedVerses] = useState<Set<string>>(new Set());

  const filteredVerses = VERSES.filter((v) => {
    if (activeCategory !== 'all' && v.category !== activeCategory) return false;
    if (searchQ.trim() && !v.text.toLowerCase().includes(searchQ.toLowerCase()) && !v.reference.toLowerCase().includes(searchQ.toLowerCase())) return false;
    return true;
  });

  const toggleSave = (ref: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSavedVerses((prev) => {
      const next = new Set(prev);
      if (next.has(ref)) next.delete(ref);
      else next.add(ref);
      return next;
    });
  };

  const handleShare = (v: Verse) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Share.share({ message: `"${v.text}" — ${v.reference}` });
  };

  const handlePostToFeed = (v: Verse) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPendingVerse({ reference: v.reference, text: v.text });
    router.push('/');
  };

  const renderVerse = ({ item }: { item: Verse }) => (
    <View style={[styles.verseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.verseHeader}>
        <Text style={[styles.verseRef, { color: colors.primary }]}>{item.reference}</Text>
        <View style={styles.verseActions}>
          <TouchableOpacity onPress={() => toggleSave(item.reference)} style={styles.iconBtn}>
            <Feather
              name="bookmark"
              size={18}
              color={savedVerses.has(item.reference) ? colors.primary : colors.mutedForeground}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleShare(item)} style={styles.iconBtn}>
            <Feather name="share-2" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={[styles.verseText, { color: colors.foreground }]}>{item.text}</Text>
      <View style={styles.verseFooter}>
        <View style={[styles.verseCat, { backgroundColor: colors.muted }]}>
          <Text style={[styles.verseCatText, { color: colors.mutedForeground }]}>
            {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.postToFeedBtn, { backgroundColor: colors.primary }]}
          onPress={() => handlePostToFeed(item)}
        >
          <Feather name="home" size={13} color="#fff" />
          <Text style={styles.postToFeedText}>Post to Feed</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Bible</Text>
        <View style={{ width: 30 }} />
      </View>

      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        {(['verses', 'books', 'search'] as TabKey[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2.5 }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.mutedForeground }]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'verses' && (
        <>
          <View style={[styles.dailyCard, { backgroundColor: colors.primary }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="sun" size={16} color="#fff" />
              <Text style={styles.dailyLabel}>Verse of the Day</Text>
            </View>
            <Text style={styles.dailyRef}>{DAILY_VERSE.reference}</Text>
            <Text style={styles.dailyText}>{DAILY_VERSE.text}</Text>
            <TouchableOpacity
              style={styles.dailyPostBtn}
              onPress={() => handlePostToFeed(DAILY_VERSE)}
            >
              <Feather name="send" size={13} color={colors.primary} />
              <Text style={[styles.dailyPostText, { color: colors.primary }]}>Share to Feed</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catBar}
          >
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[
                  styles.catChip,
                  {
                    backgroundColor: activeCategory === c.id ? colors.primary : colors.muted,
                  },
                ]}
                onPress={() => setActiveCategory(c.id)}
              >
                <Text style={[styles.catChipText, { color: activeCategory === c.id ? '#fff' : colors.mutedForeground }]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <FlatList
            data={filteredVerses}
            keyExtractor={(item) => item.reference}
            renderItem={renderVerse}
            contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: isWeb ? 34 : insets.bottom + 20 }}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}

      {activeTab === 'books' && (
        <FlatList
          data={BOOKS}
          keyExtractor={(item) => item.name}
          contentContainerStyle={{ padding: 12, gap: 10, paddingBottom: isWeb ? 34 : insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.bookRow, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.75}
            >
              <View style={[styles.bookIcon, { backgroundColor: item.testament === 'Old' ? '#F59E0B22' : '#4A90A422' }]}>
                <Feather name="book-open" size={18} color={item.testament === 'Old' ? '#F59E0B' : '#4A90A4'} />
              </View>
              <View style={styles.bookInfo}>
                <Text style={[styles.bookName, { color: colors.foreground }]}>{item.name}</Text>
                <Text style={[styles.bookSub, { color: colors.mutedForeground }]}>
                  {item.chapters} chapters • {item.testament} Testament
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        />
      )}

      {activeTab === 'search' && (
        <>
          <View style={[styles.searchBar, { backgroundColor: colors.muted, margin: 12 }]}>
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder="Search verses..."
              placeholderTextColor={colors.mutedForeground}
              value={searchQ}
              onChangeText={setSearchQ}
              autoFocus
            />
            {searchQ.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQ('')}>
                <Feather name="x" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={searchQ.trim() ? filteredVerses : []}
            keyExtractor={(item) => item.reference}
            renderItem={renderVerse}
            contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: isWeb ? 34 : insets.bottom + 20 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              searchQ.trim() ? (
                <View style={styles.empty}>
                  <Feather name="search" size={40} color={colors.mutedForeground} />
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No verses found</Text>
                </View>
              ) : (
                <View style={styles.empty}>
                  <Feather name="book-open" size={40} color={colors.mutedForeground} />
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Type to search verses</Text>
                </View>
              )
            }
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  tabs: { flexDirection: 'row', borderBottomWidth: 0.5 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  dailyCard: { margin: 12, borderRadius: 16, padding: 16, gap: 6 },
  dailyPostBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, alignSelf: 'flex-start', marginTop: 4 },
  dailyPostText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  dailyLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontFamily: 'Inter_600SemiBold', letterSpacing: 1 },
  dailyRef: { color: '#fff', fontSize: 17, fontFamily: 'Inter_700Bold' },
  dailyText: { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  catBar: { paddingHorizontal: 12, paddingBottom: 10, gap: 8 },
  catChip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  catChipText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  verseCard: { borderRadius: 14, padding: 16, borderWidth: 1, gap: 10 },
  verseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  verseFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  postToFeedBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  postToFeedText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  verseRef: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  verseActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 4 },
  verseText: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 24 },
  verseCat: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  verseCatText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  bookRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, padding: 14, borderWidth: 1 },
  bookIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  bookInfo: { flex: 1 },
  bookName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  bookSub: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
});
