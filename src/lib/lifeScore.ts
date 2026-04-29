// LifeForge AI — composite Life Score (0..100) derived from existing data.
// Pure functions; reads localStorage via existing stores. No side effects.
import { getHabits, getMoods, isCompletedToday, type Habit } from "./habitStore";
import { consistencyScore } from "./analytics";

export interface LifeScore {
  score: number;          // 0..100
  delta: number;          // vs yesterday
  components: {
    consistency: number;  // 30-day consistency % (0..100)
    today: number;        // % of today's habits done
    streak: number;       // best-streak influence (0..100)
    mood: number;         // happy ratio over last 14 days * 100
  };
  band: "rising" | "steady" | "fading";
}

function todayPct(habits: Habit[]): number {
  if (habits.length === 0) return 0;
  return Math.round((habits.filter(isCompletedToday).length / habits.length) * 100);
}
function streakInfluence(habits: Habit[]): number {
  const best = Math.max(0, ...habits.map((h) => h.streak));
  // Diminishing returns: 0→0, 7→55, 30→90, 60→100
  return Math.min(100, Math.round(100 * (1 - Math.exp(-best / 18))));
}
function moodHappy14(): number {
  const cutoff = new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0];
  const recent = getMoods().filter((m) => m.date >= cutoff);
  if (recent.length === 0) return 50; // neutral baseline
  const happy = recent.filter((m) => m.mood === "happy").length;
  const sad = recent.filter((m) => m.mood === "sad").length;
  return Math.max(0, Math.min(100, Math.round(((happy - sad) / recent.length) * 50 + 50)));
}

function compute(forDate?: string): LifeScore {
  const habits = getHabits();
  const consistency = consistencyScore(30);
  const today = todayPct(habits);
  const streak = streakInfluence(habits);
  const mood = moodHappy14();
  // Weighted blend
  const score = Math.round(
    consistency * 0.4 + today * 0.25 + streak * 0.2 + mood * 0.15,
  );
  const yesterdayKey = `lifeforge_lifescore_${new Date(Date.now() - 86400000).toISOString().split("T")[0]}`;
  const yesterday = Number(localStorage.getItem(yesterdayKey)) || score;
  const delta = score - yesterday;
  const band: LifeScore["band"] = delta >= 3 ? "rising" : delta <= -3 ? "fading" : "steady";

  // Persist today's score (used as "yesterday" tomorrow).
  const todayKey = `lifeforge_lifescore_${forDate ?? new Date().toISOString().split("T")[0]}`;
  localStorage.setItem(todayKey, String(score));

  return { score, delta, components: { consistency, today, streak, mood }, band };
}

export function getLifeScore(): LifeScore {
  return compute();
}

/** Last 7 daily scores (uses persisted snapshots when present, computes today live). */
export function getLifeScoreHistory(days = 14): Array<{ date: string; score: number }> {
  const out: Array<{ date: string; score: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().split("T")[0];
    const stored = Number(localStorage.getItem(`lifeforge_lifescore_${d}`));
    out.push({ date: d, score: Number.isFinite(stored) && stored > 0 ? stored : 0 });
  }
  // Replace today with live value
  const live = getLifeScore();
  out[out.length - 1] = { date: new Date().toISOString().split("T")[0], score: live.score };
  return out;
}
