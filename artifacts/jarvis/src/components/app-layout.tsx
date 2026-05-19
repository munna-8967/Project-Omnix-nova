import { Link, useLocation } from "wouter";
import { useUser, UserButton } from "@clerk/react";
import { LayoutDashboard, MessageSquare, Brain, FileText, Settings, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetSettings } from "@workspace/api-client-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/chat", icon: MessageSquare, label: "Chat" },
  { href: "/memories", icon: Brain, label: "Memories" },
  { href: "/notes", icon: FileText, label: "Notes" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useUser();
  const { data: settings } = useGetSettings();

  const assistantName = settings?.assistantName ?? "JARVIS";

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 hud-border border-r border-l-0 border-t-0 border-b-0 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full border-2 border-primary/60 flex items-center justify-center"
                style={{ boxShadow: "0 0 16px rgba(0,229,255,0.4)" }}>
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping" style={{ animationDuration: "3s" }} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground tracking-widest uppercase">System</p>
              <h1 className="text-lg font-bold text-primary jarvis-text-glow tracking-wider">{assistantName}</h1>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1" data-testid="sidebar-nav">
          {navItems.map((item) => {
            const isActive = location === item.href || location.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href}>
                <div
                  data-testid={`nav-${item.label.toLowerCase()}`}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer group",
                    isActive
                      ? "bg-primary/10 border border-primary/30 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50 border border-transparent"
                  )}
                >
                  <item.icon className={cn(
                    "w-4 h-4 transition-all",
                    isActive ? "text-primary drop-shadow-[0_0_6px_rgba(0,229,255,0.8)]" : "group-hover:text-primary/70"
                  )} />
                  <span className="text-sm font-medium tracking-wide">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                      style={{ boxShadow: "0 0 6px rgba(0,229,255,0.8)" }} />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3 px-2 py-2">
            <UserButton />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-foreground">
                {user?.firstName ?? user?.emailAddresses[0]?.emailAddress?.split("@")[0]}
              </p>
              <p className="text-xs text-muted-foreground truncate">Online</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-background relative">
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
        <div className="relative z-10 h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
