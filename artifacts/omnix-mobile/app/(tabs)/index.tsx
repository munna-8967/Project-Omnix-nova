import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useCreateOpenaiConversation,
  useGetDashboardStats,
  useGetSettings,
  useListMemories,
} from "@workspace/api-client-react";
import { OmniOrb, OrbState } from "@/components/OmniOrb";
import { useColors } from "@/hooks/useColors";

function buildThoughts(name: string, hour: number, totalMemories: number, totalConversations: number): string[] {
  const greeting =
    hour < 10  ? `Good morning, ${name}. How would you like to begin?`
    : hour < 13 ? `Morning energy is high, ${name}. What's on your mind?`
    : hour < 17 ? `Afternoon check-in, ${name}. ${totalConversations > 0 ? `${totalConversations} conversation${totalConversations > 1 ? "s" : ""} so far today.` : "What are you thinking about?"}`
    : hour < 21 ? `Evening, ${name}. The day is winding down.`
    : `Late night, ${name}. I'm here.`;

  const lines = [greeting];
  if (totalMemories > 0)
    lines.push(`I hold ${totalMemories} memor${totalMemories === 1 ? "y" : "ies"} about you. Getting to know you better every day.`);
  else
    lines.push("Start a conversation and I'll begin learning what matters to you.");
  return lines;
}

