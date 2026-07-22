import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Compass, Home, MapPinned, User, Users } from 'lucide-react-native';
import { Gradient } from '../components/ui/Gradient';
import { colors } from '../theme/colors';
import { shadow } from '../theme';
import { AppText } from '../components/ui/AppText';

const ICONS: Record<string, React.ComponentType<any>> = {
  Home,
  Explore: Compass,
  Community: Users,
  Trips: MapPinned,
  Profile: User,
};

/** Floating frosted tab bar with an animated gradient pill on the active tab. */
export function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={[styles.bar, shadow.floating]}>
        <View style={[StyleSheet.absoluteFill, styles.barFill]} />
        <View style={styles.row}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label = (options.tabBarLabel as string) ?? options.title ?? route.name;
            const focused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            };

            return (
              <TabItem
                key={route.key}
                name={route.name}
                label={label}
                focused={focused}
                onPress={onPress}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

function TabItem({
  name,
  label,
  focused,
  onPress,
}: {
  name: string;
  label: string;
  focused: boolean;
  onPress: () => void;
}) {
  const anim = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const press = useRef(new Animated.Value(1)).current;
  const Icon = ICONS[name] ?? Home;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      speed: 16,
      bounciness: 10,
    }).start();
  }, [focused, anim]);

  const pillStyle = {
    opacity: anim,
    transform: [
      { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) },
    ],
  };
  const contentStyle = {
    transform: [
      { scale: press },
      { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -1] }) },
    ],
  };

  return (
    <Pressable
      style={styles.item}
      onPress={onPress}
      onPressIn={() =>
        Animated.spring(press, { toValue: 0.9, useNativeDriver: true, speed: 40 }).start()
      }
      onPressOut={() =>
        Animated.spring(press, { toValue: 1, useNativeDriver: true, speed: 40 }).start()
      }
      hitSlop={6}>
      <Animated.View style={contentStyle}>
        <View style={styles.iconWrap}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.pill, pillStyle]}>
            <Gradient
              colors={colors.brandGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          <Icon
            size={21}
            color={focused ? colors.white : colors.ink400}
            strokeWidth={focused ? 2.4 : 1.9}
          />
        </View>
      </Animated.View>
      <AppText
        variant="label"
        color={focused ? colors.ink900 : colors.ink400}
        style={[styles.label, focused && styles.labelActive]}
        numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    backgroundColor: 'transparent',
  },
  bar: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.75)',
    backgroundColor: 'rgba(255,255,255,0.96)',
  },
  barFill: { backgroundColor: 'rgba(255,255,255,0.97)' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 4,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  iconWrap: {
    width: 48,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: { borderRadius: 17, overflow: 'hidden' },
  label: { fontSize: 10.5, letterSpacing: 0.1 },
  labelActive: { letterSpacing: 0.1 },
});
