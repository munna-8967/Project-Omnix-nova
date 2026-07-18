import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Plus, Trash2, Tag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  useListMemories,
  useCreateMemory,
  useDeleteMemory,
  getListMemoriesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const CATEGORIES = ["general", "preference", "fact", "task", "context", "personal"];

const categoryColors: Record<string, string> = {
  general: "text-cyan-400 border-cyan-400/30 bg-cyan-400/5",
  preference: "text-purple-400 border-purple-400/30 bg-purple-400/5",
  fact: "text-blue-400 border-blue-400/30 bg-blue-400/5",
  task: "text-yellow-400 border-yellow-400/30 bg-yellow-400/5",
  context: "text-green-400 border-green-400/30 bg-green-400/5",
  personal: "text-pink-400 border-pink-400/30 bg-pink-400/5",
};

export default function MemoriesPage() {
  const { data: memories, isLoading } = useListMemories();
  const createMemory = useCreateMemory();
  const deleteMemory = useDeleteMemory();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [filterCat, setFilterCat] = useState<string>("all");

  async function handleCreate() {
    if (!content.trim()) return;
    await createMemory.mutateAsync({ data: { content: content.trim(), category } });
    queryClient.invalidateQueries({ queryKey: getListMemoriesQueryKey() });
    setContent("");
    setCategory("general");
    setOpen(false);
  }

  async function handleDelete(id: number) {
    await deleteMemory.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getListMemoriesQueryKey() });
  }

  const filtered = memories?.filter((m) => filterCat === "all" || m.category === filterCat) ?? [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs text-primary/70 tracking-[0.3em] uppercase">Neural Memory Bank</p>
            <h1 className="text-2xl font-bold text-foreground tracking-wide mt-1">Memories</h1>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold tracking-wider"
                data-testid="button-addmemory"
                style={{ boxShadow: "0 0 12px rgba(0,229,255,0.3)" }}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Memory
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border/50 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-primary tracking-wider">Store Memory</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <label className="text-xs text-muted-foreground tracking-wider mb-1.5 block">CATEGORY</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="bg-muted/20 border-border/50" data-testid="select-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground tracking-wider mb-1.5 block">CONTENT</label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="What should Omni remember?"
                    rows={3}
                    className="bg-muted/20 border-border/50 focus:border-primary/40 resize-none"
                    data-testid="textarea-memory"
                  />
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={!content.trim() || createMemory.isPending}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  data-testid="button-savememory"
                >
                  {createMemory.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Store Memory"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter */}
        <div className="flex gap-2 flex-wrap mt-4">
          {["all", ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={cn(
                "px-3 py-1 rounded-full text-xs border transition-all capitalize tracking-wide",
                filterCat === cat
                  ? "bg-primary/15 border-primary/40 text-primary"
                  : "bg-transparent border-border/40 text-muted-foreground hover:border-border"
              )}
              data-testid={`filter-${cat}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Stats bar */}
      <div className="hud-card rounded-xl p-4 mb-6 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" style={{ filter: "drop-shadow(0 0 4px rgba(0,229,255,0.6))" }} />
          <span className="text-sm text-foreground font-medium">{memories?.length ?? 0} memories stored</span>
        </div>
        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, ((memories?.length ?? 0) / 50) * 100)}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground/50">50 capacity</span>
      </div>

      {/* Memories grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 bg-muted/20 rounded-xl" />
          ))
        ) : filtered.length > 0 ? (
          <AnimatePresence>
            {filtered.map((memory, i) => (
              <motion.div
                key={memory.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04 }}
                className="hud-card p-4 rounded-xl group"
                data-testid={`memory-${memory.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border capitalize mb-2",
                      categoryColors[memory.category] ?? categoryColors.general
                    )}>
                      <Tag className="w-2.5 h-2.5" />
                      {memory.category}
                    </span>
                    <p className="text-sm text-foreground leading-relaxed">{memory.content}</p>
                    <p className="text-xs text-muted-foreground/40 mt-2">
                      {new Date(memory.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(memory.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/50 hover:text-destructive h-7 w-7 flex-shrink-0"
                    data-testid={`button-delete-memory-${memory.id}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="col-span-2 text-center py-16">
            <Brain className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground/60 tracking-wide">
              {filterCat !== "all" ? `No ${filterCat} memories` : "No memories stored yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
