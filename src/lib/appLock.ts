// App lock — simple PIN gate. Premium-only feature.
const PIN_KEY = "lifeforge_pin";
const UNLOCK_KEY = "lifeforge_unlocked_at";  // session-only via sessionStorage

export function hasPin(): boolean {
  return !!localStorage.getItem(PIN_KEY);
}

export function setPin(pin: string) {
  if (!/^\d{4,8}$/.test(pin)) throw new Error("PIN must be 4–8 digits");
  // Lightweight obfuscation — not real crypto. For local-only use.
  const obf = btoa(unescape(encodeURIComponent(pin + "::lifeforge")));
  localStorage.setItem(PIN_KEY, obf);
}

export function clearPin() {
  localStorage.removeItem(PIN_KEY);
  sessionStorage.removeItem(UNLOCK_KEY);
}

export function verifyPin(pin: string): boolean {
  const stored = localStorage.getItem(PIN_KEY);
  if (!stored) return true;
  const obf = btoa(unescape(encodeURIComponent(pin + "::lifeforge")));
  return obf === stored;
}

export function isUnlockedThisSession(): boolean {
  return sessionStorage.getItem(UNLOCK_KEY) === "1";
}

export function markUnlocked() {
  sessionStorage.setItem(UNLOCK_KEY, "1");
}
