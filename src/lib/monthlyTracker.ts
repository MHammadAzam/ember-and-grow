// Monthly Habit Tracker — separate "missed" store. "Completed" reuses habit.completedDates.
// Cell state cycles: empty -> completed -> missed -> empty.

const MISSED_KEY = "lifeforge_missed_dates";

type MissedMap = Record<string, string[]>; // habitId -> ["YYYY-MM-DD", ...]

export function getMissedMap(): MissedMap {
  try {
    return JSON.parse(localStorage.getItem(MISSED_KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveMissedMap(map: MissedMap) {
  localStorage.setItem(MISSED_KEY, JSON.stringify(map));
}

export function getMissedDates(habitId: string): string[] {
  return getMissedMap()[habitId] ?? [];
}

export function setMissedDates(habitId: string, dates: string[]) {
  const map = getMissedMap();
  map[habitId] = dates;
  saveMissedMap(map);
}

export type CellStatus = "empty" | "completed" | "missed";

export function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}
