import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SignIn, SignUp, Show } from "@clerk/react";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import DashboardPage from "@/pages/dashboard";
import ChatListPage from "@/pages/chat-list";
import ChatDetailPage from "@/pages/chat-detail";
import MemoriesPage from "@/pages/memories";
import NotesPage from "@/pages/notes";
import SettingsPage from "@/pages/settings";
import RoutinesPage from "@/pages/routines";
import AppLayout from "@/components/app-layout";
import FloatingAssistant from "@/components/floating-assistant";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in"><Redirect to="/dashboard" /></Show>
      <Show when="signed-out"><LandingPage /></Show>
    </>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Show when="signed-in">
        <AppLayout>{children}</AppLayout>
      </Show>
      <Show when="signed-out"><Redirect to="/" /></Show>
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/sign-in/*?" component={() => (
        <div className="min-h-screen flex items-center justify-center bg-background bg-grid">
          <SignIn routing="path" path={`${basePath}/sign-in`} />
        </div>
      )} />
      <Route path="/sign-up/*?" component={() => (
        <div className="min-h-screen flex items-center justify-center bg-background bg-grid">
          <SignUp routing="path" path={`${basePath}/sign-up`} />
        </div>
      )} />
      <Route path="/dashboard" component={() => (
        <ProtectedRoute><DashboardPage /></ProtectedRoute>
      )} />
      <Route path="/chat" component={() => (
        <ProtectedRoute><ChatListPage /></ProtectedRoute>
      )} />
      <Route path="/chat/:id" component={({ params }) => (
        <ProtectedRoute><ChatDetailPage id={Number(params.id)} /></ProtectedRoute>
      )} />
      <Route path="/memories" component={() => (
        <ProtectedRoute><MemoriesPage /></ProtectedRoute>
      )} />
      <Route path="/notes" component={() => (
        <ProtectedRoute><NotesPage /></ProtectedRoute>
      )} />
      <Route path="/routines" component={() => (
        <ProtectedRoute><RoutinesPage /></ProtectedRoute>
      )} />
      <Route path="/settings" component={() => (
        <ProtectedRoute><SettingsPage /></ProtectedRoute>
      )} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={basePath}>
          <>
            <Router />
            <FloatingAssistant />
          </>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
