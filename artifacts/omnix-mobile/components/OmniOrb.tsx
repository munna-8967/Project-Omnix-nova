import React, { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
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

type OrbState = "idle" | "listening" | "thinking" | "responding";

interface OmniOrbProps {
  state: OrbState;
  onPress?: () => void;
  size?: number;
}

// Each ring animated independently — avoids hooks in loops
function OrbRing({ size, borderColor, duration, reverse, opacity }: {
  size: number; borderColor: string; duration: number; reverse?: boolean; opacity: number;
}) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(reverse ? -360 : 360, { duration, easing: Easing.linear }),
      -1,
      false
    );
    return () => { cancelAnimation(rotation); };
  }, [duration, reverse]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[{
      position: "absolute",
      width: size, height: size,
      borderRadius: size / 2,
      borderWidth: 1,
      borderColor,
      opacity,
    }, style]} />
  );
}

export function OmniOrb({ state, onPress, size = 200 }: OmniOrbProps) {
  const colors = useColors();

  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.5);

  useEffect(() => {
    cancelAnimation(scale);
    cancelAnimation(glowOpacity);

    if (state === "idle") {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 3000, easing: Easing.out(Easing.quad) }),
          withTiming(0.97, { duration: 3000, easing: Easing.in(Easing.quad) }),
        ),
        -1,
        true
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.65, { duration: 3000, easing: Easing.linear }),
          withTiming(0.35, { duration: 3000, easing: Easing.linear }),
        ),
        -1,
        true
      );
    } else if (state === "listening") {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.07, { duration: 350, easing: Easing.out(Easing.quad) }),
          withTiming(0.95, { duration: 350, easing: Easing.in(Easing.quad) }),
        ),
        -1,
        true
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: 350, easing: Easing.linear }),
          withTiming(0.5, { duration: 350, easing: Easing.linear }),
        ),
        -1,
        true
      );
    } else if (state === "thinking") {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 1000, easing: Easing.out(Easing.quad) }),
          withTiming(0.97, { duration: 1000, easing: Easing.in(Easing.quad) }),
        ),
        -1,
        true
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 800, easing: Easing.linear }),
          withTiming(0.4, { duration: 800, easing: Easing.linear }),
        ),
        -1,
        true
      );
    } else {
      // responding
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 500, easing: Easing.out(Easing.quad) }),
          withTiming(0.98, { duration: 500, easing: Easing.in(Easing.quad) }),
        ),
        -1,
        true
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.85, { duration: 500, easing: Easing.linear }),
          withTiming(0.45, { duration: 500, easing: Easing.linear }),
        ),
        -1,
        true
      );
    }
  }, [state]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const orbColor =
    state === "listening" ? "#c026d3"
    : state === "thinking" ? "#d97706"
    : state === "responding" ? "#059669"
    : colors.primary;

  const glowColor =
    state === "listening" ? "rgba(192,38,211,0.5)"
    : state === "thinking" ? "rgba(217,119,6,0.5)"
    : state === "responding" ? "rgba(5,150,105,0.5)"
    : "rgba(139,92,246,0.5)";

  const ringColor =
    state === "listening" ? "rgba(192,38,211,0.3)"
    : state === "thinking" ? "rgba(217,119,6,0.3)"
    : state === "responding" ? "rgba(5,150,105,0.3)"
    : "rgba(139,92,246,0.3)";

  const core = size * 0.48;

  return (
    <Pressable
      onPress={onPress}
      style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}
    >
      {/* Outer ambient glow */}
      <Animated.View
        pointerEvents="none"
        style={[{
          position: "absolute",
          width: size * 1.3,
          height: size * 1.3,
          borderRadius: size * 0.65,
          backgroundColor: glowColor,
        }, glowStyle]}
      />

      {/* Decorative rings */}
      <OrbRing size={size * 1.05} borderColor={ringColor} duration={32000} opacity={0.25} />
      <OrbRing size={size * 0.88} borderColor={ringColor} duration={18000} reverse opacity={0.35} />
      <OrbRing size={size * 0.72} borderColor={ringColor} duration={10000} opacity={0.5} />

      {/* Core sphere */}
      <Animated.View style={[{
        width: core,
        height: core,
        borderRadius: core / 2,
        backgroundColor: orbColor,
        shadowColor: glowColor,
        shadowOpacity: 1,
        shadowRadius: 40,
        shadowOffset: { width: 0, height: 0 },
        elevation: 20,
      }, orbStyle]} />
    </Pressable>
  );
}
