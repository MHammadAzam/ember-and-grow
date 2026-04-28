import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Crown, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePremium } from "@/hooks/usePremium";
import { setPremium } from "@/lib/premium";
import { toast } from "sonner";
import confetti from "canvas-confetti";

const FREE_FEATURES = [
  "Track up to 5 habits",
  "Streaks & basic stats",
  "Daily quests & quotes",
  "Mood log",
];

const PREMIUM_FEATURES = [
  "Unlimited habits",
  "Advanced analytics + heatmap",
  "AI insights & 30-day forecast",
  "Full Habit World access",
  "Cloud-style backup & restore",
  "Focus Mode ambient sounds",
  "App lock (PIN)",
  "All achievements & themes",
];

export default function Premium() {
  const { unlocked, isAdmin } = usePremium();

  const handleUnlock = () => {
    setPremium(true);
    confetti({ particleCount: 160, spread: 90, origin: { y: 0.6 } });
    toast.success("Premium unlocked — your forge burns brighter ✨");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon">
          <Link to="/dashboard" aria-label="Back"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Membership</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 relative overflow-hidden text-center"
      >
        <div
          className="absolute -top-12 -right-12 w-52 h-52 rounded-full opacity-30 blur-2xl"
          style={{ background: "var(--gradient-rune)" }}
        />
        <div className="relative">
          <Crown className="w-10 h-10 mx-auto text-rune animate-rune-pulse" />
          <h1 className="font-display text-3xl text-gradient-forest mt-2">LifeForge Premium</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Unleash the full power of the forge — unlimited habits, AI insights, advanced analytics, and more.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Free */}
        <div className="glass-card rounded-2xl p-5">
          <p className="font-display text-lg">Free</p>
          <p className="text-xs text-muted-foreground">For wanderers starting their saga.</p>
          <ul className="mt-3 space-y-1.5 text-sm">
            {FREE_FEATURES.map(f => (
              <li key={f} className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Premium */}
        <div className="glass-card rounded-2xl p-5 border-accent/50 relative overflow-hidden">
          <div
            className="absolute -top-10 -right-10 w-36 h-36 rounded-full opacity-20 blur-2xl pointer-events-none"
            style={{ background: "var(--gradient-rune)" }}
          />
          <div className="flex items-center justify-between relative">
            <p className="font-display text-lg flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-rune" /> Premium
            </p>
            {unlocked && (
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-primary/40 bg-primary/10 text-primary">
                {isAdmin ? "Admin" : "Active"}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">For forgemasters who want it all.</p>
          <ul className="mt-3 space-y-1.5 text-sm relative">
            {PREMIUM_FEATURES.map(f => (
              <li key={f} className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 text-center">
        {unlocked ? (
          <>
            <p className="font-display text-lg text-gradient-forest">
              {isAdmin ? "Admin access — all features unlocked." : "Premium is active — enjoy the forge."}
            </p>
            <Button asChild variant="outline" className="mt-3">
              <Link to="/dashboard">Back to dashboard</Link>
            </Button>
          </>
        ) : (
          <>
            <p className="font-display text-2xl">$4.99 <span className="text-sm text-muted-foreground font-normal">/ month</span></p>
            <p className="text-xs text-muted-foreground mt-1">Cancel anytime · 7-day free trial</p>
            <Button onClick={handleUnlock} className="mt-3 w-full max-w-xs gap-2">
              <Crown className="w-4 h-4" /> Start free trial
            </Button>
            <p className="text-[10px] text-muted-foreground mt-2">
              Demo: this unlocks premium locally without payment.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
