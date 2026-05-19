import { useState, useEffect } from "react";
import { Loader2, Save, User, Mic, Palette, Brain, Bell, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { useUser } from "@clerk/react";
import { useToast } from "@/hooks/use-toast";

const personalities = [
  { value: "omni", label: "OmniNova", desc: "Futuristic, warm, powerfully intelligent. Default." },
  { value: "jarvis", label: "JARVIS", desc: "British wit, refined elegance, dry humor." },
  { value: "friday", label: "FRIDAY", desc: "Warm, supportive, conversational." },
  { value: "friday_v2", label: "FRIDAY v2", desc: "Emotionally intelligent, proactive companion." },
  { value: "custom", label: "Custom", desc: "Define your own personality." },
];

const greetingStyles = [
  { value: "friendly", label: "Friendly", desc: "Warm and casual: 'Hey Munna! 😊'" },
  { value: "professional", label: "Professional", desc: "Formal: 'Good morning, Munna.'" },
  { value: "casual", label: "Casual", desc: "Relaxed: 'Yo Munna, what's up?'" },
  { value: "energetic", label: "Energetic", desc: "High energy: 'Munna! Let's go! 🚀'" },
];

const voices = [
  { value: "alloy", label: "Alloy", desc: "Balanced, neutral voice" },
  { value: "echo", label: "Echo", desc: "Deep, resonant voice" },
  { value: "fable", label: "Fable", desc: "Warm, storytelling voice" },
  { value: "onyx", label: "Onyx", desc: "Authoritative voice" },
  { value: "nova", label: "Nova", desc: "Energetic, modern voice" },
  { value: "shimmer", label: "Shimmer", desc: "Soft, clear voice" },
];

type Section = "identity" | "voice" | "wakeword" | "appearance";

export default function SettingsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const { data: settings } = useGetSettings();
  const { mutateAsync: updateSettings, isPending } = useUpdateSettings();
  const [section, setSection] = useState<Section>("identity");

  const [form, setForm] = useState({
    assistantName: "OmniNova",
    personality: "omni",
    customPersonality: "",
    voiceEnabled: true,
    voiceGender: "alloy",
    theme: "violet",
    wakeWord: "Hey Omni",
    wakeWordEnabled: true,
    greetingStyle: "friendly",
    userName: "",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        assistantName: settings.assistantName,
        personality: settings.personality,
        customPersonality: settings.customPersonality ?? "",
        voiceEnabled: settings.voiceEnabled,
        voiceGender: settings.voiceGender,
        theme: settings.theme ?? "violet",
        wakeWord: settings.wakeWord ?? "Hey Omni",
        wakeWordEnabled: settings.wakeWordEnabled ?? true,
        greetingStyle: settings.greetingStyle ?? "friendly",
        userName: settings.userName ?? (user?.firstName ?? ""),
      });
    }
  }, [settings, user]);

  async function handleSave() {
    await updateSettings({
      data: {
        assistantName: form.assistantName,
        personality: form.personality as "omni" | "jarvis" | "friday" | "friday_v2" | "custom",
        customPersonality: form.customPersonality || null,
        voiceEnabled: form.voiceEnabled,
        voiceGender: form.voiceGender as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer",
        theme: form.theme as "violet" | "blue" | "gold" | "red" | "green",
        wakeWord: form.wakeWord,
        wakeWordEnabled: form.wakeWordEnabled,
        greetingStyle: form.greetingStyle as "friendly" | "professional" | "casual" | "energetic",
        userName: form.userName,
      },
    });
    toast({ title: "Settings saved!", description: "OmniNova has been updated." });
  }

  const sections: { id: Section; icon: typeof User; label: string }[] = [
    { id: "identity", icon: User, label: "Identity & Personality" },
    { id: "wakeword", icon: Mic, label: "Wake Word" },
    { id: "voice", icon: Zap, label: "Voice & Audio" },
    { id: "appearance", icon: Palette, label: "Appearance" },
  ];

  return (
    <div className="h-full overflow-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold gradient-text">Settings</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Personalize your OmniNova experience</p>
      </div>

      <div className="flex gap-4">
        {/* Section nav */}
        <div className="w-52 shrink-0 space-y-1">
          {sections.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left border"
              style={{
                background: section === id ? "rgba(124,58,237,0.12)" : "transparent",
                borderColor: section === id ? "rgba(124,58,237,0.4)" : "transparent",
                color: section === id ? "#a78bfa" : "rgba(255,255,255,0.45)",
              }}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="omni-card rounded-2xl p-6 space-y-5">
            {section === "identity" && (
              <>
                <h3 className="text-sm font-bold text-foreground/80 mb-4">Identity & Personality</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-2">Your Name (for greetings)</label>
                    <Input
                      value={form.userName}
                      onChange={(e) => setForm(f => ({ ...f, userName: e.target.value }))}
                      placeholder={user?.firstName ?? "Your name"}
                      className="bg-background border-border/50 focus:border-primary/50"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">Used in: "Hey {form.userName || "Munna"}!"</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-2">Assistant Name</label>
                    <Input
                      value={form.assistantName}
                      onChange={(e) => setForm(f => ({ ...f, assistantName: e.target.value }))}
                      placeholder="OmniNova"
                      className="bg-background border-border/50 focus:border-primary/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-3">Personality Mode</label>
                  <div className="space-y-2">
                    {personalities.map(({ value, label, desc }) => (
                      <button
                        key={value}
                        onClick={() => setForm(f => ({ ...f, personality: value }))}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                        style={{
                          background: form.personality === value ? "rgba(124,58,237,0.12)" : "transparent",
                          borderColor: form.personality === value ? "rgba(124,58,237,0.45)" : "rgba(255,255,255,0.08)",
                        }}
                      >
                        <div className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0"
                          style={{ borderColor: form.personality === value ? "#7c3aed" : "rgba(255,255,255,0.3)" }}>
                          {form.personality === value && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground/90">{label}</p>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {form.personality === "custom" && (
                  <div>
                    <label className="text-xs text-muted-foreground block mb-2">Custom Personality Description</label>
                    <Textarea
                      value={form.customPersonality}
                      onChange={(e) => setForm(f => ({ ...f, customPersonality: e.target.value }))}
                      placeholder="Describe how you want OmniNova to behave..."
                      className="bg-background border-border/50 focus:border-primary/50 resize-none"
                      rows={3}
                    />
                  </div>
                )}
              </>
            )}

            {section === "wakeword" && (
              <>
                <h3 className="text-sm font-bold text-foreground/80 mb-4">Wake Word Settings</h3>
                <div className="flex items-center justify-between p-4 rounded-xl border border-border/40">
                  <div>
                    <p className="text-sm font-medium text-foreground/90">Wake Word Enabled</p>
                    <p className="text-xs text-muted-foreground">Show Hey Omni button and overlay</p>
                  </div>
                  <Switch
                    checked={form.wakeWordEnabled}
                    onCheckedChange={(v) => setForm(f => ({ ...f, wakeWordEnabled: v }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-2">Wake Word / Phrase</label>
                  <Input
                    value={form.wakeWord}
                    onChange={(e) => setForm(f => ({ ...f, wakeWord: e.target.value }))}
                    placeholder="Hey Omni"
                    className="bg-background border-border/50 focus:border-primary/50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">This phrase activates your assistant</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-3">Greeting Style</label>
                  <div className="space-y-2">
                    {greetingStyles.map(({ value, label, desc }) => (
                      <button
                        key={value}
                        onClick={() => setForm(f => ({ ...f, greetingStyle: value }))}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                        style={{
                          background: form.greetingStyle === value ? "rgba(124,58,237,0.12)" : "transparent",
                          borderColor: form.greetingStyle === value ? "rgba(124,58,237,0.45)" : "rgba(255,255,255,0.08)",
                        }}
                      >
                        <div className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0"
                          style={{ borderColor: form.greetingStyle === value ? "#7c3aed" : "rgba(255,255,255,0.3)" }}>
                          {form.greetingStyle === value && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground/90">{label}</p>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {section === "voice" && (
              <>
                <h3 className="text-sm font-bold text-foreground/80 mb-4">Voice & Audio</h3>
                <div className="flex items-center justify-between p-4 rounded-xl border border-border/40">
                  <div>
                    <p className="text-sm font-medium text-foreground/90">Voice Responses</p>
                    <p className="text-xs text-muted-foreground">OmniNova speaks back to you</p>
                  </div>
                  <Switch
                    checked={form.voiceEnabled}
                    onCheckedChange={(v) => setForm(f => ({ ...f, voiceEnabled: v }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-3">Voice Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    {voices.map(({ value, label, desc }) => (
                      <button
                        key={value}
                        onClick={() => setForm(f => ({ ...f, voiceGender: value }))}
                        className="flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all"
                        style={{
                          background: form.voiceGender === value ? "rgba(124,58,237,0.12)" : "transparent",
                          borderColor: form.voiceGender === value ? "rgba(124,58,237,0.45)" : "rgba(255,255,255,0.08)",
                        }}
                      >
                        <div className="w-3.5 h-3.5 rounded-full border shrink-0 flex items-center justify-center"
                          style={{ borderColor: form.voiceGender === value ? "#7c3aed" : "rgba(255,255,255,0.3)" }}>
                          {form.voiceGender === value && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground/90">{label}</p>
                          <p className="text-[10px] text-muted-foreground">{desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {section === "appearance" && (
              <>
                <h3 className="text-sm font-bold text-foreground/80 mb-4">Appearance</h3>
                <div>
                  <label className="text-xs text-muted-foreground block mb-3">Theme Color</label>
                  <div className="flex gap-3">
                    {[
                      { value: "violet", color: "#7c3aed", label: "Violet" },
                      { value: "blue", color: "#2563eb", label: "Blue" },
                      { value: "gold", color: "#f59e0b", label: "Gold" },
                      { value: "red", color: "#ef4444", label: "Red" },
                      { value: "green", color: "#10b981", label: "Green" },
                    ].map(({ value, color, label }) => (
                      <button
                        key={value}
                        onClick={() => setForm(f => ({ ...f, theme: value }))}
                        className="flex flex-col items-center gap-1.5"
                      >
                        <div className="w-10 h-10 rounded-xl transition-all hover:scale-110"
                          style={{
                            background: color,
                            border: form.theme === value ? `3px solid white` : "3px solid transparent",
                            boxShadow: form.theme === value ? `0 0 12px ${color}80` : "none",
                          }} />
                        <p className="text-[10px] text-muted-foreground">{label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold mt-4 transition-all hover:scale-105 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)", color: "#fff", boxShadow: "0 0 16px rgba(124,58,237,0.35)" }}
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
