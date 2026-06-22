import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Verse {
  reference: string;
  text: string;
  book: string;
  chapter: number;
  category: string;
}

export const CURATED_VERSES: Verse[] = [
  { reference: 'John 3:16', text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.', book: 'John', chapter: 3, category: 'salvation' },
  { reference: 'Psalm 23:1', text: 'The Lord is my shepherd; I shall not want.', book: 'Psalms', chapter: 23, category: 'comfort' },
  { reference: 'Romans 8:28', text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.', book: 'Romans', chapter: 8, category: 'faith' },
  { reference: 'Proverbs 3:5-6', text: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.', book: 'Proverbs', chapter: 3, category: 'wisdom' },
  { reference: 'Isaiah 40:31', text: 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.', book: 'Isaiah', chapter: 40, category: 'strength' },
  { reference: 'Matthew 11:28', text: 'Come to me, all you who are weary and burdened, and I will give you rest.', book: 'Matthew', chapter: 11, category: 'rest' },
  { reference: 'Jeremiah 29:11', text: '"For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, plans to give you hope and a future."', book: 'Jeremiah', chapter: 29, category: 'hope' },
  { reference: 'Psalm 46:1', text: 'God is our refuge and strength, an ever-present help in trouble.', book: 'Psalms', chapter: 46, category: 'strength' },
  { reference: 'Matthew 6:33', text: 'But seek first his kingdom and his righteousness, and all these things will be given to you as well.', book: 'Matthew', chapter: 6, category: 'faith' },
  { reference: '1 Corinthians 13:4-5', text: 'Love is patient, love is kind. It does not envy, it does not boast, it is not proud. It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs.', book: '1 Corinthians', chapter: 13, category: 'love' },
  { reference: 'Psalm 119:105', text: 'Your word is a lamp for my feet, a light on my path.', book: 'Psalms', chapter: 119, category: 'guidance' },
  { reference: 'Galatians 5:22-23', text: 'But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control.', book: 'Galatians', chapter: 5, category: 'spirit' },
  { reference: 'Romans 12:2', text: 'Do not conform to the pattern of this world, but be transformed by the renewing of your mind.', book: 'Romans', chapter: 12, category: 'transformation' },
  { reference: 'James 1:17', text: 'Every good and perfect gift is from above, coming down from the Father of the heavenly lights, who does not change like shifting shadows.', book: 'James', chapter: 1, category: 'gratitude' },
  { reference: 'Psalm 27:1', text: 'The Lord is my light and my salvation — whom shall I fear? The Lord is the stronghold of my life — of whom shall I be afraid?', book: 'Psalms', chapter: 27, category: 'courage' },
  { reference: 'Philippians 4:13', text: 'I can do all things through Christ who strengthens me.', book: 'Philippians', chapter: 4, category: 'strength' },
  { reference: 'Philippians 4:6-7', text: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.', book: 'Philippians', chapter: 4, category: 'peace' },
  { reference: 'Ephesians 2:8-9', text: 'For it is by grace you have been saved, through faith — and this is not from yourselves, it is the gift of God — not by works, so that no one can boast.', book: 'Ephesians', chapter: 2, category: 'salvation' },
  { reference: 'Joshua 1:9', text: 'Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.', book: 'Joshua', chapter: 1, category: 'courage' },
  { reference: '2 Timothy 1:7', text: 'For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.', book: '2 Timothy', chapter: 1, category: 'courage' },
  { reference: 'Lamentations 3:22-23', text: 'The steadfast love of the Lord never ceases; his mercies never come to an end; they are new every morning; great is your faithfulness.', book: 'Lamentations', chapter: 3, category: 'comfort' },
  { reference: 'Isaiah 41:10', text: 'So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.', book: 'Isaiah', chapter: 41, category: 'comfort' },
  { reference: 'Psalm 34:18', text: 'The Lord is close to the brokenhearted and saves those who are crushed in spirit.', book: 'Psalms', chapter: 34, category: 'comfort' },
  { reference: 'John 14:6', text: 'Jesus answered, "I am the way and the truth and the life. No one comes to the Father except through me."', book: 'John', chapter: 14, category: 'salvation' },
  { reference: 'Matthew 5:16', text: 'In the same way, let your light shine before others, that they may see your good deeds and glorify your Father in heaven.', book: 'Matthew', chapter: 5, category: 'faith' },
  { reference: '1 Peter 5:7', text: 'Cast all your anxiety on him because he cares for you.', book: '1 Peter', chapter: 5, category: 'peace' },
  { reference: 'Psalm 37:4', text: 'Take delight in the Lord, and he will give you the desires of your heart.', book: 'Psalms', chapter: 37, category: 'hope' },
  { reference: 'Hebrews 11:1', text: 'Now faith is confidence in what we hope for and assurance about what we do not see.', book: 'Hebrews', chapter: 11, category: 'faith' },
  { reference: 'Romans 5:8', text: 'But God demonstrates his own love for us in this: While we were still sinners, Christ died for us.', book: 'Romans', chapter: 5, category: 'love' },
  { reference: 'Psalm 121:1-2', text: 'I lift up my eyes to the mountains — where does my help come from? My help comes from the Lord, the Maker of heaven and earth.', book: 'Psalms', chapter: 121, category: 'guidance' },
  { reference: 'Colossians 3:23', text: 'Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.', book: 'Colossians', chapter: 3, category: 'faith' },
];

const DAILY_VERSE_KEY = 'gracesocial_daily_verse';
const DAILY_VERSE_DATE_KEY = 'gracesocial_daily_verse_date';

function todayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function pickVerseForDay(): Verse {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  return CURATED_VERSES[dayOfYear % CURATED_VERSES.length];
}

export async function getDailyVerse(): Promise<Verse> {
  try {
    const today = todayDateString();
    const [storedDate, storedVerse] = await Promise.all([
      AsyncStorage.getItem(DAILY_VERSE_DATE_KEY),
      AsyncStorage.getItem(DAILY_VERSE_KEY),
    ]);

    if (storedDate === today && storedVerse) {
      return JSON.parse(storedVerse) as Verse;
    }

    const verse = pickVerseForDay();
    await Promise.all([
      AsyncStorage.setItem(DAILY_VERSE_DATE_KEY, today),
      AsyncStorage.setItem(DAILY_VERSE_KEY, JSON.stringify(verse)),
    ]);
    return verse;
  } catch {
    return pickVerseForDay();
  }
}

export async function getSavedVerses(): Promise<Verse[]> {
  try {
    const raw = await AsyncStorage.getItem('gracesocial_saved_verses');
    return raw ? (JSON.parse(raw) as Verse[]) : [];
  } catch {
    return [];
  }
}

export async function saveVerse(verse: Verse): Promise<boolean> {
  try {
    const existing = await getSavedVerses();
    const already = existing.some((v) => v.reference === verse.reference);
    if (already) return false;
    await AsyncStorage.setItem('gracesocial_saved_verses', JSON.stringify([verse, ...existing]));
    return true;
  } catch {
    return false;
  }
}
