// Auto-mark missed habits logic + user settings.
// Runs on app load: any past day (after grace cutoff) where a habit
// was neither completed nor explicitly missed is auto-marked as missed.

import { getHabits, saveHabits, calculateStreak, type Habit } from "@/lib/habitStore";
import { getMissedMap, saveMissedMap, dateKey } from "@/lib/monthlyTracker";

const SETTINGS_KEY = "lifeforge_missed_settings";
const LAST_RUN_KEY = "lifeforge_missed_lastrun";
const LOG_KEY = "lifeforge_missed_log";
const LOG_MAX = 20;

export interface SweepLogEntry {
  /** ISO timestamp when the sweep ran. */
  at: string;
  /** Number of cells marked as missed during this run. */
  marked: number;
  /** Whether the sweep was triggered manually (vs. auto on app load). */
  manual: boolean;
  /** Whether auto-mark was disabled at the time (sweep skipped). */
  skipped?: boolean;
}

export function getSweepLog(): SweepLogEntry[] {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function clearSweepLog() {
  localStorage.removeItem(LOG_KEY);
}

function appendSweepLog(entry: SweepLogEntry) {
  const log = getSweepLog();
  log.unshift(entry);
  localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(0, LOG_MAX)));
}

export function getLastSweepAt(): string | null {
  return getSweepLog()[0]?.at ?? null;
}

export interface MissedSettings {
  /** Auto-mark unmarked past-day habits as missed. */
  autoMarkMissed: boolean;
  /** Hour (0-23) after midnight before "yesterday" is considered closed. e.g. 3 = 3 AM grace period. */
  graceHour: number;
}

const DEFAULT_SETTINGS: MissedSettings = {
  autoMarkMissed: true,
  graceHour: 3,
};

export function getMissedSettings(): MissedSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

export function saveMissedSettings(s: MissedSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

function ymd(d: Date): string {
  return dateKey(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Returns the latest date that should be considered "fully closed"
 * given a grace cutoff. While we're still inside the grace window
 * after midnight, yesterday is still editable so we don't close it yet.
 */
export function lastClosedDate(now: Date, graceHour: number): Date {
  const d = new Date(now);
  if (d.getHours() < graceHour) {
    // still within grace window — yesterday is not closed yet,
    // so the last fully closed day is the day before yesterday.
    d.setDate(d.getDate() - 2);
  } else {
    d.setDate(d.getDate() - 1);
  }
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Sweep all habits and auto-mark any unmarked past day (from habit
 * creation date through lastClosedDate) as missed.
 *
 * Returns the number of cells marked.
 */
export function runMissedSweep(now: Date = new Date()): number {
  const settings = getMissedSettings();
  if (!settings.autoMarkMissed) return 0;

  const todayK = ymd(now);
  const lastRun = localStorage.getItem(LAST_RUN_KEY);
  // Skip if already ran today (cheap guard; still cheap if we don't).
  if (lastRun === todayK) return 0;

  const habits = getHabits();
  if (habits.length === 0) {
    localStorage.setItem(LAST_RUN_KEY, todayK);
    return 0;
  }

  const cutoff = lastClosedDate(now, settings.graceHour);
  const missedMap = getMissedMap();

  let changedHabits = false;
  let changedMissed = false;
  let count = 0;

  const nextHabits: Habit[] = habits.map((h) => {
    const created = parseCreatedAt(h.createdAt);
    if (!created) return h;
    const start = new Date(created);
    start.setHours(0, 0, 0, 0);

    const completed = new Set(h.completedDates);
    const existingMissed = new Set(missedMap[h.id] ?? []);
    const newMissed = new Set(existingMissed);

    for (
      let d = new Date(start);
      d.getTime() <= cutoff.getTime();
      d.setDate(d.getDate() + 1)
    ) {
      const k = ymd(d);
      if (completed.has(k)) continue;
      if (newMissed.has(k)) continue;
      newMissed.add(k);
      count++;
    }

    if (newMissed.size !== existingMissed.size) {
      missedMap[h.id] = Array.from(newMissed).sort();
      changedMissed = true;
    }

    // Re-derive streak (in case the gap pattern changed).
    const newStreak = calculateStreak(h.completedDates, h.shieldUsedOnMonth);
    if (newStreak !== h.streak) {
      changedHabits = true;
      return { ...h, streak: newStreak };
    }
    return h;
  });

  if (changedMissed) saveMissedMap(missedMap);
  if (changedHabits) saveHabits(nextHabits);
  localStorage.setItem(LAST_RUN_KEY, todayK);
  return count;
}

function parseCreatedAt(s: string | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d;
}
