import { BrandColors } from "@/constants/theme";
import { useToast } from "@/contexts/ToastsContext";
import { authService } from "@/services/auth-service";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MIN_PASSWORD_LENGTH = 6;

export default function ResetPasswordScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const { showToast } = useToast();

  const [isValidating, setIsValidating] = useState(true);
  const [linkError, setLinkError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmFocused, setIsConfirmFocused] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [done, setDone] = useState(false);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmInputRef = useRef<TextInput>(null);

  useEffect(() => {
    const validateLink = async () => {
      if (!code) {
        setLinkError("Link de recuperación inválido");
        setIsValidating(false);
        return;
      }
      const result = await authService.exchangeRecoveryCode(code);
      if (!result.ok) {
        setLinkError(result.error || "El link de recuperación expiró o ya fue usado");
      }
      setIsValidating(false);
    };
    validateLink();
  }, [code]);

  const handleSubmit = async () => {
    if (password.length < MIN_PASSWORD_LENGTH) {
      showToast(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`, "error");
      return;
    }
    if (password !== confirmPassword) {
      showToast("Las contraseñas no coinciden", "error");
      return;
    }
    try {
      setIsSaving(true);
      const result = await authService.updatePasswordFromRecovery(password);
      if (!result.ok) {
        showToast(result.error || "No se pudo actualizar la contraseña", "error");
        return;
      }
      setDone(true);
    } catch (error) {
      showToast("No se pudo actualizar la contraseña", "error");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <LinearGradient
      colors={[BrandColors.primary, BrandColors.light, BrandColors.dark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {isValidating && (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.subtitle}>Validando link...</Text>
            </View>
          )}

          {!isValidating && linkError && (
            <View style={styles.centered}>
              <Ionicons name="alert-circle-outline" size={48} color="#fff" />
              <Text style={styles.title}>Link inválido</Text>
              <Text style={styles.subtitle}>{linkError}</Text>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => router.replace("/forgot-password")}
              >
                <Text style={styles.secondaryButtonText}>Solicitar un nuevo link</Text>
              </TouchableOpacity>
            </View>
          )}

          {!isValidating && !linkError && !done && (
            <>
              <View style={styles.header}>
                <Ionicons name="lock-closed-outline" size={48} color="#fff" />
                <Text style={styles.title}>Nueva contraseña</Text>
                <Text style={styles.subtitle}>Ingresa y confirma tu nueva contraseña</Text>
              </View>

              <View style={styles.form}>
                <Pressable
                  style={[styles.inputContainer, isPasswordFocused && styles.inputContainerFocused]}
                  onPress={() => passwordInputRef.current?.focus()}
                >
                  <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    ref={passwordInputRef}
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Nueva contraseña"
                    placeholderTextColor="#9ca3af"
                    textContentType="newPassword"
                    secureTextEntry={!showPassword}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#6B7280" />
                  </TouchableOpacity>
                </Pressable>

                <Pressable
                  style={[styles.inputContainer, isConfirmFocused && styles.inputContainerFocused]}
                  onPress={() => confirmInputRef.current?.focus()}
                >
                  <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    ref={confirmInputRef}
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirmar contraseña"
                    placeholderTextColor="#9ca3af"
                    textContentType="newPassword"
                    secureTextEntry={!showPassword}
                    onFocus={() => setIsConfirmFocused(true)}
                    onBlur={() => setIsConfirmFocused(false)}
                  />
                </Pressable>

                <Pressable
                  style={[styles.primaryButton, isSaving && styles.primaryButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={isSaving}
                >
                  <Text style={styles.primaryButtonText}>
                    {isSaving ? <ActivityIndicator color="#fff" size="small" /> : "GUARDAR CONTRASEÑA"}
                  </Text>
                </Pressable>
              </View>
            </>
          )}

          {done && (
            <View style={styles.centered}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#fff" />
              <Text style={styles.title}>¡Listo!</Text>
              <Text style={styles.subtitle}>Tu contraseña fue actualizada correctamente.</Text>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={async () => {
                  await authService.logout();
                  router.replace("/login");
                }}
              >
                <Text style={styles.secondaryButtonText}>Ir a inicio de sesión</Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "center",
  },
  centered: {
    alignItems: "center",
    gap: 10,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    paddingHorizontal: 10,
  },
  form: {
    gap: 14,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1,
    borderColor: "transparent",
  },
  inputContainerFocused: {
    borderColor: BrandColors.primary,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
  },
  primaryButton: {
    backgroundColor: "#111827",
    borderRadius: 12,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  secondaryButton: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 10,
  },
  secondaryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
