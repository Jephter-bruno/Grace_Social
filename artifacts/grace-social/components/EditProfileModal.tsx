import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';

const AVATAR_COLORS = ['#4A90A4', '#9B59B6', '#27AE60', '#E91E8C', '#D4A843', '#E74C3C', '#F39C12', '#16A085'];

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

function Field({ label, value, onChangeText, placeholder, multiline = false, keyboardType = 'default' }: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: any;
}) {
  const colors = useColors();
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        style={[
          styles.fieldInput,
          { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted },
          multiline && styles.fieldInputMulti,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        multiline={multiline}
        keyboardType={keyboardType}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

export function EditProfileModal({ visible, onClose }: EditProfileModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentUser, updateProfile } = useAuth();
  const isWeb = Platform.OS === 'web';

  const [displayName, setDisplayName] = useState(currentUser?.displayName || currentUser?.name || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [selectedColor, setSelectedColor] = useState(currentUser?.color || '#4A90A4');
  const [avatarUri, setAvatarUri] = useState<string | null>(currentUser?.avatarUrl || null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible && currentUser) {
      setDisplayName(currentUser.displayName || currentUser.name || '');
      setUsername(currentUser.username || '');
      setBio(currentUser.bio || '');
      setSelectedColor(currentUser.color || '#4A90A4');
      setAvatarUri(currentUser.avatarUrl || null);
      setError('');
    }
  }, [visible, currentUser]);

  const initials = displayName.trim().split(/\s+/).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('') || 'ME';

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) { setError('Display name is required.'); return; }
    if (!username.trim()) { setError('Username is required.'); return; }
    const cleanUsername = username.replace(/^@/, '').trim();
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
      setError('Username must be 3-30 characters and contain only letters, numbers, or underscores.');
      return;
    }
    setError('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSaving(true);
    const result = await updateProfile({
      displayName: displayName.trim(),
      username: cleanUsername,
      bio: bio.trim(),
      color: selectedColor,
      avatarUrl: avatarUri,
    });
    setIsSaving(false);
    if (!result.success) {
      setError(result.error || 'Save failed. Please try again.');
      return;
    }
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: isWeb ? 20 : insets.top + 4, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Text style={[styles.headerBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={isSaving || !displayName.trim()} style={styles.headerBtn}>
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.headerBtnText, { color: displayName.trim() ? colors.primary : colors.mutedForeground, fontFamily: 'Inter_700Bold' }]}>
                Done
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Avatar section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={pickImage} style={[styles.avatarRing, { borderColor: selectedColor }]}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={{ width: 82, height: 82, borderRadius: 41 }} contentFit="cover" />
              ) : (
                <AvatarCircle initials={initials} color={selectedColor} size={82} />
              )}
              <View style={styles.cameraBadge}>
                <Feather name="camera" size={13} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={[styles.changePhotoText, { color: colors.primary }]}>Change profile photo</Text>
            {/* Color picker */}
            <View style={styles.colorPicker}>
              {AVATAR_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setSelectedColor(c)}
                  style={[styles.colorDot, { backgroundColor: c }, selectedColor === c && styles.colorDotSelected]}
                />
              ))}
            </View>
          </View>

          {/* Error */}
          {!!error && (
            <View style={styles.errorWrap}>
              <Feather name="alert-circle" size={14} color="#E53935" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Fields */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Field label="Name" value={displayName} onChangeText={setDisplayName} placeholder="Your display name" />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Field
              label="Username"
              value={username}
              onChangeText={(t) => setUsername(t.replace(/^@/, '').replace(/[^a-zA-Z0-9_]/g, ''))}
              placeholder="username"
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Field label="Bio" value={bio} onChangeText={setBio} placeholder="Write a bio…" multiline />
          </View>

          <Text style={[styles.footerNote, { color: colors.mutedForeground }]}>
            Profile information is visible to other members of your community.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 0.5 },
  headerBtn: { minWidth: 60, padding: 4 },
  headerBtnText: { fontSize: 16, fontFamily: 'Inter_400Regular' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  scroll: { paddingBottom: 40, gap: 0 },
  avatarSection: { alignItems: 'center', paddingVertical: 24, gap: 10 },
  avatarRing: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: '#4A90A4', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  changePhotoText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  colorPicker: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 20 },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  colorDotSelected: { borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 4 },
  errorWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFEBEE', borderRadius: 8, padding: 10, marginHorizontal: 16, marginBottom: 8 },
  errorText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', color: '#E53935' },
  section: { borderTopWidth: 0.5, borderBottomWidth: 0.5, paddingHorizontal: 16 },
  fieldWrap: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, gap: 12 },
  fieldLabel: { width: 80, fontSize: 14, fontFamily: 'Inter_400Regular', paddingTop: 12 },
  fieldInput: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', borderWidth: 0, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  fieldInputMulti: { minHeight: 72 },
  divider: { height: 0.5, marginLeft: 92 },
  footerNote: { fontSize: 12, fontFamily: 'Inter_400Regular', paddingHorizontal: 16, paddingTop: 24, textAlign: 'center', lineHeight: 18 },
});
