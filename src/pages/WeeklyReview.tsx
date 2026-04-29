import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import { generateWeeklyReview } from "@/lib/weeklyReview";

export default function WeeklyReview() {
  const r = generateWeeklyReview();
  const tone =
    r.successRate >= 70 ? "text-primary"
    : r.successRate >= 40 ? "text-rune"
    : "text-destructive";

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-5"
      >
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{r.weekLabel}</p>
        <h1 className="font-display text-2xl text-gradient-forest">Weekly Review</h1>
        <p className="text-sm text-muted-foreground mt-1">A reflection on your last seven days.</p>
      </motion.div>

      <div className="glass-card rounded-2xl p-5 text-center">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Success rate</p>
        <p className={`font-display text-5xl mt-1 ${tone}`}>{r.successRate}%</p>
        <p className="text-xs text-muted-foreground mt-1">
          {r.totalCompleted} of {r.totalOpportunities} habit-days completed
        </p>
        <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all"
            style={{ width: `${r.successRate}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {r.topHabit && (
          <div className="glass-card rounded-2xl p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-primary" /> Strongest
            </p>
            <p className="font-display text-base mt-1">{r.topHabit.icon} {r.topHabit.name}</p>
            <p className="text-xs text-muted-foreground">{Math.round(r.topHabit.rate * 100)}% this week</p>
          </div>
        )}
        {r.weakHabit && (
          <div className="glass-card rounded-2xl p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-destructive" /> Weakest
            </p>
            <p className="font-display text-base mt-1">{r.weakHabit.icon} {r.weakHabit.name}</p>
            <p className="text-xs text-muted-foreground">{Math.round(r.weakHabit.rate * 100)}% this week</p>
          </div>
        )}
      </div>

      <div className="glass-card rounded-2xl p-5">
        <p className="font-display text-lg flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-rune" /> Suggestions
        </p>
        <ul className="space-y-2 mt-2">
          {r.suggestions.map((s, i) => (
            <li key={i} className="text-sm rounded-lg border border-border px-3 py-2">{s}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
