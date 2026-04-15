import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Flame, TreePine, BarChart3, Sparkles, Trophy, Bell, ArrowRight } from "lucide-react";

const features = [
  { icon: Flame, title: "Smart Streaks", desc: "Track daily streaks with fire animations and never break your chain." },
  { icon: TreePine, title: "Tree Growth", desc: "Watch your habits grow into a beautiful forest over time." },
  { icon: BarChart3, title: "Analytics", desc: "Detailed charts showing your weekly and monthly progress." },
  { icon: Sparkles, title: "AI Powered", desc: "Get personalized habit suggestions and motivational insights." },
  { icon: Trophy, title: "Gamification", desc: "Earn XP, level up, and unlock achievement badges." },
  { icon: Bell, title: "Reminders", desc: "Never forget a habit with smart browser notifications." },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
            <span className="text-2xl">🌱</span> HabitFlow
          </Link>
          <Link to="/dashboard">
            <Button variant="default" size="sm">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="container max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" /> AI-Powered Habit Tracking
            </span>
          </motion.div>
          <motion.h1
            className="text-5xl md:text-7xl font-display font-extrabold tracking-tight mb-6"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}
          >
            Build Better Habits,{" "}
            <span className="text-gradient">Grow Your Forest</span>
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
          >
            Track habits, build streaks, earn rewards, and watch your virtual forest flourish. 
            The smartest way to build consistency.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Link to="/dashboard">
              <Button size="lg" className="text-lg px-8 gap-2">
                Start Tracking Now <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>

          {/* Floating emojis */}
          <div className="relative mt-16 h-32">
            {["🌱", "🔥", "🏆", "📊", "🌳"].map((emoji, i) => (
              <motion.span
                key={i}
                className="absolute text-4xl"
                style={{ left: `${15 + i * 18}%` }}
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 3, delay: i * 0.4, repeat: Infinity }}
              >
                {emoji}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="container max-w-6xl">
          <motion.h2
            className="text-3xl md:text-4xl font-display font-bold text-center mb-4"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          >
            Everything You Need
          </motion.h2>
          <motion.p
            className="text-muted-foreground text-center mb-12 max-w-xl mx-auto"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
          >
            Powerful features designed to make habit building effortless and fun.
          </motion.p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="glass-card-hover rounded-xl p-6"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i + 2}
              >
                <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-display font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <motion.div
          className="container max-w-3xl glass-card rounded-2xl p-12 text-center"
          initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Ready to Transform Your Habits?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Join thousands of students and professionals building better lives, one habit at a time.
          </p>
          <Link to="/dashboard">
            <Button size="lg" className="text-lg px-8 gap-2">
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="container text-center text-sm text-muted-foreground">
          <p>🌱 HabitFlow AI — Build habits that stick.</p>
        </div>
      </footer>
    </div>
  );
}
