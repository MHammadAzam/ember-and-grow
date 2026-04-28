import { useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, Lock } from "lucide-react";
import { evaluateAchievements } from "@/lib/achievements";

export default function Achievements() {
  const items = useMemo(evaluateAchievements, []);
  const unlockedCount = items.filter(i => i.unlocked).length;

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-5 relative overflow-hidden"
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-25 blur-2xl"
             style={{ background: "var(--gradient-rune)" }} />
        <div className="relative flex items-start gap-3">
          <Trophy className="w-7 h-7 text-rune mt-1" />
          <div>
            <h1 className="font-display text-2xl text-gradient-forest">Achievements</h1>
            <p className="text-sm text-muted-foreground">
              {unlockedCount} of {items.length} forged.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {items.map(({ achievement, unlocked }) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`glass-card rounded-2xl p-4 text-center ${
              unlocked ? "border-accent/50" : "opacity-60"
            }`}
          >
            <div className={`text-3xl ${unlocked ? "" : "grayscale"}`}>{achievement.emoji}</div>
            <p className="font-display text-sm mt-1">{achievement.name}</p>
            <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
              {achievement.description}
            </p>
            {!unlocked && (
              <Lock className="w-3.5 h-3.5 mx-auto mt-2 text-muted-foreground" />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
