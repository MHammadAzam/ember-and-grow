import { motion } from "framer-motion";
import { Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AI_HABIT_SUGGESTIONS } from "@/lib/habitStore";

interface Props {
  onAdd: (name: string, icon: string) => void;
  existingNames: string[];
}

export default function AISuggestions({ onAdd, existingNames }: Props) {
  const suggestions = AI_HABIT_SUGGESTIONS.filter(s => !existingNames.includes(s.name)).slice(0, 4);

  if (suggestions.length === 0) return null;

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-accent" />
        <h3 className="font-display font-semibold">AI Suggestions</h3>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {suggestions.map((s, i) => (
          <motion.div
            key={s.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50"
          >
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{s.icon} {s.name}</p>
              <p className="text-xs text-muted-foreground">{s.reason}</p>
            </div>
            <Button size="icon" variant="ghost" className="shrink-0 h-8 w-8" onClick={() => onAdd(s.name, s.icon)}>
              <Plus className="w-4 h-4" />
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
