import React, { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, ArrowRightLeft, Clock, Search, Train as TrainIcon } from 'lucide-react-native';
import { AppText, Button, Card, SelectChip } from '../../components/ui';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { radius, shadow, spacing } from '../../theme';
import {
  bookTrain,
  cancelTrainBooking,
  getMyTrainBookings,
  searchTrains,
  Train,
} from '../../services/trainsService';
import { useAuth } from '../../context/AuthContext';
import { apiErrorMessage } from '../../lib/api';
import { queryClient } from '../../lib/queryClient';
import type { MainStackScreenProps } from '../../navigation/types';

const CLASSES = ['General', 'Sleeper', 'Third_AC', 'Second_AC'];

function todayDDMMYYYY() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}`;
}

export function TrainsScreen({ navigation }: MainStackScreenProps<'Trains'>) {
  const { profile, firebaseUser } = useAuth();
  const [tab, setTab] = useState<'search' | 'bookings'>('search');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState(todayDDMMYYYY());
  const [results, setResults] = useState<Train[]>([]);
  const [searching, setSearching] = useState(false);
  const [err, setErr] = useState('');
  const [seatClass, setSeatClass] = useState('Sleeper');

  const { data: bookings, refetch } = useQuery({
    queryKey: ['train-bookings'],
    queryFn: getMyTrainBookings,
    enabled: tab === 'bookings',
  });

  const run = async () => {
    setErr('');
    if (from.trim().length < 2 || to.trim().length < 2) {
      setErr('Enter valid station codes (e.g. NDLS, HWH).');
      return;
    }
    setSearching(true);
    try {
      setResults(await searchTrains(from.trim().toUpperCase(), to.trim().toUpperCase(), date));
    } catch (e) {
      setErr(apiErrorMessage(e));
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const book = (t: Train) => {
    Alert.alert('Confirm booking', `Book ${t.trainName} (${t.trainNumber}) in ${seatClass}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Book',
        onPress: async () => {
          try {
            await bookTrain({
              passengerName: profile?.fullname || profile?.username || firebaseUser?.displayName || 'Traveler',
              passengerAge: 25,
              passengerGender: 'Other',
              trainNumber: t.trainNumber,
              trainName: t.trainName,
              fromStation: t.from || from,
              fromStationCode: t.fromStationCode || from.toUpperCase(),
              toStation: t.to || to,
              toStationCode: t.toStationCode || to.toUpperCase(),
              journeyDate: new Date().toISOString(),
              departureTime: t.departureTime || '00:00',
              arrivalTime: t.arrivalTime || '00:00',
              seatClass,
              passengersCount: 1,
              fareAmount: Number(t.fare) || 500,
            });
            Alert.alert('Booked!', 'Your ticket is confirmed. See My bookings.');
            setTab('bookings');
            refetch();
          } catch (e) {
            Alert.alert('Booking failed', apiErrorMessage(e));
          }
        },
      },
    ]);
  };

  const cancel = (id: string) => {
    Alert.alert('Cancel booking?', '', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelTrainBooking(id);
            queryClient.invalidateQueries({ queryKey: ['train-bookings'] });
          } catch {}
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.circle} onPress={() => navigation.goBack()} hitSlop={10}>
          <ArrowLeft size={22} color={colors.ink800} />
        </Pressable>
        <AppText variant="h3">Trains</AppText>
        <View style={styles.circle} />
      </View>

      <View style={styles.tabs}>
        {(['search', 'bookings'] as const).map(t => (
          <Pressable key={t} style={styles.tab} onPress={() => setTab(t)}>
            <AppText variant="bodyStrong" color={tab === t ? colors.ink900 : colors.ink400}>
              {t === 'search' ? 'Search' : 'My bookings'}
            </AppText>
            {tab === t ? <View style={styles.tabLine} /> : null}
          </Pressable>
        ))}
      </View>

      {tab === 'search' ? (
        <FlatList
          data={results}
          keyExtractor={(item, i) => item.trainNumber || String(i)}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View>
              <Card style={styles.searchCard} rounded="xl">
                <View style={styles.stationRow}>
                  <TextInput
                    style={styles.stationInput}
                    placeholder="From (NDLS)"
                    placeholderTextColor={colors.ink400}
                    autoCapitalize="characters"
                    value={from}
                    onChangeText={setFrom}
                  />
                  <ArrowRightLeft size={18} color={colors.ink400} />
                  <TextInput
                    style={styles.stationInput}
                    placeholder="To (HWH)"
                    placeholderTextColor={colors.ink400}
                    autoCapitalize="characters"
                    value={to}
                    onChangeText={setTo}
                  />
                </View>
                <TextInput
                  style={styles.dateInput}
                  placeholder="DD-MM-YYYY"
                  placeholderTextColor={colors.ink400}
                  value={date}
                  onChangeText={setDate}
                />
                <View style={styles.classRow}>
                  {CLASSES.map(c => (
                    <SelectChip key={c} label={c.replace('_', ' ')} selected={seatClass === c} onPress={() => setSeatClass(c)} />
                  ))}
                </View>
                {err ? <AppText variant="caption" color={colors.danger}>{err}</AppText> : null}
                <Button
                  label={searching ? 'Searching…' : 'Search trains'}
                  loading={searching}
                  icon={<Search size={18} color={colors.white} />}
                  onPress={run}
                />
              </Card>
            </View>
          }
          renderItem={({ item }) => (
            <Card style={styles.trainCard} rounded="lg">
              <View style={styles.trainHead}>
                <TrainIcon size={18} color={colors.brand} />
                <AppText variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
                  {item.trainName}
                </AppText>
                <AppText variant="label" muted>
                  #{item.trainNumber}
                </AppText>
              </View>
              <View style={styles.trainTimes}>
                <AppText variant="body">{item.departureTime || '--'}</AppText>
                <View style={styles.timeMid}>
                  <Clock size={12} color={colors.ink400} />
                  <AppText variant="label" muted>
                    {item.duration || ''}
                  </AppText>
                </View>
                <AppText variant="body">{item.arrivalTime || '--'}</AppText>
              </View>
              <Button label="Book" size="sm" onPress={() => book(item)} />
            </Card>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <AppText variant="body" muted center>
                {searching ? 'Searching trains…' : 'Search trains between two stations.'}
              </AppText>
            </View>
          }
        />
      ) : (
        <FlatList
          data={bookings ?? []}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          onRefresh={refetch}
          refreshing={false}
          renderItem={({ item }) => (
            <Card style={styles.bookingCard} rounded="lg">
              <View style={styles.trainHead}>
                <TrainIcon size={18} color={colors.brand} />
                <AppText variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
                  {item.trainName || item.trainNumber}
                </AppText>
                {item.status ? (
                  <View style={styles.statusPill}>
                    <AppText variant="label" color={colors.brandDark}>
                      {item.status}
                    </AppText>
                  </View>
                ) : null}
              </View>
              <View style={styles.routeRow}>
                <AppText variant="caption" muted>
                  {item.fromStation}
                </AppText>
                <ArrowRight size={13} color={colors.ink400} />
                <AppText variant="caption" muted>
                  {item.toStation}
                </AppText>
                {item.seatClass ? (
                  <AppText variant="caption" muted>
                    · {item.seatClass}
                  </AppText>
                ) : null}
              </View>
              {item.pnr ? (
                <AppText variant="label" muted>
                  PNR {item.pnr}
                </AppText>
              ) : null}
              <Pressable onPress={() => cancel(item._id)} style={styles.cancelBtn}>
                <AppText variant="label" color={colors.danger}>
                  Cancel booking
                </AppText>
              </Pressable>
            </Card>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <AppText variant="body" muted center>
                No train bookings yet.
              </AppText>
            </View>
          }
        />
      )}
    </SafeAreaView>
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
  tabs: { flexDirection: 'row', gap: spacing.xl, paddingHorizontal: spacing.xl },
  tab: { paddingVertical: spacing.sm },
  tabLine: { height: 3, borderRadius: 2, backgroundColor: colors.brand, marginTop: 6 },
  list: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  searchCard: { backgroundColor: colors.white, gap: spacing.md, marginBottom: spacing.lg, ...shadow.sm },
  stationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stationInput: {
    flex: 1,
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.ink900,
  },
  dateInput: {
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink900,
  },
  classRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  trainCard: { backgroundColor: colors.white, gap: spacing.md, marginBottom: spacing.md, ...shadow.sm },
  trainHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trainTimes: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeMid: { alignItems: 'center', gap: 2 },
  bookingCard: { backgroundColor: colors.white, gap: 6, marginBottom: spacing.md, ...shadow.sm },
  statusPill: { backgroundColor: colors.brandSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  cancelBtn: { marginTop: spacing.sm },
  empty: { paddingTop: spacing.xxxl, alignItems: 'center' },
});
