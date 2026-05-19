import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Mic, MicOff, Loader2, Zap, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";
import { useGetOpenaiConversation, getGetOpenaiConversationQueryKey, getSendOpenaiMessageUrl, getSendOpenaiVoiceMessageUrl } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ChatDetailPageProps {
  id: number;
}

interface StreamedMessage {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

export default function ChatDetailPage({ id }: ChatDetailPageProps) {
  const { data: conversation, isLoading } = useGetOpenaiConversation(id);
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [input, setInput] = useState("");
  const [streamedMessages, setStreamedMessages] = useState<StreamedMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: userMsg }),
      });

      if (!response.ok || !response.body) throw new Error("Failed to send");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullContent += data.content;
                setStreamedMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.role === "assistant") {
                    updated[updated.length - 1] = { ...last, content: fullContent };
                  }
                  return updated;
                });
              }
              if (data.done) {
                setStreamedMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.role === "assistant") {
                    updated[updated.length - 1] = { ...last, streaming: false };
                  }
                  return updated;
                });
                queryClient.invalidateQueries({ queryKey: getGetOpenaiConversationQueryKey(id) });
              }
            } catch {}
          }
        }
      }
    } catch {
      toast({ title: "Error", description: "Failed to send message. Please try again.", variant: "destructive" });
      setStreamedMessages((prev) => prev.slice(0, -2));
    } finally {
      setIsSending(false);
      setStreamedMessages([]);
    }
  }

  async function toggleRecording() {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const arrayBuffer = await blob.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

        setIsSending(true);
        setStreamedMessages((prev) => [
          ...prev,
          { role: "assistant", content: "", streaming: true },
        ]);

        try {
          const token = await getToken();
          const url = getSendOpenaiVoiceMessageUrl(id);
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
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
            const lines = text.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === "user_transcript") userTranscript += data.data ?? "";
                  if (data.type === "transcript") {
                    assistantContent += data.data ?? "";
                    setStreamedMessages((prev) => {
                      const updated = [...prev];
                      const last = updated[updated.length - 1];
                      if (last?.role === "assistant") {
                        updated[updated.length - 1] = { ...last, content: assistantContent };
                      }
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
                      const totalLength = audioChunks.reduce((sum, c) => sum + c.length, 0);
                      const merged = new Uint8Array(totalLength);
                      let offset = 0;
                      for (const chunk of audioChunks) { merged.set(chunk, offset); offset += chunk.length; }
                      const audioBlob = new Blob([merged], { type: "audio/mpeg" });
                      const url = URL.createObjectURL(audioBlob);
                      const audio = new Audio(url);
                      audio.play().catch(() => {});
                    }
                    queryClient.invalidateQueries({ queryKey: getGetOpenaiConversationQueryKey(id) });
                  }
                } catch {}
              }
            }
          }

          if (userTranscript) {
            setStreamedMessages((prev) => {
              const msgs = [...prev];
              const assistantIdx = msgs.findIndex((m) => m.role === "assistant" && m.streaming === false);
              if (assistantIdx > 0) {
                msgs.splice(assistantIdx, 0, { role: "user", content: userTranscript });
              }
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

  useEffect(() => {
    if (!isRecording) {
      mediaRecorderRef.current?.stop();
    }
  }, [isRecording]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
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
      <div className="flex items-center gap-4 px-6 py-4 border-b border-border/50 hud-border bg-card/50">
        <Link href="/chat">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border border-primary/40 flex items-center justify-center"
            style={{ boxShadow: "0 0 10px rgba(0,229,255,0.2)" }}>
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground tracking-wide truncate max-w-[400px]">{title}</h1>
            <p className="text-xs text-primary/60">JARVIS — Online</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"
            style={{ boxShadow: "0 0 6px rgba(0,229,255,0.8)" }} />
          <span className="text-xs text-muted-foreground tracking-wider">SYSTEM READY</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full border-2 border-primary/30 flex items-center justify-center mb-4"
              style={{ boxShadow: "0 0 24px rgba(0,229,255,0.15)" }}>
              <Zap className="w-8 h-8 text-primary/50" />
            </div>
            <p className="text-muted-foreground/60 tracking-wide text-sm">JARVIS is ready.</p>
            <p className="text-muted-foreground/40 text-xs mt-1">Type a message or use voice input to begin.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {allMessages.map((msg, i) => {
              const key = (msg as any).id ?? `streamed-${i}`;
              const isUser = msg.role === "user";
              const isStreaming = (msg as StreamedMessage).streaming;
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex", isUser ? "justify-end" : "justify-start")}
                >
                  <div className={cn(
                    "max-w-[80%] relative group",
                    isUser ? "ml-12" : "mr-12"
                  )}>
                    {!isUser && (
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-5 h-5 rounded-full border border-primary/50 flex items-center justify-center">
                          <Zap className="w-2.5 h-2.5 text-primary" />
                        </div>
                        <span className="text-xs text-primary/70 tracking-widest">JARVIS</span>
                      </div>
                    )}
                    <div className={cn(
                      "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                      isUser
                        ? "bg-primary/15 border border-primary/30 text-foreground rounded-tr-sm"
                        : "bg-card border border-border/50 text-foreground rounded-tl-sm"
                    )}>
                      {msg.content ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : isStreaming ? (
                        <div className="typing-indicator flex gap-1.5 py-1">
                          <span /><span /><span />
                        </div>
                      ) : null}
                    </div>
                    {!isStreaming && msg.content && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => copyMessage(msg.content, key)}
                        className="absolute -bottom-6 right-0 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 text-muted-foreground/50 hover:text-muted-foreground"
                      >
                        {copiedId === key ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="px-6 py-4 border-t border-border/50 hud-border">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Speak your command, Sir..."
              disabled={isSending || isRecording}
              rows={1}
              className="resize-none min-h-[44px] max-h-[200px] bg-card border-border/50 focus:border-primary/40 pr-4 text-sm tracking-wide placeholder:text-muted-foreground/40"
              style={{ fieldSizing: "content" } as React.CSSProperties}
              data-testid="input-message"
            />
          </div>
          <Button
            size="icon"
            variant="outline"
            onClick={() => { setIsRecording(!isRecording); toggleRecording(); }}
            disabled={isSending}
            className={cn(
              "h-11 w-11 border-border/50 transition-all",
              isRecording
                ? "bg-red-500/20 border-red-500/50 text-red-400 animate-pulse"
                : "hover:border-primary/40 hover:text-primary"
            )}
            data-testid="button-voice"
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={!input.trim() || isSending || isRecording}
            className="h-11 w-11 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30"
            data-testid="button-send"
            style={{ boxShadow: input.trim() ? "0 0 12px rgba(0,229,255,0.4)" : "none" }}
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground/30 mt-2 text-center tracking-widest">
          PRESS ENTER TO SEND — SHIFT+ENTER FOR NEWLINE
        </p>
      </div>
    </div>
  );
}
