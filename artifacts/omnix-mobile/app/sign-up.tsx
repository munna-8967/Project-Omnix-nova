import { useSignUp, useAuth } from "@clerk/clerk-expo";
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

type Step = "register" | "verify";

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { isSignedIn } = useAuth();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>("register");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateEmail, setDuplicateEmail] = useState(false);

  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  const handleRegister = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError(null);
    try {
      await signUp.create({
        firstName: firstName.trim() || undefined,
        emailAddress: email.trim(),
        password,
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep("verify");
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { code?: string; message: string }[] };
      const firstErr = clerkErr?.errors?.[0];
      if (firstErr?.code === "form_identifier_exists") {
        setDuplicateEmail(true);
        setError(null);
      } else {
        setError(firstErr?.message ?? "Sign-up failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError(null);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
      } else {
        setError("Verification incomplete. Please try again.");
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message: string }[] };
      setError(clerkErr?.errors?.[0]?.message ?? "Invalid code. Please try again.");
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
            {step === "register" ? (
              <>
                <Text style={styles.heading}>Create account</Text>
                <Text style={styles.subheading}>Join OMNIX to get started</Text>

                {duplicateEmail && (
                  <View style={styles.duplicateBox}>
                    <View style={styles.duplicateTop}>
                      <Feather name="info" size={14} color="#a78bfa" />
                      <Text style={styles.duplicateText}>
                        An account with this email already exists. Please sign in instead.
                      </Text>
                    </View>
                    <Pressable
                      style={({ pressed }) => [styles.signInInlineButton, pressed && styles.pressed]}
                      onPress={() => router.replace("/sign-in")}
                    >
                      <Text style={styles.signInInlineText}>Go to Sign In</Text>
                      <Feather name="arrow-right" size={14} color="#a78bfa" />
                    </Pressable>
                  </View>
                )}

                {error && !duplicateEmail && (
                  <View style={styles.errorBox}>
                    <Feather name="alert-circle" size={14} color="#f87171" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <View style={styles.field}>
                  <Text style={styles.label}>First name (optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Your name"
                    placeholderTextColor="#6b5e8c"
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                    textContentType="givenName"
                    selectionColor="#7c3aed"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor="#6b5e8c"
                    value={email}
                    onChangeText={(v) => { setEmail(v); setDuplicateEmail(false); setError(null); }}
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
                      autoComplete="new-password"
                      textContentType="newPassword"
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
                  style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
                  onPress={handleRegister}
                  disabled={loading || !email || !password}
                >
                  <LinearGradient
                    colors={["#7c3aed", "#2563eb"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.primaryText}>Create account</Text>
                    )}
                  </LinearGradient>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.heading}>Verify email</Text>
                <Text style={styles.subheading}>
                  We sent a code to{" "}
                  <Text style={{ color: "#a78bfa" }}>{email}</Text>
                </Text>

                {error && (
                  <View style={styles.errorBox}>
                    <Feather name="alert-circle" size={14} color="#f87171" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <View style={styles.field}>
                  <Text style={styles.label}>Verification code</Text>
                  <TextInput
                    style={[styles.input, styles.codeInput]}
                    placeholder="000000"
                    placeholderTextColor="#6b5e8c"
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    textContentType="oneTimeCode"
                    selectionColor="#7c3aed"
                    textAlign="center"
                  />
                </View>

                <Pressable
                  style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
                  onPress={handleVerify}
                  disabled={loading || code.length < 6}
                >
                  <LinearGradient
                    colors={["#7c3aed", "#2563eb"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.primaryText}>Verify</Text>
                    )}
                  </LinearGradient>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
                  onPress={() => { setStep("register"); setError(null); }}
                >
                  <Feather name="arrow-left" size={14} color="#6b5e8c" />
                  <Text style={styles.backText}>Go back</Text>
                </Pressable>
              </>
            )}

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              style={({ pressed }) => [styles.signInButton, pressed && styles.pressed]}
              onPress={() => router.push("/sign-in")}
            >
              <Text style={styles.signInText}>
                Already have an account?{" "}
                <Text style={styles.signInLink}>Sign in</Text>
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
  duplicateBox: {
    backgroundColor: "rgba(124,58,237,0.08)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.3)",
    padding: 12,
    gap: 10,
  },
  duplicateTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  duplicateText: {
    color: "#c4b5fd",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
    lineHeight: 19,
  },
  signInInlineButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "rgba(124,58,237,0.15)",
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.35)",
  },
  signInInlineText: {
    color: "#a78bfa",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
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
  codeInput: {
    fontSize: 24,
    letterSpacing: 8,
    fontFamily: "Inter_700Bold",
    paddingVertical: 18,
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
  primaryButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 4,
  },
  primaryGradient: {
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  backText: {
    color: "#6b5e8c",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
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
  signInButton: {
    alignItems: "center",
    paddingVertical: 4,
  },
  signInText: {
    color: "#6b5e8c",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  signInLink: {
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
