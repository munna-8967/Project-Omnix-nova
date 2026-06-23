import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface MemoryCardProps {
  content: string;
  category: string;
  createdAt: string;
  onDelete: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  personal: "user",
  preference: "heart",
  goal: "target",
  fact: "info",
  other: "bookmark",
};

export function MemoryCard({ content, category, createdAt, onDelete }: MemoryCardProps) {
  const colors = useColors();
  const icon = (CATEGORY_ICONS[category.toLowerCase()] ?? "bookmark") as "user" | "heart" | "target" | "info" | "bookmark";

  const d = new Date(createdAt);
  const dateStr = d.toLocaleDateString([], { month: "short", day: "numeric" });

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: "rgba(139,92,246,0.12)" }]}>
          <Feather name={icon} size={12} color={colors.primary} />
          <Text style={[styles.category, { color: colors.primary }]}>{category}</Text>
        </View>
        <View style={styles.right}>
          <Text style={[styles.date, { color: colors.mutedForeground }]}>{dateStr}</Text>
          <Pressable onPress={onDelete} hitSlop={12}>
            <Feather name="trash-2" size={14} color={colors.mutedForeground} />
          </Pressable>
        </View>
      </View>
      <Text style={[styles.content, { color: colors.foreground }]}>{content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 5,
    padding: 14,
    gap: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  category: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "capitalize",
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  date: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  content: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
});
