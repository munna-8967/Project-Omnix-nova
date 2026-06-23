import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useCreateMemory,
  useDeleteMemory,
  useListMemories,
  getListMemoriesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";

const CATEGORIES = ["general", "preference", "fact", "task", "context", "personal"] as const;
type Category = typeof CATEGORIES[number];

const CATEGORY_COLORS: Record<Category, { text: string; border: string; bg: string }> = {
  general:    { text: "#22d3ee", border: "rgba(34,211,238,0.3)",   bg: "rgba(34,211,238,0.05)"  },
  preference: { text: "#c084fc", border: "rgba(192,132,252,0.3)", bg: "rgba(192,132,252,0.05)" },
  fact:       { text: "#60a5fa", border: "rgba(96,165,250,0.3)",  bg: "rgba(96,165,250,0.05)"  },
  task:       { text: "#fbbf24", border: "rgba(251,191,36,0.3)",  bg: "rgba(251,191,36,0.05)"  },
  context:    { text: "#34d399", border: "rgba(52,211,153,0.3)",  bg: "rgba(52,211,153,0.05)"  },
  personal:   { text: "#f472b6", border: "rgba(244,114,182,0.3)", bg: "rgba(244,114,182,0.05)" },
};

export default function MemoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [showAdd, setShowAdd] = useState(false);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<Category>("general");
  const [filterCat, setFilterCat] = useState<"all" | Category>("all");

  const { data: memories = [], isLoading } = useListMemories();
  const { mutateAsync: createMemory, isPending: isCreating } = useCreateMemory();
  const { mutateAsync: deleteMemory } = useDeleteMemory();

  const paddingTop = Platform.OS === "web" ? 67 : insets.top;
  const paddingBottom = Platform.OS === "web" ? 34 : insets.bottom;

  async function handleCreate() {
    if (!content.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await createMemory({ data: { content: content.trim(), category } });
      queryClient.invalidateQueries({ queryKey: getListMemoriesQueryKey() });
      setContent("");
      setCategory("general");
      setShowAdd(false);
    } catch {
      Alert.alert("Error", "Could not save memory.");
    }
  }

  async function handleDelete(id: number) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await deleteMemory({ id });
      queryClient.invalidateQueries({ queryKey: getListMemoriesQueryKey() });
    } catch {
      Alert.alert("Error", "Could not delete memory.");
    }
  }

  const filtered = memories.filter((m) => filterCat === "all" || m.category === filterCat);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: paddingTop + 16, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.eyebrow, { color: "rgba(124,58,237,0.7)" }]}>
            NEURAL MEMORY BANK
          </Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Memories</Text>
        </View>
        <Pressable
          onPress={() => setShowAdd(v => !v)}
          style={[styles.addBtn, { backgroundColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 12 }]}
        >
          <Feather name={showAdd ? "x" : "plus"} size={16} color="#fff" />
          <Text style={styles.addBtnText}>{showAdd ? "Cancel" : "Add Memory"}</Text>
        </Pressable>
      </View>

      {/* Add panel */}
      {showAdd && (
        <View style={[styles.addPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {CATEGORIES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setCategory(c)}
                  style={[
                    styles.catPill,
                    {
                      backgroundColor: category === c ? colors.primary : "transparent",
                      borderColor: category === c ? colors.primary : colors.border,
                    }
                  ]}
                >
                  <Text style={[styles.catPillText, {
                    color: category === c ? "#fff" : colors.mutedForeground,
                    textTransform: "capitalize",
                  }]}>{c}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>CONTENT</Text>
          <TextInput
            style={[styles.addInput, { backgroundColor: "rgba(255,255,255,0.04)", color: colors.foreground, borderColor: "rgba(124,58,237,0.2)" }]}
            placeholder="What should Omni remember?"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={500}
          />
          <Pressable
            onPress={handleCreate}
            disabled={!content.trim() || isCreating}
            style={[styles.saveBtn, { backgroundColor: content.trim() ? colors.primary : colors.muted }]}
          >
            {isCreating
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={[styles.saveBtnText, { color: content.trim() ? "#fff" : colors.mutedForeground }]}>Store Memory</Text>
            }
          </Pressable>
        </View>
      )}

      {/* Stats bar */}
      <View style={[styles.statsBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="cpu" size={14} color={colors.primary} />
        <Text style={[styles.statsText, { color: colors.foreground }]}>
          {memories.length} {memories.length === 1 ? "memory" : "memories"} stored
        </Text>
        <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
          <View style={[styles.progressFill, {
            width: `${Math.min(100, (memories.length / 50) * 100)}%`,
            backgroundColor: colors.primary,
          }]} />
        </View>
        <Text style={[styles.statsCapacity, { color: colors.mutedForeground }]}>50 cap.</Text>
      </View>

      {/* Filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 6, flexDirection: "row" }}
      >
        {(["all", ...CATEGORIES] as const).map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setFilterCat(cat)}
            style={[
              styles.filterPill,
              {
                backgroundColor: filterCat === cat ? "rgba(124,58,237,0.15)" : "transparent",
                borderColor: filterCat === cat ? "rgba(124,58,237,0.4)" : colors.border,
              }
            ]}
          >
            <Text style={[styles.filterPillText, {
              color: filterCat === cat ? colors.primary : colors.mutedForeground,
              textTransform: "capitalize",
            }]}>{cat}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Memory list */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: paddingBottom + 100, gap: 8 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const cat = (item.category as Category) in CATEGORY_COLORS ? item.category as Category : "general";
            const catColors = CATEGORY_COLORS[cat];
            return (
              <View style={[styles.memCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.memCardTop}>
                  <View style={[styles.memCatBadge, { backgroundColor: catColors.bg, borderColor: catColors.border }]}>
                    <Feather name="tag" size={10} color={catColors.text} />
                    <Text style={[styles.memCatText, { color: catColors.text, textTransform: "capitalize" }]}>
                      {item.category}
                    </Text>
                  </View>
                  <Pressable onPress={() => handleDelete(item.id)} hitSlop={10}>
                    <Feather name="trash-2" size={14} color={colors.mutedForeground} style={{ opacity: 0.5 }} />
                  </Pressable>
                </View>
                <Text style={[styles.memContent, { color: colors.foreground }]}>{item.content}</Text>
                <Text style={[styles.memDate, { color: colors.mutedForeground }]}>
                  {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="cpu" size={36} color="rgba(255,255,255,0.2)" />
              <Text style={[styles.emptyText, { color: "rgba(255,255,255,0.6)" }]}>
                {filterCat !== "all" ? `No ${filterCat} memories` : "No memories stored yet"}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  eyebrow: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold" },
  addBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12,
  },
  addBtnText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },
  addPanel: {
    margin: 16, borderRadius: 16, borderWidth: 1, padding: 16, gap: 4,
  },
  fieldLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 2, marginBottom: 8 },
  catPill: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1,
  },
  catPillText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  addInput: {
    borderRadius: 12, borderWidth: 1, padding: 12,
    fontSize: 14, fontFamily: "Inter_400Regular",
    minHeight: 80, marginBottom: 12,
  },
  saveBtn: {
    height: 44, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  saveBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  statsBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 16, marginTop: 12, marginBottom: 2,
    padding: 14, borderRadius: 16, borderWidth: 1,
  },
  statsText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  progressTrack: { flex: 1, height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  statsCapacity: { fontSize: 11, fontFamily: "Inter_400Regular" },
  filterPill: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1,
  },
  filterPillText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  memCard: {
    padding: 16, borderRadius: 16, borderWidth: 1, gap: 8,
  },
  memCardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  memCatBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1,
  },
  memCatText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  memContent: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  memDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
  empty: { alignItems: "center", gap: 12, paddingTop: 64 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});
