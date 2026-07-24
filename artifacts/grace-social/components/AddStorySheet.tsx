import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import React, { useState, useRef } from 'react';
import {
  Alert,
  Dimensions,
  Image,
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
import { AddStoryPayload, StoryScripture } from '@/hooks/useStories';
import { useColors } from '@/hooks/useColors';

const { width: W, height: H } = Dimensions.get('window');
const PREVIEW_H = H * 0.62;

const GRADIENTS: [string, string, string][] = [
  ['#1a3a4a', '#2d6a7f', '#1a3a4a'],
  ['#2a1a3a', '#5a3a7a', '#2a1a3a'],
  ['#1a2a1a', '#2a5a3a', '#1a3a2a'],
  ['#3a1a10', '#7a3520', '#3a1a10'],
  ['#2a2010', '#5a4520', '#2a2010'],
  ['#1a1a3a', '#3a3a7a', '#1a1a3a'],
];

const SCRIPTURES: StoryScripture[] = [
  { reference: 'John 3:16', text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.' },
  { reference: 'Psalm 23:1', text: 'The Lord is my shepherd; I shall not want.' },
  { reference: 'Jeremiah 29:11', text: 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.' },
  { reference: 'Philippians 4:13', text: 'I can do all this through him who gives me strength.' },
  { reference: 'Romans 8:28', text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.' },
  { reference: 'Proverbs 3:5-6', text: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.' },
  { reference: 'Isaiah 40:31', text: 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.' },
  { reference: 'Psalm 46:10', text: 'Be still, and know that I am God.' },
  { reference: 'Matthew 6:33', text: 'But seek first his kingdom and his righteousness, and all these things will be given to you as well.' },
  { reference: 'Joshua 1:9', text: 'Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.' },
  { reference: 'Lamentations 3:22-23', text: 'Because of the Lord\'s great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.' },
  { reference: 'Hebrews 11:1', text: 'Now faith is confidence in what we hope for and assurance about what we do not see.' },
  { reference: 'Psalm 119:105', text: 'Your word is a lamp for my feet, a light on my path.' },
  { reference: '1 Corinthians 13:4', text: 'Love is patient, love is kind. It does not envy, it does not boast, it is not proud.' },
  { reference: 'Romans 8:38-39', text: 'For I am convinced that neither death nor life, neither angels nor demons… nor anything else in all creation, will be able to separate us from the love of God.' },
  { reference: 'Galatians 5:22-23', text: 'But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control.' },
];

type StoryMode = 'text' | 'image' | 'video';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: AddStoryPayload) => void;
}

export function AddStorySheet({ visible, onClose, onSubmit }: Props) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const isWeb = Platform.OS === 'web';
  const videoRef = useRef<Video>(null);

  const [mode, setMode] = useState<StoryMode>('text');
  const [gradientIdx, setGradientIdx] = useState(0);
  const [caption, setCaption] = useState('');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [selectedScripture, setSelectedScripture] = useState<StoryScripture | null>(null);
  const [showScripturePicker, setShowScripturePicker] = useState(false);
  const [scriptureSearch, setScriptureSearch] = useState('');

  const reset = () => {
    setMode('text');
    setGradientIdx(0);
    setCaption('');
    setMediaUri(null);
    setSelectedScripture(null);
    setShowScripturePicker(false);
    setScriptureSearch('');
  };

  const handleClose = () => { reset(); onClose(); };

  const canShare =
    mode === 'text' ? caption.trim().length > 0 : mediaUri !== null;

  const pickMedia = async (type: 'image' | 'video') => {
    if (isWeb) {
      Alert.alert('Not supported', 'Media picking is only supported on mobile.');
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library in settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: type === 'image'
        ? ImagePicker.MediaTypeOptions.Images
        : ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.85,
      videoMaxDuration: 30,
    });
    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
      setMode(type);
    }
  };

  const handleShare = () => {
    const payload: AddStoryPayload = {
      text: caption.trim() || undefined,
      gradient: GRADIENTS[gradientIdx],
      scripture: selectedScripture ?? undefined,
      mediaUri: mediaUri ?? undefined,
      mediaType: mode !== 'text' ? mode : undefined,
    };
    onSubmit(payload);
    reset();
    onClose();
  };

  const filteredScriptures = scriptureSearch.trim()
    ? SCRIPTURES.filter(
        (s) =>
          s.reference.toLowerCase().includes(scriptureSearch.toLowerCase()) ||
          s.text.toLowerCase().includes(scriptureSearch.toLowerCase())
      )
    : SCRIPTURES;

  // ── Scripture picker sheet ──
  if (showScripturePicker) {
    return (
      <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={() => setShowScripturePicker(false)}>
        <View style={[styles.pickerContainer, { backgroundColor: colors.background, paddingTop: isWeb ? 50 : insets.top + 10 }]}>
          {/* Header */}
          <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowScripturePicker(false)} style={styles.pickerBack}>
              <Feather name="arrow-left" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.pickerTitle, { color: colors.foreground }]}>Select Scripture</Text>
            {selectedScripture && (
              <TouchableOpacity onPress={() => { setSelectedScripture(null); setShowScripturePicker(false); }}>
                <Text style={[styles.pickerClear, { color: '#E07A54' }]}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Search */}
          <View style={[styles.searchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              value={scriptureSearch}
              onChangeText={setScriptureSearch}
              placeholder="Search scripture..."
              placeholderTextColor={colors.mutedForeground}
              autoFocus
            />
            {scriptureSearch.length > 0 && (
              <TouchableOpacity onPress={() => setScriptureSearch('')}>
                <Feather name="x" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>

          {/* List */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
            {filteredScriptures.map((s) => {
              const isSelected = selectedScripture?.reference === s.reference;
              return (
                <TouchableOpacity
                  key={s.reference}
                  style={[
                    styles.scriptureRow,
                    { borderBottomColor: colors.border },
                    isSelected && { backgroundColor: colors.muted },
                  ]}
                  onPress={() => { setSelectedScripture(s); setShowScripturePicker(false); }}
                  activeOpacity={0.75}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.scriptureRef, { color: '#D4A843' }]}>{s.reference}</Text>
                    <Text style={[styles.scriptureText, { color: colors.mutedForeground }]} numberOfLines={2}>{s.text}</Text>
                  </View>
                  {isSelected && <Feather name="check" size={18} color="#D4A843" />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    );
  }

  // ── Main composer ──
  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={handleClose}>
      <View style={[styles.container, { backgroundColor: '#000', paddingTop: isWeb ? 50 : insets.top + 6 }]}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

          {/* ── Top bar ── */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={handleClose} style={styles.iconBtn}>
              <Feather name="x" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.topTitle}>Add to Story</Text>
            <TouchableOpacity
              style={[styles.shareBtn, !canShare && { opacity: 0.35 }]}
              onPress={handleShare}
              disabled={!canShare}
            >
              <Text style={styles.shareBtnText}>Share</Text>
              <Feather name="arrow-right" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* ── Preview area ── */}
          <View style={[styles.preview, { height: PREVIEW_H }]}>
            {mode === 'text' || !mediaUri ? (
              <LinearGradient
                colors={GRADIENTS[gradientIdx]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            ) : mode === 'image' && mediaUri ? (
              <Image source={{ uri: mediaUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : mode === 'video' && mediaUri ? (
              <Video
                ref={videoRef}
                source={{ uri: mediaUri }}
                style={StyleSheet.absoluteFill}
                resizeMode={ResizeMode.COVER}
                isLooping
                shouldPlay
                isMuted
              />
            ) : null}

            {/* Dark scrim for media so text is legible */}
            {mediaUri && (
              <View style={styles.mediaScrim} />
            )}

            {/* Scripture overlay */}
            {selectedScripture && (
              <View style={styles.scriptureOverlay}>
                <Text style={styles.scriptureOverlayRef}>{selectedScripture.reference}</Text>
                <Text style={styles.scriptureOverlayText} numberOfLines={4}>{selectedScripture.text}</Text>
              </View>
            )}

            {/* Caption overlay / text input for text mode */}
            {mode === 'text' ? (
              <TextInput
                style={styles.textModeInput}
                value={caption}
                onChangeText={setCaption}
                placeholder="Share something inspiring..."
                placeholderTextColor="rgba(255,255,255,0.45)"
                multiline
                maxLength={200}
                textAlign="center"
                textAlignVertical="center"
              />
            ) : (
              caption.length > 0 && (
                <View style={styles.captionOverlay}>
                  <Text style={styles.captionOverlayText}>{caption}</Text>
                </View>
              )
            )}

            {/* Media mode: tap to change */}
            {mediaUri && (
              <TouchableOpacity
                style={styles.changeMediaBtn}
                onPress={() => pickMedia(mode as 'image' | 'video')}
              >
                <Feather name="refresh-cw" size={14} color="#fff" />
                <Text style={styles.changeMediaText}>Change</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── Bottom controls ── */}
          <ScrollView
            style={[styles.controls, { backgroundColor: '#111' }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Mode tabs */}
            <View style={styles.modeTabs}>
              {([
                { key: 'text', icon: 'type', label: 'Text' },
                { key: 'image', icon: 'image', label: 'Photo' },
                { key: 'video', icon: 'film', label: 'Video' },
              ] as { key: StoryMode; icon: string; label: string }[]).map((tab) => {
                const active = mode === tab.key && (tab.key === 'text' || mediaUri !== null);
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={[styles.modeTab, active && styles.modeTabActive]}
                    onPress={() => {
                      if (tab.key === 'text') { setMediaUri(null); setMode('text'); }
                      else pickMedia(tab.key);
                    }}
                    activeOpacity={0.75}
                  >
                    <Feather name={tab.icon as any} size={18} color={active ? '#E07A54' : 'rgba(255,255,255,0.5)'} />
                    <Text style={[styles.modeTabLabel, active && { color: '#E07A54' }]}>{tab.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Gradient picker (text mode only) */}
            {mode === 'text' && (
              <View style={styles.gradientRow}>
                <Text style={styles.rowLabel}>Background</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gradientList}>
                  {GRADIENTS.map((g, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => setGradientIdx(i)}
                      style={[styles.gradientDot, i === gradientIdx && styles.gradientDotSelected]}
                      activeOpacity={0.8}
                    >
                      <LinearGradient colors={g} style={StyleSheet.absoluteFill} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Caption input (media modes) */}
            {mode !== 'text' && (
              <View style={styles.captionRow}>
                <Text style={styles.rowLabel}>Caption</Text>
                <TextInput
                  style={[styles.captionInput, { color: '#fff', borderColor: 'rgba(255,255,255,0.15)' }]}
                  value={caption}
                  onChangeText={setCaption}
                  placeholder="Add a caption... (optional)"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  multiline
                  maxLength={150}
                />
              </View>
            )}

            {/* Scripture picker */}
            <View style={styles.scriptureSection}>
              <Text style={styles.rowLabel}>Scripture</Text>
              <TouchableOpacity
                style={[styles.scriptureTrigger, { borderColor: 'rgba(255,255,255,0.15)' }]}
                onPress={() => setShowScripturePicker(true)}
                activeOpacity={0.75}
              >
                {selectedScripture ? (
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.scriptureTriggerRef, { color: '#D4A843' }]}>{selectedScripture.reference}</Text>
                    <Text style={styles.scriptureTriggerText} numberOfLines={1}>{selectedScripture.text}</Text>
                  </View>
                ) : (
                  <Text style={styles.scriptureTriggerPlaceholder}>Add a scripture (optional)</Text>
                )}
                <Feather name={selectedScripture ? 'edit-2' : 'book-open'} size={16} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
              {selectedScripture && (
                <TouchableOpacity onPress={() => setSelectedScripture(null)} style={styles.scriptureClearBtn}>
                  <Feather name="x" size={13} color="rgba(255,255,255,0.4)" />
                  <Text style={styles.scriptureClearText}>Remove scripture</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 8,
  },
  iconBtn: { padding: 6 },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E07A54',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  shareBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff' },

  // Preview
  preview: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  textModeInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    paddingHorizontal: 28,
    paddingVertical: 60,
  },
  scriptureOverlay: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#D4A843',
  },
  scriptureOverlayRef: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#D4A843',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scriptureOverlayText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#fff',
    lineHeight: 19,
    fontStyle: 'italic',
  },
  captionOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  captionOverlayText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
    textAlign: 'center',
  },
  changeMediaBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  changeMediaText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#fff' },

  // Controls
  controls: { flex: 1 },
  modeTabs: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modeTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  modeTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#E07A54',
  },
  modeTabLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: 'rgba(255,255,255,0.5)',
  },

  rowLabel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 10,
  },

  // Gradient picker
  gradientRow: { paddingHorizontal: 16, paddingTop: 16 },
  gradientList: { gap: 10, paddingRight: 8 },
  gradientDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: 'transparent',
  },
  gradientDotSelected: {
    borderColor: '#fff',
    transform: [{ scale: 1.15 }],
  },

  // Caption (media mode)
  captionRow: { paddingHorizontal: 16, paddingTop: 16 },
  captionInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    minHeight: 72,
    textAlignVertical: 'top',
  },

  // Scripture
  scriptureSection: { paddingHorizontal: 16, paddingTop: 16 },
  scriptureTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  scriptureTriggerPlaceholder: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.35)',
  },
  scriptureTriggerRef: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    marginBottom: 2,
  },
  scriptureTriggerText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.55)',
  },
  scriptureClearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  scriptureClearText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.4)',
  },

  // Scripture picker sheet
  pickerContainer: { flex: 1 },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  pickerBack: { padding: 4 },
  pickerTitle: { flex: 1, fontSize: 17, fontFamily: 'Inter_700Bold' },
  pickerClear: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular' },
  scriptureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  scriptureRef: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  scriptureText: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
});
