import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Globe2, Flame, Trophy, Brain, ArrowRight, Shield } from "lucide-react";

const features = [
  { icon: Globe2,   title: "Living Habit World",   desc: "Each habit becomes a tree, tower, or planet that grows with your discipline." },
  { icon: Flame,    title: "Emotional Streaks",    desc: "Embers ignite as you commit. Use a Streak Shield once a month to survive setbacks." },
  { icon: Sparkles, title: "Daily Quests",         desc: "Three trials each dawn. Claim XP, level up, and unlock RPG titles." },
  { icon: Brain,    title: "Mood & Insights",      desc: "Track how you feel, then see how your mood shapes your performance." },
  { icon: Trophy,   title: "Levels & Titles",      desc: "From Wanderer to Eternal Forgemaster — your saga, charted." },
  { icon: Shield,   title: "Streak Shield",        desc: "Saved one streak per month. Because life happens." },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

export default function Index() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
            <span className="text-2xl animate-rune-pulse">🜂</span>
            <span className="text-gradient-forest">LifeForge AI</span>
          </Link>
          <Link to="/dashboard">
            <Button size="sm">Enter</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 px-4">
        <div className="container max-w-3xl text-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6 rune-glow border border-accent/30"
          >
            <Sparkles className="w-4 h-4" /> An RPG for your real life
          </motion.span>

          <motion.h1
            className="text-4xl md:text-6xl font-display font-bold tracking-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Forge your habits.{" "}
            <span className="text-gradient-forest">Grow your world.</span>
          </motion.h1>

          <motion.p
            className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            LifeForge AI turns daily discipline into a mystical journey.
            Complete quests, gain XP, and watch your living world evolve with every habit you keep.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-3 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Link to="/dashboard">
              <Button size="lg" className="text-base px-8 gap-2">
                Begin Your Saga <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>

          {/* Floating runes */}
          <div className="relative mt-14 h-28">
            {["🌳", "🪐", "🏰", "🔥", "🪄"].map((emoji, i) => (
              <motion.span
                key={i}
                className="absolute text-3xl md:text-4xl"
                style={{ left: `${10 + i * 18}%` }}
                animate={{ y: [0, -14, 0] }}
                transition={{ duration: 3.5, delay: i * 0.4, repeat: Infinity }}
              >
                {emoji}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="container max-w-5xl">
          <motion.h2
            className="text-3xl md:text-4xl font-display font-bold text-center mb-3"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          >
            A habit tracker, reimagined
          </motion.h2>
          <motion.p
            className="text-muted-foreground text-center mb-10 max-w-xl mx-auto"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
          >
            Built for people who'd rather play their progress than tick boxes.
          </motion.p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="glass-card-hover rounded-2xl p-6"
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i + 2}
              >
                <div className="w-12 h-12 rounded-xl gradient-forest flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-display mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <motion.div
          className="container max-w-2xl glass-card rounded-3xl p-10 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">
            Your world is waiting
          </h2>
          <p className="text-muted-foreground mb-7 max-w-md mx-auto">
            Plant your first seed today. Watch what one small habit becomes.
          </p>
          <Link to="/dashboard">
            <Button size="lg" className="text-base px-8 gap-2">
              Enter LifeForge <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </motion.div>
      </section>

      <footer className="py-8 border-t border-border/50">
        <div className="container text-center text-sm text-muted-foreground">
          <p>🜂 LifeForge AI — Forge your habits. Grow your world.</p>
        </div>
      </footer>
    </div>
  );
}
