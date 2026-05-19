import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Bell, Plus, Trash2, Check, Loader2, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useListNotes,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
  getListNotesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function NotesPage() {
  const { data: notes, isLoading } = useListNotes();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"note" | "reminder">("note");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [reminderAt, setReminderAt] = useState("");

  async function handleCreate() {
    if (!title.trim()) return;
    await createNote.mutateAsync({
      data: {
        title: title.trim(),
        content: content.trim(),
        type,
        ...(reminderAt ? { reminderAt } : {}),
      },
    });
    queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
    setTitle("");
    setContent("");
    setReminderAt("");
    setOpen(false);
  }

  async function handleToggle(id: number, completed: boolean) {
    await updateNote.mutateAsync({ id, data: { completed: !completed } });
    queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
  }

  async function handleDelete(id: number) {
    await deleteNote.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
  }

  const noteItems = notes?.filter((n) => n.type === "note") ?? [];
  const reminderItems = notes?.filter((n) => n.type === "reminder") ?? [];
  const pendingReminders = reminderItems.filter((r) => !r.completed);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs text-primary/70 tracking-[0.3em] uppercase">Data Repository</p>
            <h1 className="text-2xl font-bold text-foreground tracking-wide mt-1">Notes & Reminders</h1>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold tracking-wider"
                data-testid="button-addnote"
                style={{ boxShadow: "0 0 12px rgba(0,229,255,0.3)" }}
              >
                <Plus className="w-4 h-4 mr-2" /> Add New
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border/50 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-primary tracking-wider">Create Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="flex gap-2">
                  {(["note", "reminder"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-sm border capitalize transition-all tracking-wide",
                        type === t
                          ? "bg-primary/15 border-primary/40 text-primary"
                          : "bg-transparent border-border/40 text-muted-foreground hover:border-border"
                      )}
                      data-testid={`tab-${t}`}
                    >
                      {t === "note" ? <><StickyNote className="w-3.5 h-3.5 inline mr-1.5" />Note</> : <><Bell className="w-3.5 h-3.5 inline mr-1.5" />Reminder</>}
                    </button>
                  ))}
                </div>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title..."
                  className="bg-muted/20 border-border/50 focus:border-primary/40"
                  data-testid="input-title"
                />
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Content (optional)..."
                  rows={3}
                  className="bg-muted/20 border-border/50 focus:border-primary/40 resize-none"
                  data-testid="textarea-content"
                />
                {type === "reminder" && (
                  <div>
                    <label className="text-xs text-muted-foreground tracking-wider mb-1.5 block">REMINDER TIME</label>
                    <Input
                      type="datetime-local"
                      value={reminderAt}
                      onChange={(e) => setReminderAt(e.target.value)}
                      className="bg-muted/20 border-border/50 focus:border-primary/40"
                      data-testid="input-remindertime"
                    />
                  </div>
                )}
                <Button
                  onClick={handleCreate}
                  disabled={!title.trim() || createNote.isPending}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  data-testid="button-savenote"
                >
                  {createNote.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Entry"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        {pendingReminders.length > 0 && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-400/5 border border-yellow-400/20">
            <Bell className="w-4 h-4 text-yellow-400" style={{ filter: "drop-shadow(0 0 4px rgba(250,204,21,0.6))" }} />
            <span className="text-sm text-yellow-400">{pendingReminders.length} active reminder{pendingReminders.length !== 1 ? "s" : ""}</span>
          </div>
        )}
      </motion.div>

      <Tabs defaultValue="notes">
        <TabsList className="bg-muted/30 border border-border/40 mb-6">
          <TabsTrigger value="notes" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary" data-testid="tab-notes">
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            Notes ({noteItems.length})
          </TabsTrigger>
          <TabsTrigger value="reminders" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary" data-testid="tab-reminders">
            <Bell className="w-3.5 h-3.5 mr-1.5" />
            Reminders ({reminderItems.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notes">
          <NoteList items={noteItems} loading={isLoading} onToggle={handleToggle} onDelete={handleDelete} type="note" />
        </TabsContent>
        <TabsContent value="reminders">
          <NoteList items={reminderItems} loading={isLoading} onToggle={handleToggle} onDelete={handleDelete} type="reminder" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NoteList({
  items, loading, onToggle, onDelete, type
}: {
  items: any[];
  loading: boolean;
  onToggle: (id: number, completed: boolean) => void;
  onDelete: (id: number) => void;
  type: "note" | "reminder";
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 bg-muted/20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        {type === "note"
          ? <StickyNote className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
          : <Bell className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />}
        <p className="text-muted-foreground/60 tracking-wide">No {type}s yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ delay: i * 0.04 }}
            className={cn("hud-card p-4 rounded-xl group", item.completed && "opacity-50")}
            data-testid={`note-${item.id}`}
          >
            <div className="flex items-start gap-3">
              <button
                onClick={() => onToggle(item.id, item.completed)}
                className={cn(
                  "mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-all",
                  item.completed
                    ? "bg-primary/20 border-primary/50 text-primary"
                    : "border-border/50 hover:border-primary/40"
                )}
                data-testid={`checkbox-${item.id}`}
              >
                {item.completed && <Check className="w-3 h-3" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium text-foreground", item.completed && "line-through")}>{item.title}</p>
                {item.content && (
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.content}</p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  {item.reminderAt && (
                    <span className="text-xs text-yellow-400/70 flex items-center gap-1">
                      <Bell className="w-2.5 h-2.5" />
                      {new Date(item.reminderAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground/40">
                    {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onDelete(item.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/50 hover:text-destructive h-7 w-7 flex-shrink-0"
                data-testid={`button-delete-note-${item.id}`}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
