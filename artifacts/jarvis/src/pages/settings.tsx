import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Save, User, Mic, Palette, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const PERSONALITIES = [
  { value: "jarvis", label: "JARVIS", desc: "Refined, precise, dry wit" },
  { value: "friday", label: "FRIDAY", desc: "Warm, conversational, supportive" },
  { value: "karen", label: "KAREN", desc: "Helpful, detailed, friendly" },
  { value: "custom", label: "Custom", desc: "Define your own personality" },
];

const VOICES = [
  { value: "alloy", label: "Alloy" },
  { value: "echo", label: "Echo" },
  { value: "fable", label: "Fable" },
  { value: "onyx", label: "Onyx" },
  { value: "nova", label: "Nova" },
  { value: "shimmer", label: "Shimmer" },
];

export default function SettingsPage() {
  const { data: settings, isLoading } = useGetSettings();
  const updateSettings = useUpdateSettings();
  const { toast } = useToast();

  const [assistantName, setAssistantName] = useState("JARVIS");
  const [personality, setPersonality] = useState("jarvis");
  const [customPersonality, setCustomPersonality] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceGender, setVoiceGender] = useState("alloy");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (settings) {
      setAssistantName(settings.assistantName ?? "JARVIS");
      setPersonality(settings.personality ?? "jarvis");
      setCustomPersonality(settings.customPersonality ?? "");
      setVoiceEnabled(settings.voiceEnabled ?? true);
      setVoiceGender(settings.voiceGender ?? "alloy");
    }
  }, [settings]);

  function markDirty() {
    setDirty(true);
  }

  async function handleSave() {
    try {
      await updateSettings.mutateAsync({
        data: {
          assistantName,
          personality: personality as "jarvis" | "friday" | "karen" | "custom",
          customPersonality: customPersonality || null,
          voiceEnabled,
          voiceGender: voiceGender as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer",
        },
      });
      setDirty(false);
      toast({ title: "Settings saved", description: "Your preferences have been updated." });
    } catch {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-xs text-primary/70 tracking-[0.3em] uppercase">System Configuration</p>
        <h1 className="text-2xl font-bold text-foreground tracking-wide mt-1">Settings</h1>
      </motion.div>

      <div className="space-y-6">
        {/* Assistant Identity */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="hud-card rounded-xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-widest uppercase text-foreground">Assistant Identity</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground tracking-wider mb-1.5 block">ASSISTANT NAME</label>
              <Input
                value={assistantName}
                onChange={(e) => { setAssistantName(e.target.value); markDirty(); }}
                placeholder="JARVIS"
                className="bg-muted/20 border-border/50 focus:border-primary/40 tracking-wider"
                data-testid="input-assistantname"
              />
              <p className="text-xs text-muted-foreground/50 mt-1">This name will appear in the sidebar and messages.</p>
            </div>
          </div>
        </motion.section>

        {/* Personality */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="hud-card rounded-xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-widest uppercase text-foreground">Personality Matrix</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {PERSONALITIES.map((p) => (
              <button
                key={p.value}
                onClick={() => { setPersonality(p.value); markDirty(); }}
                className={cn(
                  "p-3 rounded-lg border text-left transition-all",
                  personality === p.value
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "bg-transparent border-border/40 text-muted-foreground hover:border-border hover:text-foreground"
                )}
                data-testid={`personality-${p.value}`}
              >
                <p className="text-sm font-semibold tracking-wide">{p.label}</p>
                <p className="text-xs opacity-70 mt-0.5">{p.desc}</p>
              </button>
            ))}
          </div>
          {personality === "custom" && (
            <div>
              <label className="text-xs text-muted-foreground tracking-wider mb-1.5 block">CUSTOM PERSONALITY PROMPT</label>
              <Textarea
                value={customPersonality}
                onChange={(e) => { setCustomPersonality(e.target.value); markDirty(); }}
                placeholder="Describe how you want your assistant to behave..."
                rows={3}
                className="bg-muted/20 border-border/50 focus:border-primary/40 resize-none text-sm"
                data-testid="textarea-custompersonality"
              />
            </div>
          )}
        </motion.section>

        {/* Voice */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="hud-card rounded-xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Mic className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-widest uppercase text-foreground">Voice Configuration</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground tracking-wide">Voice Responses</p>
                <p className="text-xs text-muted-foreground/60">Enable audio playback for AI responses</p>
              </div>
              <Switch
                checked={voiceEnabled}
                onCheckedChange={(v) => { setVoiceEnabled(v); markDirty(); }}
                data-testid="switch-voice"
              />
            </div>
            {voiceEnabled && (
              <div>
                <label className="text-xs text-muted-foreground tracking-wider mb-1.5 block">VOICE STYLE</label>
                <Select value={voiceGender} onValueChange={(v) => { setVoiceGender(v); markDirty(); }}>
                  <SelectTrigger className="bg-muted/20 border-border/50" data-testid="select-voice">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VOICES.map((v) => (
                      <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </motion.section>

        {/* Save button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={handleSave}
            disabled={!dirty || updateSettings.isPending}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold tracking-widest py-3"
            data-testid="button-savesettings"
            style={{ boxShadow: dirty ? "0 0 16px rgba(0,229,255,0.3)" : "none" }}
          >
            {updateSettings.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {dirty ? "SAVE CONFIGURATION" : "NO CHANGES"}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
