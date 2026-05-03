import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import World from "./pages/World";
import Quests from "./pages/Quests";
import Coach from "./pages/Coach";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";
import Focus from "./pages/Focus";
import Bets from "./pages/Bets";
import FutureSelf from "./pages/FutureSelf";
import AlterEgoPage from "./pages/AlterEgo";
import Journal from "./pages/Journal";
import Premium from "./pages/Premium";
import Achievements from "./pages/Achievements";
import Themes from "./pages/Themes";
import Timeline from "./pages/Timeline";
import WeeklyReview from "./pages/WeeklyReview";
import MonthlyTracker from "./pages/MonthlyTracker";
import NotFound from "./pages/NotFound";
import AppShell from "./components/AppShell";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/world" element={<World />} />
            <Route path="/quests" element={<Quests />} />
            <Route path="/coach" element={<Coach />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/focus" element={<Focus />} />
            <Route path="/bets" element={<Bets />} />
            <Route path="/future" element={<FutureSelf />} />
            <Route path="/alter-ego" element={<AlterEgoPage />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/premium" element={<Premium />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/themes" element={<Themes />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/weekly-review" element={<WeeklyReview />} />
            <Route path="/monthly" element={<MonthlyTracker />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
