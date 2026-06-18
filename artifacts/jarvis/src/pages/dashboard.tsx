import { useState, useRef, useEffect, useCallback } from "react";
import { useUser } from "@clerk/react";
import { useLocation } from "wouter";
import { Sparkles, Mic, Brain, Zap, MessageSquare, Settings, ChevronRight } from "lucide-react";
import {
  useGetDashboardStats,
  useListMemories,
  useCreateOpenaiConversation,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────
type OrbState = "idle" | "listening" | "thinking" | "responding" | "executing";

const STATE_CONFIG: Record<OrbState, {
  core: string; glow: string; glowOuter: string; speed: string;
  label: string; labelColor: string; anim: string;
  ringColor: string; waveColor: string;
}> = {
  idle: {
    core:       "radial-gradient(circle at 34% 28%, rgba(255,255,255,0.18) 0%, #7c3aed 32%, #2563eb 100%)",
    glow:       "rgba(124,58,237,0.55)",
    glowOuter:  "rgba(124,58,237,0.18)",
    speed:      "3.2s",
    label:      "Tap to speak",
    labelColor: "rgba(167,139,250,0.7)",
    anim:       "orb-breathe",
    ringColor:  "rgba(124,58,237,",
    waveColor:  "#a78bfa",
  },
  listening: {
    core:       "radial-gradient(circle at 34% 28%, rgba(255,255,255,0.22) 0%, #c026d3 28%, #7c3aed 100%)",
    glow:       "rgba(192,38,211,0.65)",
    glowOuter:  "rgba(192,38,211,0.22)",
    speed:      "0.85s",
    label:      "Listening…",
    labelColor: "#f0abfc",
    anim:       "orb-listen",
    ringColor:  "rgba(192,38,211,",
    waveColor:  "#f0abfc",
  },
  thinking: {
    core:       "radial-gradient(circle at 34% 28%, rgba(255,255,255,0.18) 0%, #d97706 30%, #7c3aed 100%)",
    glow:       "rgba(217,119,6,0.55)",
    glowOuter:  "rgba(217,119,6,0.18)",
    speed:      "1.5s",
    label:      "Thinking…",
    labelColor: "#fcd34d",
    anim:       "orb-think",
    ringColor:  "rgba(217,119,6,",
    waveColor:  "#fcd34d",
  },
  responding: {
    core:       "radial-gradient(circle at 34% 28%, rgba(255,255,255,0.18) 0%, #059669 30%, #2563eb 100%)",
    glow:       "rgba(5,150,105,0.55)",
    glowOuter:  "rgba(5,150,105,0.18)",
    speed:      "2s",
    label:      "Responding…",
    labelColor: "#6ee7b7",
    anim:       "orb-breathe",
    ringColor:  "rgba(5,150,105,",
    waveColor:  "#6ee7b7",
  },
  executing: {
    core:       "radial-gradient(circle at 34% 28%, rgba(255,255,255,0.28) 0%, #f59e0b 25%, #7c3aed 100%)",
    glow:       "rgba(245,158,11,0.65)",
    glowOuter:  "rgba(245,158,11,0.22)",
    speed:      "0.45s",
    label:      "Executing…",
    labelColor: "#fde68a",
    anim:       "orb-execute",
    ringColor:  "rgba(245,158,11,",
    waveColor:  "#fde68a",
  },
};

const WAVE_BARS = Array.from({ length: 20 }, (_, i) => {
  const angle = (i / 20) * Math.PI * 2 - Math.PI / 2;
  return {
    x:     Math.cos(angle) * 128,
    y:     Math.sin(angle) * 128,
    angle: (i / 20) * 360,
    h:     8 + (i % 3) * 9 + (i % 7) * 4,
    dur:   `${0.32 + (i % 6) * 0.065}s`,
    delay: `${(i / 20) * 0.45}s`,
  };
});

// ─── Orb ─────────────────────────────────────────────────────────────────────
function OmniOrb({ state, onTap }: { state: OrbState; onTap: () => void }) {
  const cfg = STATE_CONFIG[state];
  const OrbIcon = state === "idle" ? Sparkles
    : state === "listening" ? Mic
    : state === "thinking" ? Brain
    : state === "responding" ? MessageSquare
    : Zap;

  return (
    <div className="relative flex items-center justify-center animate-float-orb" style={{ width: 300, height: 300 }}>
      <div className="absolute rounded-full pointer-events-none" style={{
        inset: -60,
        background: `radial-gradient(circle, ${cfg.glowOuter} 0%, transparent 65%)`,
        filter: "blur(32px)",
        animation: `${cfg.anim} ${cfg.speed} ease-in-out infinite`,
        willChange: "transform",
      }} />
      <div className="absolute rounded-full pointer-events-none" style={{
        inset: 10, border: `1px solid ${cfg.ringColor}0.15)`, animation: "ripple 3s ease-out infinite",
      }} />
      <div className="absolute rounded-full pointer-events-none" style={{
        inset: 16, border: `1px solid ${cfg.ringColor}0.12)`, animation: "ring-cw 28s linear infinite",
      }} />
      <div className="absolute rounded-full pointer-events-none" style={{
        inset: 36, border: `1px dashed ${cfg.ringColor}0.2)`, animation: "ring-ccw 16s linear infinite",
      }} />
      <div className="absolute rounded-full pointer-events-none" style={{
        inset: 58, border: `1px solid ${cfg.ringColor}0.35)`, animation: "ring-cw 9s linear infinite",
      }} />
      <div
        onClick={onTap}
        className="absolute rounded-full cursor-pointer select-none"
        style={{
          inset: 76,
          background: cfg.core,
          boxShadow: `0 0 32px ${cfg.glow}, 0 0 64px ${cfg.glowOuter}, inset 0 1px 0 rgba(255,255,255,0.15)`,
          animation: `${cfg.anim} ${cfg.speed} ease-in-out infinite`,
          willChange: "transform",
          transition: "box-shadow 0.6s ease, background 0.6s ease",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <OrbIcon className="w-12 h-12" style={{
          color: "#fff",
          filter: `drop-shadow(0 0 12px ${cfg.glow})`,
          opacity: state === "listening" ? 0.95 : 0.85,
        }} />
      </div>
      {(state === "listening" || state === "thinking") && WAVE_BARS.map((bar, i) => (
        <div key={i} className="absolute pointer-events-none" style={{
          left: "50%", top: "50%",
          transformOrigin: "bottom center",
          transform: `translate(calc(-50% + ${bar.x}px), calc(-50% + ${bar.y}px)) rotate(${bar.angle}deg)`,
          width: 3, height: bar.h,
        }}>
          <div style={{
            width: "100%", height: "100%", borderRadius: 3,
            background: cfg.waveColor,
            opacity: state === "thinking" ? 0.4 : 0.85,
            animation: `wave-bar ${bar.dur} ease-in-out infinite`,
            animationDelay: bar.delay,
            transformOrigin: "bottom center",
          }} />
        </div>
      ))}
    </div>
  );
}

// ─── Omni Thoughts ────────────────────────────────────────────────────────────
function buildThoughts(firstName: string, hour: number, totalMemories: number, totalConversations: number): string[] {
  const greeting = hour < 10
    ? `Good morning, ${firstName}. How would you like to begin?`
    : hour < 13
    ? `Morning energy is high, ${firstName}. What's on your mind?`
    : hour < 17
    ? `Afternoon check-in, ${firstName}. ${totalConversations > 0 ? `${totalConversations} conversation${totalConversations > 1 ? "s" : ""} so far today.` : "What are you thinking about?"}`
    : hour < 21
    ? `Evening, ${firstName}. The day is winding down.`
    : `Late night, ${firstName}. I'm here.`;

  const lines = [greeting];
  if (totalMemories > 0)
    lines.push(`I hold ${totalMemories} memor${totalMemories === 1 ? "y" : "ies"} about you. Getting to know you better every day.`);
  else
    lines.push("Start a conversation and I'll begin learning what matters to you.");

  return lines.slice(0, 2);
}

// ─── Web commands ─────────────────────────────────────────────────────────────
const WEB_COMMANDS: { match: RegExp; url: string; label: string }[] = [
  { match: /youtube/i,        url: "https://youtube.com",      label: "YouTube"   },
  { match: /spotify/i,        url: "https://open.spotify.com", label: "Spotify"   },
  { match: /netflix/i,        url: "https://netflix.com",      label: "Netflix"   },
  { match: /\bgoogle\b/i,     url: "https://google.com",       label: "Google"    },
  { match: /maps/i,           url: "https://maps.google.com",  label: "Maps"      },
  { match: /weather/i,        url: "https://weather.com",      label: "Weather"   },
  { match: /instagram/i,      url: "https://instagram.com",    label: "Instagram" },
  { match: /twitter|x\.com/i, url: "https://x.com",           label: "X"         },
];

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useUser();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [orbState, setOrbState]     = useState<OrbState>("idle");
  const [transcript, setTranscript] = useState("");
  const [showInput, setShowInput]   = useState(false);
  const [textInput, setTextInput]   = useState("");
  const recRef = useRef<{ stop: () => void } | null>(null);

  const firstName = user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ?? "there";
  const hour = new Date().getHours();

  const { data: stats }         = useGetDashboardStats();
  const { data: memories = [] } = useListMemories();
  const { mutateAsync: createConversation } = useCreateOpenaiConversation();

  const thoughts = buildThoughts(
    firstName, hour,
    stats?.totalMemories ?? 0,
    stats?.totalConversations ?? 0,
  );

  // ── Voice ──────────────────────────────────────────────────────────────────
  const processCommand = useCallback(async (text: string) => {
    if (!text.trim()) { setOrbState("idle"); return; }
    for (const cmd of WEB_COMMANDS) {
      if (cmd.match.test(text)) {
        setOrbState("executing");
        toast({ title: `Opening ${cmd.label}…` });
        window.open(cmd.url, "_blank", "noopener");
        setTimeout(() => { setOrbState("idle"); setTranscript(""); }, 1500);
        return;
      }
    }
    setOrbState("responding");
    try {
      const conv = await createConversation({ data: { title: text.slice(0, 64) || "Voice conversation" } });
      navigate(`/chat/${conv.id}`);
    } catch {
      toast({ title: "Error", description: "Could not start a conversation.", variant: "destructive" });
      setOrbState("idle");
    }
    setTranscript("");
  }, [createConversation, navigate, toast]);

  const handleOrbTap = useCallback(() => {
    if (orbState === "listening") {
      recRef.current?.stop();
      recRef.current = null;
      if (transcript) {
        setOrbState("thinking");
        setTimeout(() => processCommand(transcript), 500);
      } else {
        setOrbState("idle");
      }
      return;
    }
    if (orbState !== "idle") return;

    type SpeechRecognitionLike = {
      continuous: boolean; interimResults: boolean; lang: string;
      start(): void; stop(): void;
      onresult: ((e: { resultIndex: number; results: { isFinal: boolean; 0: { transcript: string } }[] }) => void) | null;
      onerror: (() => void) | null;
      onend: (() => void) | null;
    };
    const Win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SpeechRec = Win.SpeechRecognition || Win.webkitSpeechRecognition;

    if (!SpeechRec) { setShowInput(true); return; }

    setOrbState("listening");
    setTranscript("");
    const rec = new SpeechRec();
    rec.continuous = false; rec.interimResults = true; rec.lang = "en-US";
    recRef.current = rec;

    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) interim += e.results[i][0].transcript;
      setTranscript(interim);
      if (e.results[e.results.length - 1].isFinal) {
        recRef.current = null;
        setOrbState("thinking");
        setTimeout(() => processCommand(interim), 400);
      }
    };
    rec.onerror = () => { setOrbState("idle"); setTranscript(""); recRef.current = null; };
    rec.onend = () => {};
    rec.start();
  }, [orbState, transcript, processCommand]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body && orbState === "idle") {
        e.preventDefault(); handleOrbTap();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [orbState, handleOrbTap]);

  return (
    <div className="h-full overflow-auto flex flex-col relative" style={{
      background: "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.07) 0%, transparent 55%)",
    }}>

      {/* ── Status bar ── */}
      <div className="flex items-center justify-between px-8 pt-7 pb-2 animate-fade-in">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-muted-foreground tracking-[0.2em] uppercase">Omni · Online</span>
        </div>
      </div>

      {/* ── ORB HERO ── */}
      <div className="flex flex-col items-center justify-center pt-8 pb-10 px-8 animate-fade-in">
        <OmniOrb state={orbState} onTap={handleOrbTap} />

        <div className="mt-7 text-center space-y-2">
          <h2 className="text-3xl font-black tracking-tight">
            <span className="gradient-text">Hey, {firstName}</span>
          </h2>
          <div className="h-6 flex items-center justify-center">
            {transcript && orbState !== "idle" ? (
              <p className="text-sm font-medium px-3 py-0.5 rounded-full"
                style={{ color: STATE_CONFIG[orbState].labelColor, background: `${STATE_CONFIG[orbState].glow.replace("0.55", "0.08")}` }}>
                "{transcript}"
              </p>
            ) : (
              <p className="text-sm transition-all duration-500" style={{ color: STATE_CONFIG[orbState].labelColor }}>
                {STATE_CONFIG[orbState].label}
              </p>
            )}
          </div>
          {orbState === "idle" && (
            <p className="text-xs text-muted-foreground/40 tracking-widest uppercase">
              tap orb · press space · or{" "}
              <button onClick={() => setShowInput(v => !v)} className="underline hover:text-muted-foreground transition-colors">
                type
              </button>
            </p>
          )}
        </div>

        {showInput && orbState === "idle" && (
          <div className="mt-5 w-full max-w-sm animate-slide-up">
            <input
              autoFocus
              className="w-full bg-white/[0.04] border border-primary/25 rounded-2xl px-5 py-3 text-sm text-foreground placeholder:text-muted-foreground/35 focus:outline-none focus:border-primary/60 text-center"
              placeholder={`Ask Omni, ${firstName}…`}
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && textInput.trim()) {
                  setTranscript(textInput);
                  setOrbState("thinking");
                  setShowInput(false);
                  const q = textInput;
                  setTextInput("");
                  setTimeout(() => processCommand(q), 300);
                }
                if (e.key === "Escape") { setShowInput(false); setTextInput(""); }
              }}
            />
          </div>
        )}
      </div>

      <div className="mx-8 border-t border-white/[0.04]" />

      {/* ── Ambient sections ── */}
      <div className="flex-1 overflow-auto px-8 pb-12 space-y-10 mt-8">

        {/* OMNI THOUGHTS */}
        <section className="animate-slide-up" style={{ animationDelay: "0.05s" }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-primary/60" />
            <p className="text-[10px] text-muted-foreground/40 tracking-[0.25em] uppercase">Omni Thoughts</p>
          </div>
          <div className="space-y-2.5">
            {thoughts.map((t, i) => (
              <div key={i} className="px-5 py-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <p className="text-sm text-foreground/65 leading-relaxed">{t}</p>
              </div>
            ))}
          </div>
        </section>

        {/* MEMORY GLIMPSES */}
        {memories.length > 0 && (
          <section className="animate-slide-up" style={{ animationDelay: "0.12s" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-3.5 h-3.5 text-primary/60" />
                <p className="text-[10px] text-muted-foreground/40 tracking-[0.25em] uppercase">Memory</p>
              </div>
              <button onClick={() => navigate("/memories")} className="text-[10px] text-primary/50 hover:text-primary transition-colors flex items-center gap-1">
                All <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {memories.slice(0, 4).map((m) => (
                <div key={m.id} className="px-3 py-1.5 rounded-full border border-primary/15 bg-primary/5 text-xs text-primary/70 max-w-xs truncate">
                  {m.content.slice(0, 48)}{m.content.length > 48 ? "…" : ""}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* QUICK ACCESS */}
        <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <p className="text-[10px] text-muted-foreground/40 tracking-[0.25em] uppercase mb-3">Quick Access</p>
          <div className="grid grid-cols-3 gap-2">
            {([
              { icon: MessageSquare, label: "Chat",   href: "/chat"     },
              { icon: Brain,         label: "Memory", href: "/memories" },
              { icon: Settings,      label: "Settings",href: "/settings"},
            ] as const).map(({ icon: Icon, label, href }) => (
              <button
                key={href}
                onClick={() => navigate(href)}
                className="flex flex-col items-center gap-2 py-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-primary/25 hover:bg-primary/5 transition-all group"
              >
                <Icon className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                <span className="text-[10px] text-muted-foreground/40 group-hover:text-primary/60 transition-colors uppercase tracking-wide">{label}</span>
              </button>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
