import { Asset } from 'react-native-image-picker';

export interface FilePart {
  uri: string;
  name: string;
  type: string;
}

/** Convert an image-picker asset into an RN FormData file part. */
export function assetToPart(asset: Asset): FilePart {
  return {
    uri: asset.uri as string,
    name: asset.fileName || `upload_${Date.now()}.jpg`,
    type: asset.type || 'image/jpeg',
  };
}

/** Append a value to FormData only when defined/non-empty. */
export function appendIf(form: FormData, key: string, value: unknown) {
  if (value === undefined || value === null || value === '') return;
  form.append(key, String(value));
}
