import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useState } from "react";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  timestamp: number;
};

export type Conversation = {
  id: number;
  title: string;
  createdAt: string;
  lastMessage?: string;
};

type ChatContextType = {
  activeConversationId: number | null;
  setActiveConversationId: (id: number | null) => void;
  draftMessage: string;
  setDraftMessage: (msg: string) => void;
};

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [draftMessage, setDraftMessage] = useState("");

  return (
    <ChatContext.Provider value={{
      activeConversationId,
      setActiveConversationId,
      draftMessage,
      setDraftMessage,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
