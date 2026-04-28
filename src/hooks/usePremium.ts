import { useEffect, useState } from "react";
import { getPremium, hasPremium, type PremiumState } from "@/lib/premium";

/** Reactive premium state. Updates on cross-tab storage and same-tab custom events. */
export function usePremium() {
  const [state, setState] = useState<PremiumState>(getPremium);

  useEffect(() => {
    const refresh = () => setState(getPremium());
    window.addEventListener("storage", refresh);
    window.addEventListener("lifeforge:premium-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("lifeforge:premium-change", refresh);
    };
  }, []);

  return { ...state, unlocked: hasPremium() };
}
