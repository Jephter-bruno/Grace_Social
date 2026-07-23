import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { REEL_VIDEOS, POST_VIDEOS } from '@/constants/videos';

export type PrayerCategory = 'health' | 'family' | 'work' | 'faith' | 'gratitude';

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userHandle: string;
  userInitials: string;
  userColor: string;
  imageIndex: number | null;
  localImageUri?: string;
  videoUri?: string;
  caption: string;
  bibleVerse?: { reference: string; text: string };
  likes: number;
  comments: number;
  isLiked: boolean;
  isSaved: boolean;
  timestamp: string;
}

export interface Comment {
  id: string;
  postId: string;
  userName: string;
  userInitials: string;
  userColor: string;
  text: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
}


export interface Prayer {
  id: string;
  userName: string;
  userInitials: string;
  userColor: string;
  title?: string;
  request: string;
  prayerCount: number;
  isPraying: boolean;
  timestamp: string;
  category: PrayerCategory;
  comments: number;
}

export interface Reel {
  id: string;
  userName: string;
  userHandle: string;
  userInitials: string;
  userColor: string;
  description: string;
  bibleVerse: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  isLiked: boolean;
  isSaved: boolean;
  imageIndex: number;
  videoUri?: string;
  duration: string;
  isFollowing: boolean;
  audioName: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  members: number;
  category: string;
  iconName: string;
  color: string;
  isJoined: boolean;
  isPrivate?: boolean;
  imageUrl?: string;
}

export type NotificationType =
  | 'like'
  | 'comment'
  | 'comment_like'
  | 'follow'
  | 'mention'
  | 'share'
  | 'repost'
  | 'dm'
  | 'community_invite'
  | 'community_announcement'
  | 'prayer_response'
  | 'prayer_pray'
  | 'verse_share';

export interface Notification {
  id: string;
  type: NotificationType;
  userName: string;
  userInitials: string;
  userColor: string;
  message: string;
  timestamp: string;
  postImageIndex?: number;
  targetTab?: string;
  isRead: boolean;
  createdAt: number;
}

export interface UserProfile {
  name: string;
  handle: string;
  bio: string;
  location: string;
  website: string;
  joined: string;
  postsCount: number;
  followers: number;
  following: number;
}

export interface PendingVerse {
  reference: string;
  text: string;
}

