import * as ImagePicker from 'expo-image-picker';
import type { FilePart } from './upload';

export interface PickedImage extends FilePart {
  /** local preview uri (same as uri) */
  preview: string;
}

function guessType(uri: string, mime?: string): string {
  if (mime) return mime;
  const ext = uri.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'heic') return 'image/heic';
  return 'image/jpeg';
}

/**
 * Pick images from the library (Expo Go compatible).
 * Returns RN FormData-ready parts with a preview uri.
 */
export async function pickImages(selectionLimit = 5): Promise<PickedImage[]> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return [];

  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: selectionLimit > 1,
    selectionLimit,
    quality: 0.8,
  });
  if (res.canceled) return [];

  return res.assets.map((a, i) => {
    const type = guessType(a.uri, a.mimeType);
    const name = a.fileName || `upload_${Date.now()}_${i}.${type.split('/')[1] || 'jpg'}`;
    return { uri: a.uri, preview: a.uri, name, type };
  });
}
