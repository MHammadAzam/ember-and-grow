import { useEffect, useState } from "react";

const THEME_KEY = "lifeforge_theme";

function readInitial(): boolean {
  if (typeof window === "undefined") return false;
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) return saved === "dark";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

/** Single source of truth for dark/light mode.
 *  Persists to localStorage and syncs across components via a `storage` event. */
export function useTheme() {
  const [dark, setDark] = useState<boolean>(readInitial);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  }, [dark]);

  // Keep multiple components (header toggle + Settings switch) in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_KEY && e.newValue) setDark(e.newValue === "dark");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return { dark, setDark, toggle: () => setDark((d) => !d) };
}
