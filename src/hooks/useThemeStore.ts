import { useEffect, useState } from "react";
import { applyTheme, getThemeState, type ThemeId } from "@/lib/themes";

/** Reactive theme state. Applies on mount + when changed. */
export function useThemeStore() {
  const [active, setActive] = useState<ThemeId>(() => getThemeState().active);

  useEffect(() => { applyTheme(active); }, [active]);

  useEffect(() => {
    const onChange = () => setActive(getThemeState().active);
    window.addEventListener("lifeforge:theme-change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("lifeforge:theme-change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  return active;
}
