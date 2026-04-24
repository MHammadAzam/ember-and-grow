// LifeForge AI — habit + RPG store backed by localStorage.
// All persistence and date logic lives here. Components stay presentational.

export type HabitWorldType = "tree" | "building" | "planet";

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;                  // HSL components, e.g. "158 64% 32%"
  frequency: "daily" | "weekly";
  worldType: HabitWorldType;      // determines visual in Habit World
  reminderTime?: string;
  streak: number;
  shieldUsedOnMonth?: string;     // "YYYY-MM" — Streak Shield consumed this month
  completedDates: string[];       // ISO "YYYY-MM-DD"
  createdAt: string;
}

export type Mood = "sad" | "neutral" | "happy";

export interface MoodEntry {
  date: string; // YYYY-MM-DD
  mood: Mood;
}

export interface UserProfile {
  name: string;
  level: number;     // 1..100
  xp: number;        // total
  badges: string[];
  title: string;     // RPG title
}

export interface DailyQuest {
  id: string;
  date: string;                    // YYYY-MM-DD this quest is active
  type: "complete-n" | "streak-n" | "mood-check" | "all-today";
  goal: number;
  description: string;
  reward: number;                  // XP
  claimed: boolean;
}

const HABITS_KEY = "lifeforge_habits";
const PROFILE_KEY = "lifeforge_profile";
const MOOD_KEY = "lifeforge_moods";
const QUESTS_KEY = "lifeforge_quests";
const BETS_KEY = "lifeforge_bets";
const FOCUS_KEY = "lifeforge_focus_sessions";
const FUTURE_SELF_KEY = "lifeforge_future_self";
const ALTER_EGO_KEY = "lifeforge_alter_ego";
const JOURNAL_INDEX_KEY = "lifeforge_journal_index";

const ICONS = ["🏃", "📚", "💧", "🧘", "✍️", "🎵", "💪", "🥗", "😴", "🧠", "🎯", "💻", "🌿", "🔥", "⚔️", "🪄"];
// HSL component strings — pair with `hsl(${color})` in styles
const COLORS = [
  "158 64% 32%", "130 55% 42%", "200 75% 45%", "268 55% 52%",
  "42 78% 50%",  "18 88% 52%",  "340 60% 50%", "180 50% 40%",
];

export const HABIT_ICONS = ICONS;
export const HABIT_COLORS = COLORS;

// RPG titles unlocked by level
export const TITLES: { minLevel: number; title: string }[] = [
  { minLevel: 1,   title: "Wanderer" },
  { minLevel: 5,   title: "Apprentice" },
  { minLevel: 10,  title: "Focused Mind" },
  { minLevel: 20,  title: "Discipline Builder" },
  { minLevel: 35,  title: "Rune Keeper" },
  { minLevel: 50,  title: "Forest Sage" },
  { minLevel: 75,  title: "Habit Master 👑" },
  { minLevel: 100, title: "Eternal Forgemaster ✨" },
];

export function titleForLevel(level: number): string {
  return [...TITLES].reverse().find(t => level >= t.minLevel)?.title ?? "Wanderer";
}

// ---------- Date helpers ----------
export function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}
export function getMonthKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function daysAgoKey(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString().split("T")[0];
}

// ---------- Habits ----------
export function getHabits(): Habit[] {
  const raw = localStorage.getItem(HABITS_KEY);
  if (!raw) return [];
  try {
    const parsed: Habit[] = JSON.parse(raw);
    // Migrate: ensure worldType exists on legacy data
    return parsed.map(h => ({ worldType: "tree", ...h }));
  } catch {
    return [];
  }
}
export function saveHabits(habits: Habit[]) {
  localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
}

export function isCompletedToday(habit: Habit): boolean {
  return habit.completedDates.includes(getTodayKey());
}

/** Calculate streak from completion dates, allowing one shielded gap this month. */
export function calculateStreak(completedDates: string[], shieldUsedOnMonth?: string): number {
  if (completedDates.length === 0) return 0;
  const sorted = [...completedDates].sort().reverse();
  const today = getTodayKey();
  const yesterday = daysAgoKey(1);
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let streak = 1;
  let shieldAvailable = !!shieldUsedOnMonth && shieldUsedOnMonth === getMonthKey();
  // shield was already consumed this month -> no extra forgiveness
  shieldAvailable = false; // shields are consumed at use-time, not retroactively
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000);
    if (diff === 1) { streak++; continue; }
    if (diff === 2 && shieldAvailable) { streak++; shieldAvailable = false; continue; }
    break;
  }
  return streak;
}

