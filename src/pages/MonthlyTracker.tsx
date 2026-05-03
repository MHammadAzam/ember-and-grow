import { useMemo, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { getHabits, saveHabits, Habit, calculateStreak } from "@/lib/habitStore";
import {
  getMissedMap, saveMissedMap, dateKey, daysInMonth, CellStatus,
} from "@/lib/monthlyTracker";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const VIEW_KEY = "lifeforge_monthly_view";

export default function MonthlyTracker() {
  const today = new Date();
  const [year, setYear] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(VIEW_KEY);
      if (raw) {
        const v = JSON.parse(raw);
        if (typeof v.year === "number") return v.year;
      }
    } catch {}
    return today.getFullYear();
  });
  const [month, setMonth] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(VIEW_KEY);
      if (raw) {
        const v = JSON.parse(raw);
        if (typeof v.month === "number") return v.month;
      }
    } catch {}
    return today.getMonth();
  }); // 0-indexed

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, JSON.stringify({ year, month }));
    } catch {}
  }, [year, month]);

  const [habits, setHabits] = useState<Habit[]>(getHabits);
  const [missedMap, setMissedMap] = useState(getMissedMap);

  const totalDays = daysInMonth(year, month);
  const days = useMemo(() => Array.from({ length: totalDays }, (_, i) => i + 1), [totalDays]);

  const todayKey = today.toISOString().split("T")[0];

  const cellStatus = useCallback(
    (habit: Habit, day: number): CellStatus => {
      const key = dateKey(year, month, day);
      if (habit.completedDates.includes(key)) return "completed";
      if ((missedMap[habit.id] ?? []).includes(key)) return "missed";
      if (key === todayKey) return "pending";
      return "empty";
    },
    [year, month, missedMap, todayKey],
  );

  const cycleCell = (habit: Habit, day: number) => {
    const key = dateKey(year, month, day);
    const status = cellStatus(habit, day);

    // Remove from both first
    const completed = habit.completedDates.filter((d) => d !== key);
    const missed = (missedMap[habit.id] ?? []).filter((d) => d !== key);

    let newCompleted = completed;
    let newMissed = missed;

    // Cycle: empty/pending -> completed -> missed -> empty
    if (status === "empty" || status === "pending") newCompleted = [...completed, key];
    else if (status === "completed") newMissed = [...missed, key];
    // if "missed" -> empty (already removed)

    const nextHabits = habits.map((h) =>
      h.id === habit.id
        ? { ...h, completedDates: newCompleted, streak: calculateStreak(newCompleted, h.shieldUsedOnMonth) }
        : h,
    );
    const nextMissed = { ...missedMap, [habit.id]: newMissed };

    setHabits(nextHabits);
    setMissedMap(nextMissed);
    saveHabits(nextHabits);
    saveMissedMap(nextMissed);
  };

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1);
  };

  // Summary
  const stats = useMemo(() => {
    const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    return habits.map((h) => {
      const completed = h.completedDates.filter((d) => d.startsWith(monthPrefix)).length;
      const missed = (missedMap[h.id] ?? []).filter((d) => d.startsWith(monthPrefix)).length;
      const tracked = completed + missed;
      const consistency = tracked > 0 ? Math.round((completed / tracked) * 100) : 0;
      return { habit: h, completed, missed, consistency };
    });
  }, [habits, missedMap, year, month]);

  const ranked = [...stats].filter((s) => s.completed + s.missed > 0)
    .sort((a, b) => b.consistency - a.consistency);
  const best = ranked[0];
  const weakest = ranked[ranked.length - 1];

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Monthly</p>
            <h1 className="font-display text-2xl text-gradient-forest">Habit Tracker</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Tap a cell: empty → ✅ → ❌ → empty
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={prevMonth} className="p-2 rounded-full hover:bg-card border border-border/60" aria-label="Previous month">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-center px-2 min-w-[7rem]">
              <p className="font-display text-base">{MONTH_NAMES[month]}</p>
              <p className="text-xs text-muted-foreground">{year}</p>
            </div>
            <button onClick={nextMonth} className="p-2 rounded-full hover:bg-card border border-border/60" aria-label="Next month">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {habits.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground">
          Add habits from the dashboard to start tracking.
        </div>
      ) : (
        <>
          {/* Grid */}
          <div className="glass-card rounded-2xl p-2 overflow-hidden">
            <div className="overflow-auto max-h-[60vh]">
              <table className="border-separate border-spacing-0 text-xs">
                <thead>
                  <tr>
                    <th className="sticky top-0 left-0 z-30 bg-background/95 backdrop-blur px-3 py-2 text-left border-b border-border/60 min-w-[8rem]">
                      Habit
                    </th>
                    {days.map((d) => {
                      const isToday =
                        d === today.getDate() &&
                        month === today.getMonth() &&
                        year === today.getFullYear();
                      return (
                        <th
                          key={d}
                          className={cn(
                            "sticky top-0 z-20 bg-background/95 backdrop-blur px-1.5 py-2 border-b border-border/60 font-medium",
                            isToday && "text-primary",
                          )}
                        >
                          {d}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {habits.map((h) => (
                    <tr key={h.id}>
                      <td className="sticky left-0 z-10 bg-background/95 backdrop-blur px-3 py-1.5 border-b border-border/40 font-medium whitespace-nowrap">
                        <span className="mr-1.5">{h.icon}</span>
                        {h.name}
                      </td>
                      {days.map((d) => {
                        const status = cellStatus(h, d);
                        return (
                          <td
                            key={d}
                            className="border-b border-border/30 p-0.5"
                          >
                            <button
                              onClick={() => cycleCell(h, d)}
                              className={cn(
                                "w-7 h-7 rounded-md flex items-center justify-center transition-all hover:scale-110 active:scale-95",
                                status === "empty" && "bg-muted/40 hover:bg-muted",
                                status === "completed" && "bg-green-500/25 text-green-500",
                                status === "missed" && "bg-red-500/25 text-red-500",
                              )}
                              aria-label={`${h.name} day ${d}: ${status}`}
                            >
                              {status === "completed" && <Check className="w-3.5 h-3.5" />}
                              {status === "missed" && <X className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-green-500/40" /> Completed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-500/40" /> Missed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-muted/60" /> Empty
            </span>
          </div>

          {/* Summary */}
          <div className="glass-card rounded-2xl p-5 space-y-3">
            <h2 className="font-display text-lg">Summary — {MONTH_NAMES[month]}</h2>
            <div className="space-y-2">
              {stats.map((s) => (
                <div key={s.habit.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">
                    <span className="mr-1.5">{s.habit.icon}</span>{s.habit.name}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    <span className="text-green-500">{s.completed}✓</span>
                    {" · "}
                    <span className="text-red-500">{s.missed}✗</span>
                    {" · "}
                    <span className="font-medium text-foreground">{s.consistency}%</span>
                  </span>
                </div>
              ))}
            </div>
            {best && (
              <div className="pt-3 border-t border-border/40 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Best</p>
                  <p>🏆 {best.habit.icon} {best.habit.name} ({best.consistency}%)</p>
                </div>
                {weakest && weakest.habit.id !== best.habit.id && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Weakest</p>
                    <p>⚠️ {weakest.habit.icon} {weakest.habit.name} ({weakest.consistency}%)</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
