import { motion } from "framer-motion";
import { Trophy, Star, Zap } from "lucide-react";
import { UserProfile } from "@/lib/habitStore";
import { Progress } from "@/components/ui/progress";

interface Props {
  profile: UserProfile;
}

const BADGE_ICONS: Record<string, string> = {
  "7-day streak": "🔥",
  "Consistency King": "👑",
  "Habit Builder": "🏗️",
};

export default function GamificationPanel({ profile }: Props) {
  const xpInLevel = profile.xp % 100;
  const xpToNext = 100;

  return (
    <div className="glass-card rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full gradient-xp flex items-center justify-center">
          <Star className="w-6 h-6 text-xp-foreground" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Level</p>
          <p className="text-2xl font-display font-bold">{profile.level}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-sm text-muted-foreground">Total XP</p>
          <p className="font-semibold flex items-center gap-1">
            <Zap className="w-4 h-4 text-accent" /> {profile.xp}
          </p>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Level {profile.level}</span>
          <span>{xpInLevel}/{xpToNext} XP</span>
        </div>
        <Progress value={(xpInLevel / xpToNext) * 100} className="h-2" />
      </div>

      {profile.badges.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2 flex items-center gap-1">
            <Trophy className="w-4 h-4" /> Badges
          </p>
          <div className="flex flex-wrap gap-2">
            {profile.badges.map(badge => (
              <motion.span
                key={badge}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium"
              >
                {BADGE_ICONS[badge] || "🏅"} {badge}
              </motion.span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
