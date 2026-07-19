import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import { Plus } from 'lucide-react-native';
import { AppText, Button, Card } from '../../components/ui';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme';

export function TripsScreen() {
  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <AppText variant="h1" style={styles.title}>
            My Trips
          </AppText>
          <AppText variant="body" muted style={styles.subtitle}>
            Your saved plans and upcoming journeys.
          </AppText>

          <Card style={styles.empty} rounded="xxl">
            <LottieView
              source={require('../../assets/lottie/travel-bag.json')}
              autoPlay
              loop
              style={styles.lottie}
            />
            <AppText variant="h3" center>
              No trips yet
            </AppText>
            <AppText variant="body" muted center style={styles.emptyText}>
              Plan your first adventure with AI and it will show up here.
            </AppText>
            <Button
              label="Plan a trip"
              fullWidth={false}
              icon={<Plus size={18} color={colors.white} />}
              onPress={() => {}}
              style={styles.cta}
            />
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
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    backgroundColor: colors.white,
  },
  lottie: { width: 160, height: 160 },
  emptyText: { marginTop: spacing.sm, paddingHorizontal: spacing.xl, marginBottom: spacing.xl },
  cta: { paddingHorizontal: spacing.xxl, borderRadius: radius.pill },
});
