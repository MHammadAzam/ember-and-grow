import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Habit } from "@/lib/habitStore";
import { useMemo } from "react";

interface Props {
  habits: Habit[];
  range: "week" | "month";
}

export default function ProgressChart({ habits, range }: Props) {
  const data = useMemo(() => {
    const days = range === "week" ? 7 : 30;
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000);
      const key = date.toISOString().split("T")[0];
      const label = date.toLocaleDateString("en", { weekday: "short", day: "numeric" });
      const completed = habits.filter(h => h.completedDates.includes(key)).length;
      result.push({ date: label, completed, total: habits.length });
    }
    return result;
  }, [habits, range]);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} barCategoryGap="20%">
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 13,
          }}
        />
        <Bar dataKey="completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Completed" />
      </BarChart>
    </ResponsiveContainer>
  );
}
