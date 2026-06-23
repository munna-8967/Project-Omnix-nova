import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

export type OrbState = "idle" | "listening" | "thinking" | "responding" | "executing";

interface StateConfig {
  colors: [string, string, string];
  glow: string;
  glowOuter: string;
  speed: number;
  label: string;
  labelColor: string;
  ringColor: string;
  icon: keyof typeof Feather.glyphMap;
}

const STATE_CONFIG: Record<OrbState, StateConfig> = {
  idle: {
    colors: ["#a78bfa", "#7c3aed", "#2563eb"],
    glow: "rgba(124,58,237,0.55)",
    glowOuter: "rgba(124,58,237,0.18)",
    speed: 3200,
    label: "Tap to speak",
    labelColor: "rgba(167,139,250,0.7)",
    ringColor: "rgba(124,58,237,",
    icon: "zap",
  },
  listening: {
    colors: ["#f0abfc", "#c026d3", "#7c3aed"],
    glow: "rgba(192,38,211,0.65)",
    glowOuter: "rgba(192,38,211,0.22)",
    speed: 850,
    label: "Listening…",
    labelColor: "#f0abfc",
    ringColor: "rgba(192,38,211,",
    icon: "mic",
  },
  thinking: {
    colors: ["#fcd34d", "#d97706", "#7c3aed"],
    glow: "rgba(217,119,6,0.55)",
    glowOuter: "rgba(217,119,6,0.18)",
    speed: 1500,
    label: "Thinking…",
    labelColor: "#fcd34d",
    ringColor: "rgba(217,119,6,",
    icon: "cpu",
  },
  responding: {
    colors: ["#6ee7b7", "#059669", "#2563eb"],
    glow: "rgba(5,150,105,0.55)",
    glowOuter: "rgba(5,150,105,0.18)",
    speed: 2000,
    label: "Responding…",
    labelColor: "#6ee7b7",
    ringColor: "rgba(5,150,105,",
    icon: "message-square",
  },
  executing: {
    colors: ["#fde68a", "#f59e0b", "#7c3aed"],
    glow: "rgba(245,158,11,0.65)",
    glowOuter: "rgba(245,158,11,0.22)",
    speed: 450,
    label: "Executing…",
    labelColor: "#fde68a",
    ringColor: "rgba(245,158,11,",
    icon: "zap",
  },
};

const WAVE_BARS = Array.from({ length: 16 }, (_, i) => {
  const angle = (i / 16) * Math.PI * 2 - Math.PI / 2;
  return {
    x: Math.cos(angle),
    y: Math.sin(angle),
    angle: (i / 16) * 360,
    h: 8 + (i % 3) * 7 + (i % 5) * 3,
    dur: 320 + (i % 6) * 65,
    delay: (i / 16) * 450,
  };
});

function OrbRing({ size, borderColor, duration, reverse, opacity }: {
  size: number; borderColor: string; duration: number; reverse?: boolean; opacity: number;
}) {
  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(reverse ? -360 : 360, { duration, easing: Easing.linear }),
      -1, false
    );
    return () => { cancelAnimation(rotation); };
  }, [duration, reverse]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[{
        position: "absolute",
        width: size, height: size, borderRadius: size / 2,
        borderWidth: 1, borderColor, opacity,
      }, style]}
    />
  );
}

function WaveBar({ cfg, size, bar, visible }: {
  cfg: StateConfig; size: number; bar: typeof WAVE_BARS[0]; visible: boolean;
}) {
  const scaleY = useSharedValue(1);
  const opacity = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    cancelAnimation(scaleY);
    cancelAnimation(opacity);
    if (!visible) {
      opacity.value = withTiming(0, { duration: 300, easing: Easing.linear });
      return;
    }
    opacity.value = withTiming(1, { duration: 300, easing: Easing.linear });
    const timer = setTimeout(() => {
      scaleY.value = withRepeat(
        withSequence(
          withTiming(2.2, { duration: bar.dur, easing: Easing.out(Easing.quad) }),
          withTiming(0.5, { duration: bar.dur, easing: Easing.in(Easing.quad) }),
        ),
        -1, true
      );
    }, bar.delay);
    return () => clearTimeout(timer);
  }, [visible]);

  const radius = size * 0.38;
  const x = bar.x * radius;
  const y = bar.y * radius;
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { rotate: `${bar.angle}deg` },
      { scaleY: scaleY.value },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[{
        position: "absolute",
        left: size / 2 + x - 1.5,
        top: size / 2 + y - bar.h / 2,
        width: 3,
        height: bar.h,
        borderRadius: 2,
        backgroundColor: cfg.ringColor + "0.7)",
        transformOrigin: "center",
      }, style]}
    />
  );
}

interface OmniOrbProps {
  state: OrbState;
  onPress?: () => void;
  size?: number;
}

export function OmniOrb({ state, onPress, size = 240 }: OmniOrbProps) {
  const cfg = STATE_CONFIG[state];
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.5);

  useEffect(() => {
    cancelAnimation(scale);
    cancelAnimation(glowOpacity);
    const dur = cfg.speed;

    scale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: dur * 0.5, easing: Easing.out(Easing.quad) }),
        withTiming(0.97, { duration: dur * 0.5, easing: Easing.in(Easing.quad) }),
      ),
      -1, true
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.75, { duration: dur * 0.5, easing: Easing.linear }),
        withTiming(0.35, { duration: dur * 0.5, easing: Easing.linear }),
      ),
      -1, true
    );
  }, [state]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const core = size * 0.46;
  const isActive = state === "listening" || state === "thinking";

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
          width: size * 1.25, height: size * 1.25,
          borderRadius: size * 0.625,
          backgroundColor: cfg.glowOuter,
        }, glowStyle]}
      />

      {/* Wave bars (listening / thinking) */}
      {WAVE_BARS.map((bar, i) => (
        <WaveBar key={i} cfg={cfg} size={size} bar={bar} visible={isActive} />
      ))}

      {/* Rings */}
      <OrbRing size={size * 1.0}  borderColor={cfg.ringColor + "0.12)"} duration={28000} opacity={0.6} />
      <OrbRing size={size * 0.85} borderColor={cfg.ringColor + "0.15)"} duration={16000} reverse opacity={0.7} />
      <OrbRing size={size * 0.72} borderColor={cfg.ringColor + "0.28)"} duration={9000} opacity={0.9} />

      {/* Core gradient sphere */}
      <Animated.View style={[{
        width: core, height: core,
        borderRadius: core / 2,
        shadowColor: cfg.glow,
        shadowOpacity: 1,
        shadowRadius: 32,
        shadowOffset: { width: 0, height: 0 },
        elevation: 20,
      }, orbStyle]}>
        <LinearGradient
          colors={cfg.colors}
          start={{ x: 0.34, y: 0.28 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: core, height: core,
            borderRadius: core / 2,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name={cfg.icon} size={core * 0.38} color="rgba(255,255,255,0.9)" />
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}
