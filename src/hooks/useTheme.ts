import { useEffect, useState } from "react";

const THEME_KEY = "lifeforge_theme";
const EVENT = "lifeforge:mode-change";

function readInitial(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark") return true;
    if (saved === "light") return false;
  } catch { /* ignore */ }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

function applyMode(dark: boolean) {
  try {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  } catch { /* ignore */ }
}

/** Single source of truth for dark/light mode.
 *  Persists to localStorage and syncs across components in the same tab
 *  via a custom event (storage events only fire cross-tab). */
export function useTheme() {
  const [dark, setDarkState] = useState<boolean>(readInitial);

  // Apply on mount + whenever value changes.
  useEffect(() => { applyMode(dark); }, [dark]);

  // Sync with other mounted components & cross-tab changes.
  useEffect(() => {
    const onChange = () => {
      const saved = localStorage.getItem(THEME_KEY);
      setDarkState(saved === "dark");
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_KEY && e.newValue) setDarkState(e.newValue === "dark");
    };
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const setDark = (v: boolean) => {
    setDarkState(v);
    applyMode(v);
    try { window.dispatchEvent(new CustomEvent(EVENT)); } catch { /* ignore */ }
  };

  return { dark, setDark, toggle: () => setDark(!dark) };
}
