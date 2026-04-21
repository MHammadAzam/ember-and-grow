import { motion } from "framer-motion";
import { Habit, isCompletedToday } from "@/lib/habitStore";

interface Props { habits: Habit[]; }

const TREE_STAGES     = ["🌱", "🌿", "🪴", "🌳", "🌲"];
const BUILDING_STAGES = ["🛖", "🏚️", "🏠", "🏛️", "🏰"];
const PLANET_STAGES   = ["☄️", "🌑", "🌒", "🌍", "🪐"];

const SIZES = [40, 48, 58, 68, 80];

function stageFor(streak: number): number {
  if (streak >= 30) return 4;
  if (streak >= 14) return 3;
  if (streak >= 7)  return 2;
  if (streak >= 1)  return 1;
  return 0;
}

function visualFor(habit: Habit, stage: number): string {
  const set =
    habit.worldType === "building" ? BUILDING_STAGES :
    habit.worldType === "planet"   ? PLANET_STAGES   :
    TREE_STAGES;
  return set[stage];
}

/** The Habit World — each habit appears as a tree, tower, or planet that evolves with streak. */
export default function HabitWorld({ habits }: Props) {
  if (habits.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-5xl mb-4 animate-float">🌱</p>
        <p className="font-display text-lg">Your world awaits its first seed</p>
        <p className="text-sm mt-1">Forge a habit to begin building it.</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden">
      {/* Mystical ground gradient */}
      <div
        className="absolute inset-0 -z-10 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, hsl(var(--primary) / 0.12), transparent 60%), " +
            "radial-gradient(ellipse at 50% 100%, hsl(var(--accent) / 0.08), transparent 70%)",
        }}
      />
      <div className="flex flex-wrap justify-center gap-5 py-10 px-4">
        {habits.map((habit, i) => {
          const completed = isCompletedToday(habit);
          const stage = stageFor(habit.streak);
          return (
            <motion.div
              key={habit.id}
              className="flex flex-col items-center gap-2"
              initial={{ scale: 0, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: i * 0.07, type: "spring", stiffness: 120 }}
            >
              <motion.div
                className="relative"
                animate={completed
                  ? { y: [0, -6, 0], scale: [1, 1.08, 1] }
                  : { opacity: 0.55, filter: "grayscale(0.7)" }}
                transition={{ duration: 2.4, repeat: completed ? Infinity : 0 }}
              >
                {completed && (
                  <span className="absolute -inset-3 rounded-full bg-primary/15 blur-md animate-glow" />
                )}
                <span
                  style={{ fontSize: SIZES[stage] }}
                  className="relative drop-shadow-md"
                  title={`${habit.name} — ${habit.streak}-day streak`}
                >
                  {visualFor(habit, stage)}
                </span>
              </motion.div>
              <span className="text-xs font-medium max-w-[90px] truncate text-center">
                {habit.icon} {habit.name}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {habit.streak > 0 ? `🔥 ${habit.streak}` : "no streak"}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
