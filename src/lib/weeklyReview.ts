// Weekly Review derivation — wins / misses / suggestions from raw habit data.
import { getHabits } from "./habitStore";

export interface WeeklyReview {
  weekLabel: string;        // "Mar 4 – Mar 10"
  totalCompleted: number;
  totalOpportunities: number;
  successRate: number;      // 0..100
  topHabit?: { name: string; icon: string; rate: number };
  weakHabit?: { name: string; icon: string; rate: number };
  suggestions: string[];
}

function lastNDates(n: number): string[] {
  return Array.from({ length: n }, (_, i) =>
    new Date(Date.now() - i * 86400000).toISOString().split("T")[0],
  );
}

export function generateWeeklyReview(): WeeklyReview {
  const habits = getHabits();
  const dates = lastNDates(7);
  const start = dates[dates.length - 1];
  const end = dates[0];
  const fmt = (s: string) =>
    new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  let totalCompleted = 0;
  const opportunities = habits.length * 7;
  const perHabit = habits.map((h) => {
    const hits = dates.filter((d) => h.completedDates.includes(d)).length;
    totalCompleted += hits;
    return { name: h.name, icon: h.icon, rate: 7 ? hits / 7 : 0 };
  });

  const sorted = [...perHabit].sort((a, b) => b.rate - a.rate);
  const successRate = opportunities ? Math.round((totalCompleted / opportunities) * 100) : 0;

  const suggestions: string[] = [];
  if (habits.length === 0) suggestions.push("Forge your first habit to begin a meaningful week.");
  if (successRate < 40 && habits.length > 0) suggestions.push("Trim to 2–3 habits next week and shrink each to a 2-minute version.");
  if (successRate >= 80) suggestions.push("Consider raising the bar — add one slightly harder habit.");
  if (sorted[0] && sorted[0].rate >= 0.8) suggestions.push(`Anchor new habits to "${sorted[0].name}" — it's your strongest cue.`);
  if (sorted[sorted.length - 1] && sorted[sorted.length - 1].rate <= 0.3 && habits.length > 1)
    suggestions.push(`Pause "${sorted[sorted.length - 1].name}" or shrink it dramatically next week.`);
  if (suggestions.length === 0) suggestions.push("Keep your current rhythm — a small reflection note tonight will compound it.");

  return {
    weekLabel: `${fmt(start)} – ${fmt(end)}`,
    totalCompleted,
    totalOpportunities: opportunities,
    successRate,
    topHabit: sorted[0],
    weakHabit: sorted[sorted.length - 1],
    suggestions,
  };
}
