import { NavLink } from "react-router-dom";
import { Home, Globe2, Wand2, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/dashboard",  label: "Home",   Icon: Home },
  { to: "/world",      label: "World",  Icon: Globe2 },
  { to: "/coach",      label: "Coach",  Icon: Wand2 },
  { to: "/stats",      label: "Stats",  Icon: BarChart3 },
  { to: "/settings",   label: "Settings", Icon: Settings },
];

/** Mobile-first bottom navigation for LifeForge AI. */
export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-background/85 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
    >
      <ul className="mx-auto max-w-2xl grid grid-cols-5 h-16">
        {items.map(({ to, label, Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end
              className={({ isActive }) =>
                cn(
                  "h-full flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
                  <span>{label}</span>
                  {isActive && (
                    <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" aria-hidden />
                  )}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
