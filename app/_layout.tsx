import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import SessionActionsMenu from '@/components/session-actions-menu';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const hiddenSessionMenuRoutes = new Set(['/login', '/', '/newProduct', '/newCustomer', '/newOrder']);
  const showSessionMenu = !hiddenSessionMenuRoutes.has(pathname);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="newProduct" options={{ presentation: 'modal', title: 'Nuevo Producto' }} />
        <Stack.Screen name="newCustomer" options={{ presentation: 'modal', title: 'Nuevo Cliente' }} />
        <Stack.Screen name="newOrder" options={{ presentation: 'modal', title: 'Nuevo Pedido' }} />
      </Stack>
      {showSessionMenu && <SessionActionsMenu />}
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
