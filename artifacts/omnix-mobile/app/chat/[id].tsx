import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { fetch } from "expo/fetch";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useCreateOpenaiConversation,
  useDeleteOpenaiConversation,
  useGetOpenaiConversation,
} from "@workspace/api-client-react";
import { MessageBubble, TypingIndicator } from "@/components/MessageBubble";
import { Message } from "@/context/ChatContext";
import { useColors } from "@/hooks/useColors";

const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN;

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = Number(id);
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { data: conversation, isLoading } = useGetOpenaiConversation(conversationId, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: { enabled: !isNaN(conversationId) } as any,
  });

  useEffect(() => {
    if (conversation?.messages) {
      setMessages(
        conversation.messages.map((m) => ({
          id: String(m.id),
          role: m.role as "user" | "assistant",
          content: m.content,
          timestamp: new Date(m.createdAt).getTime(),
        }))
      );
    }
  }, [conversation?.messages?.length]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isSending || isNaN(conversationId)) return;
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [userMsg, ...prev]);
    setInputText("");
    setIsSending(true);

    const streamingId = `stream-${Date.now()}`;
    setMessages((prev) => [{ id: streamingId, role: "assistant", content: "", isStreaming: true, timestamp: Date.now() }, ...prev]);

    try {
      const controller = new AbortController();
      abortRef.current = controller;
      const resp = await fetch(`https://${DOMAIN}/api/openai/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text.trim() }),
        signal: controller.signal,
      });

      if (!resp.body) throw new Error("No stream body");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            accumulated += data;
            const finalAcc = accumulated;
            setMessages((prev) =>
              prev.map((m) => m.id === streamingId ? { ...m, content: finalAcc, isStreaming: true } : m)
            );
          }
        }
      }

      setMessages((prev) =>
        prev.map((m) => m.id === streamingId ? { ...m, isStreaming: false } : m)
      );
    } catch (e: unknown) {
      if ((e as Error)?.name !== "AbortError") {
        setMessages((prev) => prev.filter((m) => m.id !== streamingId));
        Alert.alert("Error", "Failed to send message. Please try again.");
      }
    } finally {
      setIsSending(false);
      abortRef.current = null;
    }
  }, [conversationId, isSending]);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const isAssistantStreaming = messages[0]?.isStreaming ?? false;

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const paddingTop = Platform.OS === "web" ? 67 : 0;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, {
        borderBottomColor: colors.border,
        paddingTop: insets.top + 12 + paddingTop,
      }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Feather name="chevron-left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
          {conversation?.title ?? "Chat"}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Messages (inverted FlatList) */}
      <FlatList
        data={messages}
        keyExtractor={(m) => m.id}
        inverted
        renderItem={({ item }) => <MessageBubble message={item} />}
        ListHeaderComponent={isAssistantStreaming ? null : null}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 8 }}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="message-circle" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Start a conversation</Text>
          </View>
        }
      />

      {/* Input row */}
      <View style={[styles.inputRow, {
        borderTopColor: colors.border,
        paddingBottom: insets.bottom + 8,
        backgroundColor: colors.background,
      }]}>
        <TextInput
          ref={inputRef}
          style={[styles.input, {
            backgroundColor: colors.muted,
            color: colors.foreground,
            borderColor: colors.border,
          }]}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Message Omni…"
          placeholderTextColor={colors.mutedForeground}
          multiline
          maxLength={2000}
          onSubmitEditing={() => { if (Platform.OS === "web") sendMessage(inputText); }}
        />
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            sendMessage(inputText);
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
          disabled={!inputText.trim() || isSending}
          style={({ pressed }) => [
            styles.sendBtn,
            {
              backgroundColor: inputText.trim() && !isSending ? colors.primary : colors.muted,
              opacity: pressed ? 0.75 : 1,
            }
          ]}
        >
          {isSending
            ? <ActivityIndicator size="small" color={colors.primaryForeground} />
            : <Feather name="send" size={18} color={inputText.trim() ? colors.primaryForeground : colors.mutedForeground} />
          }
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 16, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 0,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingTop: 80,
    transform: [{ scaleY: -1 }],
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
