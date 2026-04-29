import { motion } from "framer-motion";
import { Check, Lock, Crown, Palette } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { THEMES, getThemeState, isUnlocked, setActiveTheme, unlockTheme, type ThemeId } from "@/lib/themes";
import { getRewardState } from "@/lib/dailyReward";
import { usePremium } from "@/hooks/usePremium";
import { toast } from "sonner";
import { useThemeStore } from "@/hooks/useThemeStore";

export default function Themes() {
  const active = useThemeStore();
  const [, setTick] = useState(0);
  const { unlocked: premium } = usePremium();
  const coins = getRewardState().coins;

  const refresh = () => setTick((t) => t + 1);

  function tryActivate(id: ThemeId) {
    if (!isUnlocked(id)) {
      const r = unlockTheme(id);
      if (!r.ok) { toast.error(r.reason ?? "Locked"); return; }
      toast.success("Theme unlocked!");
    }
    const r = setActiveTheme(id);
    if (!r.ok) { toast.error(r.reason ?? "Cannot apply"); return; }
    toast.success("Theme applied");
    refresh();
  }

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-5"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Sanctum</p>
            <h1 className="font-display text-2xl text-gradient-forest flex items-center gap-2">
              <Palette className="w-5 h-5" /> Themes Store
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Cosmetic themes — unlock with coins or Premium.
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Coins</p>
            <p className="font-display text-xl text-rune">🪙 {coins}</p>
          </div>
        </div>
      </motion.div>

      {!premium && (
        <Link
          to="/premium"
          className="glass-card-hover rounded-2xl p-3 px-4 flex items-center gap-3 border-accent/40"
        >
          <Crown className="w-4 h-4 text-rune" />
          <p className="text-sm flex-1">Premium unlocks every theme instantly.</p>
          <span className="text-xs text-rune">Upgrade →</span>
        </Link>
      )}

      <div className="grid gap-3">
        {THEMES.map((t) => {
          const unlocked = isUnlocked(t.id);
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              onClick={() => tryActivate(t.id)}
              className={`glass-card-hover rounded-2xl p-4 text-left transition-all ${
                isActive ? "ring-2 ring-primary" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-14 h-14 rounded-xl flex-shrink-0 border border-border"
                  style={{ background: `linear-gradient(135deg, ${t.preview.from}, ${t.preview.to})` }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-display text-base">{t.name}</p>
                    {isActive && (
                      <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{t.tagline}</p>
                  <p className="text-[11px] mt-1">
                    {unlocked ? (
                      <span className="text-primary inline-flex items-center gap-1">
                        <Check className="w-3 h-3" /> Unlocked
                      </span>
                    ) : (
                      <span className="text-muted-foreground inline-flex items-center gap-1">
                        <Lock className="w-3 h-3" /> {t.cost} coins
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-center text-muted-foreground">
        Earn coins from daily rewards & surprise blessings.
      </p>
    </div>
  );
}
