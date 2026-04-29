import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { assessBurnout } from "@/lib/burnout";

const DISMISS_KEY = "lifeforge_burnout_dismissed";

/** Soft warning banner — only shows when burnout level is "watch" or "high".
 *  Dismissible for 24 hours. */
export default function BurnoutBanner() {
  const [hidden, setHidden] = useState<boolean>(() => {
    const ts = Number(localStorage.getItem(DISMISS_KEY)) || 0;
    return Date.now() - ts < 24 * 3600 * 1000;
  });
  const a = assessBurnout();
  if (hidden || a.level === "ok") return null;
  const high = a.level === "high";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass-card rounded-2xl p-4 border ${
          high ? "border-destructive/60" : "border-accent/50"
        } flex items-start gap-3 relative`}
      >
        <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${high ? "text-destructive" : "text-rune"}`} />
        <div className="flex-1 min-w-0">
          <p className="font-display text-sm">
            {high ? "You may be overwhelmed" : "Watch your pace"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {a.reasons.slice(0, 2).join(" · ") || "Pattern detected this week."}
          </p>
          <p className="text-xs mt-1.5">{a.suggestion}</p>
        </div>
        <button
          aria-label="Dismiss"
          onClick={() => { localStorage.setItem(DISMISS_KEY, String(Date.now())); setHidden(true); }}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
