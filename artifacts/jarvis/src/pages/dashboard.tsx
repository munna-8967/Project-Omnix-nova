import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useUser } from "@clerk/react";
import {
  Flashlight, Timer, Bell, Music, Gamepad2, Focus, Globe, Plus,
  Sparkles, MessageSquare, Brain, FileText, ListChecks, ChevronRight,
  Mic, Zap, Sun, Moon, Wind, Coffee
} from "lucide-react";
import { useGetDashboardStats, useListOpenaiConversations, useCreateOpenaiConversation } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import WakeWordOverlay from "@/components/wake-word-overlay";

type SystemMode = "normal" | "gaming" | "focus" | "sleep";

const systemModes: { id: SystemMode; icon: typeof Gamepad2; label: string; color: string; glow: string }[] = [
  { id: "normal", icon: Sun, label: "Normal", color: "#7c3aed", glow: "rgba(124,58,237,0.4)" },
  { id: "gaming", icon: Gamepad2, label: "Gaming", color: "#ef4444", glow: "rgba(239,68,68,0.4)" },
  { id: "focus", icon: Focus, label: "Focus", color: "#10b981", glow: "rgba(16,185,129,0.4)" },
  { id: "sleep", icon: Moon, label: "Sleep", color: "#6366f1", glow: "rgba(99,102,241,0.4)" },
];

function openUrl(url: string) {
  window.open(url, "_blank", "noopener");
}

function triggerFlashlight() {
  if ("mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices) {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities?.() as Record<string, unknown> | undefined;
        if (capabilities && "torch" in capabilities) {
          track.applyConstraints?.({ advanced: [{ torch: true } as MediaTrackConstraintSet] } as MediaTrackConstraints)
            .catch(() => {});
        }
        setTimeout(() => stream.getTracks().forEach(t => t.stop()), 5000);
      }).catch(() => {});
  }
}

const quickActions = [
  { icon: Flashlight, label: "Flashlight", color: "#f59e0b", desc: "Toggle torch", action: triggerFlashlight },
  { icon: Globe, label: "YouTube", color: "#ef4444", desc: "Open site", action: () => openUrl("https://youtube.com") },
  { icon: Music, label: "Spotify", color: "#22c55e", desc: "Open music", action: () => openUrl("https://open.spotify.com") },
  { icon: Globe, label: "Google", color: "#4285f4", desc: "Search web", action: () => openUrl("https://google.com") },
  { icon: Timer, label: "Timer", color: "#8b5cf6", desc: "Set timer", action: () => openUrl("https://timer.guru") },
  { icon: Globe, label: "Maps", color: "#34d399", desc: "Open maps", action: () => openUrl("https://maps.google.com") },
  { icon: Coffee, label: "Weather", color: "#0ea5e9", desc: "Check weather", action: () => openUrl("https://weather.com") },
  { icon: Wind, label: "Netflix", color: "#e50914", desc: "Open Netflix", action: () => openUrl("https://netflix.com") },
];

const suggestions = [
  "What should I focus on today?",
  "Summarize my recent memories",
  "Help me plan my evening routine",
  "Give me a productivity tip",
  "What's a good reminder to set?",
];

