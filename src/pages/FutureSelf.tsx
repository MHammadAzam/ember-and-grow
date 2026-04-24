import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, AlertCircle, Eye, Skull, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  getAlterEgo, getFutureLetters, getHabits, saveFutureLetters,
  type FutureSelfLetter,
} from "@/lib/habitStore";
import { useSpeech } from "@/hooks/useSpeech";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const HORIZONS = [30, 90, 365];

export default function FutureSelf() {
  const [letters, setLetters] = useState<FutureSelfLetter[]>(getFutureLetters);
  const [draft, setDraft] = useState("");
  const [horizon, setHorizon] = useState<number>(90);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { speak, stop, speaking, supported: speechSupported } = useSpeech();
  const ego = useMemo(() => getAlterEgo(), []);

  async function generate() {
    if (draft.trim().length < 10) {
      toast.error("Write at least one sentence to your future self.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const habits = getHabits();
      const cutoff = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
      const habitSummary = habits.map((h) => ({
        name: h.name,
        streak: h.streak,
        last30Completions: h.completedDates.filter((d) => d >= cutoff).length,
      }));

      const { data, error: fnErr } = await supabase.functions.invoke("future-self", {
        body: { letter: draft, horizonDays: horizon, habits: habitSummary, alterEgo: ego },
      });
      if (fnErr) throw new Error(fnErr.message);
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);

      const entry: FutureSelfLetter = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        horizonDays: horizon,
        letter: draft,
        bestFuture: (data as { bestFuture: string }).bestFuture,
        worstFuture: (data as { worstFuture: string }).worstFuture,
      };
      const next = [entry, ...letters].slice(0, 20);
      setLetters(next);
      saveFutureLetters(next);
      setDraft("");
      toast.success("The Oracle has spoken.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "The Oracle could not be reached.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function deleteLetter(id: string) {
    const next = letters.filter((l) => l.id !== id);
    setLetters(next);
    saveFutureLetters(next);
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
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Oracle of Time</p>
          <h1 className="font-display text-2xl text-gradient-forest">Future Self</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Write to who you wish to become. The Oracle reveals two paths.
          </p>
        </div>
      </motion.div>

      {/* Composer */}
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={5}
          placeholder="Dear future me, by the time you read this I hope…"
          className="resize-none"
        />
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Horizon</p>
          <div className="flex gap-2">
            {HORIZONS.map((d) => (
              <button
                key={d}
                onClick={() => setHorizon(d)}
                className={cn(
                  "flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                  horizon === d
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground",
                )}
              >
                {d === 365 ? "1 year" : `${d} days`}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={generate} disabled={loading} className="w-full gap-2">
          <Sparkles className="w-4 h-4" />
          {loading ? "The Oracle is gazing…" : "Reveal both futures"}
        </Button>
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}
      </div>

      {/* History */}
      <AnimatePresence>
        {letters.map((l) => {
          const speakAll = () =>
            speak(`Best future. ${l.bestFuture} ... Worst future. ${l.worstFuture}`);
          return (
            <motion.div
              key={l.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-2xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {new Date(l.createdAt).toLocaleDateString()} ·{" "}
                  {l.horizonDays === 365 ? "1 year" : `${l.horizonDays} days`} ahead
                </p>
                <div className="flex gap-1">
                  {speechSupported && (
                    <button
                      onClick={() => (speaking ? stop() : speakAll())}
                      title={speaking ? "Stop" : "Hear the Oracle"}
                      className="text-muted-foreground hover:text-rune transition-colors text-xs"
                    >
                      {speaking ? "⏸ Stop" : "🔊 Speak"}
                    </button>
                  )}
                  <button
                    onClick={() => deleteLetter(l.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <blockquote className="border-l-2 border-accent/50 pl-3 text-sm italic text-muted-foreground">
                {l.letter}
              </blockquote>
              <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="w-4 h-4 text-primary" />
                  <p className="font-display text-sm">If you stay consistent…</p>
                </div>
                <p className="text-sm leading-relaxed">{l.bestFuture}</p>
              </div>
              <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Skull className="w-4 h-4 text-destructive" />
                  <p className="font-display text-sm">If you let go…</p>
                </div>
                <p className="text-sm leading-relaxed">{l.worstFuture}</p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
