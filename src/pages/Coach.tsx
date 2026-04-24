import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Wand2, Plus, Compass, AlertCircle, RefreshCw, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  getHabits,
  getProfile,
  getMoods,
  isCompletedToday,
  saveHabits,
  HABIT_COLORS,
  type Habit,
  type MoodEntry,
} from "@/lib/habitStore";
import { useSpeech } from "@/hooks/useSpeech";
import { toast } from "sonner";

interface CoachInsight {
  title: string;
  body: string;
  tone: "positive" | "warning" | "neutral";
}
interface SuggestedHabit { name: string; icon: string; reason: string; }
interface CoachResponse {
  headline: string;
  insights: CoachInsight[];
  suggestedHabits: SuggestedHabit[];
  focusAction: string;
}

const CACHE_KEY = "lifeforge_coach_cache";
interface Cache {
  fingerprint: string;
  generatedAt: string; // ISO
  data: CoachResponse;
}

/** Stable fingerprint of the inputs the Coach actually consumes.
 *  When this string changes, cached coaching is stale and we offer a refresh. */
function buildFingerprint(habits: Habit[], moods: MoodEntry[]): string {
  const cutoff = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
  const today = new Date().toISOString().split("T")[0];
  const h = habits
    .map((x) => {
      const recent = x.completedDates.filter((d) => d >= cutoff).sort();
      return [x.id, x.name, x.worldType, x.streak, recent.join(",")].join("|");
    })
    .sort()
    .join(";");
  const m = moods
    .filter((x) => x.date >= cutoff)
    .map((x) => `${x.date}:${x.mood}`)
    .sort()
    .join(",");
  return `${today}::${h}::${m}`;
}

function loadCache(): Cache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Migrate legacy `{ date, data }` cache entries — treat as stale.
    if (!parsed?.fingerprint) return null;
    return parsed as Cache;
  } catch {
    return null;
  }
}

