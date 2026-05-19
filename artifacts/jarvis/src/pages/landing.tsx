import { useState, useEffect } from "react";
import { SignInButton, SignUpButton } from "@clerk/react";
import { Sparkles, Mic, Zap, Brain, Shield, Star, ArrowRight } from "lucide-react";

const capabilities = [
  "Hey Omni, set a reminder for 8pm",
  "Hey Omni, open YouTube",
  "Hey Omni, switch to Gaming Mode",
  "Hey Omni, turn on flashlight",
  "Hey Omni, find a recipe for pasta",
  "Hey Omni, enable focus mode",
  "Hey Omni, what's my schedule?",
];

const features = [
  { icon: Mic, title: "Voice-First AI", desc: "Talk naturally. OmniNova understands context, emotion, and intent in real time." },
  { icon: Zap, title: "System Control", desc: "Open apps, toggle flashlight, set reminders — all with a single phrase." },
  { icon: Brain, title: "Persistent Memory", desc: "OmniNova remembers your preferences, routines, and life context forever." },
  { icon: Shield, title: "Always Private", desc: "Your data is yours. End-to-end encrypted, never shared, never sold." },
];

export default function LandingPage() {
  const [capIdx, setCapIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCapIdx(i => i + 1), 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-background bg-grid text-foreground overflow-auto relative">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 65%)" }} />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, #2563eb 0%, transparent 65%)" }} />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "radial-gradient(circle, rgba(124,58,237,0.4) 0%, rgba(37,99,235,0.2) 100%)", border: "1px solid rgba(124,58,237,0.45)", boxShadow: "0 0 20px rgba(124,58,237,0.4)" }}>
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <span className="text-lg font-bold gradient-text tracking-wide">OmniNova AI</span>
        </div>
        <div className="flex items-center gap-3">
          <SignInButton mode="modal">
            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-lg">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
              style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)", color: "#fff", boxShadow: "0 0 16px rgba(124,58,237,0.4)" }}>
              Get Started Free
            </button>
          </SignUpButton>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 text-center px-8 pt-12 pb-20 max-w-5xl mx-auto">
        {/* Animated orb */}
        <div className="relative w-36 h-36 mx-auto mb-10">
          <div className="absolute inset-0 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(124,58,237,0.35) 0%, rgba(37,99,235,0.1) 60%, transparent 80%)", animation: "omni-pulse 2.5s ease-in-out infinite" }} />
          <div className="absolute inset-3 rounded-full border border-primary/25" style={{ animation: "omni-ring 12s linear infinite" }} />
          <div className="absolute inset-6 rounded-full border border-blue-500/20" style={{ animation: "omni-ring-rev 8s linear infinite" }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-12 h-12 text-primary" style={{ filter: "drop-shadow(0 0 16px rgba(124,58,237,0.9))" }} />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/25 bg-primary/5 text-primary text-xs font-medium mb-8 animate-float">
          <Star className="w-3 h-3 fill-current" />
          Personal AI Operating System · Next Generation
        </div>

        <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight">
          <span className="gradient-text">Meet OmniNova</span>
          <br />
          <span className="text-foreground/85 text-3xl md:text-5xl font-semibold">Your Personal AI Operating System</span>
        </h1>

        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
          Not a chatbot. A living AI OS that knows you, controls your digital world, learns your routines, and grows with you every single day.
        </p>

        {/* Animated capability preview */}
        <div className="mb-10 h-12 flex items-center justify-center">
          <div className="flex items-center gap-3 px-6 py-3 rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-primary font-mono">{capabilities[capIdx % capabilities.length]}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <SignUpButton mode="modal">
            <button className="flex items-center gap-2 text-base font-bold px-8 py-4 rounded-2xl transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)", color: "#fff", boxShadow: "0 0 24px rgba(124,58,237,0.5)" }}>
              <Mic className="w-5 h-5" />
              Start with Hey Omni
            </button>
          </SignUpButton>
          <SignInButton mode="modal">
            <button className="flex items-center gap-2 text-base px-8 py-4 rounded-2xl border border-border/50 hover:border-primary/40 transition-all text-muted-foreground hover:text-foreground">
              Sign In
              <ArrowRight className="w-4 h-4" />
            </button>
          </SignInButton>
        </div>
      </section>

      {/* Features grid */}
      <section className="relative z-10 px-8 pb-20 max-w-5xl mx-auto">
        <p className="text-center text-xs text-muted-foreground tracking-[0.3em] uppercase mb-10">Core Capabilities</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <div key={f.title} className="omni-card omni-glow-hover rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)" }}>
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold text-sm mb-2">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative z-10 px-8 pb-20 text-center max-w-xl mx-auto">
        <div className="omni-card rounded-3xl p-10" style={{ boxShadow: "0 0 40px rgba(124,58,237,0.15)" }}>
          <h2 className="text-3xl font-black mb-3 gradient-text">Ready to say Hey Omni?</h2>
          <p className="text-muted-foreground mb-8 text-sm">Experience the future of personal AI. Free forever.</p>
          <SignUpButton mode="modal">
            <button className="flex items-center gap-2 mx-auto text-sm font-bold px-8 py-4 rounded-2xl hover:scale-105 transition-transform"
              style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)", color: "#fff", boxShadow: "0 0 20px rgba(124,58,237,0.4)" }}>
              Create Free Account <ArrowRight className="w-4 h-4" />
            </button>
          </SignUpButton>
        </div>
      </section>

      <footer className="relative z-10 text-center pb-8">
        <p className="text-xs text-muted-foreground">© 2025 OmniNova AI · Personal AI Operating System</p>
      </footer>
    </div>
  );
}
