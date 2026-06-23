import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useCreateMemory,
  useDeleteMemory,
  useListMemories,
} from "@workspace/api-client-react";
import { MemoryCard } from "@/components/MemoryCard";
import { useColors } from "@/hooks/useColors";

const CATEGORIES = ["personal", "preference", "goal", "fact", "other"] as const;
type Category = typeof CATEGORIES[number];

export default function MemoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [newContent, setNewContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("personal");
  const [showAdd, setShowAdd] = useState(false);

  const { data: memories = [], isLoading, refetch } = useListMemories();
  const { mutateAsync: createMemory, isPending: isCreating } = useCreateMemory();
  const { mutateAsync: deleteMemory } = useDeleteMemory();

  const handleAdd = async () => {
    if (!newContent.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await createMemory({ data: { content: newContent.trim(), category: selectedCategory } });
      setNewContent("");
      setShowAdd(false);
      refetch();
    } catch {
      Alert.alert("Error", "Could not save memory.");
    }
  };

  const handleDelete = async (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await deleteMemory({ id });
      refetch();
    } catch {
      Alert.alert("Error", "Could not delete memory.");
    }
  };

  const paddingTop = Platform.OS === "web" ? 67 : insets.top;
  const paddingBottom = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: paddingTop + 16, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Memory</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {memories.length} {memories.length === 1 ? "entry" : "entries"}
          </Text>
        </View>
        <Pressable
          onPress={() => setShowAdd((v) => !v)}
          style={[styles.addBtn, { backgroundColor: showAdd ? colors.secondary : colors.primary }]}
          hitSlop={8}
        >
          <Feather name={showAdd ? "x" : "plus"} size={20} color={showAdd ? colors.foreground : colors.primaryForeground} />
        </Pressable>
      </View>

      {/* Add memory panel */}
      {showAdd && (
        <View style={[styles.addPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            style={[styles.addInput, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
            placeholder="What should Omni remember?"
            placeholderTextColor={colors.mutedForeground}
            value={newContent}
            onChangeText={setNewContent}
            multiline
            maxLength={500}
          />
          {/* Category pills */}
          <View style={styles.categoryRow}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: selectedCategory === cat ? colors.primary : colors.muted,
                    borderColor: selectedCategory === cat ? colors.primary : colors.border,
                  }
                ]}
              >
                <Text style={[
                  styles.categoryText,
                  { color: selectedCategory === cat ? colors.primaryForeground : colors.mutedForeground }
                ]}>
                  {cat}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            onPress={handleAdd}
            disabled={!newContent.trim() || isCreating}
            style={[styles.saveBtn, { backgroundColor: newContent.trim() ? colors.primary : colors.muted }]}
          >
            {isCreating
              ? <ActivityIndicator size="small" color={colors.primaryForeground} />
              : <Text style={[styles.saveBtnText, { color: newContent.trim() ? colors.primaryForeground : colors.mutedForeground }]}>Save</Text>
            }
          </Pressable>
        </View>
      )}

      {/* Memories list */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={memories}
          keyExtractor={(m) => String(m.id)}
          renderItem={({ item }) => (
            <MemoryCard
              content={item.content}
              category={item.category}
              createdAt={item.createdAt}
              onDelete={() => handleDelete(item.id)}
            />
          )}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: paddingBottom + 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="cpu" size={28} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No memories yet</Text>
              <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>Tap + to add what Omni should remember</Text>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  addPanel: {
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  addInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 80,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "capitalize",
  },
  saveBtn: {
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  emptyHint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
