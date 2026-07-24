import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

export interface StoryScripture {
  reference: string;
  text: string;
}

export interface StoryItem {
  id: string;
  // text / caption (optional when media is present)
  text?: string;
  // background gradient (used when no mediaUri)
  gradient: [string, string, string];
  // optional scripture overlay
  scripture?: StoryScripture;
  // label shown above the text (legacy, kept for mock data)
  label?: string;
  timestamp: string;
  // media
  mediaUri?: string;
  mediaType?: 'image' | 'video';
}

export interface Story {
  id: string;
  userId: number;
  displayName: string;
  username: string;
  color: string;
  avatarUrl: string | null;
  initials: string;
  items: StoryItem[];
  seen: boolean;
  isOwn?: boolean;
}

export interface AddStoryPayload {
  text?: string;
  gradient: [string, string, string];
  scripture?: StoryScripture;
  mediaUri?: string;
  mediaType?: 'image' | 'video';
}

const MOCK_STORIES: Omit<Story, 'seen'>[] = [
  {
    id: 'story-grace',
    userId: 101,
    displayName: 'Grace B.',
    username: 'graceb',
    color: '#4A90A4',
    avatarUrl: null,
    initials: 'GB',
    items: [
      {
        id: 'gi1',
        text: '"The Lord is my shepherd; I shall not want."',
        label: 'Psalm 23:1',
        gradient: ['#1a3a4a', '#2d6a7f', '#1a3a4a'],
        timestamp: '2h ago',
      },
      {
        id: 'gi2',
        text: 'Morning prayer time 🙏\nGod is so faithful!',
        gradient: ['#2a1a3a', '#5a3a7a', '#2a1a3a'],
        timestamp: '1h ago',
      },
    ],
  },
  {
    id: 'story-mark',
    userId: 102,
    displayName: 'Mark L.',
    username: 'markl',
    color: '#7B6EA0',
    avatarUrl: null,
    initials: 'ML',
    items: [
      {
        id: 'mi1',
        text: '"Trust in the LORD with all your heart and lean not on your own understanding."',
        scripture: { reference: 'Proverbs 3:5', text: 'Trust in the LORD with all your heart' },
        gradient: ['#1a2a1a', '#2a5a3a', '#1a3a2a'],
        timestamp: '3h ago',
      },
    ],
  },
  {
    id: 'story-sarah',
    userId: 103,
    displayName: 'Sarah K.',
    username: 'sarahk',
    color: '#E07A54',
    avatarUrl: null,
    initials: 'SK',
    items: [
      {
        id: 'si1',
        text: 'God answered our church\'s prayer today. 5 families got housing! 🏠✨',
        gradient: ['#3a1a10', '#7a3520', '#3a1a10'],
        timestamp: '4h ago',
      },
      {
        id: 'si2',
        text: '"For I know the plans I have for you," declares the LORD',
        scripture: { reference: 'Jeremiah 29:11', text: 'For I know the plans I have for you' },
        gradient: ['#2a1a3a', '#5a2a6a', '#3a1a4a'],
        timestamp: '4h ago',
      },
    ],
  },
  {
    id: 'story-david',
    userId: 104,
    displayName: 'David O.',
    username: 'davido',
    color: '#D4A843',
    avatarUrl: null,
    initials: 'DO',
    items: [
      {
        id: 'di1',
        text: 'Sunday sermon was 🔥 God is moving in our community!',
        gradient: ['#2a2010', '#5a4520', '#2a2010'],
        timestamp: '6h ago',
      },
    ],
  },
  {
    id: 'story-ruth',
    userId: 105,
    displayName: 'Ruth A.',
    username: 'rutha',
    color: '#5BA8C4',
    avatarUrl: null,
    initials: 'RA',
    items: [
      {
        id: 'ri1',
        text: '"Be still, and know that I am God."',
        scripture: { reference: 'Psalm 46:10', text: 'Be still, and know that I am God' },
        gradient: ['#0f2a35', '#1a5065', '#0f2a35'],
        timestamp: '8h ago',
      },
    ],
  },
];

export function useStories() {
  const { currentUser } = useAuth();
  const [seenMap, setSeenMap] = useState<Record<string, boolean>>({});
  const [ownItems, setOwnItems] = useState<StoryItem[]>([]);

  const stories: Story[] = [
    {
      id: 'story-own',
      userId: currentUser?.id ?? 0,
      displayName: currentUser?.displayName ?? currentUser?.name ?? 'You',
      username: currentUser?.username ?? '',
      color: currentUser?.color ?? '#4A90A4',
      avatarUrl: currentUser?.avatarUrl ?? null,
      initials: currentUser?.initials ?? 'Me',
      items: ownItems,
      seen: false,
      isOwn: true,
    },
    ...MOCK_STORIES.map((s) => ({ ...s, seen: seenMap[s.id] ?? false })),
  ];

  const markSeen = useCallback((storyId: string) => {
    setSeenMap((prev) => ({ ...prev, [storyId]: true }));
  }, []);

  const addOwnStory = useCallback((payload: AddStoryPayload) => {
    const item: StoryItem = {
      id: `own-${Date.now()}`,
      text: payload.text,
      gradient: payload.gradient,
      scripture: payload.scripture,
      mediaUri: payload.mediaUri,
      mediaType: payload.mediaType,
      timestamp: 'Just now',
    };
    setOwnItems((prev) => [...prev, item]);
  }, []);

  const deleteOwnStory = useCallback(() => {
    setOwnItems([]);
  }, []);

  return {
    stories,
    markSeen,
    addOwnStory,
    deleteOwnStory,
    hasOwnStory: ownItems.length > 0,
  };
}
