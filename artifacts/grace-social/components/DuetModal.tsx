import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
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
import { POST_IMAGES } from '@/constants/images';
import { Reel, useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

type Step = 'pick' | 'preview' | 'details' | 'publishing' | 'success';

interface Props {
  visible: boolean;
  onClose: () => void;
  originalReel: Reel | null;
}

function formatViews(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export function DuetModal({ visible, onClose, originalReel }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addReel } = useApp();
  const { currentUser } = useAuth();
  const isWeb = Platform.OS === 'web';
  const webFileRef = useRef<any>(null);

  const [step, setStep] = useState<Step>('pick');
  const [myVideoUri, setMyVideoUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isPicking, setIsPicking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const uploadProgress = useRef(new Animated.Value(0)).current;

  const topPad = isWeb ? 16 : insets.top + 8;

  const reset = useCallback(() => {
    setStep('pick');
    setMyVideoUri(null);
    setCaption('');
    setIsPicking(false);
    setIsRecording(false);
    uploadProgress.setValue(0);
  }, [uploadProgress]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const applyVideo = useCallback((result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || !result.assets?.length) return;
    setMyVideoUri(result.assets[0].uri);
    setStep('preview');
  }, []);

  const pickFromLibrary = useCallback(async () => {
    setIsPicking(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { setIsPicking(false); return; }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        videoMaxDuration: 60,
        quality: 0.8,
      } as any);
      applyVideo(result);
    } catch {}
    setIsPicking(false);
  }, [applyVideo]);

  const recordVideo = useCallback(async () => {
    setIsRecording(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') { setIsRecording(false); return; }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['videos'],
        videoMaxDuration: 60,
        quality: 0.8,
      } as any);
      applyVideo(result);
    } catch {}
    setIsRecording(false);
  }, [applyVideo]);

  const handleWebFile = useCallback((e: any) => {
    const file: File = e.target?.files?.[0];
    if (!file) return;
    setMyVideoUri(URL.createObjectURL(file));
    setStep('preview');
    e.target.value = '';
  }, []);

  const handlePost = useCallback(() => {
    if (!originalReel) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStep('publishing');
    uploadProgress.setValue(0);
    Animated.timing(uploadProgress, {
      toValue: 1,
      duration: 2200,
      useNativeDriver: false,
    }).start(() => {
      const duetDesc = `🎭 Duet with ${originalReel.userHandle}\n\n${caption.trim() || 'My duet response 🙌'}`;
      addReel({
        userName:     currentUser?.displayName || currentUser?.name || 'You',
        userHandle:   currentUser?.handle || '@gracemember',
        userInitials: currentUser?.initials || 'ME',
        userColor:    currentUser?.color || '#4A90A4',
        description:  duetDesc,
        bibleVerse:   originalReel.bibleVerse,
        likes:        0,
        comments:     0,
        shares:       0,
        views:        0,
        isLiked:      false,
        isSaved:      false,
        imageIndex:   originalReel.imageIndex,
        videoUri:     myVideoUri ?? originalReel.videoUri,
        duration:     '0:60',
        isFollowing:  false,
        audioName:    originalReel.audioName,
      });
      setStep('success');
      setTimeout(() => { reset(); onClose(); }, 2200);
    });
  }, [originalReel, caption, myVideoUri, addReel, currentUser, uploadProgress, reset, onClose]);

  const barWidth = uploadProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  if (!originalReel) return null;

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
          <TouchableOpacity
            style={styles.headerLeft}
            onPress={step === 'preview' || step === 'details' ? () => setStep(step === 'details' ? 'preview' : 'pick') : handleClose}
          >
            <Feather
              name={step === 'pick' ? 'x' : 'arrow-left'}
              size={22}
              color={colors.mutedForeground}
            />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Feather name="users" size={16} color={colors.primary} />
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              {step === 'pick' ? 'Duet' : step === 'preview' ? 'Preview' : step === 'details' ? 'Add Details' : step === 'publishing' ? 'Posting…' : 'Posted!'}
            </Text>
          </View>

          {step === 'preview' ? (
            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: colors.primary }]}
              onPress={() => { Haptics.selectionAsync(); setStep('details'); }}
            >
              <Text style={styles.nextBtnText}>Next</Text>
            </TouchableOpacity>
          ) : step === 'details' ? (
            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: colors.primary }]}
              onPress={handlePost}
            >
              <Text style={styles.nextBtnText}>Post</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 60 }} />
          )}
        </View>

        {/* ── STEP: PICK ── */}
        {step === 'pick' && (
          <View style={styles.pickContainer}>
            {/* Original reel preview (top) */}
            <View style={styles.originalPreview}>
              {originalReel.videoUri ? (
                <VideoPlayer uri={originalReel.videoUri} isActive muted loop style={StyleSheet.absoluteFill as any} />
              ) : (
                <Image source={POST_IMAGES[originalReel.imageIndex]} style={StyleSheet.absoluteFill} contentFit="cover" />
              )}
              <LinearGradient colors={['rgba(0,0,0,0.55)', 'transparent']} style={styles.originalGradient} />
              <View style={styles.originalBadge}>
                <Feather name="film" size={12} color="#fff" />
                <Text style={styles.originalBadgeText}>Original · {originalReel.userHandle}</Text>
              </View>
              {/* Split indicator */}
              <View style={styles.splitLine} />
              <View style={styles.mySlotEmpty}>
                <Feather name="user" size={28} color="rgba(255,255,255,0.4)" />
                <Text style={styles.mySlotText}>Your response goes here</Text>
              </View>
            </View>

            {/* Pick options */}
            <View style={styles.pickOptions}>
              <Text style={[styles.pickTitle, { color: colors.foreground }]}>Record your duet response</Text>
              <Text style={[styles.pickSub, { color: colors.mutedForeground }]}>
                Your video will play side-by-side with {originalReel.userName}'s Realm
              </Text>

              <TouchableOpacity
                style={[styles.pickOption, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={isWeb ? () => webFileRef.current?.click() : pickFromLibrary}
                disabled={isPicking}
                activeOpacity={0.75}
              >
                <View style={[styles.pickOptionIcon, { backgroundColor: colors.primary + '18' }]}>
                  <Feather name="video" size={26} color={colors.primary} />
                </View>
                <View style={styles.pickOptionText}>
                  <Text style={[styles.pickOptionTitle, { color: colors.foreground }]}>
                    {isPicking ? 'Opening…' : 'Choose from library'}
                  </Text>
                  <Text style={[styles.pickOptionSub, { color: colors.mutedForeground }]}>
                    Pick an existing video
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>

              {!isWeb && (
                <TouchableOpacity
                  style={[styles.pickOption, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={recordVideo}
                  disabled={isRecording}
                  activeOpacity={0.75}
                >
                  <View style={[styles.pickOptionIcon, { backgroundColor: '#E91E8C18' }]}>
                    <Feather name="camera" size={26} color="#E91E8C" />
                  </View>
                  <View style={styles.pickOptionText}>
                    <Text style={[styles.pickOptionTitle, { color: colors.foreground }]}>
                      {isRecording ? 'Opening camera…' : 'Record now'}
                    </Text>
                    <Text style={[styles.pickOptionSub, { color: colors.mutedForeground }]}>
                      Capture your response on camera
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}

              <View style={[styles.infoBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Feather name="info" size={13} color={colors.mutedForeground} />
                <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                  Your duet will appear side-by-side with the original Realm in the feed
                </Text>
              </View>
            </View>

            {isWeb && (
              <input ref={webFileRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleWebFile} />
            )}
          </View>
        )}

        {/* ── STEP: PREVIEW ── */}
        {step === 'preview' && myVideoUri && (
          <View style={styles.previewContainer}>
            {/* Split-screen preview */}
            <View style={styles.splitPreview}>
              {/* Left / Top half — original */}
              <View style={styles.splitHalf}>
                {originalReel.videoUri ? (
                  <VideoPlayer uri={originalReel.videoUri} isActive muted loop style={StyleSheet.absoluteFill as any} />
                ) : (
                  <Image source={POST_IMAGES[originalReel.imageIndex]} style={StyleSheet.absoluteFill} contentFit="cover" />
                )}
                <View style={styles.splitLabelWrap}>
                  <View style={[styles.splitLabel, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
                    <AvatarCircle initials={originalReel.userInitials} color={originalReel.userColor} size={16} />
                    <Text style={styles.splitLabelText}>{originalReel.userHandle}</Text>
                  </View>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.splitDivider} />

              {/* Right / Bottom half — my video */}
              <View style={styles.splitHalf}>
                <VideoPlayer uri={myVideoUri} isActive muted loop style={StyleSheet.absoluteFill as any} />
                <View style={styles.splitLabelWrap}>
                  <View style={[styles.splitLabel, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
                    <AvatarCircle
                      initials={currentUser?.initials || 'ME'}
                      color={currentUser?.color || '#4A90A4'}
                      size={16}
                    />
                    <Text style={styles.splitLabelText}>{currentUser?.handle || '@you'}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Change video + info */}
            <View style={[styles.previewInfo, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
              <View style={styles.previewInfoRow}>
                <Feather name="film" size={16} color={colors.primary} />
                <Text style={[styles.previewInfoText, { color: colors.foreground }]}>
                  Side-by-side duet preview
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.changeBtn, { borderColor: colors.border }]}
                onPress={() => setStep('pick')}
              >
                <Feather name="refresh-cw" size={14} color={colors.mutedForeground} />
                <Text style={[styles.changeBtnText, { color: colors.mutedForeground }]}>Change my video</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── STEP: DETAILS ── */}
        {step === 'details' && (
          <ScrollView
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Split-screen thumbnail */}
            <View style={styles.detailsThumb}>
              <View style={[styles.thumbHalf, { backgroundColor: '#000' }]}>
                {originalReel.videoUri ? (
                  <VideoPlayer uri={originalReel.videoUri} isActive={false} muted style={StyleSheet.absoluteFill as any} />
                ) : (
                  <Image source={POST_IMAGES[originalReel.imageIndex]} style={StyleSheet.absoluteFill} contentFit="cover" />
                )}
                <LinearGradient colors={['rgba(0,0,0,0.5)', 'transparent']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 40 }} />
                <Text style={styles.thumbLabel}>{originalReel.userHandle}</Text>
              </View>
              <View style={styles.thumbDivider} />
              <View style={[styles.thumbHalf, { backgroundColor: '#111' }]}>
                {myVideoUri && <VideoPlayer uri={myVideoUri} isActive={false} muted style={StyleSheet.absoluteFill as any} />}
                <LinearGradient colors={['rgba(0,0,0,0.5)', 'transparent']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 40 }} />
                <Text style={styles.thumbLabel}>{currentUser?.handle || '@you'}</Text>
              </View>
              <View style={styles.thumbDuetBadge}>
                <Feather name="users" size={11} color="#fff" />
                <Text style={styles.thumbDuetText}>Duet</Text>
              </View>
            </View>

            <View style={styles.detailsBody}>
              {/* Author */}
              <View style={styles.authorRow}>
                <AvatarCircle
                  initials={currentUser?.initials || 'ME'}
                  color={currentUser?.color || '#4A90A4'}
                  avatarUrl={currentUser?.avatarUrl}
                  size={40}
                />
                <View>
                  <Text style={[styles.authorName, { color: colors.foreground }]}>
                    {currentUser?.displayName || currentUser?.name || 'You'}
                  </Text>
                  <Text style={[styles.authorHandle, { color: colors.mutedForeground }]}>
                    {currentUser?.handle || '@gracemember'}
                  </Text>
                </View>
              </View>

              {/* Duet tag (read-only) */}
              <View style={[styles.duetTagRow, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}>
                <Feather name="users" size={14} color={colors.primary} />
                <Text style={[styles.duetTagText, { color: colors.primary }]}>
                  Duet with {originalReel.userHandle}
                </Text>
                <Text style={[styles.duetTagViews, { color: colors.mutedForeground }]}>
                  {formatViews(originalReel.views)} views
                </Text>
              </View>

              {/* Caption input */}
              <TextInput
                style={[styles.captionInput, { color: colors.foreground }]}
                placeholder="Add your message to this duet…"
                placeholderTextColor={colors.mutedForeground}
                value={caption}
                onChangeText={setCaption}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={300}
                autoFocus
              />
              <Text style={[styles.charCount, { color: colors.mutedForeground }]}>
                {caption.length}/300
              </Text>

              {/* Original verse */}
              {originalReel.bibleVerse ? (
                <>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <View style={[styles.verseCarryRow, { backgroundColor: colors.accent + '12', borderColor: colors.accent + '30', borderWidth: 1, borderRadius: 12, padding: 12 }]}>
                    <Feather name="book-open" size={14} color={colors.accent} />
                    <Text style={[styles.verseCarryText, { color: colors.accent }]}>
                      Original verse carried: {originalReel.bibleVerse}
                    </Text>
                  </View>
                </>
              ) : null}
            </View>

            <View style={{ height: 60 }} />
          </ScrollView>
        )}

        {/* ── STEP: PUBLISHING ── */}
        {step === 'publishing' && (
          <View style={styles.publishingView}>
            <View style={[styles.publishIconRing, { backgroundColor: colors.primary + '18' }]}>
              <Feather name="upload-cloud" size={44} color={colors.primary} />
            </View>
            <Text style={[styles.publishTitle, { color: colors.foreground }]}>Posting your Duet…</Text>
            <Text style={[styles.publishSub, { color: colors.mutedForeground }]}>
              Duetting with {originalReel.userHandle}
            </Text>
            <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
              <Animated.View style={[styles.progressFill, { width: barWidth, backgroundColor: colors.primary }]} />
            </View>
          </View>
        )}

        {/* ── STEP: SUCCESS ── */}
        {step === 'success' && (
          <View style={styles.successView}>
            <View style={[styles.successRing, { backgroundColor: colors.primary + '20' }]}>
              <Feather name="check-circle" size={52} color={colors.primary} />
            </View>
            <Text style={[styles.successTitle, { color: colors.foreground }]}>Duet Posted!</Text>
            <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
              Your duet with {originalReel.userHandle} is now live in the Realms feed
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  handleBar: { width: 36, height: 4, borderRadius: 2, marginBottom: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
  },
  headerLeft: { padding: 4, width: 60 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  nextBtn: { borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8, width: 60, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },

  /* Pick step */
  pickContainer: { flex: 1 },
  originalPreview: {
    height: SCREEN_HEIGHT * 0.32,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  originalGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 60 },
  originalBadge: {
    position: 'absolute',
    top: 10,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  originalBadgeText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  splitLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  mySlotEmpty: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mySlotText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontFamily: 'Inter_400Regular' },
  pickOptions: { padding: 20, gap: 14 },
  pickTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  pickSub: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18, marginTop: -6 },
  pickOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  pickOptionIcon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  pickOptionText: { flex: 1, gap: 3 },
  pickOptionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  pickOptionSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  infoText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },

  /* Preview step */
  previewContainer: { flex: 1 },
  splitPreview: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#000',
    maxHeight: SCREEN_HEIGHT * 0.55,
  },
  splitHalf: { flex: 1, position: 'relative', overflow: 'hidden' },
  splitDivider: { width: 2, backgroundColor: 'rgba(255,255,255,0.7)' },
  splitLabelWrap: { position: 'absolute', bottom: 10, left: 0, right: 0, alignItems: 'center' },
  splitLabel: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  splitLabelText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  previewInfo: {
    padding: 16,
    borderTopWidth: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewInfoText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  changeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  changeBtnText: { fontSize: 13, fontFamily: 'Inter_400Regular' },

  /* Details step */
  detailsThumb: {
    height: 130,
    flexDirection: 'row',
    position: 'relative',
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  thumbHalf: { flex: 1, position: 'relative', overflow: 'hidden' },
  thumbDivider: { width: 2, backgroundColor: 'rgba(255,255,255,0.6)' },
  thumbLabel: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },
  thumbDuetBadge: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  thumbDuetText: { color: '#fff', fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  detailsBody: { padding: 20, gap: 14 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  authorName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  authorHandle: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  duetTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
  },
  duetTagText: { flex: 1, fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  duetTagViews: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  captionInput: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
    minHeight: 90,
  },
  charCount: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'right', marginTop: -8 },
  divider: { height: 0.5, marginVertical: 4 },
  verseCarryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  verseCarryText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', fontStyle: 'italic', lineHeight: 18 },

  /* Publishing */
  publishingView: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 40 },
  publishIconRing: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  publishTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  publishSub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  progressTrack: { width: '100%', height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 8 },
  progressFill: { height: '100%', borderRadius: 2 },

  /* Success */
  successView: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 40 },
  successRing: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  successSub: { fontSize: 15, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22 },
});
