import React, { useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Search, Shield, UserPlus, Users } from 'lucide-react-native';
import { AppText } from '../../components/ui';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { radius, spacing } from '../../theme';
import { searchUsers, toggleFollow, SocialUser } from '../../services/socialService';
import type { MainStackScreenProps } from '../../navigation/types';

export function PeopleScreen({ navigation }: MainStackScreenProps<'People'>) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SocialUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [followed, setFollowed] = useState<Record<string, boolean>>({});

  const run = async (text: string) => {
    setQ(text);
    if (text.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      setResults(await searchUsers(text.trim()));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const follow = async (u: SocialUser) => {
    const id = u.firebaseUid || u._id || '';
    setFollowed(p => ({ ...p, [id]: true }));
    try {
      await toggleFollow(id);
    } catch {}
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.circle} onPress={() => navigation.goBack()} hitSlop={10}>
          <ArrowLeft size={22} color={colors.ink800} />
        </Pressable>
        <View style={styles.searchBar}>
          <Search size={20} color={colors.ink400} />
          <TextInput
            style={styles.input}
            placeholder="Search travelers…"
            placeholderTextColor={colors.ink400}
            value={q}
            onChangeText={run}
            autoFocus
            autoCapitalize="none"
            selectionColor={colors.brand}
          />
        </View>
        <Pressable style={styles.circle} onPress={() => navigation.navigate('Friends')} hitSlop={10}>
          <Users size={20} color={colors.brand} />
        </Pressable>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item, i) => item.firebaseUid || item._id || String(i)}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const id = item.firebaseUid || item._id || '';
          const name = item.username || item.fullname || 'Traveler';
          const isFollowed = followed[id];
          return (
            <View style={styles.row}>
              <View style={styles.avatar}>
                {item.profilepicture || item.profileImage ? (
                  <Image source={{ uri: item.profilepicture || item.profileImage }} style={styles.avatarImg} />
                ) : (
                  <AppText variant="bodyStrong" color={colors.white}>
                    {name.charAt(0).toUpperCase()}
                  </AppText>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong">{name}</AppText>
                <View style={styles.metaRow}>
                  {typeof item.trustScore === 'number' ? (
                    <View style={styles.trust}>
                      <Shield size={12} color={colors.success} />
                      <AppText variant="label" color={colors.success}>
                        {Math.round(item.trustScore)}
                      </AppText>
                    </View>
                  ) : null}
                  {item.bio ? (
                    <AppText variant="label" muted numberOfLines={1} style={{ flex: 1 }}>
                      {item.bio}
                    </AppText>
                  ) : null}
                </View>
              </View>
              <Pressable
                style={[styles.followBtn, isFollowed && styles.followedBtn]}
                onPress={() => !isFollowed && follow(item)}>
                {isFollowed ? (
                  <AppText variant="label" color={colors.brand}>
                    Following
                  </AppText>
                ) : (
                  <>
                    <UserPlus size={14} color={colors.white} />
                    <AppText variant="label" color={colors.white}>
                      Follow
                    </AppText>
                  </>
                )}
              </Pressable>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <AppText variant="body" muted center>
              {loading
                ? 'Searching…'
                : q.trim().length >= 2
                ? 'No travelers found'
                : 'Find fellow travelers by name'}
            </AppText>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 46,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
  },
  input: { flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.ink900 },
  list: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: spacing.md },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  trust: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
  },
  followedBtn: { backgroundColor: colors.brandSoft },
  empty: { paddingTop: spacing.huge, alignItems: 'center' },
});
