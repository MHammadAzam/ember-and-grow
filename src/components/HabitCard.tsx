import { motion, AnimatePresence } from "framer-motion";
import { Check, Flame, Pencil, Trash2 } from "lucide-react";
import { Habit, isCompletedToday } from "@/lib/habitStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  habit: Habit;
  onToggle: (id: string) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (id: string) => void;
}

export default function HabitCard({ habit, onToggle, onEdit, onDelete }: Props) {
  const completed = isCompletedToday(habit);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        "glass-card-hover rounded-xl p-5 relative group",
        completed && "ring-2 ring-primary/30"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Check button */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => onToggle(habit.id)}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 border-2",
            completed
              ? "border-primary bg-primary"
              : "border-muted-foreground/30 hover:border-primary"
          )}
        >
          <AnimatePresence>
            {completed && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Check className="w-5 h-5 text-primary-foreground" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{habit.icon}</span>
            <h3 className={cn(
              "font-semibold transition-all",
              completed && "line-through text-muted-foreground"
            )}>
              {habit.name}
            </h3>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="capitalize">{habit.frequency}</span>
            {habit.streak > 0 && (
              <motion.span
                className="flex items-center gap-1 text-streak font-medium"
                animate={habit.streak >= 3 ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <Flame className={cn("w-4 h-4", habit.streak >= 7 && "animate-fire-flicker")} />
                {habit.streak} day{habit.streak > 1 ? "s" : ""}
              </motion.span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(habit)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(habit.id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
