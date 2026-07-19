import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { MapPin, Mountain, Palmtree, Search, Snowflake, Building2 } from 'lucide-react-native';
import { AppText, Card } from '../../components/ui';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme';

const CATEGORIES = [
  { key: 'beach', label: 'Beaches', icon: Palmtree, gradient: ['#5FB0EF', '#8FCBF6'] },
  { key: 'mountain', label: 'Mountains', icon: Mountain, gradient: ['#2FBF71', '#7CD9A6'] },
  { key: 'city', label: 'City breaks', icon: Building2, gradient: ['#7C6CF0', '#A99BF6'] },
  { key: 'snow', label: 'Snow & ski', icon: Snowflake, gradient: ['#3B9AE1', '#9AD0F5'] },
];

export function ExploreScreen() {
  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <AppText variant="h1" style={styles.title}>
            Explore
          </AppText>
          <AppText variant="body" muted style={styles.subtitle}>
            Find your next destination by vibe.
          </AppText>

          <View style={styles.searchBar}>
            <Search size={20} color={colors.ink400} />
            <AppText variant="body" color={colors.ink400}>
              Search anywhere…
            </AppText>
          </View>

          <View style={styles.grid}>
            {CATEGORIES.map(c => {
              const Icon = c.icon;
              return (
                <Card key={c.key} onPress={() => {}} padded={false} style={styles.tile} rounded="xl">
                  <LinearGradient colors={c.gradient} style={styles.tileGradient}>
                    <Icon size={26} color={colors.white} />
                    <AppText variant="h3" color={colors.white} style={{ marginTop: 10 }}>
                      {c.label}
                    </AppText>
                  </LinearGradient>
                </Card>
              );
            })}
          </View>

          <Card style={styles.hint} rounded="xl">
            <MapPin size={20} color={colors.brand} />
            <AppText variant="body" muted style={{ flex: 1 }}>
              Personalized picks appear here once the AI learns your travel taste.
            </AppText>
          </Card>
          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  title: { marginTop: spacing.sm },
  subtitle: { marginBottom: spacing.xl },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: spacing.xl,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tile: { width: '48%', height: 130, marginBottom: spacing.lg },
  tileGradient: { flex: 1, borderRadius: radius.xl, padding: spacing.lg, justifyContent: 'flex-end' },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.brandSoft,
    marginTop: spacing.sm,
  },
});
