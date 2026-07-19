import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, X } from 'lucide-react-native';
import { AppText, Button, Input } from '../../components/ui';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { radius, spacing } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { updateProfile } from '../../services/profileService';
import { pickImages, PickedImage } from '../../lib/imagePicker';
import { apiErrorMessage } from '../../lib/api';
import type { MainStackScreenProps } from '../../navigation/types';

export function EditProfileScreen({ navigation }: MainStackScreenProps<'EditProfile'>) {
  const { profile, firebaseUser, refreshProfile } = useAuth();
  const [fullname, setFullname] = useState(profile?.fullname || firebaseUser?.displayName || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [phone, setPhone] = useState((profile as any)?.phonenumber || '');
  const [country, setCountry] = useState((profile as any)?.country || '');
  const [avatar, setAvatar] = useState<PickedImage | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const existingAvatar = profile?.profileImage || (profile as any)?.profilepicture;

  const pickAvatar = async () => {
    const picked = await pickImages(1);
    if (picked.length) setAvatar(picked[0]);
  };

  const save = async () => {
    setError('');
    setSaving(true);
    try {
      await updateProfile({
        fullname: fullname.trim() || undefined,
        username: username.trim() || undefined,
        bio: bio.trim(),
        phonenumber: phone.trim() || undefined,
        country: country.trim() || undefined,
        image: avatar || undefined,
      });
      await refreshProfile();
      navigation.goBack();
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.circle} onPress={() => navigation.goBack()} hitSlop={10}>
          <X size={20} color={colors.ink700} />
        </Pressable>
        <AppText variant="h3">Edit profile</AppText>
        <View style={styles.circle} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Pressable style={styles.avatarWrap} onPress={pickAvatar}>
            <View style={styles.avatar}>
              {avatar?.uri || existingAvatar ? (
                <Image source={{ uri: avatar?.uri || existingAvatar }} style={styles.avatarImg} />
              ) : (
                <AppText variant="hero" color={colors.white}>
                  {(fullname || 'T').charAt(0).toUpperCase()}
                </AppText>
              )}
              <View style={styles.cameraBadge}>
                <Camera size={16} color={colors.white} />
              </View>
            </View>
            <AppText variant="caption" color={colors.brand} style={{ marginTop: spacing.sm }}>
              Change photo
            </AppText>
          </Pressable>

          <Input label="Full name" placeholder="Your name" value={fullname} onChangeText={setFullname} />
          <View style={{ height: spacing.lg }} />
          <Input label="Username" placeholder="username" autoCapitalize="none" value={username} onChangeText={setUsername} />

          <AppText variant="label" color={colors.ink600} style={styles.lbl}>
            BIO
          </AppText>
          <TextInput
            style={styles.textarea}
            placeholder="Tell travelers about yourself…"
            placeholderTextColor={colors.ink400}
            value={bio}
            onChangeText={setBio}
            multiline
            selectionColor={colors.brand}
          />

          <View style={{ height: spacing.lg }} />
          <Input label="Phone" placeholder="+1 555 000 0000" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
          <View style={{ height: spacing.lg }} />
          <Input label="Country" placeholder="Your country" value={country} onChangeText={setCountry} />

          {error ? (
            <AppText variant="caption" color={colors.danger} style={{ marginTop: spacing.md }}>
              {error}
            </AppText>
          ) : null}
          <View style={{ height: spacing.xl }} />
          <Button label="Save changes" loading={saving} onPress={save} />
          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
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
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  avatarWrap: { alignItems: 'center', marginBottom: spacing.xl },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: { width: '100%', height: '100%', borderRadius: 50 },
  cameraBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brandDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  lbl: { marginTop: spacing.lg, marginBottom: spacing.md, marginLeft: 4, letterSpacing: 1 },
  textarea: {
    minHeight: 100,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink900,
    textAlignVertical: 'top',
  },
});
