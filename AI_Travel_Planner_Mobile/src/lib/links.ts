import { Linking } from 'react-native';

/** Open the device mail composer to the given address. */
export function openEmail(address: string, subject?: string) {
  const url = `mailto:${address}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;
  Linking.openURL(url).catch(() => {});
}

/** Open an external URL in the browser. */
export function openUrl(url: string) {
  Linking.openURL(url).catch(() => {});
}
