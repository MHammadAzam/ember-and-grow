import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Check } from "lucide-react";
import {
  getQuests, saveQuests, questProgress, questGoalScalar,
  getHabits, getTodayMood, addXP, getProfile, DailyQuest,
} from "@/lib/habitStore";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import confetti from "canvas-confetti";

export default function Quests() {
  const habits = getHabits();
  const mood = getTodayMood();
  const [quests, setQuests] = useState<DailyQuest[]>(getQuests);
  const [profile, setProfile] = useState(getProfile);

  const claim = (quest: DailyQuest) => {
    const progress = questProgress(quest, habits, mood);
    const goal = questGoalScalar(quest);
    if (progress < goal) {
      toast.error("Quest not yet complete");
      return;
    }
    if (quest.claimed) return;
    const updated = quests.map(q => q.id === quest.id ? { ...q, claimed: true } : q);
    setQuests(updated);
    saveQuests(updated);
    const p = addXP(quest.reward);
    setProfile(p);
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
    toast.success(`+${quest.reward} XP — ${quest.description}`);
  };

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-5 flex items-center justify-between"
      >
        <div>
          <h1 className="font-display text-2xl text-gradient-rune">Daily Quests</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Three trials a day. Complete them for bonus XP.
          </p>
        </div>
        <div className="rune-glow rounded-full bg-card px-3 py-1.5 border border-accent/40 text-right">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">XP</p>
          <p className="font-display text-lg text-rune leading-none">{profile.xp}</p>
        </div>
      </motion.div>

      <div className="space-y-3">
        {quests.map((q, i) => {
          const progress = questProgress(q, habits, mood);
          const goal = questGoalScalar(q);
          const ready = progress >= goal && !q.claimed;
          const done = q.claimed;
          return (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card rounded-2xl p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg gradient-rune flex items-center justify-center shrink-0 rune-glow">
                  <Sparkles className="w-5 h-5 text-accent-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{q.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <Progress value={(progress / goal) * 100} className="h-2 flex-1 mr-3" />
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {progress}/{goal}
                    </span>
                  </div>
                  <p className="text-xs text-rune font-medium mt-1.5">+{q.reward} XP</p>
                </div>
                <Button
                  size="sm"
                  variant={ready ? "default" : "outline"}
                  disabled={!ready || done}
                  onClick={() => claim(q)}
                  className="shrink-0"
                >
                  {done ? <Check className="w-4 h-4" /> : "Claim"}
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <p className="text-xs text-center text-muted-foreground">
        New quests appear every dawn 🌅
      </p>
    </div>
  );
}
