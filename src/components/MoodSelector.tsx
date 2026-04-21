import { motion } from "framer-motion";
import { Smile, Meh, Frown } from "lucide-react";
import { Mood, getTodayMood, setTodayMood } from "@/lib/habitStore";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  onChange?: (mood: Mood) => void;
}

const OPTIONS: { mood: Mood; Icon: typeof Smile; label: string; tone: string }[] = [
  { mood: "sad",     Icon: Frown, label: "Heavy",   tone: "text-mana" },
  { mood: "neutral", Icon: Meh,   label: "Steady",  tone: "text-muted-foreground" },
  { mood: "happy",   Icon: Smile, label: "Bright",  tone: "text-accent" },
];

export default function MoodSelector({ onChange }: Props) {
  const [current, setCurrent] = useState<Mood | null>(getTodayMood());

  const handleSelect = (m: Mood) => {
    setTodayMood(m);
    setCurrent(m);
    onChange?.(m);
  };

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium">How does today feel?</p>
        {current && <span className="text-xs text-muted-foreground">Logged ✓</span>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map(({ mood, Icon, label, tone }) => {
          const active = current === mood;
          return (
            <motion.button
              key={mood}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelect(mood)}
              className={cn(
                "rounded-xl p-3 flex flex-col items-center gap-1 border transition-all",
                active
                  ? "bg-primary/10 border-primary ring-2 ring-primary/30"
                  : "bg-muted/40 border-transparent hover:bg-muted"
              )}
            >
              <Icon className={cn("w-6 h-6", active ? "text-primary" : tone)} />
              <span className="text-xs font-medium">{label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