export default function DashboardPage() {
  const { user } = useUser();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<SystemMode>("normal");
  const [wakeActive, setWakeActive] = useState(false);

  const { data: stats } = useGetDashboardStats();
  const { data: conversations = [] } = useListOpenaiConversations();
  const { mutateAsync: createConversation, isPending } = useCreateOpenaiConversation();

  const firstName = user?.firstName ?? user?.emailAddresses[0]?.emailAddress?.split("@")[0] ?? "User";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const currentMode = systemModes.find(m => m.id === mode)!;

  async function startNewChat() {
    const title = `Chat ${new Date().toLocaleDateString()}`;
    const conv = await createConversation({ data: { title } });
    navigate(`/chat/${conv.id}`);
  }

  const statCards = [
    { icon: MessageSquare, label: "Conversations", value: stats?.totalConversations ?? 0, color: "#7c3aed" },
    { icon: Brain, label: "Memories", value: stats?.totalMemories ?? 0, color: "#2563eb" },
    { icon: FileText, label: "Notes", value: stats?.totalNotes ?? 0, color: "#10b981" },
    { icon: Bell, label: "Reminders", value: stats?.activeReminders ?? 0, color: "#f59e0b" },
  ];

  return (
    <>
      <WakeWordOverlay
        open={wakeActive}
        onClose={() => setWakeActive(false)}
        userName={firstName}
      />

      <div className="h-full overflow-auto p-6 space-y-6">
        {/* Header greeting */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground tracking-widest uppercase mb-1">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
            <h2 className="text-2xl font-bold text-foreground/90">
              {greeting},{" "}
              <span className="gradient-text">{firstName}</span> 👋
            </h2>
            <p className="text-sm text-muted-foreground mt-1">OmniNova is online and ready</p>
          </div>
          {/* System mode */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {systemModes.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setMode(m.id);
                  toast({ title: `${m.label} Mode Activated`, description: `OmniNova switched to ${m.label.toLowerCase()} mode.` });
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border"
                style={{
                  background: mode === m.id ? `${m.color}22` : "transparent",
                  borderColor: mode === m.id ? m.color : "rgba(255,255,255,0.1)",
                  color: mode === m.id ? m.color : "rgba(255,255,255,0.4)",
                  boxShadow: mode === m.id ? `0 0 12px ${m.glow}` : "none",
                }}
              >
                <m.icon className="w-3.5 h-3.5" />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Wake word card */}
        <button
          onClick={() => setWakeActive(true)}
          className="w-full rounded-2xl p-5 flex items-center gap-5 transition-all group text-left omni-glow-hover"
          style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(37,99,235,0.1))", border: "1px solid rgba(124,58,237,0.3)" }}
        >
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-full flex items-center justify-center animate-omni-pulse"
              style={{ background: "radial-gradient(circle, rgba(124,58,237,0.4) 0%, rgba(37,99,235,0.2) 100%)", border: "1px solid rgba(124,58,237,0.5)" }}>
              <Mic className="w-7 h-7 text-primary" style={{ filter: "drop-shadow(0 0 8px rgba(124,58,237,0.9))" }} />
            </div>
            <div className="absolute -inset-2 rounded-full border border-primary/15 animate-ping" style={{ animationDuration: "2s" }} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-base text-foreground mb-0.5">Say "Hey Omni"</h3>
            <p className="text-sm text-muted-foreground">Tap to activate your personal AI assistant</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium shrink-0"
            style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa" }}>
            <Sparkles className="w-3 h-3" />
            Wake Omni
          </div>
        </button>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3">
          {statCards.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="omni-card rounded-2xl p-4 flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <p className="text-xl font-black" style={{ color }}>{value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-foreground/80 uppercase tracking-widest">Quick Actions</h3>
            <span className="text-[10px] text-muted-foreground">System Controls</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map(({ icon: Icon, label, color, desc, action }) => (
              <button
                key={label}
                onClick={() => {
                  action();
                  toast({ title: label, description: `Opening ${label}...` });
                }}
                className="omni-card omni-glow-hover rounded-2xl p-4 flex flex-col items-center text-center gap-2 transition-all hover:scale-[1.03] active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18`, border: `1px solid ${color}35` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground/90">{label}</p>
                  <p className="text-[10px] text-muted-foreground">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom row: Recent chats + Suggestions */}
        <div className="grid grid-cols-2 gap-4">
          {/* Recent conversations */}
          <div className="omni-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-foreground/80">Recent Chats</h3>
              <Link href="/chat">
                <span className="text-xs text-primary hover:underline cursor-pointer">View all</span>
              </Link>
            </div>
            <div className="space-y-2">
              {conversations.slice(0, 4).map((conv) => (
                <Link key={conv.id} href={`/chat/${conv.id}`}>
                  <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-primary/5 transition-colors cursor-pointer group border border-transparent hover:border-primary/15">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(124,58,237,0.15)" }}>
                      <MessageSquare className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <p className="text-xs text-foreground/80 truncate flex-1">{conv.title}</p>
                    <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
              {conversations.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No conversations yet</p>
              )}
            </div>
            <button
              onClick={startNewChat}
              disabled={isPending}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all border border-primary/25 hover:bg-primary/10 text-primary"
            >
              <Plus className="w-3.5 h-3.5" />
              New Conversation
            </button>
          </div>

          {/* Proactive suggestions */}
          <div className="omni-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground/80">Ask OmniNova</h3>
            </div>
            <div className="space-y-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={async () => {
                    const conv = await createConversation({ data: { title: s } });
                    navigate(`/chat/${conv.id}`);
                  }}
                  className="w-full text-left flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-primary/5 transition-colors group border border-transparent hover:border-primary/15"
                >
                  <Sparkles className="w-3 h-3 text-primary shrink-0" />
                  <span className="text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors">{s}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
