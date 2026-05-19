import { useState } from "react";
import { Mic, X, Sparkles, MessageSquare, Brain, ListChecks, Settings } from "lucide-react";
import { Link } from "wouter";
import WakeWordOverlay from "./wake-word-overlay";

const quickLinks = [
  { icon: MessageSquare, label: "New Chat", href: "/chat" },
  { icon: Brain, label: "Memory", href: "/memories" },
  { icon: ListChecks, label: "Routines", href: "/routines" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export default function FloatingAssistant() {
  const [expanded, setExpanded] = useState(false);
  const [wakeOpen, setWakeOpen] = useState(false);

  return (
    <>
      <WakeWordOverlay open={wakeOpen} onClose={() => setWakeOpen(false)} />

      {/* Floating container */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        {/* Quick links — visible when expanded */}
        {expanded && (
          <div className="flex flex-col gap-2 items-end animate-slide-up">
            {quickLinks.map(({ icon: Icon, label, href }) => (
              <Link key={href} href={href} onClick={() => setExpanded(false)}>
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl cursor-pointer transition-all hover:scale-105"
                  style={{ background: "rgba(8,4,24,0.92)", border: "1px solid rgba(124,58,237,0.3)", backdropFilter: "blur(12px)", boxShadow: "0 0 16px rgba(124,58,237,0.2)" }}>
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground/90 whitespace-nowrap">{label}</span>
                </div>
              </Link>
            ))}

            {/* Wake word button inside expanded */}
            <button
              onClick={() => { setExpanded(false); setWakeOpen(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all hover:scale-105"
              style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.5)", backdropFilter: "blur(12px)" }}
            >
              <Mic className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary whitespace-nowrap">Hey Omni</span>
            </button>
          </div>
        )}

        {/* Main FAB */}
        <div className="relative">
          {/* Pulse rings */}
          {!expanded && (
            <>
              <div className="absolute -inset-3 rounded-full border border-primary/15 animate-ping" style={{ animationDuration: "2.5s" }} />
              <div className="absolute -inset-6 rounded-full border border-primary/07 animate-ping" style={{ animationDuration: "3.5s", animationDelay: "0.5s" }} />
            </>
          )}

          <button
            onClick={() => setExpanded((e) => !e)}
            className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{
              background: expanded
                ? "rgba(8,4,24,0.95)"
                : "radial-gradient(circle, #7c3aed 0%, #2563eb 100%)",
              border: "1px solid rgba(124,58,237,0.6)",
              boxShadow: expanded
                ? "0 0 20px rgba(124,58,237,0.3)"
                : "0 0 30px rgba(124,58,237,0.6), 0 0 60px rgba(124,58,237,0.25)",
            }}
          >
            {expanded
              ? <X className="w-6 h-6 text-primary" />
              : <Sparkles className="w-7 h-7 text-white" style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.6))" }} />
            }
          </button>
        </div>
      </div>
    </>
  );
}
