import { Feather } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
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
import { useColors } from '@/hooks/useColors';

export interface NewCircleMember {
  id: string;
  displayName: string;
  initials: string;
  color: string;
}

const AVAILABLE_MEMBERS: NewCircleMember[] = [
  { id: 'invite-sarah', displayName: 'Sarah M.', initials: 'SM', color: '#E91E8C' },
  { id: 'invite-pastor-tim', displayName: 'Pastor Tim', initials: 'PT', color: '#D4A843' },
  { id: 'invite-james', displayName: 'James K.', initials: 'JK', color: '#2980B9' },
  { id: 'invite-grace', displayName: 'Grace B.', initials: 'GB', color: '#27AE60' },
  { id: 'invite-mark', displayName: 'Mark L.', initials: 'ML', color: '#8E44AD' },
  { id: 'invite-hope', displayName: 'Hope W.', initials: 'HW', color: '#E74C3C' },
  { id: 'invite-mary', displayName: 'Mary K.', initials: 'MK', color: '#F39C12' },
  { id: 'invite-anna', displayName: 'Anna P.', initials: 'AP', color: '#16A085' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string, members: NewCircleMember[]) => void;
}

export function CreatePrayerCircleModal({ visible, onClose, onCreate }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      setName('');
      setSearch('');
      setSelectedIds([]);
    }
  }, [visible]);

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return AVAILABLE_MEMBERS;
    return AVAILABLE_MEMBERS.filter((member) =>
      member.displayName.toLowerCase().includes(query)
    );
  }, [search]);

  const selectedMembers = AVAILABLE_MEMBERS.filter((member) =>
    selectedIds.includes(member.id)
  );
  const canCreate = name.trim().length > 0 && selectedMembers.length > 0;

  const toggleMember = (memberId: string) => {
    setSelectedIds((current) => {
      if (current.includes(memberId)) {
        return current.filter((id) => id !== memberId);
      }
      if (current.length >= 12) return current;
      return [...current, memberId];
    });
  };

  const handleCreate = () => {
    if (!canCreate) return;
    onCreate(name.trim(), selectedMembers);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>Create a Prayer Circle</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Choose a name and invite friends to pray together.
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 24 },
          ]}
        >
          <Text style={[styles.label, { color: colors.mutedForeground }]}>CIRCLE NAME</Text>
          <TextInput
            style={[
              styles.nameInput,
              { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground },
            ]}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Evening Intercessors"
            placeholderTextColor={colors.mutedForeground}
            maxLength={40}
            autoCapitalize="words"
          />

          <View style={styles.memberHeading}>
            <View>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>INVITE MEMBERS</Text>
              <Text style={[styles.memberCount, { color: colors.mutedForeground }]}>
                {selectedMembers.length} selected · up to 12 friends
              </Text>
            </View>
            <Text style={[styles.required, { color: selectedMembers.length ? '#27AE60' : CORAL }]}>
              {selectedMembers.length ? 'Ready' : 'Select at least 1'}
            </Text>
          </View>

          <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              value={search}
              onChangeText={setSearch}
              placeholder="Search friends..."
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} style={styles.clearButton}>
                <Feather name="x" size={15} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.memberList}>
            {filteredMembers.map((member) => {
              const selected = selectedIds.includes(member.id);
              return (
                <TouchableOpacity
                  key={member.id}
                  style={[
                    styles.memberRow,
                    { backgroundColor: colors.card, borderColor: selected ? CORAL : colors.border },
                  ]}
                  onPress={() => toggleMember(member.id)}
                  activeOpacity={0.75}
                >
                  <AvatarCircle initials={member.initials} color={member.color} size={42} />
                  <Text
                    style={[styles.memberName, { color: colors.foreground }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {member.displayName}
                  </Text>
                  <View
                    style={[
                      styles.checkCircle,
                      { backgroundColor: selected ? CORAL : 'transparent', borderColor: selected ? CORAL : colors.border },
                    ]}
                  >
                    {selected && <Feather name="check" size={15} color="#fff" />}
                  </View>
                </TouchableOpacity>
              );
            })}
            {filteredMembers.length === 0 && (
              <Text style={[styles.noResults, { color: colors.mutedForeground }]}>
                No friends found.
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: canCreate ? CORAL : colors.muted }]}
            onPress={handleCreate}
            disabled={!canCreate}
            activeOpacity={0.85}
          >
            <Feather name="users" size={18} color={canCreate ? '#fff' : colors.mutedForeground} />
            <Text style={[styles.createButtonText, { color: canCreate ? '#fff' : colors.mutedForeground }]}>
              Create Circle
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const CORAL = '#E07A54';

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderBottomWidth: 1,
  },
  handle: { width: 36, height: 4, borderRadius: 2, marginBottom: 14 },
  closeButton: { position: 'absolute', right: 18, bottom: 18, padding: 4 },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 5, textAlign: 'center' },
  content: { padding: 20, gap: 10 },
  label: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0.9 },
  nameInput: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    marginBottom: 12,
  },
  memberHeading: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  memberCount: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 3 },
  required: { fontSize: 11, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  searchWrap: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 2,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  clearButton: { padding: 4 },
  memberList: { gap: 8 },
  memberRow: {
    minHeight: 60,
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  memberName: { flex: 1, fontSize: 15, fontFamily: 'Inter_600SemiBold', minWidth: 0 },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResults: { textAlign: 'center', paddingVertical: 24, fontSize: 14, fontFamily: 'Inter_400Regular' },
  createButton: {
    minHeight: 50,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  createButtonText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
});