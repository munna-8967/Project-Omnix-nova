import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

const VOICE_OPTIONS = [
  { value: "alloy", label: "Alloy" },
  { value: "echo", label: "Echo" },
  { value: "nova", label: "Nova" },
  { value: "shimmer", label: "Shimmer" },
  { value: "onyx", label: "Onyx" },
  { value: "fable", label: "Fable" },
] as const;

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.settingLabel, { color: colors.foreground }]}>{label}</Text>
      {children}
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  const colors = useColors();
  return (
    <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>{title}</Text>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: settings, isLoading, refetch } = useGetSettings();
  const { mutateAsync: updateSettings, isPending } = useUpdateSettings();

  const update = async (patch: Record<string, unknown>) => {
    Haptics.selectionAsync();
    try {
      await updateSettings({ data: patch });
      refetch();
    } catch {
      Alert.alert("Error", "Could not save setting.");
    }
  };

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
      contentContainerStyle={{ paddingBottom: paddingBottom + 80 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: paddingTop + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>
      </View>

      {/* Identity section */}
      <SectionHeader title="IDENTITY" />
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SettingRow label="Assistant name">
          <Text style={[styles.valueText, { color: colors.mutedForeground }]}>
            {settings?.assistantName ?? "Omni"}
          </Text>
        </SettingRow>
      </View>

      {/* Voice section */}
      <SectionHeader title="VOICE" />
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SettingRow label="Voice enabled">
          <Switch
            value={settings?.voiceEnabled ?? true}
            onValueChange={(v) => update({ voiceEnabled: v })}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#fff"
          />
        </SettingRow>
        <SettingRow label="Voice style">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 6, paddingVertical: 2 }}>
              {VOICE_OPTIONS.map((v) => (
                <Pressable
                  key={v.value}
                  onPress={() => update({ voiceGender: v.value })}
                  style={[
                    styles.voicePill,
                    {
                      backgroundColor: settings?.voiceGender === v.value ? colors.primary : colors.muted,
                      borderColor: settings?.voiceGender === v.value ? colors.primary : colors.border,
                    }
                  ]}
                >
                  <Text style={[
                    styles.voicePillText,
                    { color: settings?.voiceGender === v.value ? colors.primaryForeground : colors.mutedForeground }
                  ]}>
                    {v.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </SettingRow>
      </View>

      {/* About */}
      <SectionHeader title="ABOUT" />
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SettingRow label="Version">
          <Text style={[styles.valueText, { color: colors.mutedForeground }]}>1.1.0</Text>
        </SettingRow>
        <SettingRow label="Model">
          <Text style={[styles.valueText, { color: colors.mutedForeground }]}>gpt-5.4</Text>
        </SettingRow>
        <View style={[styles.settingRow, { borderBottomColor: "transparent" }]}>
          <Text style={[styles.settingLabel, { color: colors.foreground }]}>Identity</Text>
          <View style={[styles.identityBadge, { backgroundColor: "rgba(139,92,246,0.12)" }]}>
            <Text style={[styles.identityText, { color: colors.primary }]}>Omni · OMNIX</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  card: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  valueText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  voicePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  voicePillText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  identityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  identityText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
});
