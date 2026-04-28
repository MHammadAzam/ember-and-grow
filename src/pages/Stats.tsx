import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import GamificationPanel from "@/components/GamificationPanel";
import ProgressChart from "@/components/ProgressChart";
import PaywallCard from "@/components/PaywallCard";
import { getHabits, getProfile, getMoods, isCompletedToday } from "@/lib/habitStore";
import {
  buildHeatmap, habitSuccessRates, bestTimeOfDay, consistencyScore,
  weeklyRates, forecastSuccessIn30Days,
} from "@/lib/analytics";
import { usePremium } from "@/hooks/usePremium";

export default function Stats() {
  const habits = getHabits();
  const profile = getProfile();
  const moods = getMoods();
  const [range, setRange] = useState<"week" | "month">("week");
  const { unlocked: premium } = usePremium();

  const totalCompletions = habits.reduce((sum, h) => sum + h.completedDates.length, 0);
  const longestStreak = Math.max(0, ...habits.map(h => h.streak));
  const todayDone = habits.filter(isCompletedToday).length;

  // Mood pattern: happiness rate over last 30 days
  const last30 = moods.slice(-30);
  const happyPct = last30.length
    ? Math.round((last30.filter(m => m.mood === "happy").length / last30.length) * 100)
    : 0;

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-5"
      >
        <h1 className="font-display text-2xl text-gradient-forest">Your Saga</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track every chapter of your discipline.
        </p>
      </motion.div>

      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Today" value={`${todayDone}/${habits.length || 0}`} />
        <StatTile label="Best streak" value={`🔥 ${longestStreak}`} />
        <StatTile label="Total deeds" value={totalCompletions.toString()} />
      </div>

      <GamificationPanel profile={profile} />

      {/* Mood insight */}
      {last30.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <p className="font-display text-lg mb-1">Mood Pattern</p>
          <p className="text-sm text-muted-foreground">
            Over the last {last30.length} day{last30.length === 1 ? "" : "s"}, you've felt{" "}
            <b className="text-primary">bright {happyPct}%</b> of the time.
          </p>
        </div>
      )}

      <Tabs defaultValue="chart">
        <TabsList className="w-full">
          <TabsTrigger value="chart" className="flex-1">Progress</TabsTrigger>
          <TabsTrigger value="failure" className="flex-1">Insights</TabsTrigger>
          <TabsTrigger value="advanced" className="flex-1">Advanced</TabsTrigger>
        </TabsList>
        <TabsContent value="chart">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display">Completion</h3>
              <div className="flex gap-1">
                {(["week", "month"] as const).map(r => (
                  <Button
                    key={r}
                    variant={range === r ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setRange(r)}
                    className="capitalize text-xs h-7"
                  >
                    {r}
                  </Button>
                ))}
              </div>
            </div>
            <ProgressChart habits={habits} range={range} />
          </div>
        </TabsContent>
        <TabsContent value="failure">
          <FailureInsights />
        </TabsContent>
        <TabsContent value="advanced">
          {premium ? <AdvancedAnalytics /> : (
            <PaywallCard
              feature="Advanced analytics"
              description="Heatmaps, weekly rates, consistency score, best time-of-day and a 30-day success forecast."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card rounded-xl p-3 text-center">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-display text-lg mt-0.5">{value}</p>
    </div>
  );
}

function FailureInsights() {
  const habits = getHabits();
  if (habits.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center text-muted-foreground text-sm">
        Forge a habit to see insights.
      </div>
    );
  }
  const ranked = [...habits]
    .map(h => {
      const days = Math.max(1, Math.ceil(
        (Date.now() - new Date(h.createdAt).getTime()) / 86400000
      ));
      return { h, ratio: h.completedDates.length / days };
    })
    .sort((a, b) => a.ratio - b.ratio);

  const weakest = ranked[0];
  const strongest = ranked[ranked.length - 1];

  return (
    <div className="glass-card rounded-2xl p-5 space-y-3">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Weakest habit</p>
        <p className="font-display">
          {weakest.h.icon} {weakest.h.name} — {Math.round(weakest.ratio * 100)}% rate
        </p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Strongest habit</p>
        <p className="font-display">
          {strongest.h.icon} {strongest.h.name} — {Math.round(strongest.ratio * 100)}% rate
        </p>
      </div>
      <p className="text-xs text-muted-foreground italic">
        Tip: focus on consistency for your weakest habit this week.
      </p>
    </div>
  );
}

