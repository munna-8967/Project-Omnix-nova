import { useState } from "react";
import { Plus, Trash2, Play, Zap, Globe, Bell, Music, Gamepad2, Focus, Moon, Sun, ListChecks, Timer } from "lucide-react";
import { useListRoutines, useCreateRoutine, useDeleteRoutine, useRunRoutine } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const iconMap: Record<string, typeof Zap> = {
  zap: Zap, globe: Globe, bell: Bell, music: Music,
  gamepad: Gamepad2, focus: Focus, moon: Moon, sun: Sun,
  list: ListChecks, timer: Timer,
};

const iconOptions = Object.keys(iconMap);

const defaultActions = [
  '[{"type":"greeting","value":"Good morning!"},{"type":"reminder","value":"Check emails"}]',
  '[{"type":"website","value":"https://youtube.com"},{"type":"mode","value":"gaming"}]',
  '[{"type":"mode","value":"focus"},{"type":"reminder","value":"Stay focused for 2 hours"}]',
  '[{"type":"website","value":"https://spotify.com"},{"type":"mode","value":"normal"}]',
];

export default function RoutinesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: routines = [], isLoading } = useListRoutines();
  const { mutateAsync: createRoutine, isPending: creating } = useCreateRoutine();
  const { mutateAsync: deleteRoutine } = useDeleteRoutine();
  const { mutateAsync: runRoutine, isPending: running } = useRunRoutine();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", trigger: "", icon: "zap", actions: defaultActions[0] });

  async function handleCreate() {
    if (!form.name.trim()) return;
    await createRoutine({ data: { name: form.name, trigger: form.trigger, icon: form.icon, actions: form.actions } });
    queryClient.invalidateQueries({ queryKey: ["listRoutines"] });
    toast({ title: "Routine created!", description: `"${form.name}" is ready to use.` });
    setForm({ name: "", trigger: "", icon: "zap", actions: defaultActions[0] });
    setShowForm(false);
  }

  async function handleDelete(id: number) {
    await deleteRoutine({ id });
    queryClient.invalidateQueries({ queryKey: ["listRoutines"] });
    toast({ title: "Routine deleted" });
  }

  async function handleRun(id: number, name: string) {
    const result = await runRoutine({ id });
    toast({ title: `✓ ${name} executed`, description: result.message });
  }

  const presets = [
    { name: "Morning Wake-Up", trigger: "Hey Omni, good morning", icon: "sun", desc: "Greet + check emails + open weather" },
    { name: "Gaming Mode On", trigger: "Hey Omni, let's game", icon: "gamepad", desc: "Open YouTube + switch to gaming mode" },
    { name: "Focus Session", trigger: "Hey Omni, focus time", icon: "focus", desc: "Enable focus mode + set 2hr reminder" },
    { name: "Evening Wind-Down", trigger: "Hey Omni, good night", icon: "moon", desc: "Open Spotify + switch to sleep mode" },
  ];

  return (
    <div className="h-full overflow-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold gradient-text">Routines</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Automate your life with OmniNova triggers</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
          style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)", color: "#fff", boxShadow: "0 0 16px rgba(124,58,237,0.35)" }}
        >
          <Plus className="w-4 h-4" />
          New Routine
        </button>
      </div>

      {/* Preset suggestions */}
      {routines.length === 0 && !isLoading && (
        <div className="mb-6">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Suggested Routines</p>
          <div className="grid grid-cols-2 gap-3">
            {presets.map((p) => {
              const Icon = iconMap[p.icon] ?? Zap;
              return (
                <button
                  key={p.name}
                  onClick={() => {
                    setForm({ name: p.name, trigger: p.trigger, icon: p.icon, actions: defaultActions[0] });
                    setShowForm(true);
                  }}
                  className="omni-card omni-glow-hover rounded-2xl p-4 text-left flex items-start gap-3 group"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)" }}>
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground/90 mb-0.5">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.desc}</p>
                    <p className="text-[10px] text-primary/60 mt-1 font-mono">"{p.trigger}"</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="omni-card rounded-2xl p-5 mb-6 animate-slide-up" style={{ border: "1px solid rgba(124,58,237,0.3)" }}>
          <h3 className="text-sm font-bold text-foreground/90 mb-4">Create Routine</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Routine Name</label>
              <input
                className="w-full bg-background border border-border/50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground/50"
                placeholder="Morning Routine"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Voice Trigger</label>
              <input
                className="w-full bg-background border border-border/50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground/50"
                placeholder="Hey Omni, good morning"
                value={form.trigger}
                onChange={(e) => setForm(f => ({ ...f, trigger: e.target.value }))}
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="text-xs text-muted-foreground mb-1.5 block">Icon</label>
            <div className="flex gap-2 flex-wrap">
              {iconOptions.map((ic) => {
                const Icon = iconMap[ic]!;
                return (
                  <button
                    key={ic}
                    onClick={() => setForm(f => ({ ...f, icon: ic }))}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all border"
                    style={{
                      background: form.icon === ic ? "rgba(124,58,237,0.2)" : "transparent",
                      borderColor: form.icon === ic ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.1)",
                    }}
                  >
                    <Icon className="w-4 h-4 text-primary" />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={creating || !form.name.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)", color: "#fff" }}
            >
              {creating ? "Creating..." : "Create Routine"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-xl text-sm border border-border/50 hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Routines list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {routines.map((r) => {
            const Icon = iconMap[r.icon] ?? Zap;
            let actions: { type: string; value: string }[] = [];
            try { actions = JSON.parse(r.actions); } catch {}
            return (
              <div key={r.id} className="omni-card omni-glow-hover rounded-2xl p-4 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)" }}>
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground/90">{r.name}</p>
                  {r.trigger && (
                    <p className="text-xs text-primary/60 font-mono mt-0.5">"{r.trigger}"</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">{actions.length} action{actions.length !== 1 ? "s" : ""}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {r.lastRun && (
                    <p className="text-[10px] text-muted-foreground hidden md:block">
                      Last: {new Date(r.lastRun).toLocaleDateString()}
                    </p>
                  )}
                  <button
                    onClick={() => handleRun(r.id, r.name)}
                    disabled={running}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
                    style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.3)" }}
                  >
                    <Play className="w-3.5 h-3.5" />
                    Run
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center border border-border/40 hover:border-red-500/40 text-muted-foreground hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
