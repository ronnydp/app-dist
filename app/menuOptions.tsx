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
  const {role} = useAuth();

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
  // const options: [
  //     {
  //         icon:'settings-outline',
  //         label:'Configuración',
  //         onPress: () => {}
  //     },
  //     {
  //         icon:'person-outline',
  //         label:'Mi Perfil',
  //         onPress: () => router.push('/profile')
  //     },
  //     {
  //         icon:'information-circle-outline',
  //         label:'Acerca de',
  //         onPress: () => {}
  //     },
  //     {
  //         icon:'log-out-outline',
  //         label:'Cerrar sesión',
  //         onPress: () => {}
  //     }
  // ]
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.option}
        onPress={() => router.push("/profile")}
      >
        <Ionicons name="person-outline" size={20} />
        <Text style={styles.optionText}>Mi Perfil</Text>
      </TouchableOpacity>
      {role === 'admin' && (
        <>
        <TouchableOpacity style={styles.option}>
          <Ionicons name="people-outline" size={20} />
          <Text style={styles.optionText}>Usuarios</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option}>
          <Ionicons name="people-outline" size={20} />
          <Text style={styles.optionText}>Reportes</Text>
        </TouchableOpacity>
        </>
        
      )}

      <TouchableOpacity style={styles.option}>
        <Ionicons name="settings-outline" size={20} />
        <Text style={styles.optionText}>Configuración</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.option}>
        <Ionicons name="information-circle-outline" size={20} />
        <Text style={styles.optionText}>Acerca de</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.option} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} />
        <Text style={styles.optionText}>Cerrar sesión</Text>
      </TouchableOpacity>
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
  );
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