function AdvancedAnalytics() {
  const cells = buildHeatmap(90);
  const rates = habitSuccessRates();
  const tod = bestTimeOfDay();
  const cs = consistencyScore(30);
  const weekly = weeklyRates(8);
  const forecast = forecastSuccessIn30Days();

  // 90-day heatmap = 13 weeks × 7 days. Render as a small grid.
  const weeks: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  function cellColor(ratio: number, hasHabits: boolean) {
    if (!hasHabits) return "hsl(var(--muted) / 0.5)";
    if (ratio === 0) return "hsl(var(--muted) / 0.6)";
    const opacity = 0.25 + ratio * 0.75;
    return `hsl(var(--primary) / ${opacity.toFixed(2)})`;
  }

  return (
    <div className="space-y-4">
      {/* Heatmap */}
      <div className="glass-card rounded-2xl p-5">
        <p className="font-display text-lg mb-1">90-day heatmap</p>
        <p className="text-xs text-muted-foreground mb-3">Each square is a day; brighter = more habits completed.</p>
        <div className="overflow-x-auto">
          <div className="flex gap-1">
            {weeks.map((wk, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {wk.map((c) => (
                  <div
                    key={c.date}
                    title={`${c.date} · ${c.completed}/${c.total}`}
                    className="w-3 h-3 rounded-sm"
                    style={{ background: cellColor(c.ratio, c.total > 0) }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly bars */}
      <div className="glass-card rounded-2xl p-5">
        <p className="font-display text-lg mb-3">Weekly success rate (last 8 weeks)</p>
        {weekly.length === 0 ? (
          <p className="text-sm text-muted-foreground">Forge a habit to start measuring.</p>
        ) : (
          <div className="flex items-end gap-1 h-24">
            {weekly.map((w, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-sm bg-primary/70"
                  style={{ height: `${Math.max(4, w.rate * 100)}%` }}
                  title={`${Math.round(w.rate * 100)}%`}
                />
                <span className="text-[9px] text-muted-foreground">{w.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Score grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Consistency (30d)</p>
          <p className="font-display text-2xl mt-1">{cs}%</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Best time of day</p>
          <p className="font-display text-base mt-1">{tod ? tod.label : "—"}</p>
          {tod && <p className="text-xs text-muted-foreground">{tod.count} sessions</p>}
        </div>
      </div>

      {/* Per-habit success */}
      {rates.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <p className="font-display text-lg mb-3">Habit success rate</p>
          <ul className="space-y-2">
            {rates.map(r => (
              <li key={r.habit.id} className="flex items-center gap-3">
                <span className="text-lg">{r.habit.icon}</span>
                <span className="flex-1 text-sm truncate">{r.habit.name}</span>
                <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${Math.min(100, r.rate * 100)}%` }} />
                </div>
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {Math.round(r.rate * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Forecast */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <p className="font-display text-lg">30-day forecast</p>
          {forecast.trend === "up" && <TrendingUp className="w-5 h-5 text-primary" />}
          {forecast.trend === "down" && <TrendingDown className="w-5 h-5 text-destructive" />}
          {forecast.trend === "flat" && <Minus className="w-5 h-5 text-muted-foreground" />}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          If you keep your current pace, your expected success rate in 30 days is{" "}
          <b className="text-primary">{forecast.predicted}%</b> (currently {forecast.current}%).
        </p>
        <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: `${forecast.predicted}%` }} />
        </div>
      </div>
    </div>
  );
}
