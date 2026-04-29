// Burnout / overwhelm detection. Pure analysis over the last 7-14 days.
import { getHabits, type Habit } from "./habitStore";

export interface BurnoutAssessment {
  level: "ok" | "watch" | "high";
  score: number;          // 0..100, higher = more burnout risk
  reasons: string[];
  suggestion: string;
}

export function assessBurnout(): BurnoutAssessment {
  const habits = getHabits();
  if (habits.length === 0) {
    return { level: "ok", score: 0, reasons: [], suggestion: "Add a small first habit to begin." };
  }

  const reasons: string[] = [];
  let score = 0;

  // 1. Habit overload
  if (habits.length > 8) { score += 30; reasons.push(`Tracking ${habits.length} habits is a lot`); }
  else if (habits.length > 5) { score += 15; reasons.push(`Managing ${habits.length} habits`); }

  // 2. Recent failure rate (last 7 days)
  const last7 = lastNDates(7);
  let opportunities = 0, hits = 0;
  habits.forEach((h) => {
    last7.forEach((d) => {
      opportunities++;
      if (h.completedDates.includes(d)) hits++;
    });
  });
  const fail7 = opportunities ? 1 - hits / opportunities : 0;
  if (fail7 > 0.7) { score += 35; reasons.push(`Missing ~${Math.round(fail7 * 100)}% of habits this week`); }
  else if (fail7 > 0.5) { score += 20; reasons.push(`Slipping on ~${Math.round(fail7 * 100)}% of habits this week`); }

  // 3. Streak collapse
  const collapsed = habits.filter((h) => h.streak === 0 && h.completedDates.length >= 7).length;
  if (collapsed >= 3) { score += 20; reasons.push(`${collapsed} streaks recently broke`); }
  else if (collapsed >= 1) { score += 10; reasons.push(`${collapsed} streak${collapsed === 1 ? "" : "s"} broke recently`); }

  score = Math.min(100, score);
  const level: BurnoutAssessment["level"] = score >= 60 ? "high" : score >= 30 ? "watch" : "ok";

  let suggestion = "You're balanced — keep your rhythm.";
  if (level === "watch") suggestion = "Consider pausing 1 habit and shrinking another to a 2-min version.";
  if (level === "high") suggestion = "You may be overwhelmed. Pause non-essential habits and pick just 2 to focus on this week.";

  return { level, score, reasons, suggestion };
}

function lastNDates(n: number): string[] {
  return Array.from({ length: n }, (_, i) =>
    new Date(Date.now() - i * 86400000).toISOString().split("T")[0],
  );
}
