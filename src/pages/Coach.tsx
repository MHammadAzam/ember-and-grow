import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Wand2, Plus, Compass, AlertCircle } from "lucide-react";
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
} from "@/lib/habitStore";
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
interface Cache { date: string; data: CoachResponse; }

function loadCache(): Cache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Cache) : null;
  } catch { return null; }
}

export default function Coach() {
  const todayKey = new Date().toISOString().split("T")[0];
  const cached = loadCache();
  const initial = cached?.date === todayKey ? cached.data : null;

  const [data, setData] = useState<CoachResponse | null>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setData(next);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ date: todayKey, data: next }));
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
