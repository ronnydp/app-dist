import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import SessionActionsMenu from '@/components/session-actions-menu';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { supabase } from '@/lib/supabase';

import { ToastProvider } from '../contexts/ToastsContext'
import Toast from '../components/Toast'

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const hiddenSessionMenuRoutes = new Set(['/login', '/', '/profile', '/newProduct', '/newCustomer', '/newOrder']);
  const showSessionMenu = !hiddenSessionMenuRoutes.has(pathname);

  // Codigo para evitar la pérdida de carga si la app pierde el foco
  useEffect(() => {
    const subcription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });
    return () => {
      subcription.remove();
    }
  }, [])

  return (
    <ToastProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="profile" options={{
            title: 'Perfil',
            headerStyle: { backgroundColor: '#fff' },
            headerTitleStyle: { fontWeight: 'bold', fontSize: 20 },
            headerTitleAlign: 'center'
          }} />
          <Stack.Screen name="newProduct" options={{
            presentation: 'modal', title: 'Nuevo Producto',
            headerStyle: { backgroundColor: '#fff' },
            headerTitleStyle: { fontWeight: 'bold', fontSize: 20 },
            headerTitleAlign: 'center'
          }} />
          <Stack.Screen name="newCustomer" options={{
            presentation: 'modal', title: 'Nuevo Cliente',
            headerStyle: { backgroundColor: '#fff' },
            headerTitleStyle: { fontWeight: 'bold', fontSize: 20 },
            headerTitleAlign: 'center'
          }} />
          <Stack.Screen name="newOrder" options={{
            presentation: 'modal', title: 'Nuevo Pedido',
            headerStyle: { backgroundColor: '#fff' },
            headerTitleStyle: { fontWeight: 'bold', fontSize: 20 },
            headerTitleAlign: 'center'
          }} />
        </Stack>
        {showSessionMenu && <SessionActionsMenu />}
        <StatusBar style="auto" />
        <Toast />
      </ThemeProvider>
    </ToastProvider>
  );
}
