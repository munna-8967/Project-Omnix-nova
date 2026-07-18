import { useState, useEffect } from "react";
import { Loader2, Save, User, Zap, Palette } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { useUser } from "@clerk/react";
import { useToast } from "@/hooks/use-toast";

const personalities = [
  { value: "omni",   label: "Omni",   desc: "Calm, practical, slightly witty. Default Omni personality." },
  { value: "custom", label: "Custom", desc: "Define your own style." },
];

const voices = [
  { value: "alloy",   label: "Alloy",   desc: "Balanced, neutral" },
  { value: "echo",    label: "Echo",    desc: "Deep, resonant"    },
  { value: "fable",   label: "Fable",   desc: "Warm, storytelling" },
  { value: "onyx",    label: "Onyx",    desc: "Authoritative"     },
  { value: "nova",    label: "Nova",    desc: "Energetic, modern"  },
  { value: "shimmer", label: "Shimmer", desc: "Soft, clear"       },
];

type Section = "identity" | "voice" | "appearance";

export default function SettingsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const { data: settings } = useGetSettings();
  const { mutateAsync: updateSettings, isPending } = useUpdateSettings();
  const [section, setSection] = useState<Section>("identity");

  const [form, setForm] = useState({
    assistantName: "Omni",
    personality: "omni",
    customPersonality: "",
    voiceEnabled: true,
    voiceGender: "alloy",
    theme: "violet",
    userName: "",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        assistantName: settings.assistantName,
        personality: (["jarvis", "friday", "friday_v2"] as string[]).includes(settings.personality as string) ? "omni" : settings.personality,
        customPersonality: settings.customPersonality ?? "",
        voiceEnabled: settings.voiceEnabled,
        voiceGender: settings.voiceGender,
        theme: settings.theme ?? "violet",
        userName: settings.userName ?? (user?.firstName ?? ""),
      });
    }
  }, [settings, user]);

  async function handleSave() {
    await updateSettings({
      data: {
        assistantName: form.assistantName || "Omni",
        personality: form.personality as "omni" | "custom",
        customPersonality: form.customPersonality || null,
        voiceEnabled: form.voiceEnabled,
        voiceGender: form.voiceGender as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer",
        theme: form.theme as "violet" | "blue" | "gold" | "red" | "green",
        wakeWord: "Hey Omni",
        wakeWordEnabled: true,
        greetingStyle: "friendly",
        userName: form.userName,
      },
    });
    toast({ title: "Saved." });
  }

  const sections: { id: Section; icon: typeof User; label: string }[] = [
    { id: "identity",   icon: User,    label: "Identity"   },
    { id: "voice",      icon: Zap,     label: "Voice"      },
    { id: "appearance", icon: Palette, label: "Appearance" },
  ];

  return (
    <div className="h-full overflow-auto p-6 max-w-3xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold gradient-text">Settings</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Personalize your Omni experience</p>
      </div>

      <div className="flex gap-4">
        {/* Section nav */}
        <div className="w-44 shrink-0 space-y-1">
          {sections.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left border"
              style={{
                background:   section === id ? "rgba(124,58,237,0.12)" : "transparent",
                borderColor:  section === id ? "rgba(124,58,237,0.4)"  : "transparent",
                color:        section === id ? "#a78bfa" : "rgba(255,255,255,0.45)",
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

            {/* ── IDENTITY ── */}
            {section === "identity" && (
              <>
                <h3 className="text-sm font-bold text-foreground/80 mb-4">Identity</h3>
                <div>
                  <label className="text-xs text-muted-foreground block mb-2">Your Name</label>
                  <Input
                    value={form.userName}
                    onChange={(e) => setForm(f => ({ ...f, userName: e.target.value }))}
                    placeholder={user?.firstName ?? "Your name"}
                    className="bg-background border-border/50 focus:border-primary/50"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Used in greetings: "Hey {form.userName || "there"}!"</p>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-3">Personality</label>
                  <div className="space-y-2">
                    {personalities.map(({ value, label, desc }) => (
                      <button
                        key={value}
                        onClick={() => setForm(f => ({ ...f, personality: value }))}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                        style={{
                          background:  form.personality === value ? "rgba(124,58,237,0.12)" : "transparent",
                          borderColor: form.personality === value ? "rgba(124,58,237,0.45)" : "rgba(255,255,255,0.08)",
                        }}
                      >
                        <div
                          className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0"
                          style={{ borderColor: form.personality === value ? "#7c3aed" : "rgba(255,255,255,0.3)" }}
                        >
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
                    <label className="text-xs text-muted-foreground block mb-2">Custom Instructions</label>
                    <Textarea
                      value={form.customPersonality}
                      onChange={(e) => setForm(f => ({ ...f, customPersonality: e.target.value }))}
                      placeholder="Describe how you want Omni to behave…"
                      className="bg-background border-border/50 focus:border-primary/50 resize-none"
                      rows={4}
                    />
                  </div>
                )}
              </>
            )}

            {/* ── VOICE ── */}
            {section === "voice" && (
              <>
                <h3 className="text-sm font-bold text-foreground/80 mb-4">Voice</h3>
                <div className="flex items-center justify-between p-4 rounded-xl border border-border/40">
                  <div>
                    <p className="text-sm font-medium text-foreground/90">Voice Responses</p>
                    <p className="text-xs text-muted-foreground">Omni speaks back to you</p>
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
                          background:  form.voiceGender === value ? "rgba(124,58,237,0.12)" : "transparent",
                          borderColor: form.voiceGender === value ? "rgba(124,58,237,0.45)" : "rgba(255,255,255,0.08)",
                        }}
                      >
                        <div
                          className="w-3.5 h-3.5 rounded-full border shrink-0 flex items-center justify-center"
                          style={{ borderColor: form.voiceGender === value ? "#7c3aed" : "rgba(255,255,255,0.3)" }}
                        >
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

            {/* ── APPEARANCE ── */}
            {section === "appearance" && (
              <>
                <h3 className="text-sm font-bold text-foreground/80 mb-4">Appearance</h3>
                <div>
                  <label className="text-xs text-muted-foreground block mb-3">Theme Color</label>
                  <div className="flex gap-3">
                    {[
                      { value: "violet", color: "#7c3aed", label: "Violet" },
                      { value: "blue",   color: "#2563eb", label: "Blue"   },
                      { value: "gold",   color: "#f59e0b", label: "Gold"   },
                      { value: "red",    color: "#ef4444", label: "Red"    },
                      { value: "green",  color: "#10b981", label: "Green"  },
                    ].map(({ value, color, label }) => (
                      <button
                        key={value}
                        onClick={() => setForm(f => ({ ...f, theme: value }))}
                        className="flex flex-col items-center gap-1.5"
                      >
                        <div
                          className="w-10 h-10 rounded-xl transition-all hover:scale-110"
                          style={{
                            background:  color,
                            border:      form.theme === value ? "3px solid white" : "3px solid transparent",
                            boxShadow:   form.theme === value ? `0 0 12px ${color}80` : "none",
                          }}
                        />
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
              style={{
                background:  "linear-gradient(135deg, #7c3aed, #2563eb)",
                color:       "#fff",
                boxShadow:   "0 0 16px rgba(124,58,237,0.35)",
              }}
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
