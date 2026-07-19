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
import { ArrowLeft, Lock, Mail } from 'lucide-react-native';
import { AppText, Button, GradientBackground, Input } from '../../components/ui';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { firebaseAuthMessage } from '../../lib/authErrors';
import type { AuthStackScreenProps } from '../../navigation/types';

export function SignInScreen({ navigation }: AuthStackScreenProps<'SignIn'>) {
  const { signIn, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError('');
    setInfo('');
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
      // Root navigator swaps to the Main stack automatically on auth change.
    } catch (e) {
      setError(firebaseAuthMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const onForgot = async () => {
    setError('');
    setInfo('');
    if (!email.trim()) {
      setError('Enter your email first, then tap "Forgot password".');
      return;
    }
    try {
      await resetPassword(email);
      setInfo('Password reset link sent. Check your inbox.');
    } catch (e) {
      setError(firebaseAuthMessage(e));
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
                Welcome back
              </AppText>
              <AppText variant="body" muted>
                Sign in to continue your journey.
              </AppText>
            </View>

            <View style={styles.form}>
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
                placeholder="Your password"
                secure
                value={password}
                onChangeText={setPassword}
                icon={<Lock size={20} color={colors.ink400} />}
              />

              <Pressable onPress={onForgot} style={styles.forgot} hitSlop={8}>
                <AppText variant="caption" color={colors.primary}>
                  Forgot password?
                </AppText>
              </Pressable>

              {error ? (
                <AppText variant="caption" color={colors.danger} style={styles.msg}>
                  {error}
                </AppText>
              ) : null}
              {info ? (
                <AppText variant="caption" color={colors.success} style={styles.msg}>
                  {info}
                </AppText>
              ) : null}

              <View style={{ height: spacing.lg }} />
              <Button label="Sign in" loading={loading} onPress={onSubmit} />
            </View>

            <View style={styles.footer}>
              <AppText variant="body" muted>
                New here?{' '}
              </AppText>
              <Pressable onPress={() => navigation.replace('SignUp')} hitSlop={8}>
                <AppText variant="bodyStrong" color={colors.primary}>
                  Create an account
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
  forgot: { alignSelf: 'flex-end', marginTop: spacing.md },
  msg: { marginTop: spacing.md },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
});
