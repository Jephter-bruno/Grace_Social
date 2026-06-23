import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarCircle } from '@/components/AvatarCircle';
import { VideoPlayer } from '@/components/VideoPlayer';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';

type Step = 'pick' | 'details' | 'publishing' | 'success';

const CATEGORIES = [
  { id: 0, label: 'Worship',   emoji: '🎵', color: '#4A90A4' },
  { id: 1, label: 'Testimony', emoji: '🙏', color: '#27AE60' },
  { id: 2, label: 'Scripture', emoji: '📖', color: '#8B5CF6' },
  { id: 3, label: 'Devotion',  emoji: '☀️', color: '#F59E0B' },
  { id: 4, label: 'Prayer',    emoji: '💙', color: '#E91E8C' },
];

const VERSE_SUGGESTIONS = [
  { reference: 'Psalm 100:1',      text: 'Make a joyful noise to the Lord, all the earth!' },
  { reference: 'Philippians 4:4',  text: 'Rejoice in the Lord always. I will say it again: Rejoice!' },
  { reference: 'Psalm 150:6',      text: 'Let everything that has breath praise the Lord.' },
  { reference: 'Colossians 3:16',  text: 'Let the message of Christ dwell among you richly... singing to God with gratitude in your hearts.' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function NewReelModal({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addReel } = useApp();
  const { currentUser } = useAuth();
  const isWeb = Platform.OS === 'web';
  const fileInputRef = useRef<any>(null);

  const [step, setStep] = useState<Step>('pick');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState('0:15');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [verseEnabled, setVerseEnabled] = useState(false);
  const [verseRef, setVerseRef] = useState('');
  const [verseText, setVerseText] = useState('');
  const [isPickingLibrary, setIsPickingLibrary] = useState(false);
  const [isPickingCamera, setIsPickingCamera] = useState(false);
  const [uploadProgress] = useState(new Animated.Value(0));

  const reset = useCallback(() => {
    setStep('pick');
    setVideoUri(null);
    setVideoDuration('0:15');
    setDescription('');
    setSelectedCategory(0);
    setVerseEnabled(false);
    setVerseRef('');
    setVerseText('');
    setIsPickingLibrary(false);
    setIsPickingCamera(false);
    uploadProgress.setValue(0);
  }, [uploadProgress]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const applyPickedVideo = useCallback((result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    setVideoUri(asset.uri);
    if (asset.duration) {
      const secs = Math.round(asset.duration / 1000);
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      setVideoDuration(`${m}:${s.toString().padStart(2, '0')}`);
    }
    setStep('details');
  }, []);

  const pickFromLibrary = useCallback(async () => {
    setIsPickingLibrary(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setIsPickingLibrary(false);
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        videoMaxDuration: 60,
        quality: 0.8,
      } as any);
      applyPickedVideo(result);
    } catch {}
    setIsPickingLibrary(false);
  }, [applyPickedVideo]);

  const recordVideo = useCallback(async () => {
    setIsPickingCamera(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setIsPickingCamera(false);
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['videos'],
        videoMaxDuration: 60,
        quality: 0.8,
      } as any);
      applyPickedVideo(result);
    } catch {}
    setIsPickingCamera(false);
  }, [applyPickedVideo]);

  const handleWebFilePick = useCallback((e: any) => {
    const file: File = e.target?.files?.[0];
    if (!file) return;
    const uri = URL.createObjectURL(file);
    setVideoUri(uri);
    setStep('details');
    e.target.value = '';
  }, []);

  const canPost = description.trim().length > 0 && !!videoUri;

  const runPublish = useCallback(() => {
    if (!canPost) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setStep('publishing');
    uploadProgress.setValue(0);

    Animated.timing(uploadProgress, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start(() => {
      addReel({
        userName:     currentUser?.displayName || currentUser?.name || 'You',
        userHandle:   currentUser?.handle || '@gracemember',
        userInitials: currentUser?.initials || 'ME',
        userColor:    currentUser?.color || '#4A90A4',
        description:  description.trim(),
        bibleVerse:   verseEnabled && verseRef.trim() ? `${verseRef} — "${verseText}"` : '',
        likes:        0,
        comments:     0,
        shares:       0,
        views:        0,
        isLiked:      false,
        isSaved:      false,
        imageIndex:   selectedCategory,
        videoUri:     videoUri ?? undefined,
        duration:     videoDuration,
        isFollowing:  false,
        audioName:    `Original audio · ${currentUser?.handle || '@gracemember'}`,
      });
      setStep('success');
      setTimeout(() => { reset(); onClose(); }, 2000);
    });
  }, [canPost, addReel, currentUser, description, verseEnabled, verseRef, verseText,
      selectedCategory, videoUri, videoDuration, uploadProgress, reset, onClose]);

  const topPad = isWeb ? 16 : insets.top + 8;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={[styles.root, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Handle + Header */}
        <View style={{ marginTop: topPad, alignItems: 'center' }}>
          <View style={[styles.handleBar, { backgroundColor: colors.border }]} />
        </View>

        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={step === 'details' ? () => setStep('pick') : handleClose} style={styles.headerLeft}>
            <Feather
              name={step === 'details' ? 'arrow-left' : 'x'}
              size={22}
              color={colors.mutedForeground}
            />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {step === 'pick' ? 'New Realm' : step === 'details' ? 'Add Details' : step === 'publishing' ? 'Uploading…' : 'Posted!'}
          </Text>

          {step === 'details' ? (
            <TouchableOpacity
              style={[styles.postBtn, { backgroundColor: canPost ? colors.primary : colors.muted }]}
              onPress={runPublish}
              disabled={!canPost}
            >
              <Text style={[styles.postBtnText, { color: canPost ? '#fff' : colors.mutedForeground }]}>
                Post
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 60 }} />
          )}
        </View>

        {/* ── STEP: PICK ── */}
        {step === 'pick' && (
          <View style={styles.pickContainer}>
            {/* Decorative top banner */}
            <LinearGradient
              colors={['#1a0a2e', '#0d1a12']}
              style={styles.pickBanner}
            >
              <View style={styles.pickIconRing}>
                <Feather name="film" size={36} color="#D4A843" />
              </View>
              <Text style={[styles.pickBannerTitle, { color: '#fff' }]}>Share Your Story</Text>
              <Text style={[styles.pickBannerSub, { color: 'rgba(255,255,255,0.6)' }]}>
                Upload a video or record something new to share with your community
              </Text>
            </LinearGradient>

            {/* Source options */}
            <View style={styles.pickOptions}>
              {/* Library */}
              <TouchableOpacity
                style={[styles.pickOption, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={isWeb ? () => fileInputRef.current?.click() : pickFromLibrary}
                activeOpacity={0.75}
                disabled={isPickingLibrary}
              >
                <View style={[styles.pickOptionIcon, { backgroundColor: colors.primary + '18' }]}>
                  <Feather name="image" size={28} color={colors.primary} />
                </View>
                <View style={styles.pickOptionText}>
                  <Text style={[styles.pickOptionTitle, { color: colors.foreground }]}>
                    {isPickingLibrary ? 'Opening…' : 'Choose from Library'}
                  </Text>
                  <Text style={[styles.pickOptionSub, { color: colors.mutedForeground }]}>
                    Pick an existing video from your device
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>

              {/* Camera — web hides this */}
              {!isWeb && (
                <TouchableOpacity
                  style={[styles.pickOption, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={recordVideo}
                  activeOpacity={0.75}
                  disabled={isPickingCamera}
                >
                  <View style={[styles.pickOptionIcon, { backgroundColor: '#E91E8C18' }]}>
                    <Feather name="video" size={28} color="#E91E8C" />
                  </View>
                  <View style={styles.pickOptionText}>
                    <Text style={[styles.pickOptionTitle, { color: colors.foreground }]}>
                      {isPickingCamera ? 'Opening Camera…' : 'Record a Video'}
                    </Text>
                    <Text style={[styles.pickOptionSub, { color: colors.mutedForeground }]}>
                      Capture a new video right now
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}

              {/* Guidelines */}
              <View style={[styles.guidelinesBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Feather name="info" size={13} color={colors.mutedForeground} />
                <Text style={[styles.guidelinesText, { color: colors.mutedForeground }]}>
                  Videos up to 60 seconds · MP4 or MOV · Faith-centered content only
                </Text>
              </View>
            </View>

            {/* Hidden web file input */}
            {isWeb && (
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                style={{ display: 'none' }}
                onChange={handleWebFilePick}
              />
            )}
          </View>
        )}

        {/* ── STEP: DETAILS ── */}
        {step === 'details' && videoUri && (
          <ScrollView
            style={styles.detailsScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Video preview */}
            <View style={styles.previewRow}>
              <View style={styles.previewThumb}>
                <VideoPlayer uri={videoUri} isActive muted loop style={StyleSheet.absoluteFill} />
                {/* Duration badge */}
                <View style={styles.durationBadge}>
                  <Feather name="clock" size={10} color="#fff" />
                  <Text style={styles.durationBadgeText}>{videoDuration}</Text>
                </View>
              </View>

              <View style={styles.previewMeta}>
                <View style={[styles.previewStatusPill, { backgroundColor: colors.primary + '18' }]}>
                  <View style={[styles.previewDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.previewStatusText, { color: colors.primary }]}>Ready to post</Text>
                </View>
                <TouchableOpacity
                  style={[styles.changeVideoBtn, { borderColor: colors.border }]}
                  onPress={() => setStep('pick')}
                >
                  <Feather name="refresh-cw" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.changeVideoText, { color: colors.mutedForeground }]}>Change video</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Author row */}
            <View style={[styles.detailsBody]}>
              <View style={styles.authorRow}>
                <AvatarCircle
                  initials={currentUser?.initials || 'ME'}
                  color={currentUser?.color || '#4A90A4'}
                  avatarUrl={currentUser?.avatarUrl}
                  size={40}
                />
                <View style={styles.authorInfo}>
                  <Text style={[styles.authorName, { color: colors.foreground }]}>
                    {currentUser?.displayName || currentUser?.name || 'You'}
                  </Text>
                  <Text style={[styles.authorHandle, { color: colors.mutedForeground }]}>
                    {currentUser?.handle || '@gracemember'}
                  </Text>
                </View>
              </View>

              {/* Caption */}
              <TextInput
                style={[styles.captionInput, { color: colors.foreground }]}
                placeholder="Share what God is doing in your life..."
                placeholderTextColor={colors.mutedForeground}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={300}
                autoFocus
              />
              <Text style={[styles.charCount, { color: colors.mutedForeground }]}>
                {description.length}/300
              </Text>

              {/* Category */}
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CATEGORY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: selectedCategory === cat.id ? cat.color : colors.muted,
                        borderColor:     selectedCategory === cat.id ? cat.color : colors.border,
                        borderWidth:     selectedCategory === cat.id ? 2 : 1,
                      },
                    ]}
                    onPress={() => { Haptics.selectionAsync().catch(() => {}); setSelectedCategory(cat.id); }}
                  >
                    <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                    <Text style={[styles.categoryLabel, { color: selectedCategory === cat.id ? '#fff' : colors.mutedForeground }]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Bible verse toggle */}
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <TouchableOpacity
                style={[
                  styles.verseToggle,
                  {
                    backgroundColor: verseEnabled ? colors.accent + '15' : colors.muted,
                    borderColor:     verseEnabled ? colors.accent : colors.border,
                  },
                ]}
                onPress={() => { Haptics.selectionAsync().catch(() => {}); setVerseEnabled((v) => !v); }}
              >
                <Feather name="book-open" size={16} color={verseEnabled ? colors.accent : colors.mutedForeground} />
                <Text style={[styles.verseToggleText, { color: verseEnabled ? colors.accent : colors.mutedForeground }]}>
                  {verseEnabled ? 'Bible verse added' : 'Add a Bible verse'}
                </Text>
                <Feather name={verseEnabled ? 'chevron-up' : 'chevron-down'} size={16} color={verseEnabled ? colors.accent : colors.mutedForeground} />
              </TouchableOpacity>

              {verseEnabled && (
                <View style={[styles.verseSection, { borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.verseRefInput, { color: colors.foreground, borderBottomColor: colors.border }]}
                    placeholder="Reference (e.g. John 3:16)"
                    placeholderTextColor={colors.mutedForeground}
                    value={verseRef}
                    onChangeText={setVerseRef}
                  />
                  <TextInput
                    style={[styles.verseBodyInput, { color: colors.foreground }]}
                    placeholder="Verse text..."
                    placeholderTextColor={colors.mutedForeground}
                    value={verseText}
                    onChangeText={setVerseText}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                  <Text style={[styles.suggestLabel, { color: colors.mutedForeground }]}>QUICK PICKS</Text>
                  {VERSE_SUGGESTIONS.map((v) => (
                    <TouchableOpacity
                      key={v.reference}
                      style={[styles.verseSuggestion, { backgroundColor: colors.muted }]}
                      onPress={() => { setVerseRef(v.reference); setVerseText(v.text); }}
                    >
                      <Text style={[styles.verseSugRef, { color: colors.primary }]}>{v.reference}</Text>
                      <Text style={[styles.verseSugText, { color: colors.foreground }]} numberOfLines={1}>
                        {v.text}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={{ height: 60 }} />
          </ScrollView>
        )}

        {/* ── STEP: PUBLISHING ── */}
        {step === 'publishing' && (
          <UploadingView progress={uploadProgress} colors={colors} />
        )}

        {/* ── STEP: SUCCESS ── */}
        {step === 'success' && (
          <View style={styles.successView}>
            <View style={[styles.successCircle, { backgroundColor: colors.primary + '20' }]}>
              <Feather name="check-circle" size={52} color={colors.primary} />
            </View>
            <Text style={[styles.successTitle, { color: colors.foreground }]}>Realm Posted!</Text>
            <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
              Your video is now live in the Realms feed
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ── Upload progress sub-component ── */
function UploadingView({ progress, colors }: { progress: Animated.Value; colors: any }) {
  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.uploadingView}>
      <View style={[styles.uploadIconRing, { backgroundColor: colors.primary + '18' }]}>
        <Feather name="upload-cloud" size={44} color={colors.primary} />
      </View>
      <Text style={[styles.uploadingTitle, { color: colors.foreground }]}>Uploading your Realm…</Text>
      <Text style={[styles.uploadingSub, { color: colors.mutedForeground }]}>
        Sharing your faith story with the community
      </Text>
      <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
        <Animated.View
          style={[styles.progressFill, { width: barWidth, backgroundColor: colors.primary }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1 },
  handleBar:   { width: 36, height: 4, borderRadius: 2, marginBottom: 12 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 0.5 },
  headerLeft:  { padding: 4, width: 60 },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  postBtn:     { borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8, width: 60, alignItems: 'center' },
  postBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold' },

  /* Pick step */
  pickContainer: { flex: 1 },
  pickBanner: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24, gap: 10 },
  pickIconRing: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(212,168,67,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(212,168,67,0.35)', marginBottom: 4 },
  pickBannerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  pickBannerSub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  pickOptions: { padding: 20, gap: 14 },
  pickOption: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 16, borderWidth: 1, padding: 16 },
  pickOptionIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  pickOptionText: { flex: 1, gap: 3 },
  pickOptionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  pickOptionSub: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },
  guidelinesBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 10, borderWidth: 1, padding: 12 },
  guidelinesText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },

  /* Details step */
  detailsScroll: { flex: 1 },
  previewRow: { flexDirection: 'row', gap: 14, padding: 16, paddingBottom: 8 },
  previewThumb: { width: 100, height: 140, borderRadius: 12, overflow: 'hidden', backgroundColor: '#111', position: 'relative' },
  durationBadge: { position: 'absolute', bottom: 6, left: 6, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3 },
  durationBadgeText: { color: '#fff', fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  previewMeta: { flex: 1, justifyContent: 'center', gap: 12 },
  previewStatusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' },
  previewDot: { width: 6, height: 6, borderRadius: 3 },
  previewStatusText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  changeVideoBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7, alignSelf: 'flex-start' },
  changeVideoText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  detailsBody: { paddingHorizontal: 16, paddingTop: 8, gap: 0 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  authorInfo: { gap: 2 },
  authorName: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  authorHandle: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  captionInput: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 22, minHeight: 80, marginBottom: 4 },
  charCount: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'right', marginBottom: 4 },
  divider: { height: 0.5, marginVertical: 16 },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0.8, marginBottom: 10 },
  categoryRow: { gap: 8, paddingBottom: 4 },
  categoryChip: { alignItems: 'center', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, gap: 4, minWidth: 74 },
  categoryEmoji: { fontSize: 22 },
  categoryLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  verseToggle: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, padding: 14, borderWidth: 1 },
  verseToggleText: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium' },
  verseSection: { marginTop: 10, borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  verseRefInput: { fontSize: 14, fontFamily: 'Inter_600SemiBold', borderBottomWidth: 0.5, paddingBottom: 8 },
  verseBodyInput: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21, minHeight: 60 },
  suggestLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.8, marginTop: 4 },
  verseSuggestion: { borderRadius: 10, padding: 10, gap: 2 },
  verseSugRef: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  verseSugText: { fontSize: 12, fontFamily: 'Inter_400Regular' },

  /* Uploading step */
  uploadingView: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40 },
  uploadIconRing: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
  uploadingTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  uploadingSub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  progressTrack: { width: '100%', height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 8 },
  progressFill: { height: '100%', borderRadius: 3 },

  /* Success step */
  successView: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 40 },
  successCircle: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  successSub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
});
