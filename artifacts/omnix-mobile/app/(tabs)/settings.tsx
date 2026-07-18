import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

type Section = "identity" | "voice" | "appearance";

const PERSONALITIES = [
  { value: "omni",   label: "Omni",   desc: "Calm, practical, slightly witty. Default Omni personality." },
  { value: "custom", label: "Custom", desc: "Define your own style." },
];

const VOICES = [
  { value: "alloy",   label: "Alloy",   desc: "Balanced, neutral"   },
  { value: "echo",    label: "Echo",    desc: "Deep, resonant"      },
  { value: "fable",   label: "Fable",   desc: "Warm, storytelling"  },
  { value: "onyx",    label: "Onyx",    desc: "Authoritative"       },
  { value: "nova",    label: "Nova",    desc: "Energetic, modern"   },
  { value: "shimmer", label: "Shimmer", desc: "Soft, clear"         },
];

const THEMES = [
  { value: "violet", color: "#7c3aed", label: "Violet" },
  { value: "blue",   color: "#2563eb", label: "Blue"   },
  { value: "gold",   color: "#f59e0b", label: "Gold"   },
  { value: "red",    color: "#ef4444", label: "Red"    },
  { value: "green",  color: "#10b981", label: "Green"  },
];

const SECTIONS: { id: Section; icon: keyof typeof Feather.glyphMap; label: string }[] = [
  { id: "identity",   icon: "user",    label: "Identity"   },
  { id: "voice",      icon: "zap",     label: "Voice"      },
  { id: "appearance", icon: "sliders", label: "Appearance" },
];

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: settings, isLoading } = useGetSettings();
  const { mutateAsync: updateSettings, isPending } = useUpdateSettings();
  const [section, setSection] = useState<Section>("identity");

  const [form, setForm] = useState({
    assistantName: "Omni",
    personality: "omni",
    customPersonality: "",
    voiceEnabled: true,
    voiceGender: "alloy",
    theme: "violet",
    userName: "",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        assistantName: settings.assistantName,
        personality: ["jarvis", "friday", "friday_v2"].includes(settings.personality) ? "omni" : settings.personality,
        customPersonality: settings.customPersonality ?? "",
        voiceEnabled: settings.voiceEnabled,
        voiceGender: settings.voiceGender,
        theme: settings.theme ?? "violet",
        userName: settings.userName ?? "",
      });
    }
  }, [settings]);

  async function handleSave() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await updateSettings({
        data: {
          assistantName: form.assistantName || "Omni",
          personality: form.personality as "omni" | "custom",
          customPersonality: form.customPersonality || null,
          voiceEnabled: form.voiceEnabled,
          voiceGender: form.voiceGender as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer",
          theme: form.theme as "violet" | "blue" | "gold" | "red" | "green",
          wakeWord: "Hey Omni",
          wakeWordEnabled: true,
          greetingStyle: "friendly",
          userName: form.userName,
        },
      });
      Alert.alert("Saved", "Your settings have been updated.");
    } catch {
      Alert.alert("Error", "Could not save settings.");
    }
  }

  const paddingTop = Platform.OS === "web" ? 67 : insets.top;
  const paddingBottom = Platform.OS === "web" ? 34 : insets.bottom;

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: paddingBottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: paddingTop + 16 }]}>
        <Text style={[styles.title, { color: colors.primary }]}>Settings</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Personalize your Omni experience
        </Text>
      </View>

      {/* Section nav */}
      <View style={[styles.sectionNav, { gap: 6, paddingHorizontal: 16, marginBottom: 16 }]}>
        {SECTIONS.map(({ id, icon, label }) => (
          <Pressable
            key={id}
            onPress={() => setSection(id)}
            style={[
              styles.sectionBtn,
              {
                backgroundColor: section === id ? "rgba(124,58,237,0.12)" : "transparent",
                borderColor: section === id ? "rgba(124,58,237,0.4)" : "transparent",
              }
            ]}
          >
            <Feather name={icon} size={15} color={section === id ? "#a78bfa" : "rgba(255,255,255,0.45)"} />
            <Text style={[styles.sectionBtnText, { color: section === id ? "#a78bfa" : "rgba(255,255,255,0.45)" }]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content card */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>

        {/* ── IDENTITY ── */}
        {section === "identity" && (
          <>
            <Text style={[styles.cardTitle, { color: "rgba(255,255,255,0.8)" }]}>Identity</Text>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Your Name</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.background, color: colors.foreground, borderColor: "rgba(255,255,255,0.12)" }]}
                placeholder="Your name"
                placeholderTextColor={colors.mutedForeground}
                value={form.userName}
                onChangeText={(v) => setForm(f => ({ ...f, userName: v }))}
              />
              <Text style={[styles.fieldHint, { color: colors.mutedForeground }]}>
                Used in greetings: "Hey {form.userName || "there"}!"
              </Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Personality</Text>
              <View style={{ gap: 8 }}>
                {PERSONALITIES.map(({ value, label, desc }) => (
                  <Pressable
                    key={value}
                    onPress={() => setForm(f => ({ ...f, personality: value }))}
                    style={[
                      styles.radioItem,
                      {
                        backgroundColor: form.personality === value ? "rgba(124,58,237,0.12)" : "transparent",
                        borderColor: form.personality === value ? "rgba(124,58,237,0.45)" : "rgba(255,255,255,0.08)",
                      }
                    ]}
                  >
                    <View style={[styles.radioCircle, { borderColor: form.personality === value ? "#7c3aed" : "rgba(255,255,255,0.3)" }]}>
                      {form.personality === value && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.radioLabel, { color: "rgba(255,255,255,0.9)" }]}>{label}</Text>
                      <Text style={[styles.radioDesc, { color: colors.mutedForeground }]}>{desc}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>

            {form.personality === "custom" && (
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Custom Instructions</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.background, color: colors.foreground, borderColor: "rgba(255,255,255,0.12)" }]}
                  placeholder="Describe how you want Omni to behave…"
                  placeholderTextColor={colors.mutedForeground}
                  value={form.customPersonality}
                  onChangeText={(v) => setForm(f => ({ ...f, customPersonality: v }))}
                  multiline
                  numberOfLines={4}
                />
              </View>
            )}
          </>
        )}

        {/* ── VOICE ── */}
        {section === "voice" && (
          <>
            <Text style={[styles.cardTitle, { color: "rgba(255,255,255,0.8)" }]}>Voice</Text>

            <View style={[styles.voiceToggleRow, { borderColor: "rgba(255,255,255,0.08)" }]}>
              <View>
                <Text style={[styles.radioLabel, { color: "rgba(255,255,255,0.9)" }]}>Voice Responses</Text>
                <Text style={[styles.radioDesc, { color: colors.mutedForeground }]}>Omni speaks back to you</Text>
              </View>
              <Switch
                value={form.voiceEnabled}
                onValueChange={(v) => setForm(f => ({ ...f, voiceEnabled: v }))}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Voice Style</Text>
              <View style={styles.voiceGrid}>
                {VOICES.map(({ value, label, desc }) => (
                  <Pressable
                    key={value}
                    onPress={() => setForm(f => ({ ...f, voiceGender: value }))}
                    style={[
                      styles.voiceItem,
                      {
                        backgroundColor: form.voiceGender === value ? "rgba(124,58,237,0.12)" : "transparent",
                        borderColor: form.voiceGender === value ? "rgba(124,58,237,0.45)" : "rgba(255,255,255,0.08)",
                      }
                    ]}
                  >
                    <View style={[styles.radioCircle, { borderColor: form.voiceGender === value ? "#7c3aed" : "rgba(255,255,255,0.3)" }]}>
                      {form.voiceGender === value && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.radioLabel, { color: "rgba(255,255,255,0.9)", fontSize: 13 }]}>{label}</Text>
                      <Text style={[styles.radioDesc, { color: colors.mutedForeground }]}>{desc}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        )}

        {/* ── APPEARANCE ── */}
        {section === "appearance" && (
          <>
            <Text style={[styles.cardTitle, { color: "rgba(255,255,255,0.8)" }]}>Appearance</Text>
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Theme Color</Text>
              <View style={styles.themeRow}>
                {THEMES.map(({ value, color, label }) => (
                  <Pressable
                    key={value}
                    onPress={() => setForm(f => ({ ...f, theme: value }))}
                    style={{ alignItems: "center", gap: 6 }}
                  >
                    <View style={[styles.themeCircle, {
                      backgroundColor: color,
                      borderWidth: form.theme === value ? 3 : 3,
                      borderColor: form.theme === value ? "#fff" : "transparent",
                      shadowColor: color,
                      shadowOpacity: form.theme === value ? 0.6 : 0,
                      shadowRadius: 8,
                    }]} />
                    <Text style={[styles.themeLabel, { color: colors.mutedForeground }]}>{label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Save button */}
        <Pressable
          onPress={handleSave}
          disabled={isPending}
          style={({ pressed }) => [
            styles.saveBtn,
            { opacity: pressed || isPending ? 0.75 : 1 }
          ]}
        >
          <View style={styles.saveBtnInner}>
            {isPending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Feather name="save" size={16} color="#fff" />
            }
            <Text style={styles.saveBtnText}>Save</Text>
          </View>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 3 },
  sectionNav: { flexDirection: "row" },
  sectionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 10, borderRadius: 12, borderWidth: 1,
  },
  sectionBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  card: {
    marginHorizontal: 16, borderRadius: 20, borderWidth: 1,
    padding: 20, gap: 20,
  },
  cardTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 11, fontFamily: "Inter_500Medium", letterSpacing: 0.8 },
  fieldHint: { fontSize: 10, fontFamily: "Inter_400Regular" },
  textInput: {
    height: 44, borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, fontSize: 14, fontFamily: "Inter_400Regular",
  },
  textArea: {
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, fontFamily: "Inter_400Regular",
    minHeight: 100,
  },
  radioItem: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    padding: 14, borderRadius: 14, borderWidth: 1,
  },
  radioCircle: {
    width: 18, height: 18, borderRadius: 9, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center", marginTop: 1,
  },
  radioDot: { width: 9, height: 9, borderRadius: 5 },
  radioLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  radioDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  voiceToggleRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 14, borderRadius: 14, borderWidth: 1,
  },
  voiceGrid: { gap: 8 },
  voiceItem: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    padding: 12, borderRadius: 14, borderWidth: 1,
  },
  themeRow: { flexDirection: "row", gap: 16, flexWrap: "wrap" },
  themeCircle: { width: 44, height: 44, borderRadius: 12 },
  themeLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  saveBtn: { marginTop: 4 },
  saveBtnInner: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 14, borderRadius: 14,
    backgroundColor: "#7c3aed",
    shadowColor: "rgba(124,58,237,0.35)",
    shadowOpacity: 1, shadowRadius: 16,
  },
  saveBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
