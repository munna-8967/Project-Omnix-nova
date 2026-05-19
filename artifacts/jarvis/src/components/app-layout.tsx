import { Link, useLocation } from "wouter";
import { useUser, UserButton } from "@clerk/react";
import { LayoutDashboard, MessageSquare, Brain, FileText, Settings, Zap, ListChecks, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetSettings } from "@workspace/api-client-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/chat", icon: MessageSquare, label: "Assistant" },
  { href: "/routines", icon: ListChecks, label: "Routines" },
  { href: "/memories", icon: Brain, label: "Memory" },
  { href: "/notes", icon: FileText, label: "Notes" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useUser();
  const { data: settings } = useGetSettings();

  const assistantName = settings?.assistantName ?? "OmniNova";
  const displayName = user?.firstName ?? user?.emailAddresses[0]?.emailAddress?.split("@")[0] ?? "User";

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-border/40 flex flex-col"
        style={{ background: "rgba(6,3,18,0.97)", backdropFilter: "blur(16px)" }}>
        {/* Logo */}
        <div className="p-5 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full flex items-center justify-center animate-omni-pulse"
                style={{ background: "radial-gradient(circle, rgba(124,58,237,0.3) 0%, rgba(37,99,235,0.1) 100%)", border: "1px solid rgba(124,58,237,0.5)" }}>
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="absolute -inset-1 rounded-full border border-primary/20 animate-ping" style={{ animationDuration: "3s" }} />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase">Personal AI OS</p>
              <h1 className="text-base font-bold tracking-wide gradient-text">{assistantName}</h1>
            </div>
          </div>
        </div>

        {/* Greeting */}
        <div className="px-5 py-3 border-b border-border/30">
          <p className="text-xs text-muted-foreground">Welcome back,</p>
          <p className="text-sm font-semibold text-foreground/90 truncate">{displayName}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location === item.href || location.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group",
                  isActive
                    ? "omni-card-active text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03] border border-transparent"
                )}>
                  <item.icon className={cn(
                    "w-4 h-4 transition-all shrink-0",
                    isActive ? "text-primary drop-shadow-[0_0_8px_rgba(124,58,237,0.9)]" : "group-hover:text-primary/70"
                  )} />
                  <span className="text-sm font-medium">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                      style={{ boxShadow: "0 0 8px rgba(124,58,237,0.9)" }} />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Status indicator */}
        <div className="px-5 py-3 border-t border-border/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-muted-foreground tracking-widest uppercase">OmniNova Online</span>
          </div>
          <div className="flex items-center gap-3 px-1">
            <UserButton />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-foreground/80">{displayName}</p>
              <p className="text-[10px] text-muted-foreground">Active</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-background relative">
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
        <div className="relative z-10 h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
