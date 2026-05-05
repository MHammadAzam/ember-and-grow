import { useEffect, useState } from "react";
import { applyTheme, getThemeState, type ThemeId } from "@/lib/themes";
import { logError } from "@/lib/errorLog";

/** Reactive theme state. Applies on mount + when changed. Crash-proof. */
export function useThemeStore() {
  const [active, setActive] = useState<ThemeId>(() => {
    try { return getThemeState().active; } catch { return "default"; }
  });

  useEffect(() => {
    try { applyTheme(active); } catch (err) {
      logError({
        source: "manual",
        context: "useThemeStore:apply",
        message: err instanceof Error ? err.message : "applyTheme threw",
      });
    }
  }, [active]);

  useEffect(() => {
    const onChange = () => {
      try { setActive(getThemeState().active); } catch { setActive("default"); }
    };
    window.addEventListener("lifeforge:theme-change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("lifeforge:theme-change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  return active;
}
