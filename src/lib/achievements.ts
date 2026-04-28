// Achievement system — derives unlocked badges from existing habit data.
// Stored badges live on the profile; this module just computes & persists them.

import {
  getHabits,
  getProfile,
  saveProfile,
  isCompletedToday,
  type Habit,
} from "./habitStore";

export interface Achievement {
  id: string;
  name: string;
  emoji: string;
  description: string;
  /** Returns true if unlocked given current data. */
  test: (habits: Habit[], totalCompletions: number, maxStreak: number) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-step",
    name: "First Spark",
    emoji: "✨",
    description: "Complete your first habit.",
    test: (_h, total) => total >= 1,
  },
  {
    id: "streak-7",
    name: "7-Day Ember",
    emoji: "🔥",
    description: "Hold a 7-day streak on any habit.",
    test: (_h, _t, max) => max >= 7,
  },
  {
    id: "streak-30",
    name: "Consistency Crown",
    emoji: "👑",
    description: "Hold a 30-day streak.",
    test: (_h, _t, max) => max >= 30,
  },
  {
    id: "completions-30",
    name: "Forge Apprentice",
    emoji: "⚒️",
    description: "Log 30 total habit completions.",
    test: (_h, total) => total >= 30,
  },
  {
    id: "completions-100",
    name: "Forge Master",
    emoji: "🪓",
    description: "Log 100 total habit completions.",
    test: (_h, total) => total >= 100,
  },
  {
    id: "perfect-week",
    name: "Perfect Week",
    emoji: "🌟",
    description: "Complete every habit, every day, for 7 days.",
    test: (h) => {
      if (h.length === 0) return false;
      for (let i = 0; i < 7; i++) {
        const d = new Date(Date.now() - i * 86400000).toISOString().split("T")[0];
        if (!h.every(x => x.completedDates.includes(d))) return false;
      }
      return true;
    },
  },
  {
    id: "all-today",
    name: "Daily Triumph",
    emoji: "🏆",
    description: "Complete every habit today.",
    test: (h) => h.length > 0 && h.every(isCompletedToday),
  },
];

export interface AchievementProgress {
  achievement: Achievement;
  unlocked: boolean;
}

export function evaluateAchievements(): AchievementProgress[] {
  const habits = getHabits();
  const totalCompletions = habits.reduce((s, h) => s + h.completedDates.length, 0);
  const maxStreak = Math.max(0, ...habits.map(h => h.streak));
  const profile = getProfile();
  const known = new Set(profile.badges);

  const result = ACHIEVEMENTS.map(a => ({
    achievement: a,
    unlocked: a.test(habits, totalCompletions, maxStreak),
  }));

  // Persist any newly unlocked badges into the profile.
  let dirty = false;
  result.forEach(r => {
    if (r.unlocked && !known.has(r.achievement.name)) {
      profile.badges.push(r.achievement.name);
      dirty = true;
    }
  });
  if (dirty) saveProfile(profile);
  return result;
}
