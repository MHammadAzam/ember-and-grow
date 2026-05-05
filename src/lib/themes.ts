// Themes Store — unlockable cosmetic themes layered on top of light/dark.
// Themes are applied as a `data-theme` attribute on <html> and pure CSS overrides.
// Coins live in `lifeforge_daily_reward.coins`; premium also unlocks all themes.
import { getRewardState } from "./dailyReward";
import { hasPremium } from "./premium";
import { logError } from "./errorLog";

export type ThemeId = "default" | "dark-pro" | "neon-focus" | "minimal-zen";

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  tagline: string;
  cost: number;          // coins
  premiumOnly?: boolean;
  preview: { from: string; to: string }; // CSS gradient stops for tile
}

export const THEMES: ThemeMeta[] = [
  { id: "default",     name: "Forest (Default)", tagline: "Mossy emerald & dawn mist",     cost: 0,
    preview: { from: "hsl(158 64% 32%)", to: "hsl(130 55% 42%)" } },
  { id: "dark-pro",    name: "Dark Pro",          tagline: "Carbon obsidian, gold runes",   cost: 80,
    preview: { from: "hsl(220 25% 8%)",  to: "hsl(42 78% 50%)" } },
  { id: "neon-focus",  name: "Neon Focus",        tagline: "Magenta-cyan cyber sanctum",    cost: 120, premiumOnly: false,
    preview: { from: "hsl(295 90% 55%)", to: "hsl(190 95% 55%)" } },
  { id: "minimal-zen", name: "Minimal Zen",       tagline: "Paper white & ink calm",        cost: 60,
    preview: { from: "hsl(40 30% 96%)",  to: "hsl(220 15% 25%)" } },
];

const VALID_IDS = new Set<ThemeId>(THEMES.map((t) => t.id));
const STORE_KEY = "lifeforge_themes";
const FALLBACK: ThemeState = { active: "default", unlocked: ["default"] };

interface ThemeState {
  active: ThemeId;
  unlocked: ThemeId[];
}

/** Coerce arbitrary input into a valid ThemeState. Never throws. */
function sanitize(input: unknown): ThemeState {
  if (!input || typeof input !== "object") return { ...FALLBACK };
  const obj = input as Partial<ThemeState>;
  const active: ThemeId = VALID_IDS.has(obj.active as ThemeId) ? (obj.active as ThemeId) : "default";
  const unlockedRaw = Array.isArray(obj.unlocked) ? obj.unlocked : [];
  const unlocked = unlockedRaw.filter((id): id is ThemeId => VALID_IDS.has(id as ThemeId));
  if (!unlocked.includes("default")) unlocked.unshift("default");
  return { active, unlocked };
}

export function getThemeState(): ThemeState {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { ...FALLBACK };
    return sanitize(JSON.parse(raw));
  } catch (err) {
    logError({
      source: "manual",
      context: "themes:getThemeState",
      message: err instanceof Error ? err.message : "Failed to read theme state",
      stack: err instanceof Error ? err.stack : undefined,
    });
    return { ...FALLBACK };
  }
}

function save(s: ThemeState) {
  const safe = sanitize(s);
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(safe));
  } catch (err) {
    logError({
      source: "manual",
      context: "themes:save",
      message: err instanceof Error ? err.message : "Failed to persist theme",
    });
  }
  try {
    window.dispatchEvent(new CustomEvent("lifeforge:theme-change"));
  } catch { /* ignore */ }
}

export function isUnlocked(id: ThemeId): boolean {
  if (!VALID_IDS.has(id)) return false;
  if (id === "default") return true;
  try { if (hasPremium()) return true; } catch { /* ignore */ }
  return getThemeState().unlocked.includes(id);
}

export function unlockTheme(id: ThemeId): { ok: boolean; reason?: string } {
  const meta = THEMES.find((t) => t.id === id);
  if (!meta) return { ok: false, reason: "Unknown theme" };
  if (isUnlocked(id)) return { ok: true };
  if (hasPremium()) return { ok: true };
  const reward = getRewardState();
  if (reward.coins < meta.cost) {
    return { ok: false, reason: `Need ${meta.cost} coins. You have ${reward.coins}.` };
  }
  try {
    localStorage.setItem(
      "lifeforge_daily_reward",
      JSON.stringify({ ...reward, coins: reward.coins - meta.cost }),
    );
  } catch (err) {
    logError({
      source: "manual",
      context: "themes:unlock-coins",
      message: err instanceof Error ? err.message : "Failed to debit coins",
    });
    return { ok: false, reason: "Could not save unlock — try again" };
  }
  const s = getThemeState();
  save({ ...s, unlocked: [...new Set([...s.unlocked, id])] });
  return { ok: true };
}

export function setActiveTheme(id: ThemeId): { ok: boolean; reason?: string } {
  if (!VALID_IDS.has(id)) return { ok: false, reason: "Unknown theme" };
  if (!isUnlocked(id)) return { ok: false, reason: "Theme is locked" };
  const s = getThemeState();
  save({ ...s, active: id });
  applyTheme(id);
  return { ok: true };
}

/** Apply the theme attribute to <html>. Idempotent and crash-proof. */
export function applyTheme(id?: ThemeId) {
  try {
    const candidate = id ?? getThemeState().active;
    const target: ThemeId = VALID_IDS.has(candidate) ? candidate : "default";
    if (typeof document !== "undefined" && document.documentElement) {
      document.documentElement.setAttribute("data-theme", target);
    }
  } catch (err) {
    logError({
      source: "manual",
      context: "themes:applyTheme",
      message: err instanceof Error ? err.message : "Failed to apply theme",
      stack: err instanceof Error ? err.stack : undefined,
    });
    try { document.documentElement.setAttribute("data-theme", "default"); } catch { /* ignore */ }
  }
}
