import api from '../lib/api';
import { appendIf } from '../lib/upload';
import type { FilePart } from '../lib/upload';

export interface ProfileUpdate {
  fullname?: string;
  username?: string;
  bio?: string;
  phonenumber?: string;
  gender?: string;
  country?: string;
  isPrivate?: boolean;
  image?: FilePart; // profile picture
}

export async function updateProfile(input: ProfileUpdate): Promise<any> {
  const form = new FormData();
  appendIf(form, 'fullname', input.fullname);
  appendIf(form, 'username', input.username);
  appendIf(form, 'bio', input.bio);
  appendIf(form, 'phonenumber', input.phonenumber);
  appendIf(form, 'gender', input.gender);
  appendIf(form, 'country', input.country);
  if (input.isPrivate !== undefined) form.append('isPrivate', String(input.isPrivate));
  if (input.image) {
    form.append('imageType', 'profile');
    form.append('image', input.image as any);
  }
  const { data } = await api.patch('/users/profile', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data?.data ?? data;
}

export interface DashboardStats {
  posts?: any[];
  experiences?: any[];
  comments?: any[];
  likes?: any[];
  groups?: any[];
}

export async function getDashboard(firebaseUid: string): Promise<DashboardStats> {
  const [posts, experiences, groups] = await Promise.allSettled([
    api.get(`/users/${firebaseUid}/posts`),
    api.get(`/users/${firebaseUid}/experiences`),
    api.get(`/users/${firebaseUid}/groups`),
  ]);
  const val = (r: PromiseSettledResult<any>) =>
    r.status === 'fulfilled' ? r.value.data?.data ?? r.value.data ?? [] : [];
  return {
    posts: val(posts),
    experiences: val(experiences),
    groups: val(groups),
  };
}
