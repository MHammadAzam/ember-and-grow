import { motion } from "framer-motion";
import { Habit, isCompletedToday } from "@/lib/habitStore";

interface Props {
  habits: Habit[];
}

/** Simple tree visualization: each habit = a tree whose size depends on streak */
export default function TreeVisualization({ habits }: Props) {
  if (habits.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-4xl mb-3">🌱</p>
        <p>Add habits to grow your forest!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-6 py-8">
      {habits.map((habit, i) => {
        const completed = isCompletedToday(habit);
        const stage = habit.streak >= 30 ? 4 : habit.streak >= 14 ? 3 : habit.streak >= 7 ? 2 : habit.streak >= 1 ? 1 : 0;
        const trees = ["🌱", "🌿", "🪴", "🌳", "🌲"];
        const sizes = [40, 48, 56, 64, 72];

        return (
          <motion.div
            key={habit.id}
            className="flex flex-col items-center gap-2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.1, type: "spring" }}
          >
            <motion.span
              style={{ fontSize: sizes[stage] }}
              animate={completed ? { scale: [1, 1.15, 1] } : { opacity: 0.5, filter: "grayscale(0.8)" }}
              transition={{ duration: 0.5 }}
              className="cursor-default"
              title={`${habit.name} — ${habit.streak} day streak`}
            >
              {trees[stage]}
            </motion.span>
            <span className="text-xs text-muted-foreground font-medium text-center max-w-[80px] truncate">
              {habit.icon} {habit.name}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
