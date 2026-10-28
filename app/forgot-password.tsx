import ClearableTextInput from "@/components/ClearableTextInput";
import { BrandColors } from "@/constants/theme";
import { useToast } from "@/contexts/ToastsContext";
import { authService } from "@/services/auth-service";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { showToast } = useToast();
  const emailInputRef = useRef<ClearableTextInput>(null);

  const handleSubmit = async () => {
    if (!email.trim()) {
      showToast("Ingresa tu correo", "error");
      return;
    }
    try {
      setIsLoading(true);
      const result = await authService.requestPasswordReset(email.trim());
      if (!result.ok) {
        showToast(result.error || "No se pudo enviar el correo", "error");
        return;
      }
      setSent(true);
    } catch (error) {
      showToast("No se pudo enviar el correo", "error");
      console.error(error);
    } finally {
      setIsLoading(false);
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
          behavior="padding"
        >
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Ionicons name="key-outline" size={48} color="#fff" />
            <Text style={styles.title}>Recuperar contraseña</Text>
            <Text style={styles.subtitle}>
              {sent
                ? "Revisa tu correo y sigue el link para crear una nueva contraseña."
                : "Ingresa tu correo y te enviaremos un link para restablecerla."}
            </Text>
          </View>

          {!sent && (
            <View style={styles.form}>
              <Pressable
                style={[styles.inputContainer, isEmailFocused && styles.inputContainerFocused]}
                onPress={() => emailInputRef.current?.focus()}
              >
                <Ionicons name="mail-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                <ClearableTextInput
                  ref={emailInputRef}
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Correo"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  onFocus={() => setIsEmailFocused(true)}
                  onBlur={() => setIsEmailFocused(false)}
                />
              </Pressable>

              <Pressable
                style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                <Text style={styles.primaryButtonText}>
                  {isLoading ? <ActivityIndicator color="#fff" size="small" /> : "ENVIAR LINK"}
                </Text>
              </Pressable>
            </View>
          )}

          {sent && (
            <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace("/login")}>
              <Text style={styles.secondaryButtonText}>Volver a inicio de sesión</Text>
            </TouchableOpacity>
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
    paddingTop: 20,
    justifyContent: "flex-start",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginTop: 20,
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
  },
  secondaryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
