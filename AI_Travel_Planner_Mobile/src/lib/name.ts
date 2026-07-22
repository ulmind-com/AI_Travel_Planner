/** Helpers for deriving a clean, human display name from profile/auth data. */

function clean(value?: string | null): string {
  return (value ?? '').trim();
}

function titleCase(word: string): string {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Best available full name, in priority order:
 * real name -> display name -> username -> email local part.
 */
export function getDisplayName(
  profile?: { fullname?: string; username?: string; email?: string } | null,
  authUser?: { displayName?: string | null; email?: string | null } | null,
): string {
  const candidates = [
    clean(profile?.fullname),
    clean(authUser?.displayName),
    clean(profile?.username),
    clean(profile?.email).split('@')[0],
    clean(authUser?.email).split('@')[0],
  ];
  return candidates.find(Boolean) || 'Traveler';
}

/**
 * Just the first name — trimmed, separators stripped, title-cased.
 * "soumyajit banerjee" -> "Soumyajit" | "john.doe@x.com" -> "John"
 */
export function getFirstName(
  profile?: { fullname?: string; username?: string; email?: string } | null,
  authUser?: { displayName?: string | null; email?: string | null } | null,
): string {
  const full = getDisplayName(profile, authUser);
  const first = full.split(/[\s._\-+]+/).filter(Boolean)[0] ?? full;
  return titleCase(first) || 'Traveler';
}

/** Single uppercase letter for avatar placeholders. */
export function getInitial(
  profile?: { fullname?: string; username?: string; email?: string } | null,
  authUser?: { displayName?: string | null; email?: string | null } | null,
): string {
  return getFirstName(profile, authUser).charAt(0).toUpperCase();
}
