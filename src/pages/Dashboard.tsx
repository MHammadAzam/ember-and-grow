import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Sparkles, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import HabitCard from "@/components/HabitCard";
import AddHabitDialog from "@/components/AddHabitDialog";
import AISuggestions from "@/components/AISuggestions";
import MoodSelector from "@/components/MoodSelector";
import confetti from "canvas-confetti";
import {
  Habit, getHabits, saveHabits, getProfile, getTodayKey, getMonthKey,
  calculateStreak, addXP, getDailyQuote, isCompletedToday, HABIT_COLORS,
} from "@/lib/habitStore";
import { toast } from "sonner";

export default function Dashboard() {
  const [habits, setHabits] = useState<Habit[]>(getHabits);
  const [profile, setProfile] = useState(getProfile);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const todayCompleted = habits.filter(isCompletedToday).length;
  const totalHabits = habits.length;
  const percent = totalHabits > 0 ? Math.round((todayCompleted / totalHabits) * 100) : 0;

  useEffect(() => { saveHabits(habits); }, [habits]);

  const toggleHabit = useCallback((id: string) => {
    setHabits(prev => {
      const updated = prev.map(h => {
        if (h.id !== id) return h;
        const today = getTodayKey();
        const completed = h.completedDates.includes(today);
        const newDates = completed
          ? h.completedDates.filter(d => d !== today)
          : [...h.completedDates, today];
        const streak = calculateStreak(newDates, h.shieldUsedOnMonth);
        return { ...h, completedDates: newDates, streak };
      });

      const allDone = updated.length > 0 && updated.every(isCompletedToday);
      if (allDone) confetti({ particleCount: 120, spread: 75, origin: { y: 0.6 } });

      const before = prev.find(h => h.id === id);
      if (before && !isCompletedToday(before)) {
        const p = addXP(10);
        setProfile(p);
      }
      return updated;
    });
  }, []);

  const useStreakShield = useCallback((id: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id !== id) return h;
      const month = getMonthKey();
      if (h.shieldUsedOnMonth === month) {
        toast.error("Shield already used this month");
        return h;
      }
      // backfill yesterday so the streak is preserved
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      const newDates = h.completedDates.includes(yesterday)
        ? h.completedDates
        : [...h.completedDates, yesterday];
      const streak = calculateStreak(newDates, month);
      toast.success("🛡️ Streak Shield used — your streak is safe!");
      return { ...h, completedDates: newDates, streak, shieldUsedOnMonth: month };
    }));
  }, []);

  const handleAddHabit = useCallback((data: Omit<Habit, "id" | "streak" | "completedDates" | "createdAt">) => {
    if (editingHabit) {
      setHabits(prev => prev.map(h => h.id === editingHabit.id ? { ...h, ...data } : h));
      setEditingHabit(null);
    } else {
      const newHabit: Habit = {
        ...data,
        id: crypto.randomUUID(),
        streak: 0,
        completedDates: [],
        createdAt: new Date().toISOString(),
      };
      setHabits(prev => [...prev, newHabit]);
    }
  }, [editingHabit]);

  const handleQuickAdd = useCallback((name: string, icon: string) => {
    const newHabit: Habit = {
      id: crypto.randomUUID(), name, icon,
      color: HABIT_COLORS[Math.floor(Math.random() * HABIT_COLORS.length)],
      frequency: "daily", worldType: "tree",
      streak: 0, completedDates: [], createdAt: new Date().toISOString(),
    };
    setHabits(prev => [...prev, newHabit]);
  }, []);

  const deleteHabit = useCallback((id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  }, []);

  return (
    <div className="space-y-5">
      {/* Hero greeting + level chip */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-5 relative overflow-hidden"
      >
        <div
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-30 blur-2xl"
          style={{ background: "var(--gradient-rune)" }}
        />
        <div className="flex items-center justify-between relative">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {profile.title}
            </p>
            <h1 className="font-display text-2xl text-gradient-forest">
              Greetings, {profile.name}
            </h1>
            <p className="text-sm text-muted-foreground italic mt-1">{getDailyQuote()}</p>
          </div>
          <div className="text-right">
            <div className="rune-glow rounded-full bg-card px-3 py-1.5 border border-accent/40">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Lvl</p>
              <p className="font-display text-xl text-rune leading-none">{profile.level}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Today's progress */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-end justify-between"
      >
        <div>
          <h2 className="font-display text-xl">Today's Quests</h2>
          <p className="text-muted-foreground text-sm">
            {totalHabits === 0 ? "Forge your first habit below" : `${todayCompleted}/${totalHabits} completed`}
          </p>
        </div>
        {totalHabits > 0 && (
          <p className="font-display text-3xl text-primary">{percent}%</p>
        )}
        <Button
          size="sm"
          onClick={() => { setEditingHabit(null); setDialogOpen(true); }}
          className="gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add
        </Button>
      </motion.div>

      {/* Mood */}
      <MoodSelector />

      {/* Habit list */}
      <div className="space-y-3">
        <AnimatePresence>
          {habits.map(h => (
            <div key={h.id} className="relative group">
              <HabitCard
                habit={h}
                onToggle={toggleHabit}
                onEdit={(habit) => { setEditingHabit(habit); setDialogOpen(true); }}
                onDelete={deleteHabit}
              />
              {/* Streak shield (only when streak >= 2 and not yet used this month) */}
              {h.streak >= 2 && h.shieldUsedOnMonth !== getMonthKey() && (
                <button
                  onClick={() => useStreakShield(h.id)}
                  title="Use Streak Shield (1/month)"
                  className="absolute -top-2 -right-2 z-10 w-7 h-7 rounded-full bg-card border border-accent/50 rune-glow flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <Shield className="w-3.5 h-3.5 text-rune" />
                </button>
              )}
            </div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty state nudge */}
      {totalHabits === 0 && (
        <div className="glass-card rounded-2xl p-8 text-center">
          <Sparkles className="w-8 h-8 mx-auto text-rune animate-rune-pulse mb-3" />
          <p className="font-display text-lg">Your story starts now</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Forge your first habit and watch your world come alive.
          </p>
          <Button onClick={() => setDialogOpen(true)} className="gap-1.5">
            <Plus className="w-4 h-4" /> Forge First Habit
          </Button>
        </div>
      )}

      {/* AI suggestions */}
      <AISuggestions onAdd={handleQuickAdd} existingNames={habits.map(h => h.name)} />

      <AddHabitDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleAddHabit}
        editingHabit={editingHabit}
      />
    </div>
  );
}