export default function Coach() {
  const cached = useMemo(loadCache, []);
  const [data, setData] = useState<CoachResponse | null>(cached?.data ?? null);
  const [cachedFingerprint, setCachedFingerprint] = useState<string | null>(
    cached?.fingerprint ?? null,
  );
  const [currentFingerprint, setCurrentFingerprint] = useState<string>(() =>
    buildFingerprint(getHabits(), getMoods()),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { speak, stop, speaking, supported: speechSupported } = useSpeech();

  // Re-check the fingerprint whenever the page becomes visible or storage changes.
  // This catches habit toggles done on Dashboard while Coach was open.
  useEffect(() => {
    const recompute = () => setCurrentFingerprint(buildFingerprint(getHabits(), getMoods()));
    const onVisibility = () => { if (!document.hidden) recompute(); };
    window.addEventListener("focus", recompute);
    window.addEventListener("storage", recompute);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", recompute);
      window.removeEventListener("storage", recompute);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const isStale =
    !!data && cachedFingerprint !== null && cachedFingerprint !== currentFingerprint;

  async function fetchCoach() {
    setLoading(true);
    setError(null);
    try {
      const habits = getHabits();
      const profile = getProfile();
      const moods = getMoods();
      const todayDone = habits.filter(isCompletedToday).length;

      // Trim each habit's completedDates to last 30 days to keep payload small.
      const cutoff = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
      const trimmedHabits = habits.map((h) => ({
        name: h.name,
        icon: h.icon,
        streak: h.streak,
        completedDates: h.completedDates.filter((d) => d >= cutoff),
        createdAt: h.createdAt,
        worldType: h.worldType,
      }));

      const { data: resp, error: fnErr } = await supabase.functions.invoke("ai-coach", {
        body: {
          profile: {
            name: profile.name,
            level: profile.level,
            xp: profile.xp,
            title: profile.title,
          },
          habits: trimmedHabits,
          moods: moods.slice(-30),
          todayDone,
          todayTotal: habits.length,
        },
      });

      if (fnErr) throw new Error(fnErr.message);
      if ((resp as { error?: string })?.error) throw new Error((resp as { error: string }).error);

      const next = resp as CoachResponse;
      const fingerprint = buildFingerprint(habits, moods);
      const cache: Cache = {
        fingerprint,
        generatedAt: new Date().toISOString(),
        data: next,
      };
      setData(next);
      setCachedFingerprint(fingerprint);
      setCurrentFingerprint(fingerprint);
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "The Coach could not be reached.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function adoptHabit(s: SuggestedHabit) {
    const habits = getHabits();
    if (habits.some((h) => h.name.toLowerCase() === s.name.toLowerCase())) {
      toast.info("You already track this habit");
      return;
    }
    const newHabit: Habit = {
      id: crypto.randomUUID(),
      name: s.name,
      icon: s.icon || "✨",
      color: HABIT_COLORS[Math.floor(Math.random() * HABIT_COLORS.length)],
      frequency: "daily",
      worldType: "tree",
      streak: 0,
      completedDates: [],
      createdAt: new Date().toISOString(),
    };
    saveHabits([...habits, newHabit]);
    toast.success(`Forged: ${s.icon} ${s.name}`);
  }

  return (
    <div className="space-y-5">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-5 relative overflow-hidden"
      >
        <div
          className="absolute -top-12 -right-10 w-44 h-44 rounded-full opacity-30 blur-2xl"
          style={{ background: "var(--gradient-rune)" }}
        />
        <div className="relative">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">AI Life Coach</p>
          <h1 className="font-display text-2xl text-gradient-forest">The Forest Sage</h1>
          <p className="text-sm text-muted-foreground mt-1">
            A wise eye on your habits, streaks, and moods.
          </p>
        </div>
      </motion.div>

      {/* Action card */}
      <div className="glass-card rounded-2xl p-5">
        {!data && !loading && (
          <div className="text-center py-4">
            <Compass className="w-10 h-10 mx-auto text-rune animate-rune-pulse mb-3" />
            <p className="font-display text-lg">Seek the Sage's counsel</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              I'll read your recent habits, streaks, and moods — then offer real, personal insight.
            </p>
            <Button onClick={fetchCoach} className="gap-2">
              <Wand2 className="w-4 h-4" /> Consult the Sage
            </Button>
          </div>
        )}

        {loading && (
          <div className="text-center py-6">
            <Sparkles className="w-8 h-8 mx-auto text-primary animate-rune-pulse mb-3" />
            <p className="text-sm text-muted-foreground">The Sage is reading your saga…</p>
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-4">
            <AlertCircle className="w-8 h-8 mx-auto text-destructive mb-2" />
            <p className="text-sm text-destructive mb-3">{error}</p>
            <Button onClick={fetchCoach} variant="outline" size="sm">Try again</Button>
          </div>
        )}

        {data && !loading && (
          <div className="space-y-4">
            {isStale && (
              <button
                onClick={fetchCoach}
                className="w-full flex items-center gap-2 rounded-xl border border-accent/50 bg-accent/10 px-3 py-2 text-left hover:bg-accent/15 transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-rune shrink-0" />
                <span className="text-xs text-muted-foreground flex-1">
                  Your habits or moods have shifted — refresh for new counsel.
                </span>
                <span className="text-xs font-medium text-rune">Refresh</span>
              </button>
            )}
            <div>
              <p className="font-display text-lg leading-snug text-gradient-forest">
                {data.headline}
              </p>
            </div>

            <div className="space-y-2.5">
              {data.insights.map((ins, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`rounded-xl border p-3 ${
                    ins.tone === "positive"
                      ? "border-primary/40 bg-primary/5"
                      : ins.tone === "warning"
                      ? "border-destructive/40 bg-destructive/5"
                      : "border-border bg-muted/30"
                  }`}
                >
                  <p className="font-medium text-sm">{ins.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{ins.body}</p>
                </motion.div>
              ))}
            </div>

            <div className="rounded-xl border border-accent/40 bg-accent/5 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Today's focus
              </p>
              <p className="text-sm mt-0.5">{data.focusAction}</p>
            </div>

            <Button onClick={fetchCoach} variant="ghost" size="sm" className="w-full">
              <Wand2 className="w-3.5 h-3.5 mr-1.5" /> Re-consult the Sage
            </Button>
          </div>
        )}
      </div>

      {/* Suggested habits */}
      {data && data.suggestedHabits.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <p className="font-display text-lg mb-3">Habits the Sage suggests</p>
          <div className="space-y-2">
            {data.suggestedHabits.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-border p-3"
              >
                <span className="text-2xl">{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{s.reason}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => adoptHabit(s)} className="gap-1">
                  <Plus className="w-3.5 h-3.5" /> Forge
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
