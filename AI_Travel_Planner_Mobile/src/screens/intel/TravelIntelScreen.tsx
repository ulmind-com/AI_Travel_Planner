import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  CloudRain,
  Droplets,
  Lightbulb,
  Search,
  ShieldAlert,
  Sun,
  Thermometer,
  Users,
  Wind,
} from 'lucide-react-native';
import { AppText, Card } from '../../components/ui';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { radius, shadow, spacing } from '../../theme';
import { getTravelIntel } from '../../services/miscService';
import type { MainStackScreenProps } from '../../navigation/types';

function riskColor(level?: string) {
  const l = (level || '').toLowerCase();
  if (l.includes('high')) return colors.danger;
  if (l.includes('medium') || l.includes('moderate')) return colors.gold;
  return colors.success;
}

export function TravelIntelScreen({ navigation, route }: MainStackScreenProps<'TravelIntel'>) {
  const [input, setInput] = useState(route.params?.destination || '');
  const [location, setLocation] = useState(route.params?.destination || '');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['intel', location],
    queryFn: () => getTravelIntel(location),
    enabled: location.trim().length > 1,
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.circle} onPress={() => navigation.goBack()} hitSlop={10}>
          <ArrowLeft size={22} color={colors.ink800} />
        </Pressable>
        <AppText variant="h3">Travel intel</AppText>
        <View style={styles.circle} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.searchBar}>
          <Search size={20} color={colors.ink400} />
          <TextInput
            style={styles.input}
            placeholder="Enter a destination…"
            placeholderTextColor={colors.ink400}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => setLocation(input)}
            returnKeyType="search"
          />
          <Pressable onPress={() => setLocation(input)} hitSlop={8}>
            <AppText variant="bodyStrong" color={colors.brand}>
              Go
            </AppText>
          </Pressable>
        </View>

        {location.trim().length <= 1 ? (
          <View style={styles.empty}>
            <AppText variant="body" muted center>
              Get live weather, crowd levels, and safety intel for any destination.
            </AppText>
          </View>
        ) : isLoading ? (
          <View style={styles.empty}>
            <AppText variant="body" muted>
              Gathering live intel for {location}…
            </AppText>
          </View>
        ) : isError || !data ? (
          <View style={styles.empty}>
            <AppText variant="body" muted center>
              Couldn't fetch intel for {location}. Try another spelling.
            </AppText>
          </View>
        ) : (
          <>
            {data.weather ? (
              <Card style={styles.weatherCard} rounded="xxl">
                <AppText variant="label" color="rgba(255,255,255,0.85)">
                  {location.toUpperCase()}
                </AppText>
                <AppText variant="hero" color={colors.white}>
                  {Math.round(Number(data.weather.temp ?? 0))}°
                </AppText>
                {data.weather.description ? (
                  <AppText variant="body" color="rgba(255,255,255,0.9)">
                    {data.weather.description}
                  </AppText>
                ) : null}
                <View style={styles.weatherRow}>
                  <WeatherStat icon={<CloudRain size={16} color={colors.white} />} value={`${data.weather.rain ?? 0}mm`} />
                  <WeatherStat icon={<Wind size={16} color={colors.white} />} value={`${data.weather.wind ?? 0}km/h`} />
                  <WeatherStat icon={<Droplets size={16} color={colors.white} />} value={`${data.weather.humidity ?? 0}%`} />
                  <WeatherStat icon={<Sun size={16} color={colors.white} />} value={`UV ${data.weather.uv ?? 0}`} />
                </View>
              </Card>
            ) : null}

            <View style={styles.pillRow}>
              <InfoPill icon={<Users size={18} color={colors.purple} />} label="Crowd" value={data.crowdLevel || '—'} tint={colors.purpleSoft} />
              <InfoPill
                icon={<ShieldAlert size={18} color={riskColor(data.riskLevel)} />}
                label="Risk"
                value={data.riskLevel || '—'}
                tint={riskColor(data.riskLevel) + '1A'}
              />
            </View>

            {data.bestTimeToday ? (
              <Card style={styles.bestTime} rounded="xl">
                <Thermometer size={20} color={colors.brand} />
                <View style={{ flex: 1 }}>
                  <AppText variant="label" muted>
                    BEST TIME TODAY
                  </AppText>
                  <AppText variant="bodyStrong">{data.bestTimeToday}</AppText>
                </View>
              </Card>
            ) : null}

            {data.recommendations && data.recommendations.length > 0 ? (
              <View style={styles.section}>
                <AppText variant="h3" style={{ marginBottom: spacing.md }}>
                  Recommendations
                </AppText>
                {data.recommendations.map((r, i) => (
                  <View key={i} style={styles.tipRow}>
                    <Lightbulb size={16} color={colors.gold} />
                    <AppText variant="body" color={colors.ink700} style={{ flex: 1 }}>
                      {r}
                    </AppText>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        )}
        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function WeatherStat({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <View style={styles.wStat}>
      {icon}
      <AppText variant="label" color={colors.white}>
        {value}
      </AppText>
    </View>
  );
}

function InfoPill({ icon, label, value, tint }: { icon: React.ReactNode; label: string; value: string; tint: string }) {
  return (
    <View style={[styles.infoPill, { backgroundColor: tint }]}>
      {icon}
      <View>
        <AppText variant="label" muted>
          {label}
        </AppText>
        <AppText variant="bodyStrong" style={{ textTransform: 'capitalize' }}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    marginBottom: spacing.xl,
  },
  input: { flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.ink900 },
  empty: { paddingTop: spacing.huge, alignItems: 'center', paddingHorizontal: spacing.lg },
  weatherCard: {
    backgroundColor: colors.brand,
    gap: 4,
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg,
    ...shadow.md,
  },
  weatherRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  wStat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  pillRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  infoPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: spacing.lg,
    borderRadius: radius.xl,
  },
  bestTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    marginBottom: spacing.lg,
    ...shadow.sm,
  },
  section: { marginTop: spacing.sm },
  tipRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: spacing.md },
});
