import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, TreePine, BarChart3, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HabitCard from "@/components/HabitCard";
import AddHabitDialog from "@/components/AddHabitDialog";
import TreeVisualization from "@/components/TreeVisualization";
import ProgressChart from "@/components/ProgressChart";
import AISuggestions from "@/components/AISuggestions";
import GamificationPanel from "@/components/GamificationPanel";
import confetti from "canvas-confetti";
import {
  Habit, getHabits, saveHabits, getProfile, getTodayKey,
  calculateStreak, addXP, getDailyQuote, isCompletedToday, HABIT_COLORS,
} from "@/lib/habitStore";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [habits, setHabits] = useState<Habit[]>(getHabits);
  const [profile, setProfile] = useState(getProfile);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [chartRange, setChartRange] = useState<"week" | "month">("week");

  const todayCompleted = habits.filter(isCompletedToday).length;
  const totalHabits = habits.length;

  // Persist
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
        const streak = calculateStreak(newDates);
        return { ...h, completedDates: newDates, streak };
      });

      // Check if all completed
      const allDone = updated.length > 0 && updated.every(isCompletedToday);
      if (allDone) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }

      // Award XP for completing (not uncompleting)
      const habit = prev.find(h => h.id === id);
      if (habit && !isCompletedToday(habit)) {
        const p = addXP(10);
        setProfile(p);
      }

      return updated;
    });
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
      id: crypto.randomUUID(), name, icon, color: HABIT_COLORS[Math.floor(Math.random() * HABIT_COLORS.length)],
      frequency: "daily", streak: 0, completedDates: [], createdAt: new Date().toISOString(),
    };
    setHabits(prev => [...prev, newHabit]);
  }, []);

  const deleteHabit = useCallback((id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2 font-display font-bold">
            <span className="text-xl">🌱</span> HabitFlow
          </Link>
          <Button size="sm" onClick={() => { setEditingHabit(null); setDialogOpen(true); }} className="gap-1.5">
            <Plus className="w-4 h-4" /> Add Habit
          </Button>
        </div>
      </header>

      <main className="container py-6 space-y-6 max-w-4xl">
        {/* Daily quote */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 text-center"
        >
          <p className="text-sm text-muted-foreground italic">{getDailyQuote()}</p>
        </motion.div>

        {/* Progress summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-display font-bold">Today's Habits</h1>
            <p className="text-muted-foreground text-sm">
              {totalHabits === 0 ? "Add your first habit!" : `${todayCompleted}/${totalHabits} completed`}
            </p>
          </div>
          {totalHabits > 0 && (
            <div className="text-right">
              <p className="text-3xl font-display font-bold text-primary">
                {totalHabits > 0 ? Math.round((todayCompleted / totalHabits) * 100) : 0}%
              </p>
            </div>
          )}
        </motion.div>

        {/* Habit cards */}
        <div className="space-y-3">
          <AnimatePresence>
            {habits.map(h => (
              <HabitCard
                key={h.id}
                habit={h}
                onToggle={toggleHabit}
                onEdit={(habit) => { setEditingHabit(habit); setDialogOpen(true); }}
                onDelete={deleteHabit}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* AI suggestions */}
        <AISuggestions onAdd={handleQuickAdd} existingNames={habits.map(h => h.name)} />

        {/* Tabs: Forest / Analytics / Stats */}
        <Tabs defaultValue="forest">
          <TabsList className="w-full">
            <TabsTrigger value="forest" className="flex-1 gap-1.5"><TreePine className="w-4 h-4" /> Forest</TabsTrigger>
            <TabsTrigger value="analytics" className="flex-1 gap-1.5"><BarChart3 className="w-4 h-4" /> Analytics</TabsTrigger>
            <TabsTrigger value="stats" className="flex-1 gap-1.5"><Sparkles className="w-4 h-4" /> Stats</TabsTrigger>
          </TabsList>
          <TabsContent value="forest">
            <div className="glass-card rounded-xl p-5">
              <h3 className="font-display font-semibold mb-2">🌳 Your Habit Forest</h3>
              <p className="text-sm text-muted-foreground mb-4">Complete habits to grow your trees. Build streaks for bigger trees!</p>
              <TreeVisualization habits={habits} />
            </div>
          </TabsContent>
          <TabsContent value="analytics">
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold">Progress</h3>
                <div className="flex gap-1">
                  {(["week", "month"] as const).map(r => (
                    <Button key={r} variant={chartRange === r ? "default" : "ghost"} size="sm"
                      onClick={() => setChartRange(r)} className="capitalize text-xs h-7">{r}</Button>
                  ))}
                </div>
              </div>
              <ProgressChart habits={habits} range={chartRange} />
            </div>
          </TabsContent>
          <TabsContent value="stats">
            <GamificationPanel profile={profile} />
          </TabsContent>
        </Tabs>
      </main>

      <AddHabitDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleAddHabit}
        editingHabit={editingHabit}
      />
    </div>
  );
}
