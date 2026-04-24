import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Sparkles, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  addXP, focusSessionsToday, getHabits, logFocusSession,
  type FocusSession,
} from "@/lib/habitStore";
import { toast } from "sonner";
import confetti from "canvas-confetti";

const PRESETS = [25, 45, 60] as const;

export default function Focus() {
  const [duration, setDuration] = useState<number>(25);
  const [habitId, setHabitId] = useState<string | "">("");
  const [remaining, setRemaining] = useState<number>(25 * 60);
  const [running, setRunning] = useState(false);
  const [today, setToday] = useState<FocusSession[]>(focusSessionsToday);
  const startedAtRef = useRef<string | null>(null);
  const habits = useMemo(() => getHabits(), []);

  // Reset remaining when duration changes (and not running)
  useEffect(() => {
    if (!running) setRemaining(duration * 60);
  }, [duration, running]);

  // Tick
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          finish(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  function start() {
    startedAtRef.current = new Date().toISOString();
    setRunning(true);
  }
  function pause() { setRunning(false); }
  function reset() {
    setRunning(false);
    setRemaining(duration * 60);
    startedAtRef.current = null;
  }
  function finish(completed: boolean) {
    setRunning(false);
    const startedAt = startedAtRef.current ?? new Date().toISOString();
    const completedMin = Math.round((duration * 60 - remaining) / 60) || (completed ? duration : 0);
    const session: FocusSession = {
      id: crypto.randomUUID(),
      startedAt,
      durationMin: duration,
      completedMin: completed ? duration : completedMin,
      habitId: habitId || undefined,
      completed,
    };
    logFocusSession(session);
    setToday(focusSessionsToday());
    if (completed) {
      const reward = Math.round(duration * 1.5); // 1.5 XP / focused minute
      addXP(reward);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast.success(`Focus complete — +${reward} XP forged.`);
    } else {
      toast("Session ended early — progress logged.");
    }
    startedAtRef.current = null;
    setRemaining(duration * 60);
  }

  const totalSeconds = duration * 60;
  const progress = 1 - remaining / totalSeconds;
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-5 relative overflow-hidden"
      >
        <div
          className="absolute -top-12 -right-10 w-44 h-44 rounded-full opacity-30 blur-2xl"
          style={{ background: "var(--gradient-arcane)" }}
        />
        <div className="relative">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Sanctum</p>
          <h1 className="font-display text-2xl text-gradient-forest">Focus Mode</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Step into the silent grove. The world fades; your work begins.
          </p>
        </div>
      </motion.div>

      {/* Preset duration */}
      <div className="flex gap-2">
        {PRESETS.map((m) => (
          <button
            key={m}
            disabled={running}
            onClick={() => setDuration(m)}
            className={cn(
              "flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
              duration === m
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
              running && "opacity-50 cursor-not-allowed",
            )}
          >
            {m} min
          </button>
        ))}
      </div>

      {/* Optional linked habit */}
      {habits.length > 0 && (
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">
            Link to habit (optional)
          </label>
          <select
            disabled={running}
            value={habitId}
            onChange={(e) => setHabitId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-card/60 px-3 py-2 text-sm"
          >
            <option value="">— None —</option>
            {habits.map((h) => (
              <option key={h.id} value={h.id}>{h.icon} {h.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Timer ring */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-3xl p-8 flex flex-col items-center"
      >
        <div className="relative w-56 h-56">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="46"
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="3"
            />
            <motion.circle
              cx="50" cy="50" r="46"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 46}
              animate={{ strokeDashoffset: 2 * Math.PI * 46 * (1 - progress) }}
              transition={{ duration: 0.4, ease: "linear" }}
              style={{ filter: "drop-shadow(0 0 6px hsl(var(--primary) / 0.6))" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Timer className="w-5 h-5 text-rune mb-1 animate-rune-pulse" />
            <p className="font-display text-5xl tabular-nums">{mm}:{ss}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {running ? "in the grove…" : "ready"}
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          {!running ? (
            <Button onClick={start} className="gap-2 px-6">
              <Play className="w-4 h-4" /> Begin
            </Button>
          ) : (
            <Button onClick={pause} variant="outline" className="gap-2 px-6">
              <Pause className="w-4 h-4" /> Pause
            </Button>
          )}
          <Button onClick={reset} variant="ghost" className="gap-2">
            <RotateCcw className="w-4 h-4" /> Reset
          </Button>
        </div>
      </motion.div>

      {/* Today's sessions */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="font-display text-lg">Today's grove</p>
          <p className="text-xs text-muted-foreground">
            {today.length} session{today.length !== 1 ? "s" : ""} · {today.reduce((a, s) => a + s.completedMin, 0)} min
          </p>
        </div>
        <AnimatePresence>
          {today.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              <Sparkles className="w-5 h-5 inline-block mr-1 text-rune" />
              No focus sessions yet today.
            </p>
          ) : (
            <ul className="space-y-2">
              {today.map((s) => (
                <motion.li
                  key={s.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between text-sm rounded-lg border border-border px-3 py-2"
                >
                  <span>
                    {new Date(s.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {" · "}
                    {s.completedMin}/{s.durationMin} min
                  </span>
                  <span className={cn("text-xs font-medium", s.completed ? "text-primary" : "text-muted-foreground")}>
                    {s.completed ? "Complete" : "Partial"}
                  </span>
                </motion.li>
              ))}
            </ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
