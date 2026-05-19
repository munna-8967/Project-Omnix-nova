import { motion } from "framer-motion";
import { MessageSquare, Plus, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import {
  useListOpenaiConversations,
  useCreateOpenaiConversation,
  useDeleteOpenaiConversation,
  getListOpenaiConversationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export default function ChatListPage() {
  const { data: conversations, isLoading } = useListOpenaiConversations();
  const createConversation = useCreateOpenaiConversation();
  const deleteConversation = useDeleteOpenaiConversation();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  async function handleNew() {
    const conv = await createConversation.mutateAsync({ data: { title: "New conversation" } });
    queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
    setLocation(`/chat/${conv.id}`);
  }

  async function handleDelete(e: React.MouseEvent, id: number) {
    e.preventDefault();
    e.stopPropagation();
    await deleteConversation.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
  }

  const filtered = conversations?.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs text-primary/70 tracking-[0.3em] uppercase">Conversation Archive</p>
            <h1 className="text-2xl font-bold text-foreground tracking-wide mt-1">Chat History</h1>
          </div>
          <Button onClick={handleNew} disabled={createConversation.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold tracking-wider"
            data-testid="button-newconversation"
            style={{ boxShadow: "0 0 12px rgba(0,229,255,0.3)" }}>
            <Plus className="w-4 h-4 mr-2" /> New Chat
          </Button>
        </div>
      </motion.div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search conversations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-card border-border/50 focus:border-primary/40"
          data-testid="input-search"
        />
      </div>

      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full bg-muted/20 rounded-xl" />
          ))
        ) : filtered.length > 0 ? (
          filtered.map((conv, i) => (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/chat/${conv.id}`}>
                <div className="hud-card p-4 rounded-xl cursor-pointer group flex items-center justify-between"
                  data-testid={`conv-item-${conv.id}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-primary/70" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{conv.title}</p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">
                        {new Date(conv.createdAt).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric"
                        })}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => handleDelete(e, conv.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive h-8 w-8"
                    data-testid={`button-delete-conv-${conv.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Link>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-16">
            <MessageSquare className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground/60 tracking-wide">
              {search ? "No conversations match your search" : "No conversations yet"}
            </p>
            {!search && (
              <Button onClick={handleNew} className="mt-4 bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20" variant="outline"
                data-testid="button-firstchat">
                Start your first conversation
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
