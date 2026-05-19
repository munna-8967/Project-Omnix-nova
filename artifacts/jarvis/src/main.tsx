import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/react";
import App from "./App";
import "./index.css";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL
  ? `${window.location.origin}${import.meta.env.VITE_CLERK_PROXY_URL}`
  : undefined;

const appearance = {
  cssLayerName: "clerk",
  layout: {
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    logoPlacement: "inside" as const,
    socialButtonsPlacement: "bottom" as const,
    socialButtonsVariant: "iconButton" as const,
  },
  variables: {
    colorBackground: "#060414",
    colorPrimary: "#7c3aed",
    colorForeground: "#ede9fe",
    colorMutedForeground: "#6b5e8c",
    colorInput: "#12083a",
    colorInputForeground: "#ede9fe",
    colorDanger: "#ef4444",
    colorNeutral: "#2d1f5c",
    borderRadius: "0.75rem",
    fontFamily: "Inter, sans-serif",
    fontSize: "16px",
  },
  elements: {
    card: {
      background: "rgba(6,4,20,0.95)",
      border: "1px solid rgba(124,58,237,0.25)",
      backdropFilter: "blur(16px)",
      boxShadow: "0 0 40px rgba(124,58,237,0.15)",
    },
    headerTitle: { color: "#a78bfa", letterSpacing: "0.05em" },
    headerSubtitle: { color: "#6b5e8c" },
    socialButtonsBlockButton: {
      background: "rgba(124,58,237,0.07)",
      border: "1px solid rgba(124,58,237,0.25)",
      color: "#ede9fe",
    },
    formFieldInput: {
      background: "#12083a",
      border: "1px solid rgba(124,58,237,0.25)",
      color: "#ede9fe",
    },
    formButtonPrimary: {
      background: "linear-gradient(135deg, #7c3aed, #2563eb)",
      color: "#fff",
      fontWeight: "700",
    },
    footerActionLink: { color: "#a78bfa" },
    footerActionText: { color: "#6b5e8c" },
    dividerLine: { background: "rgba(124,58,237,0.2)" },
  },
};

createRoot(document.getElementById("root")!).render(
  <ClerkProvider
    publishableKey={clerkPubKey}
    proxyUrl={clerkProxyUrl}
    appearance={appearance}
  >
    <App />
  </ClerkProvider>
);
