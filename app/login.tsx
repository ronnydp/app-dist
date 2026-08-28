import { useToast } from "@/contexts/ToastsContext";
import { authService } from "@/services/auth-service";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
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

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const { showToast } = useToast();
  const current_year = new Date().getFullYear();
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  const handleContinue = async () => {
    if (!email.trim() || !password.trim()) {
      showToast("Completa correo y contraseña", "error");
      return;
    }
    try {
      setIsLoading(true);
      await authService.login({email, password})
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Error al iniciar sesión",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#08859b", "#dfe6f4", "#08599b"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.container}>
        <View
          style={{
            position: "absolute",
            width: 350,
            height: 350,
            borderRadius: 175,
            backgroundColor: "rgba(255,255,255,0.08)",
            top: -100,
            right: -120,
          }}
        />

        <View
          style={{
            position: "absolute",
            width: 250,
            height: 250,
            borderRadius: 125,
            backgroundColor: "rgba(255,255,255,0.05)",
            bottom: -80,
            left: -80,
          }}
        />
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.header}>
            <Image
              source={require("../assets/images/icon-mikari.png")}
              style={styles.image}
            />
            <Text style={styles.title}>Bienvenido</Text>
            <Text style={styles.subtitle}>
              Registra ventas | Consulta pedidos
            </Text>
          </View>

          <View style={styles.form}>
            <Pressable style={[styles.inputContainer, isEmailFocused && styles.inputContainerFocused]}
              onPress={() => emailInputRef.current?.focus()}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#9ca3af"
                style={styles.inputIcon}
              />
              <TextInput
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

            <Pressable style={[styles.inputContainer, isPasswordFocused && styles.inputContainerFocused]}
            onPress={() => {passwordInputRef.current?.focus()}}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#6B7280"
                style={styles.inputIcon}
              />
              <TextInput
                ref={passwordInputRef}
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Contraseña"
                placeholderTextColor="#9ca3af"
                textContentType="password"
                secureTextEntry={!showPassword}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </Pressable>

            <Pressable
              style={[
                styles.primaryButton,
                isLoading && styles.primaryButtonDisabled,
              ]}
              onPress={handleContinue}
              disabled={isLoading}
            >
              <Text style={styles.primaryButtonText}>
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : "INICIAR SESION"}
              </Text>
            </Pressable>
            <Text style={styles.helperText}>
              Ingresa con tus credenciales de usuario
            </Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.copyright}>
              © {current_year} Distribuidora Santa Irene - Mikari
            </Text>
            <Text style={styles.rights}>Todos los derechos reservados.</Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    marginTop: 60,
    paddingHorizontal: 28,
    justifyContent: "flex-start",
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  image: {
    width: 180,
    height: 180,
    marginBottom: 10,
    borderRadius: 25,
    resizeMode: "contain",
  },
  title: {
    fontSize: 25,
    fontWeight: "700",
    color: "#2d3647",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#69707a",
  },
  form: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 24,
    shadowColor: "#052D73",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 12,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#D9E1EC",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 54,
    marginBottom: 12,
  },
  inputContainerFocused: {
    borderColor: "#08859b",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    paddingVertical: 0,
  },
  primaryButton: {
    marginTop: 10,
    backgroundColor: "#08859b",
    height: 54,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#08599b",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  errorText: {
    textAlign: "center",
    fontSize: 13,
    color: "#DC2626",
    fontWeight: "600",
    marginTop: 8,
  },
  helperText: {
    textAlign: "center",
    fontSize: 12,
    color: "#6B7280",
    marginTop: 12,
  },
  footer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: "auto",
  },
  copyright: {
    color: "#eceaea7c",
    fontSize: 13,
    fontWeight: "700",
  },
  rights: {
    color: "#eceaea7c",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "700",
  },
});
