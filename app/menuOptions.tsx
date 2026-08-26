import ConfirmDialog from "@/components/ConfirmDialogProps";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastsContext";
import { authService } from "@/services/auth-service";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";


export default function MenuOptions() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const { showToast } = useToast();
  const { role } = useAuth();

  const handleLogout = () => {
    setIsConfirmVisible(true);
  };

  const handleCancelLogout = () => {
    setIsConfirmVisible(false);
  };

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await authService.logout();
      router.replace("/login");
    } catch (error) {
      showToast("No se pudo cerrar sesión", "error");
      console.error(error);
    } finally {
      setIsLoggingOut(false);
      setIsConfirmVisible(false);
    }
  };
  const options = [
    {
      icon: 'people-outline',
      label: 'Usuarios',
      role: 'admin',
      onPress: () => router.push('/users')
    },
    // {
    //   icon: 'settings-outline',
    //   label: 'Configuración'
    // },
    // {
    //   icon: 'information-circle-outline',
    //   label: 'Acerca de'
    // },
    {
      icon: 'log-out-outline',
      label: 'Cerrar sesión',
      onPress: handleLogout
    }
  ]
  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const canShow = !opt.role || opt.role === role
        if (!canShow) return null; // esta linea debe resultar Usuarios y Reportes
        return (
          <View key={opt.label} >
            <TouchableOpacity style={styles.option} onPress={opt.onPress}>
              <Ionicons name={opt.icon as any} size={20} />
              <Text style={styles.optionText}>{opt.label}</Text>
            </TouchableOpacity>
          </View>
        )
      })
      }
      <ConfirmDialog
        visible={isConfirmVisible}
        title="Cerrar sesión"
        message="¿Seguro que deseas salir?"
        confirmText="Salir"
        cancelText="Cancelar"
        isLoading={isLoggingOut}
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
      />
    </View>
  )
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  optionText: {
    fontSize: 15,
    color: "#374151",
  },
});
