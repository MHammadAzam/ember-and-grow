import { useState } from "react";
import { motion } from "framer-motion";
import { Moon, Sun, Download, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getProfile, saveProfile } from "@/lib/habitStore";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "sonner";

export default function Settings() {
  const [profile, setProfileState] = useState(getProfile);
  const [name, setName] = useState(profile.name);
  const { dark, setDark } = useTheme();

  const saveName = () => {
    const next = { ...profile, name: name.trim() || "Adventurer" };
    saveProfile(next);
    setProfileState(next);
    toast.success("Profile updated");
  };

  const exportData = () => {
    const data = {
      habits: localStorage.getItem("lifeforge_habits"),
      profile: localStorage.getItem("lifeforge_profile"),
      moods: localStorage.getItem("lifeforge_moods"),
      quests: localStorage.getItem("lifeforge_quests"),
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
