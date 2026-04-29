import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, Flame, Trophy, Video, Coins, Calendar, ScrollText } from "lucide-react";
import { buildTimeline, type TimelineEvent } from "@/lib/timeline";

const TYPE_ICON: Record<TimelineEvent["type"], any> = {
  "habit-created": ScrollText,
  "streak-milestone": Flame,
  "level-up": Trophy,
  "focus-session": Sparkles,
  "journal": Video,
  "bet-won": Coins,
  "bet-lost": Coins,
  "shield-used": Sparkles,
};

export default function Timeline() {
  const events = buildTimeline().slice(0, 80);

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-5"
      >
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Saga</p>
        <h1 className="font-display text-2xl text-gradient-forest">Your Life Story</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Every milestone, ember and slip — woven into one timeline.
        </p>
      </motion.div>

      {events.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <Calendar className="w-8 h-8 mx-auto text-rune mb-2" />
          <p className="text-sm text-muted-foreground">
            Forge a habit and your story will begin to write itself.
          </p>
          <Link to="/dashboard" className="mt-3 inline-block text-primary text-sm">Go to Dashboard →</Link>
        </div>
      ) : (
        <div className="relative pl-6">
          <div className="absolute left-2 top-2 bottom-2 w-px bg-gradient-to-b from-primary/60 via-border to-transparent" />
          <ul className="space-y-3">
            {events.map((e, i) => {
              const Icon = TYPE_ICON[e.type] ?? Sparkles;
              return (
                <motion.li
                  key={`${e.type}-${i}-${e.date}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className="relative glass-card rounded-xl p-3"
                >
                  <span className="absolute -left-[18px] top-3 w-3 h-3 rounded-full bg-primary ring-4 ring-background" />
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{e.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug">{e.title}</p>
                      {e.detail && <p className="text-xs text-muted-foreground truncate">{e.detail}</p>}
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 flex items-center gap-1">
                        <Icon className="w-3 h-3" />
                        {new Date(e.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
