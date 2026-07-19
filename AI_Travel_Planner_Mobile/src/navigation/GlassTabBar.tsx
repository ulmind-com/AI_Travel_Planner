import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Compass, Home, MapPinned, User } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { shadow } from '../theme';
import { AppText } from '../components/ui/AppText';

const ICONS: Record<string, any> = {
  Home,
  Explore: Compass,
  Trips: MapPinned,
  Profile: User,
};

/** Floating frosted-glass tab bar. */
export function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={[styles.bar, shadow.floating]}>
        <View style={[StyleSheet.absoluteFill, styles.barFill]} />
        <View style={styles.row}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label =
              (options.tabBarLabel as string) ?? options.title ?? route.name;
            const focused = state.index === index;
            const Icon = ICONS[route.name] ?? Home;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <Pressable key={route.key} onPress={onPress} style={styles.item} hitSlop={6}>
                <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                  <Icon
                    size={22}
                    color={focused ? colors.white : colors.ink400}
                    strokeWidth={focused ? 2.4 : 2}
                  />
                </View>
                <AppText
                  variant="label"
                  color={focused ? colors.ink900 : colors.ink400}
                  style={styles.label}>
                  {label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  bar: {
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.7)',
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  barFill: { backgroundColor: 'rgba(255,255,255,0.96)' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  item: { alignItems: 'center', justifyContent: 'center', flex: 1, gap: 4 },
  iconWrap: {
    width: 44,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.ink900,
  },
  label: { fontSize: 11 },
});
