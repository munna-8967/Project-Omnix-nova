import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  cancelAnimation,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";
import { Message } from "@/context/ChatContext";

// Each dot extracted to a component to avoid hooks-in-loops
function TypingDot({ index }: { index: number }) {
  const colors = useColors();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    const startDelay = index * 150;
    const timer = setTimeout(() => {
      opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 400, easing: Easing.linear }),
          withTiming(0.3, { duration: 400, easing: Easing.linear }),
        ),
        -1,
        true
      );
    }, startDelay);
    return () => {
      clearTimeout(timer);
      cancelAnimation(opacity);
    };
  }, [index]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[{
      width: 6, height: 6, borderRadius: 3,
      backgroundColor: colors.mutedForeground,
      marginHorizontal: 2,
    }, style]} />
  );
}

export function TypingIndicator() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10 }}>
      <TypingDot index={0} />
      <TypingDot index={1} />
      <TypingDot index={2} />
    </View>
  );
}

// Slide-in wrapper for each message — avoids hooks in list renderItem
function AnimatedBubble({ children }: { children: React.ReactNode }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 220, easing: Easing.linear });
    translateY.value = withSpring(0, { damping: 22, stiffness: 220 });
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const colors = useColors();
  const isUser = message.role === "user";

  return (
    <AnimatedBubble>
      <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
        <View style={[
          styles.bubble,
          {
            backgroundColor: isUser ? colors.primary : colors.card,
            borderColor: isUser ? "transparent" : colors.border,
            maxWidth: "82%",
          }
        ]}>
          {message.isStreaming && message.content === "" ? (
            <TypingIndicator />
          ) : (
            <Text style={[
              styles.text,
              { color: isUser ? colors.primaryForeground : colors.foreground }
            ]}>
              {message.content}
              {message.isStreaming && (
                <Text style={{ color: colors.primary }}>▋</Text>
              )}
            </Text>
          )}
        </View>
      </View>
    </AnimatedBubble>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginVertical: 3,
    paddingHorizontal: 16,
  },
  rowUser: { justifyContent: "flex-end" },
  rowAssistant: { justifyContent: "flex-start" },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: "Inter_400Regular",
  },
});
