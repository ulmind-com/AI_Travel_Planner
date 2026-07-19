import React, { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Gradient as LinearGradient } from './Gradient';
import { colors } from '../../theme/colors';
import { radius, shadow } from '../../theme';
import { AppText } from './AppText';

type Variant = 'primary' | 'ink' | 'glass' | 'ghost' | 'outline';
type Size = 'lg' | 'md' | 'sm';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

const heights: Record<Size, number> = { lg: 56, md: 48, sm: 40 };

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  loading,
  disabled,
  fullWidth = true,
  icon,
  style,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const isDisabled = disabled || loading;

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();

  const textColor =
    variant === 'ghost' || variant === 'outline'
      ? colors.primary
      : variant === 'glass'
      ? colors.ink900
      : colors.white;

  const content = (
    <>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.inner}>
          {icon}
          <AppText variant="button" color={textColor}>
            {label}
          </AppText>
        </View>
      )}
    </>
  );

  const base: ViewStyle = {
    height: heights[size],
    borderRadius: radius.pill,
    opacity: isDisabled ? 0.55 : 1,
    width: fullWidth ? '100%' : undefined,
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, fullWidth && styles.full, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={isDisabled}
        style={styles.press}>
        {variant === 'primary' ? (
          <LinearGradient
            colors={[...colors.brandGradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.center, base, shadow.md]}>
            {content}
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.center,
              base,
              variant === 'ink' && { backgroundColor: colors.ink900, ...shadow.md },
              variant === 'glass' && styles.glass,
              variant === 'outline' && styles.outline,
              variant === 'ghost' && styles.ghost,
            ]}>
            {content}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  full: { width: '100%' },
  press: { width: '100%' },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  glass: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.7)',
    ...shadow.sm,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  ghost: { backgroundColor: colors.brandSoft },
});
