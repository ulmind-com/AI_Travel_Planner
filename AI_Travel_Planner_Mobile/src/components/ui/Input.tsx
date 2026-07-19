import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { radius } from '../../theme';
import { AppText } from './AppText';

interface Props extends TextInputProps {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
  secure?: boolean;
}

/** Soft, rounded input with icon + focus ring, matching the reference pills. */
export function Input({ label, icon, error, secure, style, onFocus, onBlur, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secure);

  const handleFocus = (e: any) => {
    setFocused(true);
    onFocus?.(e);
  };
  const handleBlur = (e: any) => {
    setFocused(false);
    onBlur?.(e);
  };

  return (
    <View style={styles.wrap}>
      {label ? (
        <AppText variant="label" color={colors.ink600} style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <View
        style={[
          styles.field,
          focused && styles.fieldFocused,
          !!error && styles.fieldError,
        ]}>
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <TextInput
          placeholderTextColor={colors.ink400}
          selectionColor={colors.primary}
          style={[styles.input, style]}
          secureTextEntry={hidden}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />
        {secure ? (
          <Pressable hitSlop={10} onPress={() => setHidden(h => !h)} style={styles.eye}>
            {hidden ? (
              <EyeOff size={20} color={colors.ink400} />
            ) : (
              <Eye size={20} color={colors.ink500} />
            )}
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText variant="caption" color={colors.danger} style={styles.errorText}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  label: { marginBottom: 8, marginLeft: 4, textTransform: 'uppercase' },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  fieldFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  fieldError: { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
  icon: { marginRight: 10 },
  input: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink900,
    paddingVertical: 12,
  },
  eye: { paddingLeft: 8 },
  errorText: { marginTop: 6, marginLeft: 4 },
});
