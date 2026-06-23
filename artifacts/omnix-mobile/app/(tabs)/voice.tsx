import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { fetch } from "expo/fetch";
import { router } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCreateOpenaiConversation } from "@workspace/api-client-react";
import { OmniOrb } from "@/components/OmniOrb";
import { useColors } from "@/hooks/useColors";

const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN;

type OrbState = "idle" | "listening" | "thinking" | "responding";

export default function VoiceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [statusText, setStatusText] = useState("Hold to talk");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { mutateAsync: createConversation } = useCreateOpenaiConversation();

  const startRecording = useCallback(async () => {
    if (Platform.OS !== "web") {
      Alert.alert("Voice", "Push-to-talk is available in the native Expo Go app. On web, use the chat screen instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const buffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i += 8192) {
          binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + 8192, bytes.byteLength)));
        }
        const audio = btoa(binary);
        await sendVoice(audio);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setOrbState("listening");
      setStatusText("Listening…");
      setTranscript("");
      setResponse("");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      Alert.alert("Microphone", "Could not access microphone. Please check permissions.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setOrbState("thinking");
      setStatusText("Processing…");
    }
  }, []);

  const sendVoice = useCallback(async (audio: string) => {
    try {
      const conv = await createConversation({ data: { title: "Voice conversation" } });
      const resp = await fetch(`https://${DOMAIN}/api/openai/conversations/${conv.id}/voice-messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio }),
      });

      if (!resp.body) throw new Error("No stream");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      setOrbState("responding");
      setStatusText("Responding…");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const evt = JSON.parse(data) as { type: string; data?: string };
            if (evt.type === "user_transcript") setTranscript(evt.data ?? "");
            if (evt.type === "text") setResponse((r) => r + (evt.data ?? ""));
          } catch { /* non-JSON delta */ }
        }
      }
      setOrbState("idle");
      setStatusText("Tap to talk again");
    } catch {
      setOrbState("idle");
      setStatusText("Hold to talk");
      Alert.alert("Error", "Voice failed. Try again.");
    }
  }, [createConversation]);

  const paddingTop = Platform.OS === "web" ? 67 : insets.top;
  const paddingBottom = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: paddingTop + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Voice</Text>
      </View>

      <View style={styles.center}>
        <Pressable
          onPressIn={startRecording}
          onPressOut={stopRecording}
          style={{ alignItems: "center", justifyContent: "center" }}
        >
          <OmniOrb state={orbState} size={220} />
        </Pressable>

        <Text style={[styles.status, {
          color: orbState === "idle" ? colors.mutedForeground : colors.primary,
        }]}>
          {statusText}
        </Text>
        <Text style={[styles.holdHint, { color: colors.mutedForeground }]}>
          {orbState === "idle" ? "Hold orb to speak" : ""}
        </Text>
      </View>

      {(transcript || response) ? (
        <ScrollView style={styles.transcriptArea} contentContainerStyle={{ padding: 20, paddingBottom: paddingBottom + 24 }}>
          {transcript ? (
            <View style={[styles.bubble, { backgroundColor: colors.primary }]}>
              <Text style={[styles.bubbleLabel, { color: colors.primaryForeground, opacity: 0.7 }]}>You</Text>
              <Text style={[styles.bubbleText, { color: colors.primaryForeground }]}>{transcript}</Text>
            </View>
          ) : null}
          {response ? (
            <View style={[styles.bubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.bubbleLabel, { color: colors.mutedForeground }]}>Omni</Text>
              <Text style={[styles.bubbleText, { color: colors.foreground }]}>{response}</Text>
            </View>
          ) : null}
        </ScrollView>
      ) : (
        <View style={{ height: 80 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  status: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  holdHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  transcriptArea: {
    maxHeight: 260,
  },
  bubble: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "transparent",
    gap: 4,
  },
  bubbleLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  bubbleText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
});
