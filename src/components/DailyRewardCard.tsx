import { useState } from "react";
import { motion } from "framer-motion";
import { Gift, Sparkles, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  canClaimToday, claimDailyReward, getRewardState, nextRewardPreview,
} from "@/lib/dailyReward";
import confetti from "canvas-confetti";
import { toast } from "sonner";

/** Compact daily reward card. Self-hides until a new day is available. */
export default function DailyRewardCard({ onClaimed }: { onClaimed?: () => void }) {
  const [state, setState] = useState(getRewardState);
  const [available, setAvailable] = useState(canClaimToday);
  const preview = nextRewardPreview();

  if (!available) {
    return (
      <div className="glass-card rounded-2xl p-3 px-4 flex items-center gap-3">
        <Flame className="w-5 h-5 text-streak" style={{ color: "hsl(var(--streak))" }} />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Daily reward</p>
          <p className="text-sm">
            Claimed · day <b>{state.chain}</b>/7 · 🪙 {state.coins}
          </p>
        </div>
      </div>
    );
  }

  const claim = () => {
    try {
      const r = claimDailyReward();
      if (!r) return;
      // Confetti is cosmetic — never let it crash the claim flow.
      try {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
      } catch { /* ignore */ }
      toast.success(`+${r.xp} XP and 🪙 ${r.coins} claimed (day ${r.day})`);
      setState(getRewardState());
      setAvailable(false);
      onClaimed?.();
    } catch (err) {
      console.error("[DailyReward] claim failed:", err);
      toast.error("Could not claim reward — please try again");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-4 flex items-center gap-3 relative overflow-hidden"
    >
      <div
        className="absolute -top-8 -right-6 w-28 h-28 rounded-full opacity-30 blur-2xl pointer-events-none"
        style={{ background: "var(--gradient-ember)" }}
      />
      <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/40 flex items-center justify-center rune-glow">
        <Gift className="w-5 h-5 text-rune" />
      </div>
      <div className="flex-1 min-w-0 relative">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Daily reward · day {preview.day}/7</p>
        <p className="text-sm">
          <Sparkles className="inline w-3.5 h-3.5 mr-1 text-primary" />
          +{preview.xp} XP and 🪙 {preview.coins}
        </p>
      </div>
      <Button size="sm" onClick={claim}>Claim</Button>
    </motion.div>
  );
}
