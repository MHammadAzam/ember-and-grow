import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Habit, HABIT_ICONS, HABIT_COLORS } from "@/lib/habitStore";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (habit: Omit<Habit, "id" | "streak" | "completedDates" | "createdAt">) => void;
  editingHabit?: Habit | null;
}

export default function AddHabitDialog({ open, onOpenChange, onSave, editingHabit }: Props) {
  const [name, setName] = useState(editingHabit?.name || "");
  const [icon, setIcon] = useState(editingHabit?.icon || "🏃");
  const [color, setColor] = useState(editingHabit?.color || HABIT_COLORS[0]);
  const [frequency, setFrequency] = useState<"daily" | "weekly">(editingHabit?.frequency || "daily");
  const [reminderTime, setReminderTime] = useState(editingHabit?.reminderTime || "");

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), icon, color, frequency, reminderTime: reminderTime || undefined });
    setName(""); setIcon("🏃"); setColor(HABIT_COLORS[0]); setFrequency("daily"); setReminderTime("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{editingHabit ? "Edit Habit" : "New Habit"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          <div>
            <Label>Habit Name</Label>
            <Input placeholder="e.g., Morning Meditation" value={name} onChange={e => setName(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {HABIT_ICONS.map(i => (
                <button key={i} onClick={() => setIcon(i)}
                  className={cn("w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all",
                    icon === i ? "bg-primary/20 ring-2 ring-primary" : "bg-muted hover:bg-muted/80"
                  )}>{i}</button>
              ))}
            </div>
          </div>
          <div>
            <Label>Color</Label>
            <div className="flex gap-2 mt-1.5">
              {HABIT_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={cn("w-8 h-8 rounded-full transition-all",
                    color === c ? "ring-2 ring-offset-2 ring-foreground scale-110" : ""
                  )}
                  style={{ backgroundColor: `hsl(${c})` }} />
              ))}
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Frequency</Label>
              <div className="flex gap-2 mt-1.5">
                {(["daily", "weekly"] as const).map(f => (
                  <Button key={f} variant={frequency === f ? "default" : "outline"} size="sm"
                    onClick={() => setFrequency(f)} className="capitalize flex-1">{f}</Button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <Label>Reminder</Label>
              <Input type="time" value={reminderTime} onChange={e => setReminderTime(e.target.value)} className="mt-1.5" />
            </div>
          </div>
          <Button onClick={handleSave} className="w-full">{editingHabit ? "Save Changes" : "Add Habit"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
