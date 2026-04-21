import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Habit, HABIT_ICONS, HABIT_COLORS, HabitWorldType } from "@/lib/habitStore";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (habit: Omit<Habit, "id" | "streak" | "completedDates" | "createdAt">) => void;
  editingHabit?: Habit | null;
}

const WORLD_TYPES: { value: HabitWorldType; label: string; emoji: string; hint: string }[] = [
  { value: "tree",     label: "Tree",     emoji: "🌳", hint: "Growth & wellbeing" },
  { value: "building", label: "Tower",    emoji: "🏰", hint: "Study & work" },
  { value: "planet",   label: "Planet",   emoji: "🪐", hint: "Big life goals" },
];

export default function AddHabitDialog({ open, onOpenChange, onSave, editingHabit }: Props) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🏃");
  const [color, setColor] = useState(HABIT_COLORS[0]);
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");
  const [worldType, setWorldType] = useState<HabitWorldType>("tree");
  const [reminderTime, setReminderTime] = useState("");

  // Sync form state to the habit being edited (or reset on open)
  useEffect(() => {
    if (!open) return;
    setName(editingHabit?.name ?? "");
    setIcon(editingHabit?.icon ?? "🏃");
    setColor(editingHabit?.color ?? HABIT_COLORS[0]);
    setFrequency(editingHabit?.frequency ?? "daily");
    setWorldType(editingHabit?.worldType ?? "tree");
    setReminderTime(editingHabit?.reminderTime ?? "");
  }, [open, editingHabit]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(), icon, color, frequency, worldType,
      reminderTime: reminderTime || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-gradient-forest">
            {editingHabit ? "Reforge Habit" : "Forge a New Habit"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          <div>
            <Label>Name</Label>
            <Input
              placeholder="e.g., Morning Meditation"
              value={name}
              onChange={e => setName(e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>World Type</Label>
            <div className="grid grid-cols-3 gap-2 mt-1.5">
              {WORLD_TYPES.map(w => (
                <button
                  key={w.value}
                  type="button"
                  onClick={() => setWorldType(w.value)}
                  className={cn(
                    "rounded-lg p-3 text-center transition-all border",
                    worldType === w.value
                      ? "bg-primary/10 border-primary ring-2 ring-primary/40"
                      : "bg-muted/40 border-transparent hover:bg-muted"
                  )}
                >
                  <div className="text-2xl">{w.emoji}</div>
                  <div className="text-xs font-medium mt-1">{w.label}</div>
                  <div className="text-[10px] text-muted-foreground">{w.hint}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {HABIT_ICONS.map(i => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={cn(
                    "w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all",
                    icon === i ? "bg-primary/20 ring-2 ring-primary" : "bg-muted hover:bg-muted/80"
                  )}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Color</Label>
            <div className="flex gap-2 mt-1.5 flex-wrap">
              {HABIT_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-8 h-8 rounded-full transition-all",
                    color === c ? "ring-2 ring-offset-2 ring-foreground scale-110" : ""
                  )}
                  style={{ backgroundColor: `hsl(${c})` }}
                  aria-label="Pick color"
                />
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Frequency</Label>
              <div className="flex gap-2 mt-1.5">
                {(["daily", "weekly"] as const).map(f => (
                  <Button
                    key={f}
                    variant={frequency === f ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFrequency(f)}
                    className="capitalize flex-1"
                  >
                    {f}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <Label>Reminder</Label>
              <Input
                type="time"
                value={reminderTime}
                onChange={e => setReminderTime(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>

          <Button onClick={handleSave} className="w-full">
            {editingHabit ? "Save Changes" : "Forge Habit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
