import { Link } from "wouter";
import { motion } from "framer-motion";
import { useUser } from "@clerk/react";
import { MessageSquare, Brain, FileText, Bell, Plus, ChevronRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetDashboardStats,
  useListOpenaiConversations,
  useCreateOpenaiConversation,
  getListOpenaiConversationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

export default function DashboardPage() {
  const { user } = useUser();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: conversations, isLoading: convsLoading } = useListOpenaiConversations();
  const createConversation = useCreateOpenaiConversation();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.firstName ?? "Sir";

  async function handleNewChat() {
    const conv = await createConversation.mutateAsync({ data: { title: "New conversation" } });
    queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
    setLocation(`/chat/${conv.id}`);
  }

  const statCards = [
    { icon: MessageSquare, label: "Conversations", value: stats?.totalConversations ?? 0, sub: `${stats?.totalMessages ?? 0} messages` },
    { icon: Brain, label: "Memories", value: stats?.totalMemories ?? 0, sub: "Stored contexts" },
    { icon: FileText, label: "Notes", value: stats?.totalNotes ?? 0, sub: "Total entries" },
    { icon: Bell, label: "Reminders", value: stats?.activeReminders ?? 0, sub: "Active alerts" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-xs text-primary/70 tracking-[0.3em] uppercase mb-1">System Status — Online</p>
        <h1 className="text-3xl font-bold text-foreground tracking-wide">
          {greeting}, <span className="text-primary jarvis-text-glow">{firstName}</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1 tracking-wide">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="hud-card p-5 rounded-xl"
            data-testid={`stat-${card.label.toLowerCase()}`}
          >
            <div className="flex items-center justify-between mb-3">
              <card.icon className="w-4 h-4 text-primary/70" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary/60"
                style={{ boxShadow: "0 0 4px rgba(0,229,255,0.6)" }} />
            </div>
            {statsLoading ? (
              <Skeleton className="h-8 w-16 mb-1 bg-muted/30" />
            ) : (
              <p className="text-3xl font-bold text-primary jarvis-text-glow">{card.value}</p>
            )}
            <p className="text-xs text-muted-foreground tracking-wide mt-1">{card.label}</p>
            <p className="text-xs text-muted-foreground/50 mt-0.5">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Conversations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-3 hud-card rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground tracking-widest uppercase">Recent Conversations</h2>
            <Button size="sm" onClick={handleNewChat}
              disabled={createConversation.isPending}
              className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs"
              data-testid="button-newchat"
            >
              <Plus className="w-3 h-3 mr-1" /> New
            </Button>
          </div>
          <div className="space-y-2">
            {convsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full bg-muted/20 rounded-lg" />
              ))
            ) : conversations && conversations.length > 0 ? (
              conversations.slice(0, 6).map((conv) => (
                <Link key={conv.id} href={`/chat/${conv.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/40 cursor-pointer transition-colors group"
                    data-testid={`conv-${conv.id}`}>
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-sm text-foreground truncate max-w-[200px]">{conv.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground/50">
                        {new Date(conv.createdAt).toLocaleDateString()}
                      </span>
                      <ChevronRight className="w-3 h-3 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground/50">No conversations yet</p>
                <Button size="sm" onClick={handleNewChat} className="mt-3 text-primary border-primary/30 bg-primary/5 hover:bg-primary/10" variant="outline"
                  data-testid="button-startchat">
                  Start a conversation
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Commands */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 hud-card rounded-xl p-5"
        >
          <h2 className="text-sm font-semibold text-foreground tracking-widest uppercase mb-4">Quick Access</h2>
          <div className="space-y-2">
            {[
              { label: "New Chat", href: "/chat", icon: MessageSquare, action: handleNewChat },
              { label: "View Memories", href: "/memories", icon: Brain },
              { label: "Add Note", href: "/notes", icon: FileText },
              { label: "Set Reminder", href: "/notes", icon: Bell },
              { label: "Preferences", href: "/settings", icon: Zap },
            ].map((item) => (
              item.action ? (
                <button key={item.label} onClick={item.action}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors group text-left"
                  data-testid={`quick-${item.label.toLowerCase().replace(" ", "")}`}>
                  <item.icon className="w-4 h-4 group-hover:text-primary transition-colors" />
                  <span className="text-sm tracking-wide">{item.label}</span>
                  <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ) : (
                <Link key={item.label} href={item.href}>
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors group cursor-pointer"
                    data-testid={`quick-${item.label.toLowerCase().replace(" ", "")}`}>
                    <item.icon className="w-4 h-4 group-hover:text-primary transition-colors" />
                    <span className="text-sm tracking-wide">{item.label}</span>
                    <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              )
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
