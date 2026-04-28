// Advanced analytics derived from existing localStorage data.
import { getHabits, getMoods, isCompletedToday, type Habit } from "./habitStore";
import { getFocusSessions } from "./habitStore";

export interface DayCell {
  date: string;        // YYYY-MM-DD
  completed: number;
  total: number;
  ratio: number;       // 0..1
}

export function buildHeatmap(days = 90): DayCell[] {
  const habits = getHabits();
  const cells: DayCell[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().split("T")[0];
    const completed = habits.filter(h => h.completedDates.includes(d)).length;
    const total = habits.length;
    cells.push({ date: d, completed, total, ratio: total ? completed / total : 0 });
  }
  return cells;
}

export interface SuccessStat { habit: Habit; rate: number; days: number; }
export function habitSuccessRates(): SuccessStat[] {
  return getHabits().map(h => {
    const days = Math.max(1, Math.ceil((Date.now() - new Date(h.createdAt).getTime()) / 86400000));
    return { habit: h, rate: h.completedDates.length / days, days };
  });
}

/** Best time-of-day from focus sessions (where we have timestamps). */
export function bestTimeOfDay(): { label: string; count: number } | null {
  const sessions = getFocusSessions();
  if (sessions.length === 0) return null;
  const buckets: Record<string, number> = { "Morning (5–11)": 0, "Midday (11–14)": 0, "Afternoon (14–18)": 0, "Evening (18–22)": 0, "Night (22–5)": 0 };
  sessions.forEach(s => {
    const h = new Date(s.startedAt).getHours();
    let label: string;
    if (h >= 5 && h < 11) label = "Morning (5–11)";
    else if (h >= 11 && h < 14) label = "Midday (11–14)";
    else if (h >= 14 && h < 18) label = "Afternoon (14–18)";
    else if (h >= 18 && h < 22) label = "Evening (18–22)";
    else label = "Night (22–5)";
    buckets[label]++;
  });
  const best = Object.entries(buckets).sort((a, b) => b[1] - a[1])[0];
  return { label: best[0], count: best[1] };
}

/** Consistency = % of last-N days with at least one completion. */
export function consistencyScore(days = 30): number {
  const habits = getHabits();
  if (habits.length === 0) return 0;
  let hits = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - i * 86400000).toISOString().split("T")[0];
    if (habits.some(h => h.completedDates.includes(d))) hits++;
  }
  return Math.round((hits / days) * 100);
}

/** Weekly success rate over the last `weeks` weeks. */
export function weeklyRates(weeks = 8): Array<{ label: string; rate: number }> {
  const habits = getHabits();
  if (habits.length === 0) return [];
  const out: Array<{ label: string; rate: number }> = [];
  for (let w = weeks - 1; w >= 0; w--) {
    let completed = 0;
    let total = 0;
    for (let d = 0; d < 7; d++) {
      const date = new Date(Date.now() - (w * 7 + d) * 86400000).toISOString().split("T")[0];
      total += habits.length;
      completed += habits.filter(h => h.completedDates.includes(date)).length;
    }
    out.push({ label: `W-${w}`, rate: total ? completed / total : 0 });
  }
  return out;
}

/** Rolling 30-day forecast: extrapolate current consistency to predict success in 30 days. */
export function forecastSuccessIn30Days(): { current: number; predicted: number; trend: "up" | "down" | "flat" } {
  const recent = consistencyScore(14);
  const older = consistencyScore(28) * 2 - recent; // crude two-window split
  const olderClamped = Math.max(0, Math.min(100, older));
  const trend: "up" | "down" | "flat" = recent > olderClamped + 3 ? "up" : recent < olderClamped - 3 ? "down" : "flat";
  // simple projection: current + half the gap toward 100 if up; toward 0 if down
  const predicted = trend === "up"
    ? Math.min(100, Math.round(recent + (100 - recent) * 0.25))
    : trend === "down"
    ? Math.max(0, Math.round(recent - recent * 0.25))
    : recent;
  return { current: recent, predicted, trend };
}

export function todayCompletionPct(): number {
  const habits = getHabits();
  if (habits.length === 0) return 0;
  const done = habits.filter(isCompletedToday).length;
  return Math.round((done / habits.length) * 100);
}

export function moodSummary30(): { happy: number; neutral: number; sad: number; total: number } {
  const cutoff = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
  const recent = getMoods().filter(m => m.date >= cutoff);
  return {
    happy: recent.filter(m => m.mood === "happy").length,
    neutral: recent.filter(m => m.mood === "neutral").length,
    sad: recent.filter(m => m.mood === "sad").length,
    total: recent.length,
  };
}
