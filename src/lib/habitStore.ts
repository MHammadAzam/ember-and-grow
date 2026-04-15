// Habit data store using localStorage for V1
export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequency: "daily" | "weekly";
  reminderTime?: string;
  streak: number;
  completedDates: string[];
  createdAt: string;
}

export interface UserProfile {
  name: string;
  level: number;
  xp: number;
  badges: string[];
}

const HABITS_KEY = "habitflow_habits";
const PROFILE_KEY = "habitflow_profile";

const ICONS = ["🏃", "📚", "💧", "🧘", "✍️", "🎵", "💪", "🥗", "😴", "🧠", "🎯", "💻"];
const COLORS = [
  "152 60% 42%", "210 80% 55%", "30 90% 55%", "340 75% 55%",
  "262 60% 55%", "180 60% 40%", "45 90% 50%", "0 72% 51%",
];

export const HABIT_ICONS = ICONS;
export const HABIT_COLORS = COLORS;

export function getHabits(): Habit[] {
  const raw = localStorage.getItem(HABITS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveHabits(habits: Habit[]) {
  localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
}

export function getProfile(): UserProfile {
  const raw = localStorage.getItem(PROFILE_KEY);
  return raw ? JSON.parse(raw) : { name: "User", level: 1, xp: 0, badges: [] };
}

export function saveProfile(profile: UserProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

export function isCompletedToday(habit: Habit): boolean {
  return habit.completedDates.includes(getTodayKey());
}

export function calculateStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0;
  const sorted = [...completedDates].sort().reverse();
  const today = getTodayKey();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;
  
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (prev.getTime() - curr.getTime()) / 86400000;
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

export function addXP(amount: number): UserProfile {
  const profile = getProfile();
  profile.xp += amount;
  // Level up every 100 XP
  const newLevel = Math.floor(profile.xp / 100) + 1;
  if (newLevel > profile.level) {
    profile.level = Math.min(newLevel, 10);
  }
  // Check badges
  const habits = getHabits();
  const maxStreak = Math.max(...habits.map(h => h.streak), 0);
  if (maxStreak >= 7 && !profile.badges.includes("7-day streak")) profile.badges.push("7-day streak");
  if (maxStreak >= 30 && !profile.badges.includes("Consistency King")) profile.badges.push("Consistency King");
  if (habits.length >= 5 && !profile.badges.includes("Habit Builder")) profile.badges.push("Habit Builder");
  
  saveProfile(profile);
  return profile;
}

export const MOTIVATIONAL_QUOTES = [
  "Small daily improvements lead to stunning results. 🌟",
  "You don't have to be extreme, just consistent. 💪",
  "The secret of getting ahead is getting started. 🚀",
  "Success is the sum of small efforts repeated daily. ✨",
  "Be stronger than your excuses. 🔥",
  "Every day is a fresh start. 🌅",
  "Progress, not perfection. 🎯",
  "Your habits shape your future. 🌱",
];

export function getDailyQuote(): string {
  const day = new Date().getDate();
  return MOTIVATIONAL_QUOTES[day % MOTIVATIONAL_QUOTES.length];
}

export const AI_HABIT_SUGGESTIONS = [
  { name: "Morning Meditation", icon: "🧘", reason: "Reduces stress and improves focus" },
  { name: "Read 20 Pages", icon: "📚", reason: "Builds knowledge consistently" },
  { name: "Drink 8 Glasses of Water", icon: "💧", reason: "Boosts energy and health" },
  { name: "30-Min Exercise", icon: "🏃", reason: "Improves mood and fitness" },
  { name: "Journal Before Bed", icon: "✍️", reason: "Enhances self-awareness" },
  { name: "Learn Something New", icon: "🧠", reason: "Keeps your mind sharp" },
  { name: "Practice Gratitude", icon: "🙏", reason: "Increases happiness levels" },
  { name: "Digital Detox Hour", icon: "📵", reason: "Reduces anxiety and improves sleep" },
];
