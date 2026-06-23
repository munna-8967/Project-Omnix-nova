import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Keyboard,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useCreateOpenaiConversation,
  useDeleteOpenaiConversation,
  useListOpenaiConversations,
} from "@workspace/api-client-react";
import { ConversationCard } from "@/components/ConversationCard";
import { OmniOrb } from "@/components/OmniOrb";
import { useColors } from "@/hooks/useColors";

type OrbState = "idle" | "listening" | "thinking" | "responding";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [showInput, setShowInput] = useState(false);
  const [inputText, setInputText] = useState("");
  const inputRef = useRef<TextInput>(null);

  const inputOpacity = useSharedValue(0);
  const inputTranslate = useSharedValue(20);

  const { data: conversations = [], refetch } = useListOpenaiConversations();
  const { mutateAsync: createConversation } = useCreateOpenaiConversation();
  const { mutateAsync: deleteConversation } = useDeleteOpenaiConversation();

  const toggleInput = () => {
    Haptics.selectionAsync();
    if (showInput) {
      setShowInput(false);
      inputOpacity.value = withTiming(0, { duration: 200 });
      inputTranslate.value = withTiming(20, { duration: 200 });
      Keyboard.dismiss();
    } else {
      setShowInput(true);
      inputOpacity.value = withTiming(1, { duration: 250 });
      inputTranslate.value = withSpring(0, { damping: 20 });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const inputStyle = useAnimatedStyle(() => ({
    opacity: inputOpacity.value,
    transform: [{ translateY: inputTranslate.value }],
  }));

  const startConversation = useCallback(async (title: string) => {
    if (!title.trim()) return;
    setOrbState("thinking");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const conv = await createConversation({ data: { title: title.trim().slice(0, 80) } });
      setOrbState("idle");
      setInputText("");
      setShowInput(false);
      inputOpacity.value = withTiming(0);
      inputTranslate.value = withTiming(20);
      router.push(`/chat/${conv.id}`);
    } catch {
      setOrbState("idle");
      Alert.alert("Error", "Could not start conversation. Please try again.");
    }
  }, [createConversation]);

  const handleOrbPress = useCallback(() => {
    if (orbState !== "idle") return;
    toggleInput();
  }, [orbState, showInput]);

  const handleDelete = useCallback(async (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await deleteConversation({ id });
      refetch();
    } catch {
      Alert.alert("Error", "Could not delete conversation.");
    }
  }, [deleteConversation, refetch]);

  const paddingTop = Platform.OS === "web" ? 67 : insets.top;
  const paddingBottom = Platform.OS === "web" ? 34 : 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Fixed header area */}
      <View style={[styles.topSection, { paddingTop: paddingTop + 16 }]}>
        {/* Status pill */}
        <View style={[styles.statusPill, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <View style={[styles.statusDot, { backgroundColor: "#10b981" }]} />
          <Text style={[styles.statusText, { color: colors.mutedForeground }]}>Omni · Online</Text>
        </View>

        {/* Orb hero */}
        <View style={styles.orbContainer}>
          <OmniOrb state={orbState} onPress={handleOrbPress} size={200} />
        </View>

        {/* Greeting + hint */}
        <Text style={[styles.greeting, { color: colors.foreground }]}>{greeting}</Text>
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          {orbState === "idle" ? "Tap orb to start" : orbState === "thinking" ? "Thinking…" : ""}
        </Text>

        {/* Text input */}
        <Animated.View style={[styles.inputWrap, inputStyle, { display: showInput ? "flex" : "none" }]}>
          <TextInput
            ref={inputRef}
            style={[styles.input, {
              backgroundColor: colors.muted,
              color: colors.foreground,
              borderColor: colors.border,
            }]}
            placeholder="Ask Omni anything…"
            placeholderTextColor={colors.mutedForeground}
            value={inputText}
            onChangeText={setInputText}
            returnKeyType="send"
            onSubmitEditing={() => startConversation(inputText)}
            blurOnSubmit={false}
          />
          <Pressable
            onPress={() => startConversation(inputText)}
            disabled={!inputText.trim()}
            style={[styles.sendBtn, { backgroundColor: inputText.trim() ? colors.primary : colors.muted }]}
          >
            <Feather name="arrow-right" size={18} color={inputText.trim() ? colors.primaryForeground : colors.mutedForeground} />
          </Pressable>
        </Animated.View>
      </View>

      {/* Conversations list */}
      <FlatList
        data={conversations}
        keyExtractor={(c) => String(c.id)}
        renderItem={({ item }) => (
          <ConversationCard
            id={item.id}
            title={item.title}
            createdAt={item.createdAt}
            onPress={() => router.push(`/chat/${item.id}`)}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        contentContainerStyle={{
          paddingBottom: paddingBottom + 100,
          paddingTop: 8,
        }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={conversations.length > 0 ? (
          <View style={styles.sectionHeader}>
            <Feather name="clock" size={12} color={colors.mutedForeground} />
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Recent</Text>
          </View>
        ) : null}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="message-circle" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No conversations yet</Text>
            <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>Tap the orb above to start</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topSection: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 10,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
  },
  orbContainer: {
    marginVertical: 8,
  },
  greeting: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  hint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
    marginTop: 4,
  },
  input: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 18,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingTop: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  emptyHint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
