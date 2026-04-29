// Themes Store — unlockable cosmetic themes layered on top of light/dark.
// Themes are applied as a `data-theme` attribute on <html> and pure CSS overrides.
// Coins live in `lifeforge_daily_reward.coins`; premium also unlocks all themes.
import { getRewardState } from "./dailyReward";
import { hasPremium } from "./premium";

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

const STORE_KEY = "lifeforge_themes";

interface ThemeState {
  active: ThemeId;
  unlocked: ThemeId[];
}

export function getThemeState(): ThemeState {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* fall through */ }
  return { active: "default", unlocked: ["default"] };
}

function save(s: ThemeState) {
  localStorage.setItem(STORE_KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent("lifeforge:theme-change"));
}

export function isUnlocked(id: ThemeId): boolean {
  if (id === "default") return true;
  if (hasPremium()) return true;
  return getThemeState().unlocked.includes(id);
}

export function unlockTheme(id: ThemeId): { ok: boolean; reason?: string } {
  const meta = THEMES.find((t) => t.id === id);
  if (!meta) return { ok: false, reason: "Unknown theme" };
  if (isUnlocked(id)) return { ok: true };
  // Premium grants full access
  if (hasPremium()) return { ok: true };
  // Pay with coins
  const reward = getRewardState();
  if (reward.coins < meta.cost) {
    return { ok: false, reason: `Need ${meta.cost} coins. You have ${reward.coins}.` };
  }
  localStorage.setItem(
    "lifeforge_daily_reward",
    JSON.stringify({ ...reward, coins: reward.coins - meta.cost }),
  );
  const s = getThemeState();
  save({ ...s, unlocked: [...new Set([...s.unlocked, id])] });
  return { ok: true };
}

export function setActiveTheme(id: ThemeId): { ok: boolean; reason?: string } {
  if (!isUnlocked(id)) return { ok: false, reason: "Theme is locked" };
  const s = getThemeState();
  save({ ...s, active: id });
  applyTheme(id);
  return { ok: true };
}

/** Apply the theme attribute to <html>. Idempotent — safe to call on every render. */
export function applyTheme(id?: ThemeId) {
  const target = id ?? getThemeState().active;
  document.documentElement.setAttribute("data-theme", target);
}
