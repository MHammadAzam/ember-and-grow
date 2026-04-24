import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Flame, Plus, Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addXP, getBets, getHabits, getProfile, getTodayKey, resolveExpiredBets, saveBets,
  type HabitBet,
} from "@/lib/habitStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DURATIONS = [
  { label: "3 days", days: 3, required: 3 },
  { label: "7 days", days: 7, required: 6 },
  { label: "14 days", days: 14, required: 12 },
];

export default function Bets() {
  const habits = useMemo(() => getHabits(), []);
  const [bets, setBets] = useState<HabitBet[]>(getBets);
  const [profile, setProfile] = useState(getProfile);
  const [open, setOpen] = useState(false);
  const [habitId, setHabitId] = useState<string>(habits[0]?.id ?? "");
  const [stake, setStake] = useState<number>(20);
  const [durationIdx, setDurationIdx] = useState<number>(1);

  // Resolve expired bets on mount
  useEffect(() => {
    const { bets: next, xpDelta, resolved } = resolveExpiredBets(habits);
    if (resolved.length > 0) {
      setBets(next);
      if (xpDelta > 0) {
        const p = addXP(xpDelta);
        setProfile(p);
      } else {
        setProfile(getProfile());
      }
      const wins = resolved.filter((r) => r.status === "won").length;
      const losses = resolved.length - wins;
      if (wins) toast.success(`🏆 ${wins} bet${wins > 1 ? "s" : ""} won — +${xpDelta} XP!`);
      if (losses) toast(`Lost ${losses} bet${losses > 1 ? "s" : ""}. The forge tempers you.`);
    }
  }, [habits]);

  const active = bets.filter((b) => b.status === "active");
  const history = bets.filter((b) => b.status !== "active").slice(0, 10);

  function placeBet() {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return toast.error("Choose a habit first.");
    if (stake < 5) return toast.error("Minimum stake is 5 XP.");
    if (stake > profile.xp) return toast.error("Not enough XP to stake.");
    if (active.some((b) => b.habitId === habitId))
      return toast.error("You already have an active bet on this habit.");

    const dur = DURATIONS[durationIdx];
    const today = getTodayKey();
    const end = new Date(Date.now() + (dur.days - 1) * 86400000)
      .toISOString().split("T")[0];

    const newBet: HabitBet = {
      id: crypto.randomUUID(),
      habitId: habit.id,
      habitName: habit.name,
      habitIcon: habit.icon,
      stake,
      payout: stake * 2,
      startDate: today,
      endDate: end,
      requiredCompletions: dur.required,
      status: "active",
    };
    // Deduct stake immediately (negative XP via addXP cap)
    const p = addXP(-stake);
    setProfile(p);
    const next = [newBet, ...bets];
    saveBets(next);
    setBets(next);
    setOpen(false);
    setStake(20);
    toast.success(`⚔️ Bet placed: ${stake} XP on ${habit.name}`);
  }

  function cancelBet(id: string) {
    const bet = bets.find((b) => b.id === id);
    if (!bet) return;
    // Refund half on cancel
    const refund = Math.floor(bet.stake / 2);
    const p = addXP(refund);
    setProfile(p);
    const next = bets.filter((b) => b.id !== id);
    saveBets(next);
    setBets(next);
    toast(`Bet withdrawn — ${refund} XP refunded.`);
  }

  function progressFor(b: HabitBet) {
    const habit = habits.find((h) => h.id === b.habitId);
    if (!habit) return { done: 0, days: 0 };
    const today = getTodayKey();
    const end = b.endDate < today ? b.endDate : today;
    const done = habit.completedDates.filter((d) => d >= b.startDate && d <= end).length;
    const days = Math.round(
      (new Date(end).getTime() - new Date(b.startDate).getTime()) / 86400000,
    ) + 1;
    return { done, days };
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
          style={{ background: "var(--gradient-ember)" }}
        />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Forge Wager</p>
            <h1 className="font-display text-2xl text-gradient-forest">Habit Bets</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Stake XP on consistency. Win double — or lose it to the forge.
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">XP</p>
            <p className="font-display text-xl text-rune leading-none">{profile.xp}</p>
          </div>
        </div>
      </motion.div>

      <Button onClick={() => setOpen((o) => !o)} className="w-full gap-2" disabled={habits.length === 0}>
        <Plus className="w-4 h-4" /> {open ? "Close" : "Place a new bet"}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card rounded-2xl p-5 space-y-4 overflow-hidden"
          >
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Habit</label>
              <select
                value={habitId}
                onChange={(e) => setHabitId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-card/60 px-3 py-2 text-sm"
              >
                {habits.map((h) => (
                  <option key={h.id} value={h.id}>{h.icon} {h.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Stake (XP)</label>
              <Input
                type="number" min={5} max={profile.xp} value={stake}
                onChange={(e) => setStake(Math.max(0, parseInt(e.target.value) || 0))}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Win → +{stake * 2} XP · Lose → −{stake} XP
              </p>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Challenge</label>
              <div className="flex gap-2 mt-1">
                {DURATIONS.map((d, i) => (
                  <button
                    key={d.label}
                    onClick={() => setDurationIdx(i)}
                    className={cn(
                      "flex-1 rounded-xl border px-2 py-2 text-xs font-medium",
                      durationIdx === i
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    <div>{d.label}</div>
                    <div className="text-[10px] opacity-80">{d.required}/{d.days} days</div>
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={placeBet} className="w-full gap-2">
              <Coins className="w-4 h-4" /> Stake {stake} XP
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active bets */}
      <section>
        <p className="font-display text-lg mb-2">Active wagers</p>
        {active.length === 0 ? (
          <div className="glass-card rounded-2xl p-6 text-center text-sm text-muted-foreground">
            No active bets. The forge waits.
          </div>
        ) : (
          <div className="space-y-2">
            {active.map((b) => {
              const { done, days } = progressFor(b);
              const pct = Math.min(100, Math.round((done / b.requiredCompletions) * 100));
              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-xl p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl">{b.habitIcon}</span>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{b.habitName}</p>
                        <p className="text-xs text-muted-foreground">
                          {done}/{b.requiredCompletions} done · day {days}/{Math.round((new Date(b.endDate).getTime() - new Date(b.startDate).getTime()) / 86400000) + 1}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">stake</p>
                      <p className="font-display text-sm text-rune">{b.stake} XP</p>
                    </div>
                    <button
                      onClick={() => cancelBet(b.id)}
                      title="Withdraw (refund half)"
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* History */}
      {history.length > 0 && (
        <section>
          <p className="font-display text-lg mb-2">Past wagers</p>
          <div className="space-y-2">
            {history.map((b) => (
              <div
                key={b.id}
                className={cn(
                  "rounded-xl border p-3 flex items-center justify-between text-sm",
                  b.status === "won"
                    ? "border-primary/40 bg-primary/5"
                    : "border-destructive/40 bg-destructive/5",
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {b.status === "won" ? (
                    <Trophy className="w-4 h-4 text-primary shrink-0" />
                  ) : (
                    <Flame className="w-4 h-4 text-destructive shrink-0" />
                  )}
                  <span className="truncate">{b.habitIcon} {b.habitName}</span>
                </div>
                <span className={b.status === "won" ? "text-primary font-medium" : "text-destructive font-medium"}>
                  {b.status === "won" ? `+${b.payout}` : `−${b.stake}`} XP
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
