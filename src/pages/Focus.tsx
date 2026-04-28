import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Sparkles, Timer, Music, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  addXP, focusSessionsToday, getHabits, logFocusSession,
  type FocusSession,
} from "@/lib/habitStore";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import * as ambient from "@/lib/ambientSound";
import { usePremium } from "@/hooks/usePremium";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";

const PRESETS = [30, 60, 120] as const; // minutes
const STATE_KEY = "lifeforge_focus_state";

interface PersistedState {
  duration: number;
  habitId: string;
  endsAt?: number;        // ms epoch — only present while running
  pausedRemaining?: number; // seconds — only when paused
}

function loadState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function saveState(s: PersistedState | null) {
  if (s) localStorage.setItem(STATE_KEY, JSON.stringify(s));
  else localStorage.removeItem(STATE_KEY);
}

const AMBIENT_OPTIONS: { kind: ambient.AmbientKind; label: string; emoji: string }[] = [
  { kind: "off",    label: "Silence",     emoji: "🤫" },
  { kind: "rain",   label: "Rain",        emoji: "🌧" },
  { kind: "white",  label: "White noise", emoji: "📻" },
  { kind: "forest", label: "Forest hum",  emoji: "🌲" },
];

export default function Focus() {
  const persisted = useMemo(loadState, []);
  const { unlocked: premium } = usePremium();

  const [duration, setDuration] = useState<number>(persisted?.duration ?? 30);
  const [habitId, setHabitId] = useState<string | "">(persisted?.habitId ?? "");
  // Compute initial remaining from persisted endsAt (if running) or pausedRemaining.
  const [remaining, setRemaining] = useState<number>(() => {
    if (persisted?.endsAt) {
      return Math.max(0, Math.round((persisted.endsAt - Date.now()) / 1000));
    }
    if (typeof persisted?.pausedRemaining === "number") {
      return Math.max(0, persisted.pausedRemaining);
    }
    return (persisted?.duration ?? 30) * 60;
  });
  const [running, setRunning] = useState<boolean>(() => {
    return !!(persisted?.endsAt && persisted.endsAt > Date.now());
  });
  const [today, setToday] = useState<FocusSession[]>(focusSessionsToday);
  const startedAtRef = useRef<string | null>(null);
  const [ambientKind, setAmbientKind] = useState<ambient.AmbientKind>("off");
  const [summary, setSummary] = useState<{ minutes: number; xp: number; complete: boolean } | null>(null);
  const habits = useMemo(() => getHabits(), []);

  // Reset remaining when duration changes (and not running)
  useEffect(() => {
    if (!running) {
      setRemaining(duration * 60);
      saveState(null);
    }
  }, [duration, running]);

  // Tick — drives by wall clock so it's accurate even when tab was backgrounded.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const s = loadState();
      if (s?.endsAt) {
        const r = Math.max(0, Math.round((s.endsAt - Date.now()) / 1000));
        setRemaining(r);
        if (r <= 0) {
          clearInterval(id);
          finish(true);
        }
      }
    }, 500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  // Stop ambient when leaving page
  useEffect(() => () => ambient.stop(), []);

  function start() {
    startedAtRef.current = new Date().toISOString();
    const endsAt = Date.now() + remaining * 1000;
    saveState({ duration, habitId, endsAt });
    setRunning(true);
    if (premium && ambientKind !== "off") ambient.play(ambientKind);
  }
  function pause() {
    setRunning(false);
    saveState({ duration, habitId, pausedRemaining: remaining });
    ambient.stop();
  }
  function reset() {
    setRunning(false);
    setRemaining(duration * 60);
    startedAtRef.current = null;
    saveState(null);
    ambient.stop();
  }
  function finish(completed: boolean) {
    setRunning(false);
    const startedAt = startedAtRef.current ?? new Date().toISOString();
    const completedMin = Math.round((duration * 60 - remaining) / 60) || (completed ? duration : 0);
    const minutes = completed ? duration : completedMin;
    const session: FocusSession = {
      id: crypto.randomUUID(),
      startedAt,
      durationMin: duration,
      completedMin: minutes,
      habitId: habitId || undefined,
      completed,
    };
    logFocusSession(session);
    setToday(focusSessionsToday());
    saveState(null);
    ambient.stop();
    let xp = 0;
    if (completed) {
      xp = Math.round(duration * 1.5);
      addXP(xp);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast.success(`Focus complete — +${xp} XP forged.`);
    } else {
      toast("Session ended early — progress logged.");
    }
    setSummary({ minutes, xp, complete: completed });
    startedAtRef.current = null;
    setRemaining(duration * 60);
  }

  const totalSeconds = duration * 60;
  const progress = 1 - remaining / totalSeconds;
  const hh = Math.floor(remaining / 3600);
  const mm = String(Math.floor((remaining % 3600) / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const display = hh > 0 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;

  function pickAmbient(k: ambient.AmbientKind) {
    setAmbientKind(k);
    if (running) {
      if (k === "off") ambient.stop();
      else ambient.play(k);
    }
  }

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
            {m >= 60 ? `${m / 60} hour${m === 60 ? "" : "s"}` : `${m} min`}
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

      {/* Ambient sounds (premium) */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5" /> Ambient sound
          </p>
          {!premium && (
            <Link to="/premium" className="text-[11px] text-rune flex items-center gap-1">
              <Lock className="w-3 h-3" /> Premium
            </Link>
          )}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {AMBIENT_OPTIONS.map((o) => (
            <button
              key={o.kind}
              disabled={!premium && o.kind !== "off"}
              onClick={() => pickAmbient(o.kind)}
              className={cn(
                "rounded-xl border px-2 py-2 text-center transition-colors",
                ambientKind === o.kind
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
                (!premium && o.kind !== "off") && "opacity-40 cursor-not-allowed",
              )}
            >
              <div className="text-base">{o.emoji}</div>
              <div className="text-[10px] mt-0.5 leading-tight">{o.label}</div>
            </button>
          ))}
        </div>
      </div>

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
            <p className="font-display text-5xl tabular-nums">{display}</p>
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

      {/* Session summary modal */}
      <AnimatePresence>
        {summary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSummary(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card rounded-2xl p-6 max-w-sm w-full text-center relative"
            >
              <button
                onClick={() => setSummary(null)}
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="text-4xl mb-2">{summary.complete ? "🌟" : "🌱"}</div>
              <h2 className="font-display text-xl text-gradient-forest">
                {summary.complete ? "Session forged!" : "A seed of focus"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                You focused for <b className="text-foreground">{summary.minutes} minute{summary.minutes === 1 ? "" : "s"}</b>.
              </p>
              {summary.xp > 0 && (
                <p className="text-sm mt-1">+{summary.xp} XP added to your saga.</p>
              )}
              <Button onClick={() => setSummary(null)} className="mt-4 w-full">Continue</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
