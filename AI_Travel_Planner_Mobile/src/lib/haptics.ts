import * as Haptics from 'expo-haptics';

/**
 * Thin, crash-safe wrappers around expo-haptics. Every call is fire-and-forget
 * and swallows errors so haptics never break an interaction on devices/emulators
 * without a vibrator.
 */

/** Light tap — default for buttons, chips, tab switches. */
export function tapLight() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Medium tap — for more significant actions (save, send, confirm). */
export function tapMedium() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

/** Success notification — for completed positive actions. */
export function notifySuccess() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

/** Warning/error notification. */
export function notifyError() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}

/** Selection tick — for pickers/steppers/segmented controls. */
export function selectionTick() {
  Haptics.selectionAsync().catch(() => {});
}
