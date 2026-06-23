import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
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
  useCreateOpenaiConversation,
  useDeleteOpenaiConversation,
  useListOpenaiConversations,
  getListOpenaiConversationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";

export default function ChatListScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: conversations = [], isLoading } = useListOpenaiConversations();
  const { mutateAsync: createConversation, isPending: isCreating } = useCreateOpenaiConversation();
  const { mutateAsync: deleteConversation } = useDeleteOpenaiConversation();

  const paddingTop = Platform.OS === "web" ? 67 : insets.top;
  const paddingBottom = Platform.OS === "web" ? 34 : insets.bottom;

  async function handleNew() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const conv = await createConversation({ data: { title: "New conversation" } });
      queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
      router.push(`/chat/${conv.id}`);
    } catch {
      Alert.alert("Error", "Could not create conversation.");
    }
  }

  async function handleDelete(id: number) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await deleteConversation({ id });
      queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
    } catch {
      Alert.alert("Error", "Could not delete conversation.");
    }
  }

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: paddingTop + 16, borderBottomColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: "rgba(124,58,237,0.7)" }]}>
            CONVERSATION ARCHIVE
          </Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Chat History</Text>
        </View>
        <Pressable
          onPress={handleNew}
          disabled={isCreating}
          style={({ pressed }) => [
            styles.newBtn,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.85 : 1,
              shadowColor: colors.primary,
              shadowOpacity: 0.4,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 0 },
            }
          ]}
        >
          {isCreating
            ? <ActivityIndicator size="small" color="#fff" />
            : <Feather name="plus" size={16} color="#fff" />
          }
          <Text style={styles.newBtnText}>New Chat</Text>
        </Pressable>
      </View>

      {/* Search */}
      <View style={[styles.searchRow, { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }]}>
        <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search conversations…"
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Feather name="x" size={14} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: paddingBottom + 100, paddingTop: 4 }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/chat/${item.id}`)}
              style={({ pressed }) => [
                styles.convCard,
                {
                  backgroundColor: pressed ? "rgba(124,58,237,0.08)" : colors.card,
                  borderColor: pressed ? "rgba(124,58,237,0.3)" : colors.border,
                }
              ]}
            >
              <View style={[styles.convIcon, { backgroundColor: "rgba(124,58,237,0.1)", borderColor: "rgba(124,58,237,0.2)" }]}>
                <Feather name="message-square" size={16} color="rgba(167,139,250,0.7)" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.convTitle, { color: colors.foreground }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.convDate, { color: colors.mutedForeground }]}>
                  {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </Text>
              </View>
              <Pressable
                onPress={() => handleDelete(item.id)}
                hitSlop={10}
                style={({ pressed }) => ({ opacity: pressed ? 1 : 0.4 })}
              >
                <Feather name="trash-2" size={15} color={colors.mutedForeground} />
              </Pressable>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="message-square" size={36} color="rgba(255,255,255,0.2)" />
              <Text style={[styles.emptyTitle, { color: "rgba(255,255,255,0.6)" }]}>
                {search ? "No conversations match your search" : "No conversations yet"}
              </Text>
              {!search && (
                <Pressable
                  onPress={handleNew}
                  style={[styles.emptyBtn, { borderColor: "rgba(124,58,237,0.3)", backgroundColor: "rgba(124,58,237,0.08)" }]}
                >
                  <Text style={[styles.emptyBtnText, { color: colors.primary }]}>
                    Start your first conversation
                  </Text>
                </Pressable>
              )}
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
  title: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: 0.3 },
  newBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 12,
  },
  newBtnText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 0.3 },
  searchRow: {},
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 14, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  convCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 14, borderRadius: 16, borderWidth: 1,
  },
  convIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  convTitle: { fontSize: 14, fontFamily: "Inter_500Medium", marginBottom: 3 },
  convDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
  empty: { alignItems: "center", gap: 12, paddingTop: 64 },
  emptyTitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 32 },
  emptyBtn: { marginTop: 4, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  emptyBtnText: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
