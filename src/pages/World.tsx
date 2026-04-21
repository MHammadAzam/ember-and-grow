import { motion } from "framer-motion";
import HabitWorld from "@/components/HabitWorld";
import { getHabits, isCompletedToday } from "@/lib/habitStore";

export default function World() {
  const habits = getHabits();
  const alive = habits.filter(isCompletedToday).length;

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-5"
      >
        <h1 className="font-display text-2xl text-gradient-forest">Your Living World</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Each habit shapes a tree, tower, or planet. Tend them daily to make your world flourish.
        </p>
        <div className="flex gap-4 text-sm mt-3">
          <span><b className="text-primary">{alive}</b> alive today</span>
          <span><b>{habits.length}</b> total</span>
        </div>
      </motion.div>

      <div className="glass-card rounded-2xl">
        <HabitWorld habits={habits} />
      </div>

      <p className="text-xs text-center text-muted-foreground">
        🌱 Seedling → 🌿 Sprout → 🪴 Sapling → 🌳 Tree → 🌲 Ancient
      </p>
    </div>
  );
}
