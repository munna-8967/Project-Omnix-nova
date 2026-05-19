import { Link } from "wouter";
import { motion } from "framer-motion";
import { Zap, MessageSquare, Brain, FileText, Mic, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background bg-grid overflow-hidden relative flex flex-col">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(0,229,255,0.4) 0%, transparent 70%)" }} />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border border-primary/60 flex items-center justify-center"
            style={{ boxShadow: "0 0 12px rgba(0,229,255,0.4)" }}>
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <span className="text-lg font-bold text-primary tracking-widest jarvis-text-glow">JARVIS</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground" data-testid="button-signin">
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold tracking-wider"
              data-testid="button-signup"
              style={{ boxShadow: "0 0 16px rgba(0,229,255,0.3)" }}>
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 text-center">
        {/* Animated rings */}
        <div className="relative mb-12">
          <motion.div
            className="absolute inset-0 rounded-full border border-primary/10"
            style={{ width: 240, height: 240, top: -80, left: -80 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border border-primary/20"
            style={{ width: 180, height: 180, top: -50, left: -50 }}
            animate={{ rotate: -360 }}
            transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="w-20 h-20 rounded-full border-2 border-primary/60 flex items-center justify-center relative"
            style={{ boxShadow: "0 0 30px rgba(0,229,255,0.5), inset 0 0 20px rgba(0,229,255,0.1)" }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Zap className="w-10 h-10 text-primary" style={{ filter: "drop-shadow(0 0 8px rgba(0,229,255,0.8))" }} />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-xs text-primary/70 tracking-[0.4em] uppercase mb-4 font-medium">
            Artificial Intelligence Assistant
          </p>
          <h1 className="text-6xl md:text-8xl font-bold text-primary jarvis-text-glow tracking-widest mb-6">
            JARVIS
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-2xl tracking-wide">
            Just A Rather Very Intelligent System
          </p>
          <p className="text-muted-foreground/70 max-w-lg mx-auto mb-10 leading-relaxed">
            Your personal AI assistant. Voice-activated, memory-enabled, and built for productivity.
            Chat, command, and automate — all in one interface.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 mb-16"
        >
          <Link href="/sign-up">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold tracking-widest text-sm px-8 py-3"
              data-testid="button-getstarted"
              style={{ boxShadow: "0 0 24px rgba(0,229,255,0.4)" }}
            >
              INITIALIZE SYSTEM
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button
              size="lg"
              variant="outline"
              className="border-primary/30 text-foreground hover:border-primary/60 hover:bg-primary/5 tracking-widest text-sm px-8 py-3"
              data-testid="button-login"
            >
              ACCESS PORTAL
            </Button>
          </Link>
        </motion.div>

        {/* Feature grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl w-full"
        >
          {[
            { icon: MessageSquare, title: "AI Chat", desc: "Streaming conversations with memory" },
            { icon: Mic, title: "Voice Input", desc: "Speak commands naturally" },
            { icon: Brain, title: "Memory System", desc: "Remembers your context" },
            { icon: FileText, title: "Notes & Reminders", desc: "Organize your tasks" },
            { icon: Shield, title: "Private & Secure", desc: "Your data, your control" },
            { icon: Zap, title: "Automation", desc: "Productivity commands" },
          ].map((feature) => (
            <div key={feature.title} className="hud-card p-4 rounded-lg text-left">
              <feature.icon className="w-5 h-5 text-primary mb-3" style={{ filter: "drop-shadow(0 0 4px rgba(0,229,255,0.6))" }} />
              <h3 className="text-sm font-semibold text-foreground tracking-wide mb-1">{feature.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-xs text-muted-foreground/50 tracking-widest">
        JARVIS SYSTEM v3.0 — ONLINE
      </footer>
    </div>
  );
}
