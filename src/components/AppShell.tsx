import { Outlet, Link } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

/** App shell for the authenticated/main routes. Provides top brand bar + bottom nav. */
export default function AppShell() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="mx-auto max-w-2xl flex items-center justify-between h-14 px-4">
          <Link to="/dashboard" className="flex items-center gap-2 font-display font-bold">
            <span className="text-xl animate-rune-pulse">🜂</span>
            <span className="text-gradient-forest">LifeForge AI</span>
          </Link>
          <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
            Forge your habits
          </span>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-2xl px-4 pt-4 pb-safe-bottom">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
