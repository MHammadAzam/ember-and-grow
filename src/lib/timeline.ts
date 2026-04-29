// Timeline — derive a chronological "life story" of milestones from existing data.
import { getHabits, getFocusSessions, getProfile, getJournalIndex, getBets } from "./habitStore";

export interface TimelineEvent {
  date: string;            // ISO datetime
  type: "habit-created" | "streak-milestone" | "level-up" | "focus-session" | "journal" | "bet-won" | "bet-lost" | "shield-used";
  title: string;
  detail?: string;
  emoji: string;
}

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];

export function buildTimeline(): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const habits = getHabits();
  const profile = getProfile();

  habits.forEach((h) => {
    events.push({
      date: h.createdAt,
      type: "habit-created",
      title: `Forged "${h.name}"`,
      emoji: h.icon,
    });
    // streak milestone events — approximate by walking sorted completion dates
    const sorted = [...h.completedDates].sort();
    let run = 0;
    let prev: string | null = null;
    sorted.forEach((d) => {
      if (prev) {
        const diff = Math.round((+new Date(d) - +new Date(prev)) / 86400000);
        run = diff === 1 ? run + 1 : 1;
      } else run = 1;
      if (STREAK_MILESTONES.includes(run)) {
        events.push({
          date: `${d}T12:00:00.000Z`,
          type: "streak-milestone",
          title: `${run}-day streak on "${h.name}"`,
          detail: "🔥",
          emoji: h.icon,
        });
      }
      prev = d;
    });
    if (h.shieldUsedOnMonth) {
      events.push({
        date: `${h.shieldUsedOnMonth}-15T12:00:00.000Z`,
        type: "shield-used",
        title: `Streak Shield used on "${h.name}"`,
        emoji: "🛡️",
      });
    }
  });

  getFocusSessions().slice(0, 30).forEach((s) => {
    if (s.completed) events.push({
      date: s.startedAt,
      type: "focus-session",
      title: `Focused for ${s.completedMin} min`,
      emoji: "⏳",
    });
  });

  getJournalIndex().slice(0, 30).forEach((j) => {
    events.push({
      date: j.createdAt,
      type: "journal",
      title: `Video journal · ${Math.round(j.durationSec)}s`,
      detail: j.note,
      emoji: "🎥",
    });
  });

  getBets().forEach((b) => {
    if (b.status === "won" && b.resolvedAt) events.push({
      date: `${b.resolvedAt}T18:00:00.000Z`,
      type: "bet-won",
      title: `Won bet on "${b.habitName}" (+${b.payout} XP)`,
      emoji: "💎",
    });
    if (b.status === "lost" && b.resolvedAt) events.push({
      date: `${b.resolvedAt}T18:00:00.000Z`,
      type: "bet-lost",
      title: `Lost bet on "${b.habitName}" (−${b.stake} XP)`,
      emoji: "💔",
    });
  });

  // Synthetic level-up event using current level (no per-level history stored)
  if (profile.level > 1) {
    events.push({
      date: new Date().toISOString(),
      type: "level-up",
      title: `Reached Level ${profile.level} — ${profile.title}`,
      emoji: "✨",
    });
  }

  return events.sort((a, b) => +new Date(b.date) - +new Date(a.date));
}
