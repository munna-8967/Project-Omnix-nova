import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/react";
import { Mic, MicOff, X, Sparkles, MessageSquare } from "lucide-react";
import { useLocation } from "wouter";
import { useCreateOpenaiConversation } from "@workspace/api-client-react";

interface Props {
  open: boolean;
  onClose: () => void;
  userName?: string;
}

const quickPhrases = [
  "What's on my mind?",
  "Set a reminder",
  "Open YouTube",
  "Switch to Focus mode",
  "Tell me a fun fact",
  "Help me be productive",
];

type Stage = "greeting" | "listening" | "processing";

export default function WakeWordOverlay({ open, onClose, userName }: Props) {
  const { user } = useUser();
  const [, navigate] = useLocation();
  const [stage, setStage] = useState<Stage>("greeting");
  const [transcript, setTranscript] = useState("");
  const [greeting, setGreeting] = useState("");
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const { mutateAsync: createConversation } = useCreateOpenaiConversation();

  const name = userName ?? user?.firstName ?? "there";
  const hour = new Date().getHours();
  const timeGreet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    if (!open) {
      setStage("greeting");
      setTranscript("");
      stopRecognition();
      return;
    }
    setGreeting(`${timeGreet}, ${name}! How can I help you today?`);
    setStage("greeting");

    const timer = setTimeout(() => {
      setStage("listening");
      startRecognition();
    }, 1800);

    return () => clearTimeout(timer);
  }, [open]);

  function stopRecognition() {
    if (recognitionRef.current) {
      try { (recognitionRef.current as { stop: () => void }).stop(); } catch {}
      recognitionRef.current = null;
    }
  }

  function startRecognition() {
    type SR = {
      continuous: boolean; interimResults: boolean; lang: string;
      start: () => void; stop: () => void;
      onresult: ((e: { resultIndex: number; results: { isFinal: boolean; 0: { transcript: string } }[] }) => void) | null;
      onerror: (() => void) | null;
      onend: (() => void) | null;
    };
    const Win = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
    const SpeechRec = Win.SpeechRecognition || Win.webkitSpeechRecognition;
    if (!SpeechRec) return;

    const rec = new SpeechRec();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";
    recognitionRef.current = rec;

    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        interim += e.results[i][0].transcript;
      }
      setTranscript(interim);
      if (e.results[e.results.length - 1].isFinal) {
        const final = e.results[e.results.length - 1][0].transcript;
        handleCommand(final);
      }
    };

    rec.onerror = () => setStage("listening");
    rec.onend = () => {};
    rec.start();
  }

  async function handleCommand(text: string) {
    setStage("processing");
    setTranscript(text);
    const lower = text.toLowerCase();

    if (lower.includes("youtube")) { window.open("https://youtube.com", "_blank"); onClose(); return; }
    if (lower.includes("spotify") || lower.includes("music")) { window.open("https://open.spotify.com", "_blank"); onClose(); return; }
    if (lower.includes("google")) { window.open("https://google.com", "_blank"); onClose(); return; }
    if (lower.includes("maps")) { window.open("https://maps.google.com", "_blank"); onClose(); return; }
    if (lower.includes("netflix")) { window.open("https://netflix.com", "_blank"); onClose(); return; }

    try {
      const conv = await createConversation({ data: { title: text.slice(0, 60) || "Voice conversation" } });
      navigate(`/chat/${conv.id}`);
    } catch {}
    onClose();
  }

  async function handleQuickPhrase(phrase: string) {
    const conv = await createConversation({ data: { title: phrase } });
    navigate(`/chat/${conv.id}`);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(3,1,15,0.93)", backdropFilter: "blur(20px)" }}>
      {/* Ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] rounded-full opacity-[0.12]" style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 65%)", animation: "omni-pulse 2.5s ease-in-out infinite" }} />
      </div>

      {/* Close button */}
      <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center border border-border/40 hover:border-primary/40 transition-all text-muted-foreground hover:text-foreground">
        <X className="w-5 h-5" />
      </button>

      <div className="relative z-10 flex flex-col items-center text-center max-w-lg w-full px-8 animate-slide-up">
        {/* Orb */}
        <div className="relative w-32 h-32 mb-8">
          <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle, rgba(124,58,237,0.5) 0%, rgba(37,99,235,0.2) 70%, transparent 90%)", animation: stage === "listening" ? "omni-pulse 1.2s ease-in-out infinite" : "omni-pulse 2.5s ease-in-out infinite" }} />
          <div className="absolute inset-3 rounded-full border border-primary/30" style={{ animation: "omni-ring 8s linear infinite" }} />
          <div className="absolute inset-6 rounded-full border border-blue-500/20" style={{ animation: "omni-ring-rev 5s linear infinite" }} />
          <div className="absolute inset-0 flex items-center justify-center">
            {stage === "processing"
              ? <Sparkles className="w-12 h-12 text-primary animate-pulse" style={{ filter: "drop-shadow(0 0 16px rgba(124,58,237,1))" }} />
              : stage === "listening"
              ? <Mic className="w-12 h-12 text-primary" style={{ filter: "drop-shadow(0 0 16px rgba(124,58,237,1))" }} />
              : <Sparkles className="w-12 h-12 text-primary" style={{ filter: "drop-shadow(0 0 16px rgba(124,58,237,1))" }} />
            }
          </div>
        </div>

        {/* Stage content */}
        {stage === "greeting" && (
          <>
            <p className="text-xs text-primary/70 tracking-widest uppercase mb-3">OmniNova AI</p>
            <h2 className="text-3xl font-black gradient-text mb-2">Hey {name}!</h2>
            <p className="text-muted-foreground text-base">{greeting}</p>
          </>
        )}

        {stage === "listening" && (
          <>
            <p className="text-xs text-primary/70 tracking-widest uppercase mb-3">Listening...</p>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {transcript || "Go ahead, speak now"}
            </h2>
            {/* Waveform */}
            <div className="flex items-center gap-1 h-8 my-2">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="w-1 rounded-full bg-primary wave-bar"
                  style={{ height: "100%", "--dur": `${0.6 + i * 0.1}s` } as React.CSSProperties} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Say a command, ask a question, or open an app</p>
          </>
        )}

        {stage === "processing" && (
          <>
            <p className="text-xs text-primary/70 tracking-widest uppercase mb-3">Processing...</p>
            <h2 className="text-2xl font-bold gradient-text mb-2">"{transcript}"</h2>
            <p className="text-muted-foreground text-sm">OmniNova is on it...</p>
          </>
        )}

        {/* Quick phrases */}
        {stage === "listening" && (
          <div className="mt-8 w-full">
            <p className="text-xs text-muted-foreground mb-3">Or tap a suggestion:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {quickPhrases.map((p) => (
                <button
                  key={p}
                  onClick={() => handleQuickPhrase(p)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border border-primary/20 hover:border-primary/50 hover:bg-primary/10 transition-all text-muted-foreground hover:text-primary"
                >
                  <MessageSquare className="w-3 h-3" />
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
