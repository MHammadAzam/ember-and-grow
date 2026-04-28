import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  hasPin, isUnlockedThisSession, markUnlocked, verifyPin,
} from "@/lib/appLock";

/** Wrap children with a PIN screen if a PIN exists and this session is locked. */
export default function PinGate({ children }: { children: React.ReactNode }) {
  const [locked, setLocked] = useState<boolean>(() => hasPin() && !isUnlockedThisSession());
  const [pin, setPinInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocked(hasPin() && !isUnlockedThisSession());
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyPin(pin)) {
      markUnlocked();
      setLocked(false);
      setPinInput("");
      setError(null);
    } else {
      setError("Wrong PIN");
      setPinInput("");
    }
  };

  if (!locked) return <>{children}</>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="glass-card rounded-2xl p-8 max-w-sm w-full text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-accent/10 border border-accent/40 flex items-center justify-center rune-glow mb-4">
          <Lock className="w-6 h-6 text-rune" />
        </div>
        <h1 className="font-display text-2xl text-gradient-forest">LifeForge AI</h1>
        <p className="text-sm text-muted-foreground mt-1">Enter your PIN to continue.</p>
        <form onSubmit={submit} className="mt-5 space-y-3">
          <Input
            autoFocus
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={8}
            value={pin}
            onChange={e => setPinInput(e.target.value.replace(/\D/g, ""))}
            className="text-center tracking-[0.5em] text-lg"
            placeholder="••••"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={pin.length < 4}>
            Unlock
          </Button>
        </form>
      </div>
    </div>
  );
}
