import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Phone, Plus, ShieldAlert, Trash2, TriangleAlert, X } from 'lucide-react-native';
import { AppText, Button, Card } from '../../components/ui';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { radius, shadow, spacing } from '../../theme';
import {
  addContact,
  deleteContact,
  getAlerts,
  getContacts,
  triggerSOS,
} from '../../services/safetyService';
import { queryClient } from '../../lib/queryClient';
import type { MainStackScreenProps } from '../../navigation/types';

export function SafetyScreen({ navigation }: MainStackScreenProps<'Safety'>) {
  const { data: alerts } = useQuery({ queryKey: ['safety-alerts'], queryFn: getAlerts });
  const { data: contacts } = useQuery({ queryKey: ['safety-contacts'], queryFn: getContacts });

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('');
  const [sosBusy, setSosBusy] = useState(false);

  const sendSOS = () => {
    Alert.alert('Send SOS?', 'This alerts your emergency contacts with your details.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send SOS',
        style: 'destructive',
        onPress: async () => {
          setSosBusy(true);
          try {
            await triggerSOS();
            Alert.alert('SOS sent', 'Your emergency contacts have been notified.');
          } catch {
            Alert.alert('Could not send SOS', 'Please try again.');
          } finally {
            setSosBusy(false);
          }
        },
      },
    ]);
  };

  const saveContact = async () => {
    if (!name.trim() || !phone.trim() || !relation.trim()) return;
    try {
      await addContact({ name: name.trim(), phone: phone.trim(), relation: relation.trim() });
      setName('');
      setPhone('');
      setRelation('');
      setAdding(false);
      queryClient.invalidateQueries({ queryKey: ['safety-contacts'] });
    } catch {}
  };

  const removeContact = async (id: string) => {
    try {
      await deleteContact(id);
      queryClient.invalidateQueries({ queryKey: ['safety-contacts'] });
    } catch {}
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.circle} onPress={() => navigation.goBack()} hitSlop={10}>
          <ArrowLeft size={22} color={colors.ink800} />
        </Pressable>
        <AppText variant="h3">Safety center</AppText>
        <View style={styles.circle} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* SOS */}
        <Pressable style={styles.sos} onPress={sendSOS} disabled={sosBusy}>
          <ShieldAlert size={30} color={colors.white} />
          <AppText variant="h2" color={colors.white}>
            {sosBusy ? 'Sending…' : 'Emergency SOS'}
          </AppText>
          <AppText variant="caption" color="rgba(255,255,255,0.85)">
            Tap to alert your emergency contacts
          </AppText>
        </Pressable>

        {/* Contacts */}
        <View style={styles.sectionHead}>
          <AppText variant="h3">Emergency contacts</AppText>
          <Pressable onPress={() => setAdding(a => !a)} hitSlop={8}>
            {adding ? <X size={22} color={colors.ink600} /> : <Plus size={22} color={colors.brand} />}
          </Pressable>
        </View>

        {adding ? (
          <Card style={styles.addCard} rounded="xl">
            <TextInput style={styles.input} placeholder="Name" placeholderTextColor={colors.ink400} value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Phone" placeholderTextColor={colors.ink400} keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            <TextInput style={styles.input} placeholder="Relation (e.g. Family)" placeholderTextColor={colors.ink400} value={relation} onChangeText={setRelation} />
            <Button label="Add contact" size="md" onPress={saveContact} />
          </Card>
        ) : null}

        {(contacts ?? []).map(c => (
          <Card key={c._id || c.contactId} style={styles.contact} rounded="lg">
            <View style={styles.contactIcon}>
              <Phone size={18} color={colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong">{c.name}</AppText>
              <AppText variant="caption" muted>
                {c.relation} · {c.phone}
              </AppText>
            </View>
            <Pressable onPress={() => removeContact(c.contactId || c._id)} hitSlop={8}>
              <Trash2 size={18} color={colors.danger} />
            </Pressable>
          </Card>
        ))}
        {(contacts ?? []).length === 0 && !adding ? (
          <AppText variant="body" muted style={{ marginBottom: spacing.lg }}>
            Add trusted contacts to notify in an emergency.
          </AppText>
        ) : null}

        {/* Alerts */}
        <View style={styles.sectionHead}>
          <AppText variant="h3">Local safety alerts</AppText>
        </View>
        {(alerts ?? []).length === 0 ? (
          <AppText variant="body" muted>
            No active alerts in your area.
          </AppText>
        ) : (
          (alerts ?? []).map(a => (
            <Card key={a._id} style={styles.alert} rounded="lg">
              <TriangleAlert size={20} color={a.severity === 'high' ? colors.danger : colors.gold} />
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong">{a.type || 'Alert'}</AppText>
                <AppText variant="caption" muted>
                  {a.message}
                  {a.location ? ` · ${a.location}` : ''}
                </AppText>
              </View>
            </Card>
          ))
        )}
        <View style={{ height: spacing.xxl }} />
      </ScrollView>
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
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  sos: {
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.danger,
    borderRadius: radius.xxl,
    paddingVertical: spacing.xxxl,
    marginBottom: spacing.xl,
    ...shadow.md,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  addCard: { backgroundColor: colors.white, gap: spacing.md, marginBottom: spacing.md, ...shadow.sm },
  input: {
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink900,
  },
  contact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
});
