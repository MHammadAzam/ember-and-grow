// Premium / admin gating — fully on-device.
// Replace ADMIN_EMAILS with the developer's email(s).
// Setting an admin email (via setAdminEmail or matching one in this list)
// auto-unlocks every premium feature without payments.

const PREMIUM_KEY = "lifeforge_premium";
const ADMIN_EMAIL_KEY = "lifeforge_admin_email";

/** Hard-coded developer emails. Add/remove freely — comparison is case-insensitive. */
export const ADMIN_EMAILS: string[] = [
  // "you@example.com",
];

export const FREE_HABIT_LIMIT = 5;

export interface PremiumState {
  isPremium: boolean;
  isAdmin: boolean;
  email?: string;
  since?: string;     // ISO when premium was activated
}

function readState(): PremiumState {
  try {
    const raw = localStorage.getItem(PREMIUM_KEY);
    const parsed = raw ? (JSON.parse(raw) as PremiumState) : { isPremium: false, isAdmin: false };
    // Recompute admin from email at read-time (so updating ADMIN_EMAILS takes effect).
    const email = parsed.email ?? localStorage.getItem(ADMIN_EMAIL_KEY) ?? undefined;
    const isAdmin = !!email && ADMIN_EMAILS.some(e => e.toLowerCase() === email.toLowerCase());
    return { ...parsed, email, isAdmin: parsed.isAdmin || isAdmin };
  } catch {
    return { isPremium: false, isAdmin: false };
  }
}

function writeState(s: PremiumState) {
  localStorage.setItem(PREMIUM_KEY, JSON.stringify(s));
  // Notify same-tab listeners (storage event only fires cross-tab).
  window.dispatchEvent(new CustomEvent("lifeforge:premium-change"));
}

export function getPremium(): PremiumState {
  return readState();
}

/** True if the user has access (premium OR admin). Use this for feature gates. */
export function hasPremium(): boolean {
  const s = readState();
  return s.isPremium || s.isAdmin;
}

export function setPremium(isPremium: boolean) {
  const cur = readState();
  writeState({ ...cur, isPremium, since: isPremium ? (cur.since ?? new Date().toISOString()) : undefined });
}

/** Set the admin email. If it matches ADMIN_EMAILS it grants admin (and premium) silently. */
export function setAdminEmail(email: string | undefined) {
  const cur = readState();
  const normalized = email?.trim() || undefined;
  const isAdmin = !!normalized && ADMIN_EMAILS.some(e => e.toLowerCase() === normalized.toLowerCase());
  if (normalized) localStorage.setItem(ADMIN_EMAIL_KEY, normalized);
  else localStorage.removeItem(ADMIN_EMAIL_KEY);
  writeState({
    ...cur,
    email: normalized,
    isAdmin,
    isPremium: cur.isPremium || isAdmin,
    since: cur.since ?? (isAdmin ? new Date().toISOString() : undefined),
  });
}

/** Hidden console helpers for the developer. */
if (typeof window !== "undefined") {
  // @ts-expect-error attach to window for dev use
  window.__lifeforge = {
    grantPremium: () => { setPremium(true); return getPremium(); },
    revokePremium: () => { setPremium(false); return getPremium(); },
    setAdminEmail: (e: string) => { setAdminEmail(e); return getPremium(); },
    state: () => getPremium(),
  };
}
