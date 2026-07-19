import api from '../lib/api';

export interface Station {
  code: string;
  name: string;
  [key: string]: any;
}

export interface Train {
  trainNumber: string;
  trainName: string;
  fromStationCode?: string;
  toStationCode?: string;
  from?: string;
  to?: string;
  departureTime?: string;
  arrivalTime?: string;
  duration?: string;
  classes?: string[];
  [key: string]: any;
}

export interface TrainBooking {
  _id: string;
  trainNumber?: string;
  trainName?: string;
  fromStation?: string;
  toStation?: string;
  journeyDate?: string;
  seatClass?: string;
  status?: string;
  fareAmount?: number;
  pnr?: string;
  [key: string]: any;
}

export async function searchStations(q: string): Promise<Station[]> {
  const { data } = await api.get('/trains/stations/search', { params: { q } });
  return (data?.data ?? []) as Station[];
}

/** date must be DD-MM-YYYY */
export async function searchTrains(from: string, to: string, date: string): Promise<Train[]> {
  const { data } = await api.get('/trains/search', { params: { from, to, date }, timeout: 45000 });
  return (data?.data ?? data ?? []) as Train[];
}

export async function getMyTrainBookings(): Promise<TrainBooking[]> {
  const { data } = await api.get('/trains/bookings/mine');
  return (data?.data ?? data ?? []) as TrainBooking[];
}

export async function bookTrain(payload: Record<string, any>): Promise<any> {
  const { data } = await api.post('/trains/book', payload);
  return data;
}

export async function cancelTrainBooking(id: string): Promise<void> {
  await api.delete(`/trains/bookings/${id}/cancel`);
}
