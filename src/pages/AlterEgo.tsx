import { useState } from "react";
import { motion } from "framer-motion";
import { Save, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getAlterEgo, saveAlterEgo, type AlterEgo } from "@/lib/habitStore";
import { toast } from "sonner";

const ARCHETYPES = [
  "Stoic Warrior", "Forest Sage", "Inventor", "Ascetic Monk",
  "Healer", "Explorer", "Strategist", "Builder",
];

export default function AlterEgoPage() {
  const existing = getAlterEgo();
  const [name, setName] = useState(existing?.name ?? "");
  const [archetype, setArchetype] = useState(existing?.archetype ?? ARCHETYPES[0]);
  const [valuesText, setValuesText] = useState((existing?.values ?? []).join(", "));
  const [mantra, setMantra] = useState(existing?.mantra ?? "");

  function save() {
    if (!name.trim()) return toast.error("Give your alter ego a name.");
    if (!mantra.trim()) return toast.error("Write a mantra they live by.");
    const values = valuesText.split(",").map((v) => v.trim()).filter(Boolean).slice(0, 5);
    const ego: AlterEgo = {
      name: name.trim(),
      archetype,
      values,
      mantra: mantra.trim(),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    saveAlterEgo(ego);
    toast.success(`${ego.name} awakens.`);
  }

  function clear() {
    saveAlterEgo(null);
    setName(""); setArchetype(ARCHETYPES[0]); setValuesText(""); setMantra("");
    toast("Alter ego cleared.");
  }

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-5 relative overflow-hidden"
      >
        <div
          className="absolute -top-12 -right-10 w-44 h-44 rounded-full opacity-30 blur-2xl"
          style={{ background: "var(--gradient-rune)" }}
        />
        <div className="relative">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Identity Shift</p>
          <h1 className="font-display text-2xl text-gradient-forest">Alter Ego</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Forge a powerful identity. When you waver, ask: what would they do?
          </p>
        </div>
      </motion.div>

      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Aurelius, Ember, The Architect"
            className="mt-1"
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Archetype</label>
          <select
            value={archetype}
            onChange={(e) => setArchetype(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-card/60 px-3 py-2 text-sm"
          >
            {ARCHETYPES.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">
            Core values (comma-separated, max 5)
          </label>
          <Input
            value={valuesText}
            onChange={(e) => setValuesText(e.target.value)}
            placeholder="discipline, kindness, courage"
            className="mt-1"
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Mantra</label>
          <Textarea
            value={mantra}
            onChange={(e) => setMantra(e.target.value)}
            rows={2}
            placeholder="I do not negotiate with the version of me that wants comfort."
            className="mt-1 resize-none"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={save} className="flex-1 gap-2">
            <Save className="w-4 h-4" /> Awaken
          </Button>
          {existing && (
            <Button onClick={clear} variant="ghost" className="text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {existing && (
        <div className="glass-card rounded-2xl p-5 border-accent/40">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-rune animate-rune-pulse" />
            <p className="font-display text-sm uppercase tracking-wider text-muted-foreground">
              Your awakened self
            </p>
          </div>
          <p className="font-display text-2xl text-gradient-forest">{existing.name}</p>
          <p className="text-sm text-muted-foreground mb-3">{existing.archetype}</p>
          {existing.values.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {existing.values.map((v) => (
                <span key={v} className="text-[11px] px-2 py-0.5 rounded-full border border-border bg-muted/40">
                  {v}
                </span>
              ))}
            </div>
          )}
          <blockquote className="border-l-2 border-accent/50 pl-3 italic text-sm">
            "{existing.mantra}"
          </blockquote>
        </div>
      )}
    </div>
  );
}
