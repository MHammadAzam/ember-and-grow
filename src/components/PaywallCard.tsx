import { Link } from "react-router-dom";
import { Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  feature: string;
  description?: string;
  compact?: boolean;
}

/** Inline paywall used to gate premium-only sections. */
export default function PaywallCard({ feature, description, compact }: Props) {
  return (
    <div
      className={`glass-card rounded-2xl ${compact ? "p-4" : "p-6"} text-center relative overflow-hidden`}
    >
      <div
        className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-25 blur-2xl pointer-events-none"
        style={{ background: "var(--gradient-rune)" }}
      />
      <div className="relative">
        <div className="mx-auto w-12 h-12 rounded-full border border-accent/50 bg-accent/10 flex items-center justify-center rune-glow mb-3">
          <Lock className="w-5 h-5 text-rune" />
        </div>
        <p className="font-display text-lg">{feature}</p>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{description}</p>
        )}
        <Button asChild className="mt-4 gap-2">
          <Link to="/premium">
            <Crown className="w-4 h-4" /> Unlock Premium
          </Link>
        </Button>
      </div>
    </div>
  );
}