// ---------- Profile ----------
export function getProfile(): UserProfile {
  const raw = localStorage.getItem(PROFILE_KEY);
  const base: UserProfile = { name: "Adventurer", level: 1, xp: 0, badges: [], title: "Wanderer" };
  if (!raw) return base;
  try {
    const p = { ...base, ...JSON.parse(raw) };
    p.title = titleForLevel(p.level);
    return p;
  } catch { return base; }
}
export function saveProfile(profile: UserProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

/** Award XP, recompute level (cap 100) and badges. Returns the updated profile. */
export function addXP(amount: number): UserProfile {
  const profile = getProfile();
  profile.xp += amount;
  const newLevel = Math.min(100, Math.floor(profile.xp / 100) + 1);
  if (newLevel > profile.level) profile.level = newLevel;
  profile.title = titleForLevel(profile.level);

  const habits = getHabits();
  const maxStreak = Math.max(0, ...habits.map(h => h.streak));
  const grant = (b: string) => { if (!profile.badges.includes(b)) profile.badges.push(b); };
  if (maxStreak >= 7)  grant("7-Day Ember");
  if (maxStreak >= 30) grant("Consistency Crown");
  if (maxStreak >= 100) grant("Eternal Flame");
  if (habits.length >= 5) grant("Habit Builder");
  if (profile.level >= 10) grant("Focused Mind");
  if (profile.level >= 50) grant("Forest Sage");

  saveProfile(profile);
  return profile;
}

// ---------- Mood ----------
export function getMoods(): MoodEntry[] {
  const raw = localStorage.getItem(MOOD_KEY);
  return raw ? JSON.parse(raw) : [];
}
export function saveMoods(entries: MoodEntry[]) {
  localStorage.setItem(MOOD_KEY, JSON.stringify(entries));
}
export function setTodayMood(mood: Mood): MoodEntry[] {
  const today = getTodayKey();
  const existing = getMoods().filter(m => m.date !== today);
  const next = [...existing, { date: today, mood }];
  saveMoods(next);
  return next;
}
export function getTodayMood(): Mood | null {
  const today = getTodayKey();
  return getMoods().find(m => m.date === today)?.mood ?? null;
}

// ---------- Daily Quests ----------
const QUEST_TEMPLATES: Omit<DailyQuest, "id" | "date" | "claimed">[] = [
  { type: "complete-n", goal: 3, description: "Complete 3 habits today", reward: 30 },
  { type: "complete-n", goal: 1, description: "Complete your first habit today", reward: 10 },
  { type: "all-today",  goal: 1, description: "Finish every habit today", reward: 50 },
  { type: "streak-n",   goal: 2, description: "Hold a 2-day streak on any habit", reward: 25 },
  { type: "mood-check", goal: 1, description: "Log today's mood", reward: 10 },
];

export function getQuests(): DailyQuest[] {
  const raw = localStorage.getItem(QUESTS_KEY);
  const all: DailyQuest[] = raw ? JSON.parse(raw) : [];
  const today = getTodayKey();
  const todays = all.filter(q => q.date === today);
  if (todays.length >= 3) return todays;

  // Generate today's quests deterministically (seeded by date)
  const seed = today.split("-").reduce((a, b) => a + parseInt(b), 0);
  const picks: DailyQuest[] = [];
  for (let i = 0; i < 3; i++) {
    const tmpl = QUEST_TEMPLATES[(seed + i) % QUEST_TEMPLATES.length];
    picks.push({
      ...tmpl,
      id: `${today}-${i}`,
      date: today,
      claimed: false,
    });
  }
  // keep last 7 days history
  const cutoff = daysAgoKey(7);
  const trimmed = all.filter(q => q.date >= cutoff && q.date !== today);
  const next = [...trimmed, ...picks];
  localStorage.setItem(QUESTS_KEY, JSON.stringify(next));
  return picks;
}

export function saveQuests(quests: DailyQuest[]) {
  const raw = localStorage.getItem(QUESTS_KEY);
  const all: DailyQuest[] = raw ? JSON.parse(raw) : [];
  const today = getTodayKey();
  const merged = [...all.filter(q => q.date !== today), ...quests];
  localStorage.setItem(QUESTS_KEY, JSON.stringify(merged));
}

/** Returns current progress (0..goal) for a quest, given today's habit state. */
export function questProgress(quest: DailyQuest, habits: Habit[], mood: Mood | null): number {
  const completedToday = habits.filter(isCompletedToday).length;
  switch (quest.type) {
    case "complete-n": return Math.min(quest.goal, completedToday);
    case "all-today":  return habits.length > 0 && habits.every(isCompletedToday) ? 1 : 0;
    case "streak-n":   return habits.some(h => h.streak >= quest.goal) ? 1 : 0;
    case "mood-check": return mood ? 1 : 0;
  }
}
export function questGoalScalar(quest: DailyQuest): number {
  return quest.type === "complete-n" ? quest.goal : 1;
}

// ---------- Daily quote ----------
export const MOTIVATIONAL_QUOTES = [
  "Every dawn forges a new path. 🌅",
  "Small embers light vast forests. 🔥",
  "Discipline is the rune that binds your future. 🪄",
  "The forest grows one root at a time. 🌿",
  "Consistency is the truest magic. ✨",
  "Today's choice shapes tomorrow's world. 🌍",
  "A streak unbroken is a story untold. 📜",
  "Your habits are your spells — cast them well. ⚔️",
];
export function getDailyQuote(): string {
  return MOTIVATIONAL_QUOTES[new Date().getDate() % MOTIVATIONAL_QUOTES.length];
}

// ---------- AI suggestions ----------
export const AI_HABIT_SUGGESTIONS = [
  { name: "Morning Meditation",       icon: "🧘", reason: "Calms the mind before battle" },
  { name: "Read 20 Pages",            icon: "📚", reason: "Forges knowledge daily" },
  { name: "Drink 8 Glasses of Water", icon: "💧", reason: "Restores mana" },
  { name: "30-Min Exercise",          icon: "🏃", reason: "Strengthens body & spirit" },
  { name: "Journal Before Bed",       icon: "✍️", reason: "Records your saga" },
  { name: "Learn Something New",      icon: "🧠", reason: "Unlocks new abilities" },
  { name: "Practice Gratitude",       icon: "🙏", reason: "Heals the heart" },
  { name: "Digital Detox Hour",       icon: "📵", reason: "Shields from distraction" },
];
