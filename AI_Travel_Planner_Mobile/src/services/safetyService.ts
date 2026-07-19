import api from '../lib/api';

export interface SafetyAlert {
  _id: string;
  location?: string;
  coordinates?: { lat: number; lng: number };
  type?: string;
  severity?: string;
  message?: string;
  createdAt?: string;
}

export interface EmergencyContact {
  _id: string;
  contactId?: string;
  name: string;
  phone: string;
  relation: string;
}

export async function getAlerts(): Promise<SafetyAlert[]> {
  const { data } = await api.get('/safety/alerts');
  return (data?.data ?? data ?? []) as SafetyAlert[];
}

export async function reportAlert(input: {
  location: string;
  type: string;
  severity: string;
  message: string;
  coordinates?: { lat: number; lng: number };
}): Promise<any> {
  const { data } = await api.post('/safety/alerts/report', input);
  return data;
}

export async function getContacts(): Promise<EmergencyContact[]> {
  const { data } = await api.get('/safety/contacts');
  return (data?.data ?? data ?? []) as EmergencyContact[];
}

export async function addContact(input: {
  name: string;
  phone: string;
  relation: string;
}): Promise<any> {
  const { data } = await api.post('/safety/contacts', input);
  return data;
}

export async function deleteContact(contactId: string): Promise<void> {
  await api.delete(`/safety/contacts/${contactId}`);
}

export async function shareLocation(lat: number, lng: number, isActiveSharing = true): Promise<any> {
  const { data } = await api.post('/safety/share-location', { lat, lng, isActiveSharing });
  return data;
}

export async function triggerSOS(payload?: {
  lat?: number;
  lng?: number;
  message?: string;
}): Promise<any> {
  const { data } = await api.post('/safety/sos', payload ?? {});
  return data;
}
