import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Send, Mic, MicOff, Loader2, Sparkles, Copy, Check, Volume2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";
import { useGetOpenaiConversation, getGetOpenaiConversationQueryKey, getSendOpenaiMessageUrl, getSendOpenaiVoiceMessageUrl } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth, useUser } from "@clerk/react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ChatDetailPageProps { id: number; }

interface StreamedMessage {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  isVoice?: boolean;
}

export default function ChatDetailPage({ id }: ChatDetailPageProps) {
  const { data: conversation, isLoading } = useGetOpenaiConversation(id);
  const { getToken } = useAuth();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [input, setInput] = useState("");
  const [streamedMessages, setStreamedMessages] = useState<StreamedMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const firstName = user?.firstName ?? "User";

  const allMessages = [
    ...(conversation?.messages ?? []).map((m) => ({ role: m.role as "user" | "assistant", content: m.content, id: String(m.id) })),
    ...streamedMessages,
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  async function sendMessage() {
    if (!input.trim() || isSending) return;
    const userMsg = input.trim();
    setInput("");
    setIsSending(true);

    setStreamedMessages((prev) => [
      ...prev,
      { role: "user", content: userMsg },
      { role: "assistant", content: "", streaming: true },
    ]);

    try {
      const token = await getToken();
      const url = getSendOpenaiMessageUrl(id);
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ content: userMsg }),
      });

      if (!response.ok || !response.body) throw new Error("Failed to send");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        for (const line of text.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.error) {
              toast({ title: "AI Error", description: data.error, variant: "destructive" });
            }
            if (data.content) {
              fullContent += data.content;
              setStreamedMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === "assistant") updated[updated.length - 1] = { ...last, content: fullContent };
                return updated;
              });
            }
            if (data.done) {
              setStreamedMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === "assistant") updated[updated.length - 1] = { ...last, streaming: false };
                return updated;
              });
              await queryClient.refetchQueries({ queryKey: getGetOpenaiConversationQueryKey(id) });
              setStreamedMessages([]);
              break outer;
            }
          } catch {}
        }
      }
    } catch {
      toast({ title: "Error", description: "Failed to send message.", variant: "destructive" });
      setStreamedMessages((prev) => prev.slice(0, -2));
    } finally {
      setIsSending(false);
      // If streaming never completed (network/server error), remove any dangling streaming messages
      setStreamedMessages((prev) => {
        if (prev.some((m) => m.streaming)) return prev.slice(0, -2);
        return prev;
      });
    }
  }

  async function toggleRecording() {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };

      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i += 8192) {
          binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + 8192, bytes.byteLength)));
        }
        const base64 = btoa(binary);

        setIsSending(true);
        setStreamedMessages((prev) => [...prev, { role: "assistant", content: "", streaming: true, isVoice: true }]);

        try {
          const token = await getToken();
          const url = getSendOpenaiVoiceMessageUrl(id);
          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({ audio: base64 }),
          });

          if (!response.ok || !response.body) throw new Error("Voice failed");

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let userTranscript = "";
          let assistantContent = "";
          const audioChunks: Uint8Array[] = [];

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = decoder.decode(value);
            for (const line of text.split("\n")) {
              if (!line.startsWith("data: ")) continue;
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === "user_transcript") userTranscript += data.data ?? "";
                if (data.type === "transcript") {
                  assistantContent += data.data ?? "";
                  setStreamedMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last?.role === "assistant") updated[updated.length - 1] = { ...last, content: assistantContent };
                    return updated;
                  });
                }
                if (data.type === "audio" && data.data) {
                  const bytes = Uint8Array.from(atob(data.data), (c) => c.charCodeAt(0));
                  audioChunks.push(bytes);
                }
                if (data.done) {
                  setStreamedMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last?.role === "assistant") updated[updated.length - 1] = { ...last, streaming: false };
                    return updated;
                  });
                  if (audioChunks.length > 0) {
                    const total = audioChunks.reduce((s, c) => s + c.length, 0);
                    const merged = new Uint8Array(total);
                    let off = 0;
                    for (const chunk of audioChunks) { merged.set(chunk, off); off += chunk.length; }
                    const aBlob = new Blob([merged], { type: "audio/mpeg" });
                    const aUrl = URL.createObjectURL(aBlob);
                    new Audio(aUrl).play().catch(() => {});
                  }
                  queryClient.invalidateQueries({ queryKey: getGetOpenaiConversationQueryKey(id) });
                }
              } catch {}
            }
          }

          if (userTranscript) {
            setStreamedMessages((prev) => {
              const msgs = [...prev];
              const ai = msgs.findIndex((m) => m.role === "assistant" && m.streaming === false);
              if (ai > 0) msgs.splice(ai, 0, { role: "user", content: userTranscript });
              return msgs;
            });
          }
        } catch {
          toast({ title: "Voice Error", description: "Voice processing failed.", variant: "destructive" });
          setStreamedMessages((prev) => prev.slice(0, -1));
        } finally {
          setIsSending(false);
          setStreamedMessages([]);
        }
      };

      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecording(true);
    } catch {
      toast({ title: "Microphone Error", description: "Could not access microphone.", variant: "destructive" });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  async function copyMessage(content: string, key: string) {
    await navigator.clipboard.writeText(content);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const title = conversation?.title ?? `Conversation #${id}`;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-border/40 backdrop-blur-sm"
        style={{ background: "rgba(6,3,18,0.8)" }}>
        <Link href="/chat">
          <button className="w-8 h-8 rounded-xl flex items-center justify-center border border-border/40 hover:border-primary/40 text-muted-foreground hover:text-foreground transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative">
            <div className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "radial-gradient(circle, rgba(124,58,237,0.3) 0%, rgba(37,99,235,0.15) 100%)", border: "1px solid rgba(124,58,237,0.4)" }}>
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-background" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-foreground truncate max-w-sm">{title}</h1>
            <p className="text-[10px] text-primary/60 tracking-wider">Omni · Online</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setVoiceMode((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border"
            style={{
              background: voiceMode ? "rgba(124,58,237,0.2)" : "transparent",
              borderColor: voiceMode ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.1)",
              color: voiceMode ? "#a78bfa" : "rgba(255,255,255,0.4)",
            }}
          >
            <Volume2 className="w-3.5 h-3.5" />
            Voice Mode
          </button>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] text-muted-foreground tracking-widest uppercase">Active</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          </div>
        ) : allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            {/* Empty state orb */}
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(124,58,237,0.25) 0%, rgba(37,99,235,0.1) 60%, transparent 80%)", animation: "omni-pulse 2.5s ease-in-out infinite" }} />
              <div className="absolute inset-3 rounded-full border border-primary/20" style={{ animation: "omni-ring 10s linear infinite" }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary/50" style={{ filter: "drop-shadow(0 0 8px rgba(124,58,237,0.6))" }} />
              </div>
            </div>
            <p className="text-lg font-semibold gradient-text mb-1">Hey {firstName}!</p>
            <p className="text-muted-foreground text-sm mb-1">Omni is ready to help.</p>
            <p className="text-muted-foreground/50 text-xs">Type a message or tap the mic to speak.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {allMessages.map((msg, i) => {
              const key = (msg as { id?: string }).id ?? `streamed-${i}`;
              const isUser = msg.role === "user";
              const isStreaming = (msg as StreamedMessage).streaming;
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn("flex", isUser ? "justify-end" : "justify-start")}
                >
                  <div className={cn("max-w-[78%] relative group", isUser ? "ml-16" : "mr-16")}>
                    {!isUser && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)" }}>
                          <Sparkles className="w-2.5 h-2.5 text-primary" />
                        </div>
                        <span className="text-[10px] text-primary/60 tracking-widest uppercase">Omni</span>
                        {(msg as StreamedMessage).isVoice && (
                          <span className="text-[10px] text-primary/40 flex items-center gap-1">
                            <Volume2 className="w-2.5 h-2.5" /> Voice
                          </span>
                        )}
                      </div>
                    )}
                    {isUser && (
                      <p className="text-[10px] text-muted-foreground/50 text-right mb-1.5 tracking-wider uppercase">{firstName}</p>
                    )}
                    <div className={cn(
                      "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                      isUser
                        ? "text-foreground/90 rounded-tr-md"
                        : "text-foreground rounded-tl-md"
                    )} style={isUser
                      ? { background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)" }
                      : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }
                    }>
                      {msg.content ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : isStreaming ? (
                        <div className="flex gap-1.5 py-1">
                          <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                        </div>
                      ) : null}
                    </div>
                    {!isStreaming && msg.content && (
                      <button
                        onClick={() => copyMessage(msg.content, key)}
                        className="absolute -bottom-5 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-muted-foreground"
                      >
                        {copiedId === key ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Voice recording overlay */}
      {isRecording && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
          style={{ background: "rgba(3,1,15,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="flex flex-col items-center gap-4 pointer-events-auto">
            <div className="relative">
              <div className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{ background: "radial-gradient(circle, rgba(239,68,68,0.4) 0%, rgba(239,68,68,0.1) 70%)", border: "1px solid rgba(239,68,68,0.5)", animation: "omni-pulse 1s ease-in-out infinite" }}>
                <Mic className="w-10 h-10 text-red-400" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 h-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="w-1 rounded-full bg-red-400 wave-bar"
                  style={{ height: "100%", "--dur": `${0.5 + i * 0.08}s` } as React.CSSProperties} />
              ))}
            </div>
            <p className="text-sm font-semibold text-red-300">Listening...</p>
            <button
              onClick={() => toggleRecording()}
              className="px-5 py-2 rounded-xl border border-red-500/40 text-red-400 text-sm hover:bg-red-500/10 transition-all"
            >
              Tap to stop
            </button>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="relative px-6 py-4 border-t border-border/40" style={{ background: "rgba(6,3,18,0.8)" }}>
        {voiceMode ? (
          /* Voice-first UI */
          <div className="flex flex-col items-center gap-4 py-2">
            <p className="text-xs text-muted-foreground tracking-wider">
              {isRecording ? "Listening... tap to stop" : isSending ? "Omni is thinking..." : "Tap the mic to speak"}
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleRecording}
                disabled={isSending}
                className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
                style={isRecording
                  ? { background: "rgba(239,68,68,0.2)", border: "2px solid rgba(239,68,68,0.6)", boxShadow: "0 0 24px rgba(239,68,68,0.4)" }
                  : { background: "radial-gradient(circle, #7c3aed 0%, #2563eb 100%)", border: "none", boxShadow: "0 0 24px rgba(124,58,237,0.5)" }
                }
              >
                {isSending
                  ? <Loader2 className="w-6 h-6 text-white animate-spin" />
                  : isRecording
                  ? <MicOff className="w-6 h-6 text-red-400" />
                  : <Mic className="w-6 h-6 text-white" />
                }
              </button>
            </div>
            <button onClick={() => setVoiceMode(false)} className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">
              Switch to text input
            </button>
          </div>
        ) : (
          /* Text input */
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask Omni anything, ${firstName}...`}
                disabled={isSending || isRecording}
                rows={1}
                className="resize-none min-h-[44px] max-h-[200px] bg-background border-border/40 focus:border-primary/50 text-sm placeholder:text-muted-foreground/30 rounded-xl"
                style={{ fieldSizing: "content" } as React.CSSProperties}
              />
            </div>
            <button
              onClick={toggleRecording}
              disabled={isSending}
              className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center border transition-all disabled:opacity-50 shrink-0",
                isRecording
                  ? "bg-red-500/20 border-red-500/50 text-red-400 animate-pulse"
                  : "border-border/40 hover:border-primary/50 text-muted-foreground hover:text-primary"
              )}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isSending || isRecording}
              className="w-11 h-11 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 shrink-0 hover:scale-105"
              style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)", boxShadow: input.trim() ? "0 0 14px rgba(124,58,237,0.5)" : "none" }}
            >
              {isSending ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
            </button>
          </div>
        )}
        {!voiceMode && (
          <p className="text-[10px] text-muted-foreground/25 mt-2 text-center tracking-widest uppercase">
            Enter to send · Shift+Enter for new line
          </p>
        )}
      </div>
    </div>
  );
}
