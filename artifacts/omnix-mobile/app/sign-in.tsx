import { useSignIn, useAuth } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { isSignedIn } = useAuth();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  const handleSignIn = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError(null);
    try {
      const result = await signIn.create({
        identifier: email.trim(),
        password,
      });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
      } else {
        setError("Sign-in incomplete. Please try again.");
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message: string }[] };
      setError(
        clerkErr?.errors?.[0]?.message ?? "Sign-in failed. Check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoRow}>
            <LinearGradient
              colors={["rgba(124,58,237,0.6)", "rgba(37,99,235,0.3)"]}
              style={styles.orbContainer}
            >
              <Feather name="zap" size={28} color="#a78bfa" />
            </LinearGradient>
            <View style={styles.logoText}>
              <Text style={styles.logoSub}>PERSONAL AI</Text>
              <Text style={styles.logoTitle}>OMNIX</Text>
            </View>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.heading}>Welcome back</Text>
            <Text style={styles.subheading}>Sign in to continue</Text>

            {error && (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={14} color="#f87171" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#6b5e8c"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                selectionColor="#7c3aed"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="••••••••"
                  placeholderTextColor="#6b5e8c"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="current-password"
                  textContentType="password"
                  selectionColor="#7c3aed"
                />
                <Pressable
                  style={styles.eyeButton}
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={8}
                >
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={18}
                    color="#6b5e8c"
                  />
                </Pressable>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.signInButton, pressed && styles.pressed]}
              onPress={handleSignIn}
              disabled={loading || !email || !password}
            >
              <LinearGradient
                colors={["#7c3aed", "#2563eb"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.signInGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.signInText}>Sign in</Text>
                )}
              </LinearGradient>
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              style={({ pressed }) => [styles.signUpButton, pressed && styles.pressed]}
              onPress={() => router.push("/sign-up")}
            >
              <Text style={styles.signUpText}>
                Don't have an account?{" "}
                <Text style={styles.signUpLink}>Sign up</Text>
              </Text>
            </Pressable>
          </View>

          <Text style={styles.footer}>OMNIX · Personal AI</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#060414",
  },
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
    gap: 32,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  orbContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.5)",
  },
  logoText: {
    gap: 2,
  },
  logoSub: {
    fontSize: 10,
    color: "#6b5e8c",
    letterSpacing: 3,
    fontFamily: "Inter_500Medium",
  },
  logoTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    letterSpacing: 4,
    color: "#a78bfa",
  },
  card: {
    width: "100%",
    backgroundColor: "rgba(18,8,58,0.8)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.25)",
    padding: 28,
    gap: 16,
  },
  heading: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#ede9fe",
    letterSpacing: 0.5,
  },
  subheading: {
    fontSize: 13,
    color: "#6b5e8c",
    fontFamily: "Inter_400Regular",
    marginTop: -8,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
    padding: 12,
  },
  errorText: {
    color: "#f87171",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    color: "#a78bfa",
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "#12083a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.25)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#ede9fe",
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  passwordRow: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: "absolute",
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  signInButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 4,
  },
  signInGradient: {
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  signInText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(124,58,237,0.2)",
  },
  dividerText: {
    color: "#6b5e8c",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1,
  },
  signUpButton: {
    alignItems: "center",
    paddingVertical: 4,
  },
  signUpText: {
    color: "#6b5e8c",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  signUpLink: {
    color: "#a78bfa",
    fontFamily: "Inter_600SemiBold",
  },
  footer: {
    color: "#2d1f5c",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    letterSpacing: 2,
  },
});
