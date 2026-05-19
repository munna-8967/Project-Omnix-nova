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
    colorBackground: "#050a1e",
    colorPrimary: "#00e5ff",
    colorForeground: "#e8f0fe",
    colorMutedForeground: "#5c7a8c",
    colorInput: "#0d1f3c",
    colorInputForeground: "#e8f0fe",
    colorDanger: "#ef4444",
    colorNeutral: "#1e3a5f",
    borderRadius: "0.5rem",
    fontFamily: "Rajdhani, Inter, sans-serif",
    fontSize: "16px",
  },
  elements: {
    card: {
      background: "rgba(5, 10, 30, 0.95)",
      border: "1px solid rgba(0, 229, 255, 0.2)",
      backdropFilter: "blur(16px)",
      boxShadow: "0 0 40px rgba(0, 229, 255, 0.1)",
    },
    headerTitle: { color: "#00e5ff", letterSpacing: "0.1em" },
    headerSubtitle: { color: "#5c7a8c" },
    socialButtonsBlockButton: {
      background: "rgba(0, 229, 255, 0.05)",
      border: "1px solid rgba(0, 229, 255, 0.2)",
      color: "#e8f0fe",
    },
    socialButtonsBlockButtonText: { color: "#e8f0fe" },
    formFieldLabel: { color: "#8ba7c0" },
    formFieldInput: {
      background: "#0d1f3c",
      border: "1px solid rgba(0, 229, 255, 0.2)",
      color: "#e8f0fe",
    },
    formButtonPrimary: {
      background: "#00e5ff",
      color: "#050a1e",
      fontWeight: "700",
      letterSpacing: "0.08em",
    },
    footerActionLink: { color: "#00e5ff" },
    footerActionText: { color: "#5c7a8c" },
    dividerText: { color: "#5c7a8c" },
    dividerLine: { background: "rgba(0, 229, 255, 0.15)" },
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
