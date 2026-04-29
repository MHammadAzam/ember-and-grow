import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Heart } from "lucide-react";
import { getLifeScore } from "@/lib/lifeScore";
import { Link } from "react-router-dom";

/** Compact Life Score card — shows composite score (0–100) with trend. */
export default function LifeScoreCard() {
  const ls = getLifeScore();
  const Icon = ls.band === "rising" ? TrendingUp : ls.band === "fading" ? TrendingDown : Minus;
  const tone =
    ls.band === "rising" ? "text-primary"
    : ls.band === "fading" ? "text-destructive"
    : "text-muted-foreground";

  return (
    <Link to="/timeline" className="block">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-hover rounded-2xl p-4 flex items-center gap-4"
      >
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
            <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15" fill="none"
              stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round"
              strokeDasharray={`${(ls.score / 100) * 94.25} 94.25`}
              style={{ filter: "drop-shadow(0 0 4px hsl(var(--primary) / 0.6))" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display text-lg leading-none">{ls.score}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rune" />
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Life Score</p>
          </div>
          <p className="font-display text-base">
            {ls.band === "rising" ? "Rising" : ls.band === "fading" ? "Fading" : "Steady"}
            <span className={`ml-2 text-sm ${tone}`}>
              <Icon className="w-3.5 h-3.5 inline -mt-0.5" /> {ls.delta > 0 ? "+" : ""}{ls.delta}
            </span>
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            Consistency {ls.components.consistency}% · Today {ls.components.today}% · Mood {ls.components.mood}%
          </p>
        </div>
      </motion.div>
    </Link>
  );
}
