// Surprise Reward — random bonus XP/coins triggered after consistent days.
// Cooldown: at most one surprise per 24h. Triggered when user completes
// any habit and recent 3-day consistency is strong (>=70%).
import { addXP, getHabits } from "./habitStore";
import { getRewardState } from "./dailyReward";

const KEY = "lifeforge_surprise_last";

export interface Surprise {
  xp: number;
  coins: number;
  message: string;
}

const MESSAGES = [
  "The forest spirits noticed your discipline.",
  "A wandering rune blesses your saga!",
  "Hidden ember — your consistency lit the way.",
  "The Oracle smiles upon your streak.",
];

function recentConsistency(): number {
  const habits = getHabits();
  if (habits.length === 0) return 0;
  let hits = 0, total = 0;
  for (let i = 0; i < 3; i++) {
    const d = new Date(Date.now() - i * 86400000).toISOString().split("T")[0];
    habits.forEach((h) => { total++; if (h.completedDates.includes(d)) hits++; });
  }
  return total ? hits / total : 0;
}

/** Maybe roll a surprise. Call after a positive habit toggle. Returns reward or null. */
export function maybeRollSurprise(): Surprise | null {
  const last = Number(localStorage.getItem(KEY)) || 0;
  if (Date.now() - last < 18 * 3600 * 1000) return null; // 18h cooldown
  if (recentConsistency() < 0.7) return null;
  if (Math.random() > 0.18) return null; // ~18% roll when eligible

  const xp = 15 + Math.floor(Math.random() * 25);
  const coins = 5 + Math.floor(Math.random() * 10);
  addXP(xp);
  // Add coins to daily reward state
  const s = getRewardState();
  localStorage.setItem("lifeforge_daily_reward", JSON.stringify({ ...s, coins: s.coins + coins }));
  localStorage.setItem(KEY, String(Date.now()));

  return { xp, coins, message: MESSAGES[Math.floor(Math.random() * MESSAGES.length)] };
}
