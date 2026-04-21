import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import GamificationPanel from "@/components/GamificationPanel";
import ProgressChart from "@/components/ProgressChart";
import { getHabits, getProfile, getMoods, isCompletedToday } from "@/lib/habitStore";

export default function Stats() {
  const habits = getHabits();
  const profile = getProfile();
  const moods = getMoods();
  const [range, setRange] = useState<"week" | "month">("week");

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
  // Most failed = lowest completion-per-day-since-creation ratio
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
