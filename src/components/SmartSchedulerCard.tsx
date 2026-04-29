import { Clock, Bell } from "lucide-react";
import { bestGlobalWindow, smartReminders } from "@/lib/scheduler";

/** Smart Scheduler + behavior-based reminder hints. */
export default function SmartSchedulerCard() {
  const best = bestGlobalWindow();
  const hints = smartReminders().slice(0, 3);
  if (!best && hints.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-rune" />
        <p className="font-display text-lg">Smart Scheduler</p>
      </div>
      {best && (
        <div className="rounded-xl border border-border px-3 py-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Your best window</p>
          <p className="text-sm">
            <b className="text-primary">{best.window}</b>
            <span className="text-muted-foreground ml-2">{best.confidence}% confidence</span>
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Anchor your most important habit to this window for higher success.
          </p>
        </div>
      )}
      {hints.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-1.5">
            <Bell className="w-3.5 h-3.5" /> Smart reminders
          </p>
          <ul className="space-y-1.5">
            {hints.map((h) => (
              <li key={h.habit.id} className="text-xs rounded-lg border border-border px-2.5 py-1.5">
                <span className="mr-1">{h.habit.icon}</span>{h.hint}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
