// Smart Scheduler — best-time + smart-reminder heuristics.
// Uses focus session timestamps and habit completion timestamps (when available).
import { getHabits, getFocusSessions, type Habit } from "./habitStore";

const HOURS = ["Early morning (5–8)", "Morning (8–11)", "Midday (11–14)", "Afternoon (14–17)", "Evening (17–20)", "Night (20–23)"];

function bucketFor(h: number): string {
  if (h >= 5 && h < 8) return HOURS[0];
  if (h >= 8 && h < 11) return HOURS[1];
  if (h >= 11 && h < 14) return HOURS[2];
  if (h >= 14 && h < 17) return HOURS[3];
  if (h >= 17 && h < 20) return HOURS[4];
  return HOURS[5];
}

/** Aggregate focus + completion patterns to recommend a global best window. */
export function bestGlobalWindow(): { window: string; confidence: number } | null {
  const sessions = getFocusSessions();
  const habits = getHabits();
  const buckets: Record<string, number> = Object.fromEntries(HOURS.map((h) => [h, 0]));

  sessions.forEach((s) => {
    if (s.completed) buckets[bucketFor(new Date(s.startedAt).getHours())] += 2;
  });
  // Use habit createdAt hour as a weak proxy when completion timestamps absent.
  habits.forEach((h) => {
    buckets[bucketFor(new Date(h.createdAt).getHours())] += 1;
  });

  const total = Object.values(buckets).reduce((a, b) => a + b, 0);
  if (total < 3) return null;
  const best = Object.entries(buckets).sort((a, b) => b[1] - a[1])[0];
  const confidence = Math.min(100, Math.round((best[1] / total) * 100));
  return { window: best[0], confidence };
}

export interface HabitSuggestion {
  habit: Habit;
  suggestedWindow: string;
  reason: string;
}

export function suggestHabitTimes(): HabitSuggestion[] {
  const habits = getHabits();
  const global = bestGlobalWindow();
  return habits.map((h) => {
    const window = global?.window ?? "Morning (8–11)";
    const reason = global
      ? `You complete most often during ${window.toLowerCase()} — anchor "${h.name}" there.`
      : `Try ${window.toLowerCase()} for "${h.name}" — most people build streaks easier in the morning.`;
    return { habit: h, suggestedWindow: window, reason };
  });
}

/** Identify habits that frequently fail; produce a behavior-based reminder hint. */
export interface ReminderHint {
  habit: Habit;
  hint: string;
  failPct: number;
}

export function smartReminders(): ReminderHint[] {
  const habits = getHabits();
  const last14 = Array.from({ length: 14 }, (_, i) =>
    new Date(Date.now() - i * 86400000).toISOString().split("T")[0],
  );
  return habits
    .map((h) => {
      const opportunities = last14.length;
      const hits = last14.filter((d) => h.completedDates.includes(d)).length;
      const failPct = Math.round((1 - hits / opportunities) * 100);
      if (failPct < 40) return null;
      // Heuristic: if habit was created late in day, suggest morning anchor.
      const createdHour = new Date(h.createdAt).getHours();
      const hint = createdHour >= 18
        ? `You usually miss "${h.name}" at night — try anchoring it to your morning routine.`
        : `"${h.name}" slipped ${failPct}% this fortnight — set a 2-min mini version to rebuild momentum.`;
      return { habit: h, hint, failPct };
    })
    .filter(Boolean) as ReminderHint[];
}
