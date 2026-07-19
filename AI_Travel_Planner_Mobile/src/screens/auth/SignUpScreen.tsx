import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Lock, Mail, User } from 'lucide-react-native';
import { AppText, Button, GradientBackground, Input } from '../../components/ui';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { firebaseAuthMessage } from '../../lib/authErrors';
import type { AuthStackScreenProps } from '../../navigation/types';

export function SignUpScreen({ navigation }: AuthStackScreenProps<'SignUp'>) {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError('');
    if (!name.trim()) return setError('Please tell us your name.');
    if (!email.trim()) return setError('Please enter your email.');
    if (password.length < 6) return setError('Password should be at least 6 characters.');

    setLoading(true);
    try {
      await signUp({ name, email, password });
      // Root navigator swaps to Main automatically.
    } catch (e) {
      setError(firebaseAuthMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground variant="sky">
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Pressable style={styles.back} onPress={() => navigation.goBack()} hitSlop={12}>
              <ArrowLeft size={22} color={colors.ink800} />
            </Pressable>

            <View style={styles.header}>
              <AppText variant="hero" style={styles.title}>
                Create account
              </AppText>
              <AppText variant="body" muted>
                Start planning unforgettable trips in minutes.
              </AppText>
            </View>

            <View style={styles.form}>
              <Input
                label="Full name"
                placeholder="Your name"
                autoCapitalize="words"
                value={name}
                onChangeText={setName}
                icon={<User size={20} color={colors.ink400} />}
              />
              <View style={{ height: spacing.lg }} />
              <Input
                label="Email"
                placeholder="you@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                icon={<Mail size={20} color={colors.ink400} />}
              />
              <View style={{ height: spacing.lg }} />
              <Input
                label="Password"
                placeholder="At least 6 characters"
                secure
                value={password}
                onChangeText={setPassword}
                icon={<Lock size={20} color={colors.ink400} />}
              />

              {error ? (
                <AppText variant="caption" color={colors.danger} style={styles.msg}>
                  {error}
                </AppText>
              ) : null}

              <View style={{ height: spacing.xl }} />
              <Button label="Create account" loading={loading} onPress={onSubmit} />

              <AppText variant="caption" muted center style={styles.terms}>
                By continuing you agree to our Terms & Privacy Policy.
              </AppText>
            </View>

            <View style={styles.footer}>
              <AppText variant="body" muted>
                Already have an account?{' '}
              </AppText>
              <Pressable onPress={() => navigation.replace('SignIn')} hitSlop={8}>
                <AppText variant="bodyStrong" color={colors.primary}>
                  Sign in
                </AppText>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, flexGrow: 1 },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  header: { marginTop: spacing.xxl, marginBottom: spacing.xxl },
  title: { marginBottom: spacing.xs },
  form: { width: '100%' },
  msg: { marginTop: spacing.md },
  terms: { marginTop: spacing.lg, paddingHorizontal: spacing.lg },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
});
