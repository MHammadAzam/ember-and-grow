import { Outlet, Link } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useTheme } from "@/hooks/useTheme";

/** App shell for the authenticated/main routes. Provides top brand bar + bottom nav. */
export default function AppShell() {
  const { dark, toggle } = useTheme();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="mx-auto max-w-2xl flex items-center justify-between h-14 px-4">
          <Link to="/dashboard" className="flex items-center gap-2 font-display font-bold">
            <span className="text-xl animate-rune-pulse">🜂</span>
            <span className="text-gradient-forest">LifeForge AI</span>
          </Link>
          <button
            type="button"
            onClick={toggle}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
            className="relative w-9 h-9 rounded-full border border-border/60 bg-card/60 hover:bg-card transition-colors flex items-center justify-center text-foreground"
          >
            {dark ? (
              <Sun className="w-4 h-4 text-accent" />
            ) : (
              <Moon className="w-4 h-4 text-primary" />
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-2xl px-4 pt-4 pb-safe-bottom">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