// SpeechRecognition type for web
type SpeechRecLike = {
  continuous: boolean; interimResults: boolean; lang: string;
  start(): void; stop(): void;
  onresult: ((e: { resultIndex: number; results: { isFinal: boolean; 0: { transcript: string } }[] }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [transcript, setTranscript] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [textInput, setTextInput] = useState("");
  const inputRef = useRef<TextInput>(null);
  const recRef = useRef<{ stop: () => void } | null>(null);

  const inputOpacity = useSharedValue(0);
  const inputTranslate = useSharedValue(20);

  const hour = new Date().getHours();
  const { data: stats } = useGetDashboardStats();
  const { data: memories = [] } = useListMemories();
  const { data: userSettings } = useGetSettings();
  const { mutateAsync: createConversation } = useCreateOpenaiConversation();

  const name = userSettings?.userName?.trim() || "there";
  const thoughts = buildThoughts(name, hour, stats?.totalMemories ?? 0, stats?.totalConversations ?? 0);

  const processCommand = useCallback(async (text: string) => {
    if (!text.trim()) { setOrbState("idle"); return; }
    setOrbState("responding");
    try {
      const conv = await createConversation({ data: { title: text.slice(0, 64) || "Voice conversation" } });
      setOrbState("idle");
      setTranscript("");
      router.push(`/chat/${conv.id}`);
    } catch {
      setOrbState("idle");
      setTranscript("");
    }
  }, [createConversation]);

  const handleOrbTap = useCallback(() => {
    if (orbState === "listening") {
      recRef.current?.stop();
      recRef.current = null;
      if (transcript) {
        setOrbState("thinking");
        setTimeout(() => processCommand(transcript), 400);
      } else {
        setOrbState("idle");
      }
      return;
    }
    if (orbState !== "idle") return;

    // Web: try SpeechRecognition
    if (Platform.OS === "web") {
      const Win = window as unknown as {
        SpeechRecognition?: new () => SpeechRecLike;
        webkitSpeechRecognition?: new () => SpeechRecLike;
      };
      const SpeechRec = Win.SpeechRecognition || Win.webkitSpeechRecognition;
      if (SpeechRec) {
        setOrbState("listening");
        setTranscript("");
        const rec = new SpeechRec();
        rec.continuous = false; rec.interimResults = true; rec.lang = "en-US";
        recRef.current = rec;
        rec.onresult = (e) => {
          let interim = "";
          for (let i = e.resultIndex; i < e.results.length; i++) interim += e.results[i][0].transcript;
          setTranscript(interim);
          if (e.results[e.results.length - 1].isFinal) {
            recRef.current = null;
            setOrbState("thinking");
            setTimeout(() => processCommand(interim), 400);
          }
        };
        rec.onerror = () => { setOrbState("idle"); setTranscript(""); recRef.current = null; };
        rec.onend = () => {};
        rec.start();
        return;
      }
    }

    // Fallback: show text input
    Haptics.selectionAsync();
    setShowInput(true);
    inputOpacity.value = withTiming(1, { duration: 250, easing: Easing.linear });
    inputTranslate.value = withSpring(0, { damping: 20 });
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [orbState, transcript, processCommand]);

  const handleSubmitText = useCallback(() => {
    if (!textInput.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setOrbState("thinking");
    setShowInput(false);
    inputOpacity.value = withTiming(0, { duration: 180, easing: Easing.linear });
    inputTranslate.value = withTiming(20, { duration: 180, easing: Easing.linear });
    Keyboard.dismiss();
    const q = textInput.trim();
    setTextInput("");
    setTimeout(() => processCommand(q), 300);
  }, [textInput, processCommand]);

  const inputAnimStyle = useAnimatedStyle(() => ({
    opacity: inputOpacity.value,
    transform: [{ translateY: inputTranslate.value }],
  }));

  const paddingTop = Platform.OS === "web" ? 67 : insets.top;
  const paddingBottom = Platform.OS === "web" ? 34 : insets.bottom;

  const STATE_LABELS: Record<OrbState, string> = {
    idle:      "Tap to speak",
    listening: "Listening…",
    thinking:  "Thinking…",
    responding: "Responding…",
    executing: "Executing…",
  };
  const STATE_LABEL_COLORS: Record<OrbState, string> = {
    idle:       "rgba(167,139,250,0.7)",
    listening:  "#f0abfc",
    thinking:   "#fcd34d",
    responding: "#6ee7b7",
    executing:  "#fde68a",
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: paddingBottom + 100 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Status bar */}
      <View style={[styles.statusRow, { paddingTop: paddingTop + 16 }]}>
        <View style={styles.statusPill}>
          <View style={[styles.statusDot, { backgroundColor: "#10b981" }]} />
          <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
            Omni · Online
          </Text>
        </View>
      </View>

      {/* Orb hero */}
      <View style={styles.orbSection}>
        <OmniOrb state={orbState} onPress={handleOrbTap} size={240} />

        <View style={styles.greeting}>
          <Text style={[styles.greetingName, { color: colors.foreground }]}>
            Hey, {name}
          </Text>
          <View style={styles.labelRow}>
            {transcript && orbState !== "idle" ? (
              <Text style={[styles.transcript, { color: STATE_LABEL_COLORS[orbState] }]}>
                "{transcript}"
              </Text>
            ) : (
              <Text style={[styles.stateLabel, { color: STATE_LABEL_COLORS[orbState] }]}>
                {STATE_LABELS[orbState]}
              </Text>
            )}
          </View>
          {orbState === "idle" && (
            <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
              tap orb to speak · or{" "}
              <Text
                style={{ color: colors.primary, textDecorationLine: "underline" }}
                onPress={() => {
                  setShowInput(v => !v);
                  if (!showInput) {
                    inputOpacity.value = withTiming(1, { duration: 250, easing: Easing.linear });
                    inputTranslate.value = withSpring(0, { damping: 20 });
                    setTimeout(() => inputRef.current?.focus(), 100);
                  } else {
                    inputOpacity.value = withTiming(0, { duration: 180, easing: Easing.linear });
                    inputTranslate.value = withTiming(20, { duration: 180, easing: Easing.linear });
                  }
                }}
              >
                type
              </Text>
            </Text>
          )}
        </View>

        {showInput && orbState === "idle" && (
          <Animated.View style={[styles.inputWrap, inputAnimStyle]}>
            <TextInput
              ref={inputRef}
              style={[styles.input, {
                backgroundColor: "rgba(255,255,255,0.04)",
                color: colors.foreground,
                borderColor: "rgba(124,58,237,0.25)",
              }]}
              placeholder={`Ask Omni…`}
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={textInput}
              onChangeText={setTextInput}
              returnKeyType="send"
              onSubmitEditing={handleSubmitText}
            />
            <Pressable
              onPress={handleSubmitText}
              disabled={!textInput.trim()}
              style={[styles.sendBtn, {
                backgroundColor: textInput.trim() ? colors.primary : colors.muted,
              }]}
            >
              <Feather name="arrow-right" size={18} color={textInput.trim() ? "#fff" : colors.mutedForeground} />
            </Pressable>
          </Animated.View>
        )}
      </View>

      <View style={[styles.divider, { backgroundColor: "rgba(255,255,255,0.04)" }]} />

      {/* Omni Thoughts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Feather name="zap" size={12} color="rgba(124,58,237,0.6)" />
          <Text style={[styles.sectionLabel, { color: "rgba(255,255,255,0.4)" }]}>
            OMNI THOUGHTS
          </Text>
        </View>
        <View style={styles.sectionContent}>
          {thoughts.map((t, i) => (
            <View key={i} style={[styles.thoughtCard, { borderColor: "rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.02)" }]}>
              <Text style={[styles.thoughtText, { color: "rgba(255,255,255,0.65)" }]}>{t}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Memory Glimpses */}
      {memories.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeader}>
              <Feather name="cpu" size={12} color="rgba(124,58,237,0.6)" />
              <Text style={[styles.sectionLabel, { color: "rgba(255,255,255,0.4)" }]}>
                MEMORY
              </Text>
            </View>
            <Pressable onPress={() => router.push("/(tabs)/memory")} style={styles.seeAll}>
              <Text style={[styles.seeAllText, { color: "rgba(124,58,237,0.5)" }]}>All</Text>
              <Feather name="chevron-right" size={12} color="rgba(124,58,237,0.5)" />
            </Pressable>
          </View>
          <View style={styles.memoryPills}>
            {memories.slice(0, 4).map((m) => (
              <View
                key={m.id}
                style={[styles.memoryPill, { borderColor: "rgba(124,58,237,0.15)", backgroundColor: "rgba(124,58,237,0.05)" }]}
              >
                <Text style={[styles.memoryPillText, { color: "rgba(167,139,250,0.7)" }]} numberOfLines={1}>
                  {m.content.slice(0, 48)}{m.content.length > 48 ? "…" : ""}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Quick Access */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: "rgba(255,255,255,0.4)", marginBottom: 12 }]}>
          QUICK ACCESS
        </Text>
        <View style={styles.quickGrid}>
          {([
            { icon: "message-square" as const, label: "Chat",     onPress: () => router.push("/(tabs)/chat")     },
            { icon: "cpu" as const,            label: "Memory",   onPress: () => router.push("/(tabs)/memory")   },
            { icon: "settings" as const,       label: "Settings", onPress: () => router.push("/(tabs)/settings") },
          ]).map(({ icon, label, onPress }) => (
            <Pressable
              key={label}
              onPress={onPress}
              style={({ pressed }) => [
                styles.quickItem,
                {
                  borderColor: pressed ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.06)",
                  backgroundColor: pressed ? "rgba(124,58,237,0.05)" : "rgba(255,255,255,0.02)",
                }
              ]}
            >
              <Feather name={icon} size={20} color="rgba(255,255,255,0.5)" />
              <Text style={[styles.quickLabel, { color: "rgba(255,255,255,0.4)" }]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, letterSpacing: 2, textTransform: "uppercase", fontFamily: "Inter_400Regular" },
  orbSection: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 16,
  },
  greeting: { alignItems: "center", gap: 8 },
  greetingName: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5, textAlign: "center" },
  labelRow: { height: 24, alignItems: "center", justifyContent: "center" },
  stateLabel: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  transcript: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", fontStyle: "italic" },
  hintText: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", letterSpacing: 0.5, textTransform: "uppercase" },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
    maxWidth: 340,
  },
  input: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  sendBtn: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
  },
  divider: { height: 1, marginHorizontal: 24 },
  section: { paddingHorizontal: 24, paddingTop: 28 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 2.5 },
  sectionContent: { gap: 8 },
  thoughtCard: {
    paddingHorizontal: 16, paddingVertical: 14,
    borderRadius: 16, borderWidth: 1,
  },
  thoughtText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  seeAll: { flexDirection: "row", alignItems: "center", gap: 2 },
  seeAllText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  memoryPills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  memoryPill: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
    maxWidth: 200,
  },
  memoryPillText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  quickGrid: { flexDirection: "row", gap: 8 },
  quickItem: {
    flex: 1, alignItems: "center", gap: 8,
    paddingVertical: 16, borderRadius: 16, borderWidth: 1,
  },
  quickLabel: { fontSize: 10, fontFamily: "Inter_400Regular", letterSpacing: 1, textTransform: "uppercase" },
});