interface AppContextType {
  posts: Post[];
  prayers: Prayer[];
  reels: Reel[];
  communities: Community[];
  notifications: Notification[];
  commentsByPost: Record<string, Comment[]>;
  prayerCommentsByPrayer: Record<string, Comment[]>;
  unreadCount: number;
  userProfile: UserProfile;
  pendingVerse: PendingVerse | null;
  followedHandles: Record<string, boolean>;
  followingCount: number;
  isFollowingUser: (handle: string) => boolean;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setPendingVerse: (verse: PendingVerse | null) => void;
  markNotificationRead: (id: string) => void;
  addNotification: (n: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
  deleteNotification: (id: string) => void;
  deleteAllNotifications: () => void;
  toggleLike: (postId: string) => void;
  toggleSave: (postId: string) => void;
  togglePray: (prayerId: string) => void;
  toggleFollow: (handle: string) => void;
  toggleJoin: (communityId: string) => void;
  toggleReelLike: (reelId: string) => void;
  toggleReelSave: (reelId: string) => void;
  incrementReelShares: (reelId: string) => void;
  addPrayer: (prayer: Omit<Prayer, 'id'>) => void;
  addPost: (post: Omit<Post, 'id'>) => void;
  addReel: (reel: Omit<Reel, 'id'>) => void;
  addComment: (postId: string, text: string, user?: { userName: string; userInitials: string; userColor: string }) => void;
  addPrayerComment: (prayerId: string, text: string, user?: { userName: string; userInitials: string; userColor: string }) => void;
  toggleCommentLike: (postId: string, commentId: string) => void;
  togglePrayerCommentLike: (prayerId: string, commentId: string) => void;
  markAllRead: () => void;
}

const AppContext = createContext<AppContextType | null>(null);


const INITIAL_POSTS: Post[] = [
  {
    id: 'p1',
    userId: 'u1',
    userName: 'Pastor James',
    userHandle: '@pastorjames',
    userInitials: 'PJ',
    userColor: '#D4A843',
    imageIndex: null,
    videoUri: REEL_VIDEOS[0],
    caption: "Sunday message highlights: Walking in God's grace. You are loved beyond measure. Don't let the enemy tell you otherwise. Share this with someone who needs it! ❤️",
    bibleVerse: { reference: 'Ephesians 2:8', text: 'For by grace you have been saved through faith.' },
    likes: 142,
    comments: 23,
    isLiked: false,
    isSaved: false,
    timestamp: '2h ago',
  },
  {
    id: 'p2',
    userId: 'u2',
    userName: 'Sarah Williams',
    userHandle: '@sarahw',
    userInitials: 'SW',
    userColor: '#9B59B6',
    imageIndex: 1,
    caption: "Early morning devotion. God's mercies are new every morning. Starting this day with gratitude in my heart.",
    bibleVerse: { reference: 'Lamentations 3:22-23', text: "The steadfast love of the Lord never ceases; his mercies never come to an end; they are new every morning." },
    likes: 89,
    comments: 11,
    isLiked: true,
    isSaved: true,
    timestamp: '4h ago',
  },
  {
    id: 'p3',
    userId: 'currentUser',
    userName: 'You',
    userHandle: '@gracemember',
    userInitials: 'ME',
    userColor: '#4A90A4',
    imageIndex: 2,
    caption: "My devotional time this morning. God's word is a lamp unto my feet. So grateful for this quiet time with Him.",
    bibleVerse: { reference: 'Psalm 119:105', text: 'Your word is a lamp for my feet, a light on my path.' },
    likes: 56,
    comments: 8,
    isLiked: false,
    isSaved: false,
    timestamp: '6h ago',
  },
  {
    id: 'p4',
    userId: 'u3',
    userName: 'David Livingston',
    userHandle: '@david_l',
    userInitials: 'DL',
    userColor: '#27AE60',
    imageIndex: null,
    videoUri: REEL_VIDEOS[1],
    caption: "Testimony Tuesday: How God turned my darkest moment into my greatest testimony. He works all things for good. Share your testimony in the comments! 🙏",
    bibleVerse: { reference: 'Romans 8:28', text: 'And we know that in all things God works for the good of those who love him.' },
    likes: 204,
    comments: 31,
    isLiked: false,
    isSaved: false,
    timestamp: '8h ago',
  },
  {
    id: 'p5',
    userId: 'u4',
    userName: 'Grace Ministry',
    userHandle: '@graceministry',
    userInitials: 'GM',
    userColor: '#F39C12',
    imageIndex: 0,
    caption: 'Our youth group had an incredible worship night last night. These young hearts on fire for God give us so much hope for the next generation. Blessed!',
    likes: 315,
    comments: 47,
    isLiked: false,
    isSaved: false,
    timestamp: '1d ago',
  },
  {
    id: 'p6',
    userId: 'currentUser',
    userName: 'You',
    userHandle: '@gracemember',
    userInitials: 'ME',
    userColor: '#4A90A4',
    imageIndex: 1,
    caption: "God's creation never ceases to amaze me. This sunrise reminded me of His faithfulness — every single morning, without fail.",
    bibleVerse: { reference: 'Psalm 19:1', text: 'The heavens declare the glory of God; the skies proclaim the work of his hands.' },
    likes: 78,
    comments: 14,
    isLiked: false,
    isSaved: true,
    timestamp: '2d ago',
  },
];

const INITIAL_COMMENTS: Record<string, Comment[]> = {
  p1: [
    { id: 'c1a', postId: 'p1', userName: 'Sarah Williams', userInitials: 'SW', userColor: '#9B59B6', text: 'Amen! Such a powerful service. God truly showed up! 🙏', timestamp: '1h ago', likes: 12, isLiked: false },
    { id: 'c1b', postId: 'p1', userName: 'Mary K.', userInitials: 'MK', userColor: '#E91E8C', text: 'Missed it but felt the anointing from home. Blessings Pastor!', timestamp: '2h ago', likes: 8, isLiked: false },
    { id: 'c1c', postId: 'p1', userName: 'David L.', userInitials: 'DL', userColor: '#27AE60', text: 'Hebrews 10:25 is one of my favorites. We need each other!', timestamp: '2h ago', likes: 5, isLiked: false },
  ],
  p2: [
    { id: 'c2a', postId: 'p2', userName: 'Thomas B.', userInitials: 'TB', userColor: '#E74C3C', text: 'His mercies are truly new every morning. Beautiful reminder 🌅', timestamp: '3h ago', likes: 7, isLiked: false },
    { id: 'c2b', postId: 'p2', userName: 'Pastor James', userInitials: 'PJ', userColor: '#D4A843', text: 'This is why we start the day in prayer. Keep it up Sarah!', timestamp: '3h ago', likes: 15, isLiked: false },
  ],
  p3: [
    { id: 'c3a', postId: 'p3', userName: 'Sarah Williams', userInitials: 'SW', userColor: '#9B59B6', text: 'Psalm 119 is such a treasure. Love this!', timestamp: '5h ago', likes: 4, isLiked: false },
    { id: 'c3b', postId: 'p3', userName: 'Grace Ministry', userInitials: 'GM', userColor: '#F39C12', text: 'Quiet time with God changes everything. 🕊️', timestamp: '6h ago', likes: 9, isLiked: false },
  ],
  p4: [
    { id: 'c4a', postId: 'p4', userName: 'Ruth M.', userInitials: 'RM', userColor: '#8E44AD', text: 'I needed this today. Thank you David 🙏', timestamp: '7h ago', likes: 22, isLiked: false },
    { id: 'c4b', postId: 'p4', userName: 'Mary K.', userInitials: 'MK', userColor: '#E91E8C', text: "Romans 8:28 is my anchor verse. He's always in control.", timestamp: '8h ago', likes: 18, isLiked: false },
  ],
  p5: [
    { id: 'c5a', postId: 'p5', userName: 'Pastor James', userInitials: 'PJ', userColor: '#D4A843', text: 'The youth are the future of the church! 🔥', timestamp: '1d ago', likes: 31, isLiked: false },
  ],
  p6: [
    { id: 'c6a', postId: 'p6', userName: 'David L.', userInitials: 'DL', userColor: '#27AE60', text: 'The skies truly declare His glory every day!', timestamp: '2d ago', likes: 9, isLiked: false },
    { id: 'c6b', postId: 'p6', userName: 'Thomas B.', userInitials: 'TB', userColor: '#E74C3C', text: 'Psalm 19:1 — one of the most beautiful verses ever written.', timestamp: '2d ago', likes: 6, isLiked: false },
  ],
};

const INITIAL_PRAYERS: Prayer[] = [
  { id: 'pr1', userName: 'Mary K.', userInitials: 'MK', userColor: '#E91E8C', title: 'Healing for my mother', request: "Please pray for my mother who is going through chemotherapy. She needs God's healing touch and peace during this difficult time. We are trusting in His plan.", prayerCount: 48, isPraying: false, timestamp: 'Jul 20', category: 'health', comments: 3 },
  { id: 'pr2', userName: 'Thomas B.', userInitials: 'TB', userColor: '#E74C3C', title: 'Restoration of my marriage', request: "Asking for prayer for my marriage. My wife and I are going through a difficult season. We believe God can restore and strengthen our bond. Please intercede with us.", prayerCount: 72, isPraying: true, timestamp: 'Jul 20', category: 'family', comments: 5 },
  { id: 'pr3', userName: 'Anna P.', userInitials: 'AP', userColor: '#2980B9', title: 'Trusting God for new work', request: "Praying for a new job opportunity. I've been unemployed for 3 months and trust God has something prepared. Seeking direction and daily provision from Him.", prayerCount: 55, isPraying: false, timestamp: 'Jul 19', category: 'work', comments: 2 },
  { id: 'pr4', userName: 'Pastor James', userInitials: 'PJ', userColor: '#D4A843', title: 'God answered our prayers!', request: "Grateful and praising God today for answered prayer! My son passed his exams and will be starting university in September. God is faithful in all His ways!", prayerCount: 130, isPraying: false, timestamp: 'Jul 19', category: 'gratitude', comments: 8 },
  { id: 'pr5', userName: 'Ruth M.', userInitials: 'RM', userColor: '#8E44AD', title: 'Seeking renewed faith', request: "Going through a season of doubt and spiritual dryness. Asking for prayers to reignite my faith and feel God's presence again. I know He is near.", prayerCount: 93, isPraying: false, timestamp: 'Jul 18', category: 'faith', comments: 4 },
  { id: 'pr6', userName: 'James O.', userInitials: 'JO', userColor: '#16A085', title: "Father's diabetes diagnosis", request: "My father was just diagnosed with diabetes. Please join us in prayer for his healing and for wisdom for the doctors treating him. We trust in the Great Physician.", prayerCount: 61, isPraying: false, timestamp: 'Jul 18', category: 'health', comments: 2 },
];

const INITIAL_PRAYER_COMMENTS: Record<string, Comment[]> = {
  pr1: [
    { id: 'pc1a', postId: 'pr1', userName: 'Sarah Williams', userInitials: 'SW', userColor: '#9B59B6', text: 'Standing in prayer for your mother! Believing for complete healing. 🙏', timestamp: '25m ago', likes: 8, isLiked: false },
    { id: 'pc1b', postId: 'pr1', userName: 'Pastor James', userInitials: 'PJ', userColor: '#D4A843', text: 'We are agreeing with you for divine healing and God\'s peace. Isaiah 53:5.', timestamp: '20m ago', likes: 14, isLiked: false },
    { id: 'pc1c', postId: 'pr1', userName: 'David L.', userInitials: 'DL', userColor: '#27AE60', text: 'Praying right now. The Great Physician is on the case! 💙', timestamp: '15m ago', likes: 5, isLiked: false },
  ],
  pr2: [
    { id: 'pc2a', postId: 'pr2', userName: 'Mary K.', userInitials: 'MK', userColor: '#E91E8C', text: 'Praying for restoration and renewed love in your marriage! God is a redeemer. ❤️', timestamp: '50m ago', likes: 11, isLiked: false },
    { id: 'pc2b', postId: 'pr2', userName: 'Ruth M.', userInitials: 'RM', userColor: '#8E44AD', text: 'What God joins together, no man can separate. Holding you both up.', timestamp: '45m ago', likes: 7, isLiked: false },
    { id: 'pc2c', postId: 'pr2', userName: 'Grace Ministry', userInitials: 'GM', userColor: '#F39C12', text: 'Agreeing in prayer. Our couples ministry is here if you need support. 🙏', timestamp: '30m ago', likes: 9, isLiked: false },
    { id: 'pc2d', postId: 'pr2', userName: 'Anna P.', userInitials: 'AP', userColor: '#2980B9', text: 'God is faithful. Trust His process. Praying with you!', timestamp: '20m ago', likes: 6, isLiked: false },
    { id: 'pc2e', postId: 'pr2', userName: 'James O.', userInitials: 'JO', userColor: '#16A085', text: 'Standing in the gap. Believe for the breakthrough!', timestamp: '10m ago', likes: 3, isLiked: false },
  ],
  pr3: [
    { id: 'pc3a', postId: 'pr3', userName: 'Pastor James', userInitials: 'PJ', userColor: '#D4A843', text: 'God is your provider. The right door is opening. Praying! Jeremiah 29:11 🙏', timestamp: '2h ago', likes: 16, isLiked: false },
    { id: 'pc3b', postId: 'pr3', userName: 'Thomas B.', userInitials: 'TB', userColor: '#E74C3C', text: 'Believing with you. His timing is always perfect. Stay encouraged! 💪', timestamp: '1h ago', likes: 8, isLiked: false },
  ],
  pr4: [
    { id: 'pc4a', postId: 'pr4', userName: 'Mary K.', userInitials: 'MK', userColor: '#E91E8C', text: 'Hallelujah! 🎉 God is so faithful! Congratulations to your son!', timestamp: '4h ago', likes: 22, isLiked: false },
    { id: 'pc4b', postId: 'pr4', userName: 'Sarah Williams', userInitials: 'SW', userColor: '#9B59B6', text: 'Praising God with you!! This is what answered prayer looks like! 🙌', timestamp: '4h ago', likes: 18, isLiked: false },
    { id: 'pc4c', postId: 'pr4', userName: 'Ruth M.', userInitials: 'RM', userColor: '#8E44AD', text: "Great is His faithfulness! Such an encouragement to all of us. 🌟", timestamp: '3h ago', likes: 13, isLiked: false },
  ],
  pr5: [
    { id: 'pc5a', postId: 'pr5', userName: 'Pastor James', userInitials: 'PJ', userColor: '#D4A843', text: "Spiritual dry seasons are real, but so is God's presence. He's closer than you think.", timestamp: '6h ago', likes: 19, isLiked: false },
    { id: 'pc5b', postId: 'pr5', userName: 'Anna P.', userInitials: 'AP', userColor: '#2980B9', text: "I've been there. It passes! God is with you even when you can't feel Him. 💙", timestamp: '6h ago', likes: 11, isLiked: false },
    { id: 'pc5c', postId: 'pr5', userName: 'Mary K.', userInitials: 'MK', userColor: '#E91E8C', text: "Holding you in prayer. Psalm 42 is for moments like this. 🙏", timestamp: '5h ago', likes: 9, isLiked: false },
    { id: 'pc5d', postId: 'pr5', userName: 'David L.', userInitials: 'DL', userColor: '#27AE60', text: "The wilderness season always precedes the promised land. Keep going!", timestamp: '3h ago', likes: 15, isLiked: false },
  ],
  pr6: [
    { id: 'pc6a', postId: 'pr6', userName: 'Sarah Williams', userInitials: 'SW', userColor: '#9B59B6', text: 'Praying for your father! By His stripes we are healed. Isaiah 53:5 🙏', timestamp: '11h ago', likes: 10, isLiked: false },
    { id: 'pc6b', postId: 'pr6', userName: 'Grace Ministry', userInitials: 'GM', userColor: '#F39C12', text: 'Agreeing for wisdom for the medical team and full recovery!', timestamp: '10h ago', likes: 7, isLiked: false },
  ],
};

const INITIAL_REELS: Reel[] = [
  { id: 'r1', userName: 'Pastor James', userHandle: '@pastorjames', userInitials: 'PJ', userColor: '#D4A843', description: "Sunday message: Walking in God's grace. You are loved beyond measure.", bibleVerse: 'For by grace you have been saved through faith. — Ephesians 2:8', likes: 1240, comments: 89, shares: 312, views: 18400, isLiked: false, isSaved: false, imageIndex: 0, videoUri: REEL_VIDEOS[0], duration: '2:45', isFollowing: true, audioName: 'Amazing Grace (Worship Cover)' },
  { id: 'r2', userName: 'Worship House', userHandle: '@worshiphouse', userInitials: 'WH', userColor: '#9B59B6', description: "Beautiful sunrise worship session this morning. His mercies are truly new every single morning.", bibleVerse: "Great is Thy faithfulness, O God my Father. — Lamentations 3:23", likes: 3560, comments: 234, shares: 891, views: 54200, isLiked: true, isSaved: false, imageIndex: 1, videoUri: REEL_VIDEOS[1], duration: '1:58', isFollowing: false, audioName: 'Great is Thy Faithfulness · Worship House' },
  { id: 'r3', userName: 'Grace Ministry', userHandle: '@graceministry', userInitials: 'GM', userColor: '#F39C12', description: "Daily devotional: God's word is alive and active. Start your day in His presence.", bibleVerse: 'Your word is a lamp to my feet. — Psalm 119:105', likes: 892, comments: 56, shares: 204, views: 12100, isLiked: false, isSaved: false, imageIndex: 2, videoUri: REEL_VIDEOS[2], duration: '3:12', isFollowing: true, audioName: 'Original audio · @graceministry' },
  { id: 'r4', userName: 'David Livingston', userHandle: '@david_l', userInitials: 'DL', userColor: '#27AE60', description: "Testimony Tuesday: How God turned my darkest moment into my greatest testimony.", bibleVerse: 'And we know that in all things God works for good. — Romans 8:28', likes: 2100, comments: 178, shares: 567, views: 31700, isLiked: false, isSaved: false, imageIndex: 0, videoUri: REEL_VIDEOS[3], duration: '4:30', isFollowing: false, audioName: 'Original audio · @david_l' },
  { id: 'r5', userName: 'Sarah Williams', userHandle: '@sarahw', userInitials: 'SW', userColor: '#9B59B6', description: "Morning prayer walk — bringing every burden to the Lord.", bibleVerse: 'Cast all your anxiety on him because he cares for you. — 1 Peter 5:7', likes: 1876, comments: 112, shares: 449, views: 27300, isLiked: false, isSaved: false, imageIndex: 1, videoUri: REEL_VIDEOS[4], duration: '2:22', isFollowing: true, audioName: 'Oceans (Where Feet May Fail) · Hillsong' },
];

const INITIAL_COMMUNITIES: Community[] = [
  { id: 'c1', name: 'Morning Bible Study', description: 'Daily morning devotionals and scripture study for all levels. Start your day in the Word.', members: 89, category: 'Bible Study', iconName: 'book-open', color: '#27AE60', isJoined: false, isPrivate: false, imageUrl: 'https://picsum.photos/seed/gc-bible2/600/400' },
  { id: 'c2', name: 'Worship & Music', description: 'Musicians, singers, and worship leaders who serve through music ministry each week.', members: 134, category: 'Worship', iconName: 'music', color: '#9B59B6', isJoined: false, isPrivate: true, imageUrl: 'https://picsum.photos/seed/gc-worship2/600/400' },
  { id: 'c3', name: 'Youth Group', description: 'A community for young believers aged 13–25 to grow in faith together with purpose.', members: 247, category: 'Youth', iconName: 'zap', color: '#FF6B35', isJoined: true, isPrivate: false, imageUrl: 'https://picsum.photos/seed/gc-youth2/600/400' },
  { id: 'c4', name: "Women's Fellowship", description: 'A safe, uplifting space for women to connect, pray, and encourage one another in Christ.', members: 186, category: 'Fellowship', iconName: 'heart', color: '#E91E8C', isJoined: false, isPrivate: true, imageUrl: 'https://picsum.photos/seed/gc-women2/600/400' },
  { id: 'c5', name: "Men's Brotherhood", description: 'Men doing life together — accountability, real faith, and brotherly love that goes deep.', members: 143, category: 'Brotherhood', iconName: 'shield', color: '#2980B9', isJoined: false, isPrivate: true, imageUrl: 'https://picsum.photos/seed/gc-men2/600/400' },
  { id: 'c6', name: 'Prayer Warriors', description: 'Dedicated intercessors committed to praying for the church, the community, and the world.', members: 312, category: 'Prayer', iconName: 'sun', color: '#F39C12', isJoined: true, isPrivate: false, imageUrl: 'https://picsum.photos/seed/gc-prayer2/600/400' },
];

const NOW = Date.now();
const MIN = 60000;
const HOUR = 3600000;
const DAY = 86400000;

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 'n1', type: 'like', userName: 'Pastor James', userInitials: 'PJ', userColor: '#D4A843', message: 'liked your post about morning devotion.', timestamp: '2m ago', postImageIndex: 2, targetTab: '/', isRead: false, createdAt: NOW - 2 * MIN },
  { id: 'n2', type: 'comment', userName: 'Sarah Williams', userInitials: 'SW', userColor: '#9B59B6', message: 'commented: "Psalm 119 is such a treasure! Love this!" ✨', timestamp: '5m ago', postImageIndex: 2, targetTab: '/', isRead: false, createdAt: NOW - 5 * MIN },
  { id: 'n3', type: 'prayer_pray', userName: 'Mary K.', userInitials: 'MK', userColor: '#E91E8C', message: 'is praying for your request. 🙏', timestamp: '15m ago', targetTab: '/prayer', isRead: false, createdAt: NOW - 15 * MIN },
  { id: 'n4', type: 'mention', userName: 'Grace Ministry', userInitials: 'GM', userColor: '#F39C12', message: 'mentioned you: "Blessed by @gracemember\'s testimony!"', timestamp: '34m ago', postImageIndex: 1, targetTab: '/', isRead: false, createdAt: NOW - 34 * MIN },
  { id: 'n5', type: 'follow', userName: 'Thomas B.', userInitials: 'TB', userColor: '#E74C3C', message: 'started following you.', timestamp: '1h ago', targetTab: '/profile', isRead: false, createdAt: NOW - HOUR },
  { id: 'n6', type: 'verse_share', userName: 'David Livingston', userInitials: 'DL', userColor: '#27AE60', message: 'shared a Bible verse with you: Psalm 46:1.', timestamp: '2h ago', targetTab: '/', isRead: false, createdAt: NOW - 2 * HOUR },
  { id: 'n7', type: 'prayer_response', userName: 'Anna P.', userInitials: 'AP', userColor: '#2980B9', message: 'responded to your prayer request. 💙', timestamp: '3h ago', targetTab: '/prayer', isRead: true, createdAt: NOW - 3 * HOUR },
  { id: 'n8', type: 'community_announcement', userName: 'Worship Warriors', userInitials: 'WW', userColor: '#8E44AD', message: 'posted an announcement: "Prayer night this Friday 7PM!"', timestamp: '5h ago', targetTab: '/community', isRead: true, createdAt: NOW - 5 * HOUR },
  { id: 'n9', type: 'share', userName: 'James O.', userInitials: 'JO', userColor: '#16A085', message: 'shared your post with their followers.', timestamp: '6h ago', postImageIndex: 0, targetTab: '/', isRead: true, createdAt: NOW - 6 * HOUR },
  { id: 'n10', type: 'community_invite', userName: 'Ruth M.', userInitials: 'RM', userColor: '#9B59B6', message: 'invited you to join "Daily Devotions" community.', timestamp: '1d ago', targetTab: '/community', isRead: true, createdAt: NOW - DAY },
  { id: 'n11', type: 'repost', userName: 'Worship House', userInitials: 'WH', userColor: '#3B82F6', message: 'reposted your devotional post.', timestamp: '1d ago', postImageIndex: 2, targetTab: '/', isRead: true, createdAt: NOW - DAY - HOUR },
  { id: 'n12', type: 'dm', userName: 'Sarah M.', userInitials: 'SM', color: '#E91E8C', userColor: '#E91E8C', message: 'sent you a message: "Can we pray together sometime?"', timestamp: '2d ago', targetTab: '/messages', isRead: true, createdAt: NOW - 2 * DAY },
  { id: 'n13', type: 'comment_like', userName: 'John A.', userInitials: 'JA', userColor: '#F59E0B', message: 'liked your comment on Pastor James\'s post.', timestamp: '2d ago', postImageIndex: 0, targetTab: '/', isRead: true, createdAt: NOW - 2 * DAY - HOUR },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [prayers, setPrayers] = useState<Prayer[]>(INITIAL_PRAYERS);
  const [reels, setReels] = useState<Reel[]>(INITIAL_REELS);
  const [communities, setCommunities] = useState<Community[]>(INITIAL_COMMUNITIES);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, Comment[]>>(INITIAL_COMMENTS);
  const [prayerCommentsByPrayer, setPrayerCommentsByPrayer] = useState<Record<string, Comment[]>>(INITIAL_PRAYER_COMMENTS);
  const [pendingVerse, setPendingVerse] = useState<PendingVerse | null>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const toggleLike = useCallback((postId: string) => {
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 } : p));
  }, []);

  const toggleSave = useCallback((postId: string) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, isSaved: !p.isSaved } : p)));
  }, []);

  const togglePray = useCallback((prayerId: string) => {
    setPrayers((prev) => prev.map((p) => p.id === prayerId ? { ...p, isPraying: !p.isPraying, prayerCount: p.isPraying ? p.prayerCount - 1 : p.prayerCount + 1 } : p));
  }, []);

  const toggleReelLike = useCallback((reelId: string) => {
    setReels((prev) => prev.map((r) => r.id === reelId ? { ...r, isLiked: !r.isLiked, likes: r.isLiked ? r.likes - 1 : r.likes + 1 } : r));
  }, []);

  const toggleReelSave = useCallback((reelId: string) => {
    setReels((prev) => prev.map((r) => r.id === reelId ? { ...r, isSaved: !r.isSaved } : r));
  }, []);

  const incrementReelShares = useCallback((reelId: string) => {
    setReels((prev) => prev.map((r) => r.id === reelId ? { ...r, shares: r.shares + 1 } : r));
  }, []);

  // Per-user follow state keyed by userHandle — seed with handles already followed in initial reels
  const [followedHandles, setFollowedHandles] = useState<Record<string, boolean>>({
    '@pastorjames': true,
    '@graceministry': true,
    '@sarahw': true,
  });

  const isFollowingUser = useCallback((handle: string) => !!followedHandles[handle], [followedHandles]);

  const toggleFollow = useCallback((handle: string) => {
    setFollowedHandles((prev) => {
      const wasFollowing = !!prev[handle];
      // Sync reels too so the per-reel isFollowing stays consistent
      setReels((prevReels) =>
        prevReels.map((r) => (r.userHandle === handle ? { ...r, isFollowing: !wasFollowing } : r))
      );
      return { ...prev, [handle]: !wasFollowing };
    });
  }, []);

  const toggleJoin = useCallback((communityId: string) => {
    setCommunities((prev) => prev.map((c) => c.id === communityId ? { ...c, isJoined: !c.isJoined, members: c.isJoined ? c.members - 1 : c.members + 1 } : c));
  }, []);

  const addPrayer = useCallback((prayer: Omit<Prayer, 'id'>) => {
    const newPrayer: Prayer = { ...prayer, id: Date.now().toString() + Math.random().toString(36).substr(2, 9) };
    setPrayers((prev) => [newPrayer, ...prev]);
  }, []);

  const addPost = useCallback((post: Omit<Post, 'id'>) => {
    const newPost: Post = { ...post, id: Date.now().toString() + Math.random().toString(36).substr(2, 9) };
    setPosts((prev) => [newPost, ...prev]);
  }, []);

  const addReel = useCallback((reel: Omit<Reel, 'id'>) => {
    const newReel: Reel = { ...reel, id: Date.now().toString() + Math.random().toString(36).substr(2, 9) };
    setReels((prev) => [newReel, ...prev]);
  }, []);

  const addComment = useCallback((postId: string, text: string, user?: { userName: string; userInitials: string; userColor: string }) => {
    const newComment: Comment = { id: Date.now().toString() + Math.random().toString(36).substr(2, 9), postId, userName: user?.userName ?? 'You', userInitials: user?.userInitials ?? 'ME', userColor: user?.userColor ?? '#4A90A4', text, timestamp: 'just now', likes: 0, isLiked: false };
    setCommentsByPost((prev) => ({ ...prev, [postId]: [newComment, ...(prev[postId] ?? [])] }));
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comments: p.comments + 1 } : p)));
  }, []);

  const addPrayerComment = useCallback((prayerId: string, text: string, user?: { userName: string; userInitials: string; userColor: string }) => {
    const newComment: Comment = { id: Date.now().toString() + Math.random().toString(36).substr(2, 9), postId: prayerId, userName: user?.userName ?? 'You', userInitials: user?.userInitials ?? 'ME', userColor: user?.userColor ?? '#4A90A4', text, timestamp: 'just now', likes: 0, isLiked: false };
    setPrayerCommentsByPrayer((prev) => ({ ...prev, [prayerId]: [newComment, ...(prev[prayerId] ?? [])] }));
    setPrayers((prev) => prev.map((p) => (p.id === prayerId ? { ...p, comments: p.comments + 1 } : p)));
  }, []);

  const toggleCommentLike = useCallback((postId: string, commentId: string) => {
    setCommentsByPost((prev) => ({ ...prev, [postId]: (prev[postId] ?? []).map((c) => c.id === commentId ? { ...c, isLiked: !c.isLiked, likes: c.isLiked ? c.likes - 1 : c.likes + 1 } : c) }));
  }, []);

  const togglePrayerCommentLike = useCallback((prayerId: string, commentId: string) => {
    setPrayerCommentsByPrayer((prev) => ({ ...prev, [prayerId]: (prev[prayerId] ?? []).map((c) => c.id === commentId ? { ...c, isLiked: !c.isLiked, likes: c.isLiked ? c.likes - 1 : c.likes + 1 } : c) }));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }, []);

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
    const newN: Notification = { ...n, id: Date.now().toString() + Math.random().toString(36).substr(2, 6), createdAt: Date.now(), isRead: false };
    setNotifications((prev) => [newN, ...prev]);
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const deleteAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const SIMULATED_NOTIFICATIONS: Omit<Notification, 'id' | 'createdAt' | 'isRead'>[] = [
    { type: 'like', userName: 'Priscilla A.', userInitials: 'PA', userColor: '#EC4899', message: 'liked your morning devotion post.', timestamp: 'just now', postImageIndex: 2, targetTab: '/' },
    { type: 'follow', userName: 'Emmanuel K.', userInitials: 'EK', userColor: '#10B981', message: 'started following you.', timestamp: 'just now', targetTab: '/profile' },
    { type: 'comment', userName: 'Grace Ministry', userInitials: 'GM', userColor: '#F39C12', message: 'commented: "Amen! This is so encouraging 🙌"', timestamp: 'just now', postImageIndex: 0, targetTab: '/' },
    { type: 'prayer_pray', userName: 'Sister Ruth', userInitials: 'SR', userColor: '#8B5CF6', message: 'is praying for your request. 🙏', timestamp: 'just now', targetTab: '/prayer' },
    { type: 'verse_share', userName: 'Joshua M.', userInitials: 'JM', userColor: '#3B82F6', message: 'shared Philippians 4:13 with you.', timestamp: 'just now', targetTab: '/' },
    { type: 'dm', userName: 'Deborah C.', userInitials: 'DC', userColor: '#F59E0B', message: 'sent you a message: "God bless you! 💙"', timestamp: 'just now', targetTab: '/messages' },
    { type: 'community_announcement', userName: 'Daily Devotions', userInitials: 'DD', userColor: '#27AE60', message: 'posted: "Join us for sunrise prayer tomorrow!"', timestamp: 'just now', targetTab: '/community' },
    { type: 'repost', userName: 'Worship House', userInitials: 'WH', userColor: '#6366F1', message: 'reposted your scripture post to their community.', timestamp: 'just now', postImageIndex: 1, targetTab: '/' },
    { type: 'mention', userName: 'Pastor James', userInitials: 'PJ', userColor: '#D4A843', message: 'mentioned you in a post: "Inspired by @gracemember!"', timestamp: 'just now', targetTab: '/' },
    { type: 'prayer_response', userName: 'Hannah B.', userInitials: 'HB', userColor: '#E91E8C', message: 'responded to your prayer with a scripture. 📖', timestamp: 'just now', targetTab: '/prayer' },
  ];

  useEffect(() => {
    let idx = 0;
    const send = () => {
      addNotification(SIMULATED_NOTIFICATIONS[idx % SIMULATED_NOTIFICATIONS.length]);
      idx++;
    };
    const firstDelay = setTimeout(send, 18000);
    const interval = setInterval(send, 35000);
    return () => { clearTimeout(firstDelay); clearInterval(interval); };
  }, []);

  const INITIAL_USER_PROFILE: UserProfile = {
    name: 'Grace Member',
    handle: '@gracemember',
    bio: 'Walking in faith, one day at a time ✨\nPhil 4:13 | John 3:16 | Rom 8:28',
    location: 'Faith Community Church',
    website: 'gracesocial.app',
    joined: 'Joined January 2024',
    postsCount: 12,
    followers: 248,
    following: 180,
  };
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_USER_PROFILE);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...updates }));
  }, []);

  const followingCount = Object.values(followedHandles).filter(Boolean).length;

  return (
    <AppContext.Provider value={{ posts, prayers, reels, communities, notifications, commentsByPost, prayerCommentsByPrayer, unreadCount, userProfile, pendingVerse, followedHandles, followingCount, isFollowingUser, updateProfile, setPendingVerse, markNotificationRead, addNotification, deleteNotification, deleteAllNotifications, toggleLike, toggleSave, togglePray, toggleFollow, toggleJoin, toggleReelLike, toggleReelSave, incrementReelShares, addPrayer, addPost, addReel, addComment, addPrayerComment, toggleCommentLike, togglePrayerCommentLike, markAllRead }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
