import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import SessionActionsMenu from "@/components/session-actions-menu";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";
import { ActivityIndicator, AppState, StyleSheet, Text, View } from "react-native";

import Toast from "@/components/Toast";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProductProvider } from "@/contexts/ProductContext";
import { ToastProvider } from "../contexts/ToastsContext";

export default function RootLayout() {

  // Codigo para evitar la pérdida de carga si la app pierde el foco
  useEffect(() => {
    const subcription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });
    return () => {
      subcription.remove();
    };
  }, []);

  return (
    <ToastProvider>
      <AuthProvider>
        <ProductProvider>
          <RootNavigator />
        </ProductProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

function RootNavigator() {
  const pathname = usePathname();
  const hiddenSessionMenuRoutes = new Set([
    "/login",
    "/",
    "/profile",
    "/newProduct",
    "/newCustomer",
    "/newOrder",
    "/attendanceAdmin",
    "/detailAttendance",
  ]);
  const colorScheme = useColorScheme();
  const showSessionMenu = !hiddenSessionMenuRoutes.has(pathname);
  const { session, isLoading } = useAuth()
  
  if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#08859b" />
          <Text style={styles.loadingText}>Cargando sesión...</Text>
        </View>
      );
    }
  return (
    <ThemeProvider
      value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
    >
      <Stack>
        <Stack.Screen name="index" options={{headerShown: false}} />
        <Stack.Protected guard={!session}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="newCustomer"
            options={{
              presentation: "modal",
              title: "Nuevo Cliente",
              headerStyle: { backgroundColor: "#fff" },
              headerTitleStyle: { fontWeight: "bold", fontSize: 20 },
              headerTitleAlign: "center",
            }}
          />
          <Stack.Screen
            name="detailCustomer"
            options={{
              presentation: "modal",
              title: "Detalle de cliente",
              headerStyle: { backgroundColor: "#fff" },
              headerTitleStyle: { fontWeight: "bold", fontSize: 20 },
              headerTitleAlign: "center",
            }}
          />
          <Stack.Screen
            name="menuOptions"
            options={{
              presentation: "modal",
              title: "Opciones",
              headerStyle: { backgroundColor: "#fff" },
              headerTitleStyle: { fontWeight: "bold", fontSize: 20 },
              headerTitleAlign: "center",
            }}
          />
          <Stack.Screen
            name="users"
            options={{
              presentation: "modal",
              title: "Usuarios",
              headerStyle: { backgroundColor: "#fff" },
              headerTitleStyle: { fontWeight: "bold", fontSize: 20 },
              headerTitleAlign: "center",
            }}
          />
          <Stack.Screen
            name="newProduct"
            options={{
              presentation: "modal",
              title: "Nuevo Producto",
              headerStyle: { backgroundColor: "#fff" },
              headerTitleStyle: { fontWeight: "bold", fontSize: 20 },
              headerTitleAlign: "center",
            }}
          />
          <Stack.Screen
            name="newOrder"
            options={{
              presentation: "modal",
              title: "Nuevo Pedido",
              headerStyle: { backgroundColor: "#fff" },
              headerTitleStyle: { fontWeight: "bold", fontSize: 20 },
              headerTitleAlign: "center",
            }}
          />
          <Stack.Screen
            name="detailProduct"
            options={{
              presentation: "modal",
              title: "Detalle de Producto",
              headerStyle: { backgroundColor: "#fff" },
              headerTitleStyle: { fontWeight: "bold", fontSize: 20 },
              headerTitleAlign: "center",
            }}
          />
          <Stack.Screen
            name="detailAttendance"
            options={{
              presentation: "modal",
              title: "Detalle de Asistencia",
              headerStyle: { backgroundColor: "#fff" },
              headerTitleStyle: { fontWeight: "bold", fontSize: 20 },
              headerTitleAlign: "center",
            }}
          />
          <Stack.Screen
            name="asistencia"
            options={{
              title: "Asistencia",
              headerStyle: { backgroundColor: "#fff" },
              headerTitleStyle: { fontWeight: "bold", fontSize: 20 },
              headerTitleAlign: "center",
            }}
          />
        </Stack.Protected>
      </Stack>
      <Toast />
      {showSessionMenu && <SessionActionsMenu />}
      <StatusBar style="auto" />
    </ThemeProvider>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
});