import { useState } from "react";
import { motion } from "framer-motion";
import { Moon, Sun, Download, Upload, Trash2, Crown, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Link } from "react-router-dom";
import { getProfile, saveProfile } from "@/lib/habitStore";
import { useTheme } from "@/hooks/useTheme";
import { usePremium } from "@/hooks/usePremium";
import { setAdminEmail } from "@/lib/premium";
import { hasPin, setPin, clearPin } from "@/lib/appLock";
import { toast } from "sonner";
import { getMissedSettings, saveMissedSettings, runMissedSweep, getSweepLog, clearSweepLog, type SweepLogEntry } from "@/lib/missedRules";

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  if (diff < 0) return "just now";
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} day${d === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}

export default function Settings() {
  const [profile, setProfileState] = useState(getProfile);
  const [name, setName] = useState(profile.name);
  const { dark, setDark } = useTheme();
  const premium = usePremium();
  const [email, setEmail] = useState(premium.email ?? "");
  const [pinValue, setPinValue] = useState("");
  const [pinSet, setPinSet] = useState<boolean>(hasPin);
  const [missed, setMissed] = useState(getMissedSettings);
  const [sweepLog, setSweepLog] = useState<SweepLogEntry[]>(getSweepLog);

  const updateMissed = (patch: Partial<typeof missed>) => {
    const next = { ...missed, ...patch };
    setMissed(next);
    saveMissedSettings(next);
  };

  const saveName = () => {
    const next = { ...profile, name: name.trim() || "Adventurer" };
    saveProfile(next);
    setProfileState(next);
    toast.success("Profile updated");
  };

  const saveEmail = () => {
    setAdminEmail(email.trim() || undefined);
    toast.success("Account updated");
  };

  const savePin = () => {
    try {
      setPin(pinValue);
      setPinSet(true);
      setPinValue("");
      toast.success("PIN set — app will lock on next visit");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to set PIN");
    }
  };

  const removePin = () => {
    clearPin();
    setPinSet(false);
    toast.success("PIN removed");
  };

  const exportData = () => {
    const data = {
      habits: localStorage.getItem("lifeforge_habits"),
      profile: localStorage.getItem("lifeforge_profile"),
      moods: localStorage.getItem("lifeforge_moods"),
      quests: localStorage.getItem("lifeforge_quests"),
      premium: localStorage.getItem("lifeforge_premium"),
      reward: localStorage.getItem("lifeforge_daily_reward"),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lifeforge-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup downloaded");
  };

  const importData = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.habits)  localStorage.setItem("lifeforge_habits", data.habits);
      if (data.profile) localStorage.setItem("lifeforge_profile", data.profile);
      if (data.moods)   localStorage.setItem("lifeforge_moods", data.moods);
      if (data.quests)  localStorage.setItem("lifeforge_quests", data.quests);
      if (data.premium) localStorage.setItem("lifeforge_premium", data.premium);
      if (data.reward)  localStorage.setItem("lifeforge_daily_reward", data.reward);
      toast.success("Restored — reloading…");
      setTimeout(() => window.location.reload(), 600);
    } catch {
      toast.error("Invalid backup file");
    }
  };

  const wipe = () => {
    if (!confirm("Erase ALL LifeForge data? This cannot be undone.")) return;
    ["lifeforge_habits", "lifeforge_profile", "lifeforge_moods", "lifeforge_quests"]
      .forEach(k => localStorage.removeItem(k));
    toast.success("Data erased — reloading…");
    setTimeout(() => window.location.reload(), 600);
  };

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-5"
      >
        <h1 className="font-display text-2xl text-gradient-forest">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tune your experience and safeguard your saga.
        </p>
      </motion.div>

      {/* Account / membership */}
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-display text-lg">Account</p>
          {premium.unlocked && (
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-primary/40 bg-primary/10 text-primary flex items-center gap-1">
              <Crown className="w-3 h-3" /> {premium.isAdmin ? "Admin" : "Premium"}
            </span>
          )}
        </div>
        <div>
          <Label>Email (optional)</Label>
          <div className="flex gap-2 mt-1.5">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <Button onClick={saveEmail}>Save</Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Used for backup labelling. Saved on this device only.
          </p>
        </div>
        {!premium.unlocked && (
          <Button asChild variant="outline" className="w-full gap-2">
            <Link to="/premium"><Crown className="w-4 h-4" /> Upgrade to Premium</Link>
          </Button>
        )}
      </div>

      {/* Profile */}
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <p className="font-display text-lg">Profile</p>
        <div>
          <Label>Name</Label>
          <div className="flex gap-2 mt-1.5">
            <Input value={name} onChange={e => setName(e.target.value)} />
            <Button onClick={saveName}>Save</Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Title: <b className="text-foreground">{profile.title}</b> · Level <b>{profile.level}</b> · {profile.xp} XP
        </div>
      </div>

      {/* Habit tracking rules */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div>
          <p className="font-display text-lg">Habit tracking rules</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            How unmarked past days are handled.
          </p>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-sm">Auto mark missed habits as ❌</p>
            <p className="text-xs text-muted-foreground">
              Past days with no check-in turn into a miss after the cutoff.
            </p>
          </div>
          <Switch
            checked={missed.autoMarkMissed}
            onCheckedChange={(v) => updateMissed({ autoMarkMissed: v })}
          />
        </div>

        <div>
          <Label>Grace period cutoff</Label>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {[0, 1, 2, 3, 4, 5, 6].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => updateMissed({ graceHour: h })}
                className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                  missed.graceHour === h
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/60 hover:bg-card"
                }`}
              >
                {h === 0 ? "Midnight" : `${h} AM`}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            Yesterday stays editable until this time. Default: 3 AM.
          </p>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            // Force re-run by clearing the daily guard.
            localStorage.removeItem("lifeforge_missed_lastrun");
            const n = runMissedSweep(new Date(), true);
            setSweepLog(getSweepLog());
            toast.success(n > 0 ? `Marked ${n} day${n === 1 ? "" : "s"} as missed` : "Nothing to mark");
          }}
        >
          Run sweep now
        </Button>

        {/* Last sweep status + log */}
        <div className="rounded-xl border border-border/60 bg-card/40 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Last sweep</p>
            {sweepLog.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  clearSweepLog();
                  setSweepLog([]);
                  toast.success("Log cleared");
                }}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear log
              </button>
            )}
          </div>
          {sweepLog.length === 0 ? (
            <p className="text-xs text-muted-foreground">No sweeps recorded yet.</p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                {formatRelative(sweepLog[0].at)} ·{" "}
                {sweepLog[0].skipped
                  ? "skipped (auto-mark off)"
                  : `${sweepLog[0].marked} day${sweepLog[0].marked === 1 ? "" : "s"} marked`}
                {sweepLog[0].manual ? " · manual" : " · auto"}
              </p>
              <ul className="mt-1 max-h-44 overflow-auto divide-y divide-border/40 text-[11px]">
                {sweepLog.map((e, i) => (
                  <li key={i} className="flex items-center justify-between py-1.5 gap-2">
                    <span className="text-muted-foreground truncate">
                      {new Date(e.at).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`px-1.5 py-0.5 rounded ${
                          e.skipped
                            ? "bg-muted text-muted-foreground"
                            : e.marked > 0
                            ? "bg-destructive/10 text-destructive"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {e.skipped ? "skipped" : `${e.marked} marked`}
                      </span>
                      <span className="text-muted-foreground">
                        {e.manual ? "manual" : "auto"}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* Theme */}
      <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {dark ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-accent" />}
          <div>
            <p className="font-medium">Dark mode</p>
            <p className="text-xs text-muted-foreground">Enchanted forest at dusk</p>
          </div>
        </div>
        <Switch checked={dark} onCheckedChange={setDark} />
      </div>

      {/* App lock (premium) */}
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-display text-lg flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-rune" /> App lock (PIN)
          </p>
          {!premium.unlocked && (
            <Link to="/premium" className="text-[11px] text-rune flex items-center gap-1">
              <Lock className="w-3 h-3" /> Premium
            </Link>
          )}
        </div>
        {premium.unlocked ? (
          pinSet ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">PIN is set. The app will lock on each session.</p>
              <Button variant="outline" onClick={removePin}>Remove</Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                type="password"
                inputMode="numeric"
                placeholder="4–8 digits"
                value={pinValue}
                onChange={e => setPinValue(e.target.value.replace(/\D/g, "").slice(0, 8))}
              />
              <Button onClick={savePin} disabled={pinValue.length < 4}>Set PIN</Button>
            </div>
          )
        ) : (
          <p className="text-sm text-muted-foreground">Unlock Premium to protect your saga with a PIN.</p>
        )}
      </div>

      {/* Backup */}
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <p className="font-display text-lg">Backup & Restore</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={exportData} className="gap-2 flex-1">
            <Download className="w-4 h-4" /> Export JSON
          </Button>
          <label className="flex-1">
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={e => e.target.files?.[0] && importData(e.target.files[0])}
            />
            <Button variant="outline" asChild className="gap-2 w-full cursor-pointer">
              <span><Upload className="w-4 h-4" /> Import JSON</span>
            </Button>
          </label>
        </div>
        <Button variant="destructive" onClick={wipe} className="gap-2 w-full">
          <Trash2 className="w-4 h-4" /> Erase all data
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        LifeForge AI v1 · Data lives on this device.
      </p>
    </div>
  );
}
