// Daily login reward — escalating XP + coin chain. Resets if user misses a day.
import { addXP, getTodayKey } from "./habitStore";

const KEY = "lifeforge_daily_reward";

export interface DailyRewardState {
  lastClaimed?: string;  // YYYY-MM-DD
  chain: number;         // consecutive day count, 1..7 then loops
  coins: number;         // soft currency
}

const REWARDS = [10, 15, 20, 25, 30, 40, 60]; // XP per chain day

export function getRewardState(): DailyRewardState {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { chain: 0, coins: 0 };
  } catch {
    return { chain: 0, coins: 0 };
  }
}

function save(s: DailyRewardState) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function canClaimToday(): boolean {
  const s = getRewardState();
  return s.lastClaimed !== getTodayKey();
}

export function nextRewardPreview(): { xp: number; coins: number; day: number } {
  const s = getRewardState();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const continues = s.lastClaimed === yesterday;
  const nextChain = continues ? Math.min(7, s.chain + 1) : 1;
  return { xp: REWARDS[nextChain - 1], coins: 5 + nextChain * 2, day: nextChain };
}

export function claimDailyReward(): { xp: number; coins: number; day: number } | null {
  if (!canClaimToday()) return null;
  const today = getTodayKey();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const s = getRewardState();
  const continues = s.lastClaimed === yesterday;
  const chain = continues ? Math.min(7, s.chain + 1) : 1;
  const xp = REWARDS[chain - 1];
  const coins = 5 + chain * 2;
  addXP(xp);
  save({ lastClaimed: today, chain, coins: s.coins + coins });
  return { xp, coins, day: chain };
}
